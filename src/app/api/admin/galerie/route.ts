import { typedLogger as logger } from "@/lib/logger"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod/v4"

const galerieSchema = z.object({
  titre: z.string().min(1, "Titre requis"),
  description: z.string().optional(),
  soinNom: z.string().min(1, "Nom du soin requis"),
  imageAvantUrl: z.string().url("URL avant invalide"),
  imageApresUrl: z.string().url("URL après invalide"),
  consentementClient: z.boolean().default(false),
  approuve: z.boolean().default(false),
  ordre: z.number().default(0),
})

// GET /api/admin/galerie — Liste toutes les photos (admin)
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

    const photos = await prisma.galeriePhoto.findMany({
      orderBy: [{ ordre: "asc" }, { createdAt: "desc" }],
    })

    // Stats
    const total = photos.length
    const approuvees = photos.filter((p) => p.approuve).length
    const enAttente = photos.filter((p) => !p.approuve).length

    return NextResponse.json({
      photos,
      stats: { total, approuvees, enAttente },
    })
  } catch (error) {
    logger.error("Erreur récupération galerie admin:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST /api/admin/galerie — Créer une photo
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
    const parsed = galerieSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.issues },
        { status: 400 }
      )
    }

    const photo = await prisma.galeriePhoto.create({
      data: parsed.data,
    })

    return NextResponse.json({ success: true, photo }, { status: 201 })
  } catch (error) {
    logger.error("Erreur création photo galerie:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
