import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

const evenementSchema = z.object({
  titre: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  imageUrl: z.string().url().optional(),
  lieu: z.string().max(200).optional(),
  dateDebut: z.string().datetime(),
  dateFin: z.string().datetime().optional(),
  groupeId: z.string().optional(),
  maxParticipants: z.number().int().positive().optional(),
})

// GET — Liste des événements
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type") || "upcoming" // upcoming | past | my
  const groupeId = searchParams.get("groupeId")

  const now = new Date()
  const where: Record<string, unknown> = {}

  if (type === "upcoming") where.dateDebut = { gte: now }
  else if (type === "past") where.dateDebut = { lt: now }
  else if (type === "my") {
    where.participations = { some: { userId: session.user.id } }
  }

  if (groupeId) where.groupeId = groupeId

  const evenements = await prisma.evenement.findMany({
    where,
    include: {
      createur: {
        select: { id: true, nom: true, prenom: true, photoUrl: true },
      },
      groupe: { select: { id: true, nom: true, slug: true } },
      participations: {
        where: { userId: session.user.id },
        select: { statut: true },
      },
      _count: { select: { participations: true } },
    },
    orderBy: { dateDebut: type === "past" ? "desc" : "asc" },
    take: 50,
  })

  return NextResponse.json({
    evenements: evenements.map((e) => ({
      ...e,
      participantsCount: e._count.participations,
      myStatut: e.participations[0]?.statut ?? null,
      participations: undefined,
    })),
  })
}

// POST — Créer un événement
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await req.json()
  const result = evenementSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
  }

  // Si événement de groupe, vérifier appartenance
  if (result.data.groupeId) {
    const membre = await prisma.membreGroupe.findUnique({
      where: {
        groupeId_userId: { groupeId: result.data.groupeId, userId: session.user.id },
      },
    })
    if (!membre || !["ADMIN", "MODERATEUR"].includes(membre.role)) {
      return NextResponse.json({ error: "Permission insuffisante" }, { status: 403 })
    }
  }

  const evenement = await prisma.evenement.create({
    data: {
      titre: result.data.titre,
      description: result.data.description,
      imageUrl: result.data.imageUrl,
      lieu: result.data.lieu,
      dateDebut: new Date(result.data.dateDebut),
      dateFin: result.data.dateFin ? new Date(result.data.dateFin) : null,
      createurId: session.user.id,
      groupeId: result.data.groupeId,
      maxParticipants: result.data.maxParticipants,
      participations: {
        create: { userId: session.user.id, statut: "INSCRIT" },
      },
    },
    include: {
      createur: { select: { id: true, nom: true, prenom: true, photoUrl: true } },
      _count: { select: { participations: true } },
    },
  })

  return NextResponse.json(evenement, { status: 201 })
}
