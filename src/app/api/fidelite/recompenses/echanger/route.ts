import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { nanoid } from "nanoid"

const echangerSchema = z.object({
  recompenseId: z.string().min(1),
})

// POST /api/fidelite/recompenses/echanger — Échanger des points contre une récompense
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = echangerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { recompenseId } = parsed.data

    // Récupérer la récompense
    const recompense = await prisma.recompense.findUnique({
      where: { id: recompenseId },
    })

    if (!recompense || !recompense.actif) {
      return NextResponse.json(
        { error: "Récompense non disponible" },
        { status: 404 }
      )
    }

    // Vérifier le stock
    if (recompense.stock !== null && recompense.stock <= 0) {
      return NextResponse.json(
        { error: "Cette récompense est en rupture de stock" },
        { status: 400 }
      )
    }

    // Récupérer les points de l'utilisateur
    const pointsFidelite = await prisma.pointsFidelite.findUnique({
      where: { userId: session.user.id },
    })

    if (!pointsFidelite || pointsFidelite.total < recompense.pointsRequis) {
      return NextResponse.json(
        { 
          error: "Points insuffisants",
          pointsRequis: recompense.pointsRequis,
          pointsActuels: pointsFidelite?.total ?? 0,
        },
        { status: 400 }
      )
    }

    // Calculer la date d'expiration (90 jours)
    const dateExpiration = new Date()
    dateExpiration.setDate(dateExpiration.getDate() + 90)

    // Générer un code unique pour la récompense
    const codeUnique = `REC-${nanoid(8).toUpperCase()}`

    // Transaction: déduire les points + créer l'échange + décrémenter stock
    const echange = await prisma.$transaction(async (tx) => {
      // Déduire les points
      await tx.pointsFidelite.update({
        where: { userId: session.user.id },
        data: { total: { decrement: recompense.pointsRequis } },
      })

      // Historique fidélité
      await tx.historiqueFidelite.create({
        data: {
          pointsId: pointsFidelite.id,
          points: -recompense.pointsRequis,
          raison: `Échange récompense: ${recompense.nom}`,
          type: "DEPOT_RECOMPENSE",
        },
      })

      // Décrémenter le stock si applicable
      if (recompense.stock !== null) {
        await tx.recompense.update({
          where: { id: recompenseId },
          data: { stock: { decrement: 1 } },
        })
      }

      // Créer l'échange
      const newEchange = await tx.echangeRecompense.create({
        data: {
          userId: session.user.id,
          recompenseId,
          pointsUtilises: recompense.pointsRequis,
          codeUnique,
          dateExpiration,
        },
        include: { recompense: true },
      })

      return newEchange
    })

    // Créer une notification
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: "FIDELITE_RECOMPENSE",
        titre: "Récompense obtenue !",
        message: `Vous avez échangé ${recompense.pointsRequis} points contre "${recompense.nom}". Code: ${codeUnique}`,
      },
    })

    return NextResponse.json({
      success: true,
      echange,
      message: `Félicitations ! Votre récompense "${recompense.nom}" est prête. Code: ${codeUnique}`,
    })
  } catch (error) {
    console.error("Erreur échange récompense:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
