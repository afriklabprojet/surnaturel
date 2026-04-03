import { NextResponse } from "next/server"
import { z } from "zod/v4"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { genererCreneauCle } from "@/lib/utils"
import { creerPaiement, type JekoPaymentMethod } from "@/lib/jeko"

const schema = z.object({
  soinId: z.string().min(1),
  dateHeure: z.string().datetime(),
  notes: z.string().max(500).optional(),
  montant: z.number().positive(),
  methode: z.enum(["wave", "orange", "mtn", "moov", "djamo"]),
  telephone: z.string().min(8).max(20).optional(),
})

/**
 * POST /api/rdv/reserver-et-payer
 * Crée le RDV et initie le paiement de l'acompte en une seule requête.
 * Le RDV n'est créé QUE si le paiement est initié avec succès.
 */
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

  const { soinId, dateHeure, notes, montant, methode, telephone } = result.data
  const dateRDV = new Date(dateHeure)

  // Vérifier que le soin existe
  const soin = await prisma.soin.findUnique({ where: { id: soinId } })
  if (!soin) {
    return NextResponse.json({ error: "Soin introuvable." }, { status: 404 })
  }

  const creneauCle = genererCreneauCle(soinId, dateRDV)

  // Créer le RDV atomiquement
  let rdv: { id: string }
  try {
    rdv = await prisma.$transaction(async (tx) => {
      const creneauExistant = await tx.rendezVous.findUnique({
        where: { creneauCle },
      })
      if (creneauExistant) {
        throw new Error("CRENEAU_PRIS")
      }
      return tx.rendezVous.create({
        data: {
          userId: session.user.id,
          soinId,
          dateHeure: dateRDV,
          creneauCle,
          notes: notes ?? null,
        },
        select: { id: true },
      })
    })
  } catch (err) {
    if (err instanceof Error && err.message === "CRENEAU_PRIS") {
      return NextResponse.json(
        { error: "Ce créneau vient d'être pris. Veuillez en choisir un autre." },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la création du rendez-vous." },
      { status: 500 }
    )
  }

  // Initier le paiement Jeko
  try {
    const { redirectUrl, paiementId } = await creerPaiement({
      commandeId: rdv.id,
      montantFCFA: montant,
      methodePaiement: methode as JekoPaymentMethod,
      storeId: process.env.JEKO_STORE_ID!,
    })

    await prisma.rendezVous.update({
      where: { id: rdv.id },
      data: {
        paiementId,
        montantAcompte: montant,
        telephoneSms: telephone ?? null,
      },
    })

    return NextResponse.json({ redirectUrl })
  } catch {
    // Le paiement a échoué — supprimer le RDV pour libérer le créneau
    await prisma.rendezVous.delete({ where: { id: rdv.id } }).catch(() => {})
    return NextResponse.json(
      { error: "L'initiation du paiement a échoué. Veuillez réessayer." },
      { status: 502 }
    )
  }
}
