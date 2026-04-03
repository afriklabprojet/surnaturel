import { typedLogger as logger } from "@/lib/logger"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { depenserPoints, PALIERS } from "@/lib/fidelite"

// POST /api/fidelite/utiliser — Utiliser une récompense
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const { palierPoints, recompense } = body

    if (!palierPoints || !recompense) {
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 }
      )
    }

    // Vérifier que le palier existe
    const palier = PALIERS.find((p) => p.points === palierPoints)
    if (!palier) {
      return NextResponse.json(
        { error: "Palier invalide" },
        { status: 400 }
      )
    }

    try {
      await depenserPoints(session.user.id, palierPoints, recompense)
      return NextResponse.json({ success: true })
    } catch (error) {
      if (error instanceof Error && error.message === "Points insuffisants") {
        return NextResponse.json(
          { error: "Points insuffisants" },
          { status: 400 }
        )
      }
      throw error
    }
  } catch (error) {
    logger.error("Erreur utilisation récompense:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}
