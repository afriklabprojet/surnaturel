import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { creerPaiement, type JekoPaymentMethod } from "@/lib/jeko"

const paiementSchema = z.object({
  commandeId: z.string().min(1),
  montant: z.number().positive(),
  methode: z.enum(["wave", "orange", "mtn", "moov", "djamo"]),
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
      { error: "Corps de requête invalide." },
      { status: 400 }
    )
  }

  const result = paiementSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Données invalides." },
      { status: 400 }
    )
  }

  const { commandeId, montant, methode } = result.data

  try {
    const { redirectUrl, paiementId } = await creerPaiement({
      commandeId,
      montantFCFA: montant,
      methodePaiement: methode as JekoPaymentMethod,
      storeId: process.env.JEKO_STORE_ID!,
    })

    await prisma.commande.update({
      where: { id: commandeId },
      data: { paiementId },
    })

    return NextResponse.json({ redirectUrl })
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de l'initiation du paiement." },
      { status: 500 }
    )
  }
}
