import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

const patchSchema = z.object({
  nom: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  visibilite: z.enum(["PUBLIC", "PRIVE", "SECRET"]).optional(),
  regles: z.string().max(2000).optional(),
  imageUrl: z.url().optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { id } = await params

  const groupe = await prisma.groupe.findUnique({
    where: { id },
    include: {
      membres: {
        include: { user: { select: { id: true, nom: true, prenom: true, email: true, photoUrl: true } } },
        orderBy: { createdAt: "asc" },
      },
      questions: { orderBy: { ordre: "asc" } },
      _count: { select: { posts: true, evenements: true } },
    },
  })

  if (!groupe) return NextResponse.json({ error: "Groupe non trouvé" }, { status: 404 })

  return NextResponse.json({
    ...groupe,
    nbPosts: groupe._count.posts,
    nbEvenements: groupe._count.evenements,
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const result = z.safeParse(patchSchema, body)
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  const groupe = await prisma.groupe.update({ where: { id }, data: result.data })
  return NextResponse.json(groupe)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { id } = await params
  await prisma.groupe.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
