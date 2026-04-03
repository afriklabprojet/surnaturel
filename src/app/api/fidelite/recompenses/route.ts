import { typedLogger as logger } from "@/lib/logger"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/fidelite/recompenses — Liste des récompenses disponibles
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Récupérer les récompenses actives
    const recompenses = await prisma.recompense.findMany({
      where: { actif: true },
      orderBy: { pointsRequis: "asc" },
    })

    // Récupérer les points de l'utilisateur
    const pointsFidelite = await prisma.pointsFidelite.findUnique({
      where: { userId: session.user.id },
    })

    const pointsUtilisateur = pointsFidelite?.total ?? 0

    // Récupérer les échanges en cours de l'utilisateur
    const echangesEnCours = await prisma.echangeRecompense.findMany({
      where: {
        userId: session.user.id,
        statut: "EN_COURS",
      },
      include: { recompense: true },
    })

    // Mapper les récompenses avec disponibilité
    const recompensesAvecDispo = recompenses.map((r) => ({
      ...r,
      disponible: r.stock === null || r.stock > 0,
      accessible: pointsUtilisateur >= r.pointsRequis,
      pointsManquants: Math.max(0, r.pointsRequis - pointsUtilisateur),
    }))

    return NextResponse.json({
      recompenses: recompensesAvecDispo,
      pointsActuels: pointsUtilisateur,
      echangesEnCours,
    })
  } catch (error) {
    logger.error("Erreur récupération récompenses:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
