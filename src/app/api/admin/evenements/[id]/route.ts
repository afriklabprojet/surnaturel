import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

const patchSchema = z.object({
  titre: z.string().min(2).max(200).optional(),
  description: z.string().min(5).max(2000).optional(),
  lieu: z.string().max(200).optional(),
  dateDebut: z.string().optional(),
  dateFin: z.string().optional(),
  maxParticipants: z.number().int().positive().nullable().optional(),
  imageUrl: z.url().optional(),
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
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  const { dateDebut, dateFin, ...rest } = result.data
  const data: Record<string, unknown> = { ...rest }
  if (dateDebut) data.dateDebut = new Date(dateDebut)
  if (dateFin) data.dateFin = new Date(dateFin)

  const evenement = await prisma.evenement.update({ where: { id }, data })
  return NextResponse.json(evenement)
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
  await prisma.evenement.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
