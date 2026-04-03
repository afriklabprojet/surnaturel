import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

const updateSchema = z.object({
  description: z.string().max(200).nullable().optional(),
  pourcentage: z.number().int().min(1).max(100).optional(),
  montantMin: z.number().min(0).nullable().optional(),
  usageMax: z.number().int().min(1).nullable().optional(),
  debutValidite: z.string().datetime().nullable().optional(),
  finValidite: z.string().datetime().nullable().optional(),
  actif: z.boolean().optional(),
})

// GET /api/admin/promo/[id] — Récupérer un code promo
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { id } = await params

  const codePromo = await prisma.codePromo.findUnique({
    where: { id },
  })

  if (!codePromo) {
    return NextResponse.json({ error: "Code promo non trouvé" }, { status: 404 })
  }

  return NextResponse.json({ codePromo })
}

// PATCH /api/admin/promo/[id] — Modifier un code promo
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Les informations envoyées sont incorrectes. Veuillez réessayer." }, { status: 400 })
  }

  const result = updateSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: z.flattenError(result.error) }, { status: 400 })
  }

  const existe = await prisma.codePromo.findUnique({ where: { id } })
  if (!existe) {
    return NextResponse.json({ error: "Code promo non trouvé" }, { status: 404 })
  }

  const data: Record<string, unknown> = {}
  if (result.data.description !== undefined) data.description = result.data.description
  if (result.data.pourcentage !== undefined) data.pourcentage = result.data.pourcentage
  if (result.data.montantMin !== undefined) data.montantMin = result.data.montantMin
  if (result.data.usageMax !== undefined) data.usageMax = result.data.usageMax
  if (result.data.debutValidite !== undefined) {
    data.debutValidite = result.data.debutValidite ? new Date(result.data.debutValidite) : null
  }
  if (result.data.finValidite !== undefined) {
    data.finValidite = result.data.finValidite ? new Date(result.data.finValidite) : null
  }
  if (result.data.actif !== undefined) data.actif = result.data.actif

  const codePromo = await prisma.codePromo.update({
    where: { id },
    data,
  })

  return NextResponse.json({ codePromo })
}

// DELETE /api/admin/promo/[id] — Supprimer un code promo
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { id } = await params

  const existe = await prisma.codePromo.findUnique({ where: { id } })
  if (!existe) {
    return NextResponse.json({ error: "Code promo non trouvé" }, { status: 404 })
  }

  await prisma.codePromo.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
