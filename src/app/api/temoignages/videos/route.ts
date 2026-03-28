import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/temoignages/videos — Liste les vidéos approuvées (public)
export async function GET() {
  try {
    const videos = await prisma.temoignageVideo.findMany({
      where: {
        approuve: true,
        consentementClient: true,
      },
      orderBy: [{ vedette: "desc" }, { ordre: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        titre: true,
        clientNom: true,
        soinNom: true,
        videoUrl: true,
        thumbnailUrl: true,
        duree: true,
        description: true,
        vedette: true,
        createdAt: true,
      },
    })

    // Séparer vidéos vedettes et normales
    const vedettes = videos.filter((v) => v.vedette)
    const autres = videos.filter((v) => !v.vedette)

    return NextResponse.json({
      videos,
      vedettes,
      autres,
      total: videos.length,
    })
  } catch (error) {
    console.error("Erreur récupération vidéos témoignages:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
