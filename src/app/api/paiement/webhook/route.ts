import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { envoyerEmailCommandePayee } from "@/lib/email"
import { crediterCommande } from "@/lib/fidelite"
import { notifierCommandePayee } from "@/lib/notifications"

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key")
  if (apiKey !== process.env.JEKO_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await req.json()
  const { reference, status, paymentRequestId } = body as {
    reference: string
    status: string
    paymentRequestId: string
  }

  if (!reference || !status) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 })
  }

  // Extract commandeId from reference format: CMD-{commandeId}-{timestamp}
  const parts = reference.split("-")
  if (parts.length < 3 || parts[0] !== "CMD") {
    return NextResponse.json({ error: "Référence invalide" }, { status: 400 })
  }
  const commandeId = parts.slice(1, -1).join("-")

  const commande = await prisma.commande.findUnique({
    where: { id: commandeId },
    include: { user: { select: { id: true, email: true, prenom: true, nom: true } } },
  })

  if (!commande) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })
  }

  if (status === "success") {
    await prisma.commande.update({
      where: { id: commandeId },
      data: { statut: "PAYEE", paiementId: paymentRequestId },
    })

    // Email de confirmation
    envoyerEmailCommandePayee({
      destinataire: commande.user.email,
      prenom: commande.user.prenom,
      commandeId: commande.id,
      total: commande.total,
    }).catch(console.error)

    // Points fidélité (+1 pt par 100 FCFA)
    crediterCommande(commande.user.id, commande.total).catch(console.error)

    // Notification commande payée
    notifierCommandePayee(commande.user.id, commande.total).catch(console.error)
  } else if (status === "error") {
    await prisma.commande.update({
      where: { id: commandeId },
      data: { statut: "ANNULEE", paiementId: paymentRequestId },
    })
  }

  return NextResponse.json({ ok: true })
}
