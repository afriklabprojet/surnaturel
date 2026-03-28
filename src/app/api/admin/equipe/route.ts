import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

const membreSchema = z.object({
  nom: z.string().min(1),
  role: z.string().min(1),
  description: z.string().min(1),
  photoUrl: z.string().url().nullable().optional(),
  ordre: z.number().int().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const membres = await prisma.membreEquipe.findMany({ orderBy: { ordre: "asc" } })
  return NextResponse.json({ membres })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const body = await req.json()
  const result = z.safeParse(membreSchema, body)

  if (!result.success) {
    return NextResponse.json({ error: z.prettifyError(result.error) }, { status: 400 })
  }

  const membre = await prisma.membreEquipe.create({
    data: {
      nom: result.data.nom,
      role: result.data.role,
      description: result.data.description,
      photoUrl: result.data.photoUrl ?? null,
      ordre: result.data.ordre ?? 0,
    },
  })

  return NextResponse.json(membre, { status: 201 })
}
