import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const url = req.nextUrl.searchParams
  const page = Math.max(1, Number(url.get("page")) || 1)
  const limit = Math.min(100, Math.max(1, Number(url.get("limit")) || 20))
  const periode = url.get("periode") // "aVenir" | "passes"

  const now = new Date()
  const where: Record<string, unknown> = {}
  if (periode === "aVenir") where.dateDebut = { gte: now }
  if (periode === "passes") where.dateDebut = { lt: now }

  const [evenements, total] = await Promise.all([
    prisma.evenement.findMany({
      where,
      include: {
        createur: { select: { nom: true, prenom: true, photoUrl: true } },
        groupe: { select: { nom: true } },
        _count: { select: { participations: true } },
      },
      orderBy: { dateDebut: periode === "passes" ? "desc" : "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.evenement.count({ where }),
  ])

  return NextResponse.json({
    evenements: evenements.map((e) => ({
      id: e.id,
      titre: e.titre,
      description: e.description,
      imageUrl: e.imageUrl,
      lieu: e.lieu,
      dateDebut: e.dateDebut.toISOString(),
      dateFin: e.dateFin?.toISOString() ?? null,
      maxParticipants: e.maxParticipants,
      nbParticipants: e._count.participations,
      createur: `${e.createur.prenom} ${e.createur.nom}`,
      groupe: e.groupe?.nom ?? null,
      createdAt: e.createdAt.toISOString(),
    })),
    total,
  })
}

const createSchema = z.object({
  titre: z.string().min(2).max(200),
  description: z.string().min(5).max(2000),
  lieu: z.string().max(200).optional(),
  dateDebut: z.string(),
  dateFin: z.string().optional(),
  maxParticipants: z.number().int().positive().optional(),
  imageUrl: z.url().optional(),
  groupeId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const body = await req.json()
  const result = z.safeParse(createSchema, body)
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  const { dateDebut, dateFin, ...rest } = result.data

  const evenement = await prisma.evenement.create({
    data: {
      ...rest,
      dateDebut: new Date(dateDebut),
      dateFin: dateFin ? new Date(dateFin) : null,
      createurId: session.user.id!,
    },
  })

  return NextResponse.json(evenement, { status: 201 })
}
