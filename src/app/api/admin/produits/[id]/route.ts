import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

const patchSchema = z.object({
  nom: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  prix: z.number().min(0).optional(),
  stock: z.number().int().min(0).optional(),
  categorie: z.string().min(1).optional(),
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

  const produit = await prisma.produit.update({ where: { id }, data: result.data })
  return NextResponse.json(produit)
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
  await prisma.produit.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
