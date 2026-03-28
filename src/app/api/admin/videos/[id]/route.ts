import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const updateVideoSchema = z.object({
  titre: z.string().min(1).optional(),
  clientNom: z.string().min(1).optional(),
  soinNom: z.string().optional().nullable(),
  videoUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional().or(z.literal("")).nullable(),
  duree: z.number().min(0).optional().nullable(),
  description: z.string().optional().nullable(),
  consentementClient: z.boolean().optional(),
  approuve: z.boolean().optional(),
  vedette: z.boolean().optional(),
  ordre: z.number().optional(),
})

// GET /api/admin/videos/[id]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const video = await prisma.temoignageVideo.findUnique({
      where: { id },
    })

    if (!video) {
      return NextResponse.json({ error: "Vidéo non trouvée" }, { status: 404 })
    }

    return NextResponse.json(video)
  } catch (error) {
    console.error("Erreur récupération vidéo:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// PATCH /api/admin/videos/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = updateVideoSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.issues },
        { status: 400 }
      )
    }

    const video = await prisma.temoignageVideo.update({
      where: { id },
      data: parsed.data,
    })

    return NextResponse.json({ success: true, video })
  } catch (error) {
    console.error("Erreur mise à jour vidéo:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// DELETE /api/admin/videos/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    await prisma.temoignageVideo.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur suppression vidéo:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
