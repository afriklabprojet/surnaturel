import { typedLogger as logger } from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/soins — Liste publique des soins actifs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categorie = searchParams.get("categorie")

    const where: Record<string, unknown> = { actif: true }
    if (categorie && categorie !== "TOUS") {
      where.categorie = categorie
    }

    const soins = await prisma.soin.findMany({
      where,
      orderBy: { ordre: "asc" },
      select: {
        id: true,
        slug: true,
        nom: true,
        description: true,
        prix: true,
        duree: true,
        categorie: true,
        icon: true,
        badge: true,
        imageUrl: true,
      },
    })

    return NextResponse.json({ soins }, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600" },
    })
  } catch (error) {
    logger.error("Erreur GET /api/soins:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
