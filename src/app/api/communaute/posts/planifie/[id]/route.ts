import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

interface Params { params: Promise<{ id: string }> }

const updateSchema = z.object({
  contenu: z.string().min(1).max(2000).optional(),
  scheduledAt: z.string().optional(),
  annuler: z.boolean().optional(),
})

// GET — Détail d'une publication planifiée
export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id } = await params
  const post = await prisma.post.findUnique({
    where: { id },
    include: { groupe: { select: { nom: true, slug: true } } },
  })

  if (!post || post.auteurId !== session.user.id) {
    return NextResponse.json({ error: "Publication introuvable" }, { status: 404 })
  }

  return NextResponse.json({ post })
}

// PATCH — Modifier ou annuler une publication planifiée
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id } = await params
  const post = await prisma.post.findUnique({ where: { id } })
  if (!post || post.auteurId !== session.user.id) {
    return NextResponse.json({ error: "Publication introuvable" }, { status: 404 })
  }

  if (post.status !== "PLANIFIE") {
    return NextResponse.json({ error: "Seule une publication planifiée peut être modifiée" }, { status: 400 })
  }

  const body = await req.json()
  const result = updateSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
  }

  // Annuler = supprimer
  if (result.data.annuler) {
    await prisma.post.delete({ where: { id } })
    return NextResponse.json({ success: true, action: "annuler" })
  }

  const data: Record<string, unknown> = {}
  if (result.data.contenu) data.contenu = result.data.contenu
  if (result.data.scheduledAt) {
    const newDate = new Date(result.data.scheduledAt)
    if (isNaN(newDate.getTime()) || newDate <= new Date()) {
      return NextResponse.json({ error: "La date doit être dans le futur" }, { status: 400 })
    }
    data.scheduledAt = newDate
  }

  const updated = await prisma.post.update({
    where: { id },
    data,
    include: { groupe: { select: { nom: true, slug: true } } },
  })

  return NextResponse.json({ post: updated })
}

// DELETE — Supprimer une publication planifiée
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id } = await params
  const post = await prisma.post.findUnique({ where: { id } })
  if (!post || post.auteurId !== session.user.id) {
    return NextResponse.json({ error: "Publication introuvable" }, { status: 404 })
  }

  if (post.status !== "PLANIFIE") {
    return NextResponse.json({ error: "Seule une publication planifiée peut être supprimée ici" }, { status: 400 })
  }

  await prisma.post.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
