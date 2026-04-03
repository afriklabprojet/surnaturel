import { NextResponse } from "next/server"
import { z } from "zod/v4"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { creerPaiement, type JekoPaymentMethod } from "@/lib/jeko"
import { capturePaymentError } from "@/lib/sentry"

const paiementSchema = z.object({
  commandeId: z.string().min(1),
  methode: z.enum(["wave", "orange", "mtn", "moov", "djamo"]),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Connectez-vous pour effectuer un paiement." }, { status: 401 })
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

  const result = paiementSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Données invalides." },
      { status: 400 }
    )
  }

  const { commandeId, methode } = result.data

  try {
    // Lire le montant depuis la base — jamais depuis le client
    const commande = await prisma.commande.findUnique({
      where: { id: commandeId },
      select: { total: true, userId: true, statut: true },
    })

    if (!commande) {
      return NextResponse.json({ error: "Commande introuvable." }, { status: 404 })
    }

    if (commande.userId !== session.user.id) {
      return NextResponse.json({ error: "Vous n'avez pas accès à cette commande." }, { status: 403 })
    }

    if (commande.statut !== "EN_ATTENTE" && commande.statut !== "PAIEMENT_EN_COURS") {
      return NextResponse.json(
        { error: "Cette commande a déjà été traitée." },
        { status: 400 }
      )
    }

    const { redirectUrl, paiementId } = await creerPaiement({
      commandeId,
      montantFCFA: commande.total,
      methodePaiement: methode as JekoPaymentMethod,
      storeId: process.env.JEKO_STORE_ID!,
    })

    await prisma.commande.update({
      where: { id: commandeId },
      data: {
        paiementId,
        statut: "PAIEMENT_EN_COURS",
        methodePaiement: methode,
        tentativesPaiement: { increment: 1 },
      },
    })

    return NextResponse.json({ redirectUrl })
  } catch (error) {
    capturePaymentError(error, commandeId, {
      commandeId,
      montant: undefined,
      methode,
    })
    return NextResponse.json(
      { error: "Le paiement n'a pas pu démarrer. Vérifiez vos informations et réessayez." },
      { status: 500 }
    )
  }
}
