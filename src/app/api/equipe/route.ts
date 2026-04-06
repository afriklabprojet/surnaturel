import { typedLogger as logger } from "@/lib/logger"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/equipe — Liste publique des membres de l'équipe
export async function GET() {
  try {
    const membres = await prisma.membreEquipe.findMany({
      where: { actif: true },
      select: { id: true, nom: true, role: true, description: true, photoUrl: true, ordre: true },
      orderBy: { ordre: "asc" },
    })
    return NextResponse.json({ membres }, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600" },
    })
  } catch (error) {
    logger.error("Erreur GET /api/equipe:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
