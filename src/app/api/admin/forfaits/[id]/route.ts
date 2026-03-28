import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

const patchSchema = z.object({
  nom: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  prixTotal: z.number().min(0).optional(),
  prixForfait: z.number().min(0).optional(),
  economie: z.number().min(0).optional(),
  badge: z.string().nullable().optional(),
  ordre: z.number().int().optional(),
  actif: z.boolean().optional(),
  soinIds: z.array(z.string()).optional(),
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

  const { soinIds, ...data } = result.data

  if (data.nom) {
    (data as Record<string, unknown>).slug = data.nom
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")
  }

  const forfait = await prisma.forfait.update({
    where: { id },
    data: {
      ...data,
      ...(soinIds !== undefined && {
        soins: {
          deleteMany: {},
          create: soinIds.map((soinId) => ({ soinId })),
        },
      }),
    },
  })

  return NextResponse.json(forfait)
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
  await prisma.forfait.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
