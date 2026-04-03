import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

const patchSchema = z.object({
  titre: z.string().min(1).optional(),
  contenu: z.string().min(1).optional(),
  imageUrl: z.string().url().nullable().optional(),
  publie: z.boolean().optional(),
  auteur: z.string().optional(),
  auteurRole: z.string().optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { id } = await params
  const article = await prisma.article.findUnique({ where: { id } })

  if (!article) {
    return NextResponse.json({ error: "Article introuvable" }, { status: 404 })
  }

  return NextResponse.json({
    ...article,
    createdAt: article.createdAt.toISOString(),
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
    return NextResponse.json({ error: z.prettifyError(result.error) }, { status: 400 })
  }

  const data: Record<string, unknown> = { ...result.data }
  if (result.data.titre) {
    data.slug = result.data.titre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")
  }

  const article = await prisma.article.update({ where: { id }, data })
  return NextResponse.json(article)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { id } = await params
  await prisma.article.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
