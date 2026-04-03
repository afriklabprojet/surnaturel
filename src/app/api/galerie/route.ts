import { typedLogger as logger } from "@/lib/logger"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/galerie — Liste les photos approuvées (public)
export async function GET() {
  try {
    const photos = await prisma.galeriePhoto.findMany({
      where: {
        approuve: true,
        consentementClient: true,
      },
      orderBy: [{ ordre: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        titre: true,
        description: true,
        soinNom: true,
        imageAvantUrl: true,
        imageApresUrl: true,
        createdAt: true,
      },
    })

    // Grouper par soin
    const parSoin: Record<string, typeof photos> = {}
    photos.forEach((photo) => {
      if (!parSoin[photo.soinNom]) {
        parSoin[photo.soinNom] = []
      }
      parSoin[photo.soinNom].push(photo)
    })

    return NextResponse.json({
      photos,
      parSoin,
    })
  } catch (error) {
    logger.error("Erreur récupération galerie:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
