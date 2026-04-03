import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { creerPaiement, type JekoPaymentMethod } from "@/lib/jeko"
import { typedLogger as logger } from "@/lib/logger"

const MONTANT_ABONNEMENT_FCFA = 10_000
const SLUG_FORMULE = "communaute"

const abonnementSchema = z.object({
  methode: z.enum(["wave", "orange", "mtn", "moov", "djamo"]),
})

/**
 * POST /api/communaute/abonnement
 * Crée un AbonnementMensuel (EN_PAUSE) + initie le paiement Jeko.
 * Après confirmation du webhook ABCOMM, l'abonnement passe ACTIF.
 */
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 })
    }

    const result = abonnementSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Méthode de paiement invalide" },
        { status: 400 }
      )
    }

    const { methode } = result.data
    const userId = session.user.id

    // Vérifier absence d'abonnement communauté actif
    const formule = await prisma.formuleAbonnement.findUnique({
      where: { slug: SLUG_FORMULE },
    })
    if (!formule || !formule.actif) {
      return NextResponse.json({ error: "Formule introuvable" }, { status: 404 })
    }

    const abonnementExistant = await prisma.abonnementMensuel.findFirst({
      where: {
        userId,
        formuleId: formule.id,
        statut: { in: ["ACTIF", "EN_PAUSE"] },
      },
    })
    if (abonnementExistant) {
      return NextResponse.json(
        { error: "Vous avez déjà un abonnement communauté actif." },
        { status: 400 }
      )
    }

    // Créer l'abonnement en attente de paiement
    const dateProchainPaiement = new Date()
    dateProchainPaiement.setMonth(dateProchainPaiement.getMonth() + 1)

    const abonnement = await prisma.abonnementMensuel.create({
      data: {
        userId,
        formuleId: formule.id,
        statut: "EN_PAUSE", // pas encore payé
        frequence: "MENSUEL",
        dateDebut: new Date(),
        dateProchainPaiement,
        soinsRestantsMois: 0,
        moyenPaiement: methode,
      },
    })

    await prisma.paiementAbonnement.create({
      data: {
        abonnementId: abonnement.id,
        montant: MONTANT_ABONNEMENT_FCFA,
        moisConcerne: new Date(),
        statut: "EN_ATTENTE",
      },
    })

    // Initier le paiement Jeko avec référence ABCOMM-
    const commandeId = `ABCOMM-${abonnement.id}`
    const baseUrl = process.env.NEXTAUTH_URL!

    const { redirectUrl, paiementId } = await creerPaiement({
      commandeId,
      montantFCFA: MONTANT_ABONNEMENT_FCFA,
      methodePaiement: methode as JekoPaymentMethod,
      storeId: process.env.JEKO_STORE_ID!,
      successUrl: `${baseUrl}/communaute?abonnement=ok`,
      errorUrl: `${baseUrl}/communaute/abonnement?erreur=paiement`,
    })

    // Stocker le paiementId sur l'abonnement
    await prisma.paiementAbonnement.updateMany({
      where: { abonnementId: abonnement.id, statut: "EN_ATTENTE" },
      data: { transactionId: paiementId },
    })

    logger.info("Abonnement communauté créé, paiement Jeko initié", {
      userId,
      abonnementId: abonnement.id,
      paiementId,
    })

    return NextResponse.json({ redirectUrl })
  } catch (error) {
    logger.error("Erreur abonnement communauté:", error)
    return NextResponse.json({ error: "Erreur lors de l'initiation du paiement" }, { status: 500 })
  }
}
