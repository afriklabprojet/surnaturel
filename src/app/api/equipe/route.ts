import { typedLogger as logger } from "@/lib/logger"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/equipe — Liste publique des membres de l'équipe
export async function GET() {
  try {
    const membres = await prisma.membreEquipe.findMany({
      orderBy: { ordre: "asc" },
    })
    return NextResponse.json({ membres })
  } catch (error) {
    logger.error("Erreur GET /api/equipe:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
