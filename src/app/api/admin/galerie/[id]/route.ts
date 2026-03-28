import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const updateGalerieSchema = z.object({
  titre: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  soinNom: z.string().min(1).optional(),
  imageAvantUrl: z.string().url().optional(),
  imageApresUrl: z.string().url().optional(),
  consentementClient: z.boolean().optional(),
  approuve: z.boolean().optional(),
  ordre: z.number().optional(),
})

// GET /api/admin/galerie/[id]
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

    const photo = await prisma.galeriePhoto.findUnique({
      where: { id },
    })

    if (!photo) {
      return NextResponse.json({ error: "Photo non trouvée" }, { status: 404 })
    }

    return NextResponse.json(photo)
  } catch (error) {
    console.error("Erreur récupération photo:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// PATCH /api/admin/galerie/[id]
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
    const parsed = updateGalerieSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.issues },
        { status: 400 }
      )
    }

    const photo = await prisma.galeriePhoto.update({
      where: { id },
      data: parsed.data,
    })

    return NextResponse.json({ success: true, photo })
  } catch (error) {
    console.error("Erreur mise à jour photo:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// DELETE /api/admin/galerie/[id]
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

    await prisma.galeriePhoto.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur suppression photo:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
