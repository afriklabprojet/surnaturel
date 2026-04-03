import { NextResponse } from "next/server"
import { z } from "zod/v4"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { creerPaiement, type JekoPaymentMethod } from "@/lib/jeko"

const schema = z.object({
  rdvId: z.string().min(1),
  montant: z.number().positive(),
  methode: z.enum(["wave", "orange", "mtn", "moov", "djamo"]),
  telephone: z.string().min(8).max(20).optional(),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Les informations envoyées sont incorrectes. Veuillez réessayer." },
      { status: 400 }
    )
  }

  const result = schema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Données invalides." },
      { status: 400 }
    )
  }

  const { rdvId, montant, methode, telephone } = result.data

  // Vérifier que le RDV appartient à l'utilisateur et n'est pas déjà payé
  const rdv = await prisma.rendezVous.findFirst({
    where: { id: rdvId, userId: session.user.id },
    include: { soin: true },
  })

  if (!rdv) {
    return NextResponse.json({ error: "Rendez-vous introuvable." }, { status: 404 })
  }

  if (rdv.acomptePaye) {
    return NextResponse.json(
      { error: "L'acompte a déjà été payé pour ce rendez-vous." },
      { status: 409 }
    )
  }

  try {
    const { redirectUrl, paiementId } = await creerPaiement({
      commandeId: rdvId,
      montantFCFA: montant,
      methodePaiement: methode as JekoPaymentMethod,
      storeId: process.env.JEKO_STORE_ID!,
    })

    // Enregistrer le paiementId et le téléphone pour le SMS de rappel
    await prisma.rendezVous.update({
      where: { id: rdvId },
      data: {
        paiementId,
        montantAcompte: montant,
        telephoneSms: telephone ?? null,
      },
    })

    return NextResponse.json({ redirectUrl })
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de l'initiation du paiement." },
      { status: 500 }
    )
  }
}
