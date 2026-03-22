import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PALIERS, getPalierActuel, getProgressionPalier } from "@/lib/fidelite"

// GET /api/fidelite — Récupérer les points et l'historique
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Récupérer ou créer PointsFidelite
    let pointsFidelite = await prisma.pointsFidelite.findUnique({
      where: { userId: session.user.id },
      include: {
        historique: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    })

    if (!pointsFidelite) {
      pointsFidelite = await prisma.pointsFidelite.create({
        data: { userId: session.user.id, total: 0 },
        include: {
          historique: {
            orderBy: { createdAt: "desc" },
            take: 50,
          },
        },
      })
    }

    const palierActuel = getPalierActuel(pointsFidelite.total)
    const progression = getProgressionPalier(pointsFidelite.total)

    return NextResponse.json({
      points: pointsFidelite.total,
      palierActuel,
      progression,
      paliers: PALIERS,
      historique: pointsFidelite.historique,
    })
  } catch (error) {
    console.error("Erreur récupération fidélité:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}
