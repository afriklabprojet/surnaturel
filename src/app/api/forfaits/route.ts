import { typedLogger as logger } from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/forfaits — Liste publique des forfaits avec leurs soins
export async function GET() {
  try {
    const forfaits = await prisma.forfait.findMany({
      orderBy: { ordre: "asc" },
      include: {
        soins: {
          include: {
            soin: {
              select: { slug: true, nom: true, duree: true, icon: true, prix: true },
            },
          },
        },
      },
    })

    return NextResponse.json({
      forfaits: forfaits.map((f) => ({
        slug: f.slug,
        nom: f.nom,
        description: f.description,
        prixTotal: f.prixTotal,
        prixForfait: f.prixForfait,
        economie: f.economie,
        badge: f.badge,
        soins: f.soins.map((fs) => fs.soin),
      })),
    })
  } catch (error) {
    logger.error("Erreur GET /api/forfaits:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
