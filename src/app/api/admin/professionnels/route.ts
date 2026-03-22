import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get("page") || 1))
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 20)))
  const search = searchParams.get("search")?.trim()

  const where: Record<string, unknown> = {
    role: { in: ["SAGE_FEMME", "ADMIN"] },
  }
  if (search) {
    where.OR = [
      { nom: { contains: search, mode: "insensitive" } },
      { prenom: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ]
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        photoUrl: true,
        role: true,
        profilDetail: true,
      },
      orderBy: { nom: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ])

  return NextResponse.json({ users, total })
}

const updateSchema = z.object({
  userId: z.string(),
  specialite: z.string().optional(),
  numeroOrdre: z.string().optional(),
  joursDisponibilite: z.array(z.string()).optional(),
  horairesDisponibilite: z.string().optional(),
  languesConsultation: z.array(z.string()).optional(),
})

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await req.json()
  const result = z.safeParse(updateSchema, body)
  if (!result.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 })
  }

  const { userId, ...data } = result.data

  const profil = await prisma.profilDetail.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  })

  return NextResponse.json(profil)
}
