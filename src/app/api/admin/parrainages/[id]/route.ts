import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

const updateSchema = z.object({
  statut: z.enum(["EN_ATTENTE", "ACTIF", "RECOMPENSE_ACCORDEE"]),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const result = z.safeParse(updateSchema, body)
  if (!result.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 })
  }

  const parrainage = await prisma.parrainage.update({
    where: { id },
    data: { statut: result.data.statut },
  })

  return NextResponse.json(parrainage)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id } = await params
  await prisma.parrainage.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
