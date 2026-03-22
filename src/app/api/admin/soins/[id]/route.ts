import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

const patchSchema = z.object({
  nom: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  prix: z.number().min(0).optional(),
  duree: z.number().int().min(1).optional(),
  categorie: z.enum([
    "HAMMAM", "GOMMAGE", "AMINCISSANT", "VISAGE",
    "POST_ACCOUCHEMENT", "CONSEIL_ESTHETIQUE", "SAGE_FEMME",
  ]).optional(),
  imageUrl: z.string().url().nullable().optional(),
  actif: z.boolean().optional(),
})

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
  if (result.data.nom) {
    data.slug = result.data.nom
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")
  }

  const soin = await prisma.soin.update({ where: { id }, data })
  return NextResponse.json(soin)
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
  await prisma.soin.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
