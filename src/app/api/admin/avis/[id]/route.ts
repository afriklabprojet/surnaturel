import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

const patchSchema = z.object({
  publie: z.boolean().optional(),
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

  const avis = await prisma.avis.update({
    where: { id },
    data: result.data,
  })

  return NextResponse.json({ id: avis.id, publie: avis.publie })
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
  await prisma.avis.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
