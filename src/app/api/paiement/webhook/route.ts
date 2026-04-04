import logger from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { verifierStatutPaiement } from "@/lib/jeko"
import { envoyerEmailCommandePayee } from "@/lib/email"
import { crediterCommande } from "@/lib/fidelite"
import { notifierCommandePayee } from "@/lib/notifications"
import { capturePaymentError } from "@/lib/sentry"

export async function POST(req: NextRequest) {
  // ── Couche 1 : vérification clé API partagée ──────────────────────────
  const apiKey = req.headers.get("x-api-key")
  if (apiKey !== process.env.JEKO_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  // ── Couche 2 : vérification HMAC-SHA256 du body (si Jeko l'envoie) ────
  // Lire le body brut AVANT de le parser pour pouvoir calculer le HMAC
  const rawBody = await req.text()
  const hmacSecret = process.env.JEKO_WEBHOOK_HMAC_SECRET
  if (hmacSecret) {
    const receivedSig = req.headers.get("x-jeko-signature")
    if (!receivedSig) {
      return NextResponse.json({ error: "Signature invalide" }, { status: 401 })
    }

    const expectedSig = crypto
      .createHmac("sha256", hmacSecret)
      .update(rawBody)
      .digest("hex")

    // Comparaison en temps constant pour éviter les timing attacks
    if (
      receivedSig.length !== expectedSig.length ||
      !crypto.timingSafeEqual(Buffer.from(receivedSig), Buffer.from(expectedSig))
    ) {
      return NextResponse.json({ error: "Signature invalide" }, { status: 401 })
    }
  }

  let body: Record<string, string>
  try {
    body = JSON.parse(rawBody) as Record<string, string>
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 })
  }

  const { reference, status, paymentRequestId } = body

  if (!reference || !status) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 })
  }

  // Extract commandeId from reference format: CMD-{commandeId}-{timestamp}
  const parts = reference.split("-")
  if (parts.length < 3 || parts[0] !== "CMD") {
    return NextResponse.json({ error: "Référence invalide" }, { status: 400 })
  }
  const commandeId = parts.slice(1, -1).join("-")

  // ── Branche abonnement communauté (ABCOMM-{abonnementId}) ────────────
  if (commandeId.startsWith("ABCOMM-")) {
    return handleAbonnementCommunaute(commandeId, status, paymentRequestId, body)
  }

  const commande = await prisma.commande.findUnique({
    where: { id: commandeId },
    include: {
      user: { select: { id: true, email: true, prenom: true, nom: true } },
      lignes: { include: { produit: { select: { nom: true } } } },
    },
  })

  if (!commande) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })
  }

  // Idempotence : ignorer les webhooks déjà traités
  if (commande.webhookTraite) {
    return NextResponse.json({ ok: true, alreadyProcessed: true })
  }

  if (status === "success") {
    // ── Couche 3 : contre-vérification serveur→Jeko avant tout changement ─
    // Même si le webhook est falsifié, Jeko API confirmera le vrai statut
    if (paymentRequestId) {
      try {
        const statutConfirme = await verifierStatutPaiement(paymentRequestId)
        if (statutConfirme !== "success") {
          // Jeko ne confirme pas le succès — ignorer silencieusement
          return NextResponse.json({ ok: true, skipped: "unconfirmed" })
        }
      } catch {
        // Si la vérification échoue, ne pas modifier le statut
        return NextResponse.json({ error: "Impossible de confirmer le paiement" }, { status: 502 })
      }
    }

    await prisma.commande.update({
      where: { id: commandeId },
      data: { statut: "PAYEE", paiementId: paymentRequestId, webhookTraite: true },
    })

    // Reçu de paiement détaillé
    envoyerEmailCommandePayee({
      destinataire: commande.user.email,
      prenom: commande.user.prenom,
      commandeId: commande.id,
      total: commande.total,
      methode: body.paymentMethod ?? undefined,
      reference: paymentRequestId,
      lignes: commande.lignes.map((l) => ({
        nom: l.produit.nom,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
      })),
    }).catch((e) => logger.error(e, "background task failed"))

    // Points fidélité (+1 pt par 100 FCFA)
    crediterCommande(commande.user.id, commande.total).catch((e) => logger.error(e, "background task failed"))

    // Notification commande payée
    notifierCommandePayee(commande.user.id, commande.total).catch((e) => logger.error(e, "background task failed"))
  } else if (status === "error") {
    await prisma.commande.update({
      where: { id: commandeId },
      data: {
        statut: "EN_ATTENTE",
        paiementId: paymentRequestId,
        webhookTraite: false,
        dernierEchecAt: new Date(),
        methodePaiement: body.paymentMethod ?? commande.methodePaiement,
      },
    })

    capturePaymentError(
      new Error(`Paiement échoué: ${reference}`),
      paymentRequestId,
      { commandeId, montant: commande.total, methode: body.paymentMethod }
    )
  }

  return NextResponse.json({ ok: true })
}

// ── Handler abonnement communauté ─────────────────────────────────────────
async function handleAbonnementCommunaute(
  commandeId: string,
  status: string,
  paymentRequestId: string | undefined,
  body: Record<string, string>
): Promise<NextResponse> {
  const abonnementId = commandeId.replace("ABCOMM-", "")

  const abonnement = await prisma.abonnementMensuel.findUnique({
    where: { id: abonnementId },
    include: {
      user: { select: { id: true, email: true, prenom: true, nom: true } },
      formule: { select: { nom: true, prixMensuel: true } },
    },
  })

  if (!abonnement) {
    return NextResponse.json({ error: "Abonnement introuvable" }, { status: 404 })
  }

  // Idempotence
  if (abonnement.statut === "ACTIF") {
    return NextResponse.json({ ok: true, alreadyProcessed: true })
  }

  if (status === "success") {
    // Contre-vérification Jeko
    if (paymentRequestId) {
      try {
        const statutConfirme = await verifierStatutPaiement(paymentRequestId)
        if (statutConfirme !== "success") {
          return NextResponse.json({ ok: true, skipped: "unconfirmed" })
        }
      } catch {
        return NextResponse.json({ error: "Impossible de confirmer le paiement" }, { status: 502 })
      }
    }

    const expireAt = new Date()
    expireAt.setMonth(expireAt.getMonth() + 1)

    await prisma.$transaction([
      prisma.abonnementMensuel.update({
        where: { id: abonnementId },
        data: { statut: "ACTIF", dateProchainPaiement: expireAt },
      }),
      prisma.paiementAbonnement.updateMany({
        where: { abonnementId, statut: "EN_ATTENTE" },
        data: { statut: "PAYE", transactionId: paymentRequestId ?? null },
      }),
      prisma.user.update({
        where: { id: abonnement.userId },
        data: {
          accesCommuaute: true,
          accesCommuauteExpireAt: expireAt,
        },
      }),
    ])

    logger.info({ userId: abonnement.userId, abonnementId, expireAt: expireAt.toISOString() }, "Abonnement communauté activé")
  } else if (status === "error") {
    await prisma.paiementAbonnement.updateMany({
      where: { abonnementId, statut: "EN_ATTENTE" },
      data: {
        statut: "ECHEC",
        erreur: body.errorMessage ?? "Paiement refusé",
        transactionId: paymentRequestId ?? null,
      },
    })
  }

  return NextResponse.json({ ok: true })
}
