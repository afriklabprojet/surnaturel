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

  const where: Record<string, unknown> = {}
  if (search) {
    where.user = {
      OR: [
        { nom: { contains: search, mode: "insensitive" } },
        { prenom: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    }
  }

  const [points, total] = await Promise.all([
    prisma.pointsFidelite.findMany({
      where,
      include: {
        user: { select: { id: true, nom: true, prenom: true, email: true, photoUrl: true } },
        historique: { orderBy: { createdAt: "desc" }, take: 5 },
      },
      orderBy: { total: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.pointsFidelite.count({ where }),
  ])

  return NextResponse.json({ points, total })
}

const ajusterSchema = z.object({
  userId: z.string(),
  points: z.number().int(),
  raison: z.string().min(1),
  type: z.enum(["GAIN_RDV", "GAIN_COMMANDE", "GAIN_PARRAINAGE", "GAIN_AVIS", "GAIN_INSCRIPTION", "DEPOT_RECOMPENSE"]),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await req.json()
  const result = z.safeParse(ajusterSchema, body)
  if (!result.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 })
  }

  const { userId, points, raison, type } = result.data

  // Upsert PointsFidelite record
  const pf = await prisma.pointsFidelite.upsert({
    where: { userId },
    create: { userId, total: Math.max(0, points) },
    update: { total: { increment: points } },
  })

  // Ensure total never goes below 0
  if (pf.total < 0) {
    await prisma.pointsFidelite.update({ where: { userId }, data: { total: 0 } })
  }

  // Add history entry
  await prisma.historiqueFidelite.create({
    data: { pointsId: pf.id, points, raison, type },
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}
