import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

const MODERATEUR_ROLES = ["ADMIN", "MODERATEUR"]

const patchSchema = z.object({
  publie: z.boolean().optional(),
  raisonRejet: z.string().max(500).optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || !MODERATEUR_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const result = z.safeParse(patchSchema, body)
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  const data: Record<string, unknown> = {
    moderePar: session.user.id,
    modereAt: new Date(),
  }
  if (result.data.publie !== undefined) data.publie = result.data.publie
  if (result.data.raisonRejet !== undefined) data.raisonRejet = result.data.raisonRejet
  if (result.data.publie === false) data.signale = false

  const avis = await prisma.avisProduit.update({
    where: { id },
    data: data as { publie?: boolean; raisonRejet?: string; moderePar: string; modereAt: Date; signale?: boolean },
  })

  return NextResponse.json({ id: avis.id, publie: avis.publie, raisonRejet: avis.raisonRejet })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || !MODERATEUR_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { id } = await params
  await prisma.avisProduit.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
