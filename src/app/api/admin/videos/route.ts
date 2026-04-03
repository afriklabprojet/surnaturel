import { typedLogger as logger } from "@/lib/logger"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod/v4"

const videoSchema = z.object({
  titre: z.string().min(1, "Titre requis"),
  clientNom: z.string().min(1, "Nom client requis"),
  soinNom: z.string().optional(),
  videoUrl: z.string().url("URL vidéo invalide"),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
  duree: z.number().min(0).optional(),
  description: z.string().optional(),
  consentementClient: z.boolean().default(false),
  approuve: z.boolean().default(false),
  vedette: z.boolean().default(false),
  ordre: z.number().default(0),
})

// GET /api/admin/videos — Liste toutes les vidéos (admin)
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Vérifier le rôle admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const videos = await prisma.temoignageVideo.findMany({
      orderBy: [{ vedette: "desc" }, { ordre: "asc" }, { createdAt: "desc" }],
    })

    // Stats
    const total = videos.length
    const approuvees = videos.filter((v) => v.approuve).length
    const vedettes = videos.filter((v) => v.vedette).length

    return NextResponse.json({
      videos,
      stats: { total, approuvees, vedettes },
    })
  } catch (error) {
    logger.error("Erreur récupération vidéos admin:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST /api/admin/videos — Créer une vidéo
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Vérifier le rôle admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = videoSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.issues },
        { status: 400 }
      )
    }

    const data = parsed.data
    const video = await prisma.temoignageVideo.create({
      data: {
        titre: data.titre,
        clientNom: data.clientNom,
        soinNom: data.soinNom || null,
        videoUrl: data.videoUrl,
        thumbnailUrl: data.thumbnailUrl || null,
        duree: data.duree,
        description: data.description || null,
        consentementClient: data.consentementClient,
        approuve: data.approuve,
        vedette: data.vedette,
        ordre: data.ordre,
      },
    })

    return NextResponse.json({ success: true, video }, { status: 201 })
  } catch (error) {
    logger.error("Erreur création vidéo:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
