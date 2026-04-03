import { typedLogger as logger } from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { StatutRDV, Prisma } from "@/generated/prisma/client"
import { startOfDay, endOfDay } from "date-fns"
import { z } from "zod/v4"
import { genererCreneauCle } from "@/lib/utils"
import { getPusherServeur, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const url = req.nextUrl.searchParams
  const page = Math.max(1, Number(url.get("page")) || 1)
  const limit = Math.min(100, Math.max(1, Number(url.get("limit")) || 20))
  const statut = url.get("statut") as StatutRDV | null
  const dateStr = url.get("date")
  const soinId = url.get("soinId")
  const search = url.get("search")?.trim()

  const where: Prisma.RendezVousWhereInput = {}

  if (statut) where.statut = statut

  if (dateStr) {
    const d = new Date(dateStr)
    if (!isNaN(d.getTime())) {
      where.dateHeure = { gte: startOfDay(d), lte: endOfDay(d) }
    }
  }

  if (soinId) where.soinId = soinId

  if (search) {
    where.user = {
      OR: [
        { nom: { contains: search, mode: "insensitive" } },
        { prenom: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    }
  }

  const [rdvs, total] = await Promise.all([
    prisma.rendezVous.findMany({
      where,
      include: {
        user: { select: { nom: true, prenom: true, email: true } },
        soin: { select: { id: true, nom: true, prix: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.rendezVous.count({ where }),
  ])

  return NextResponse.json({
    rdvs: rdvs.map((r) => ({
      id: r.id,
      client: `${r.user.prenom} ${r.user.nom}`,
      email: r.user.email,
      soin: r.soin.nom,
      soinId: r.soin.id,
      prix: r.soin.prix,
      dateHeure: r.dateHeure.toISOString(),
      statut: r.statut,
      notes: r.notes,
    })),
    total,
  })
}

const createRdvSchema = z.object({
  userId: z.string().min(1),
  soinId: z.string().min(1),
  dateHeure: z.string(),
  notes: z.string().max(500).optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const body = await req.json()
  const result = z.safeParse(createRdvSchema, body)
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  const { userId, soinId, dateHeure, notes } = result.data
  const dateRDV = new Date(dateHeure)

  const [user, soin] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
    prisma.soin.findUnique({ where: { id: soinId }, select: { id: true } }),
  ])

  if (!user) return NextResponse.json({ error: "Client non trouvé" }, { status: 404 })
  if (!soin) return NextResponse.json({ error: "Soin non trouvé" }, { status: 404 })

  // Générer la clé unique du créneau
  const creneauCle = genererCreneauCle(soinId, dateRDV)

  try {
    const rdv = await prisma.rendezVous.create({
      data: {
        userId,
        soinId,
        dateHeure: dateRDV,
        creneauCle,
        notes: notes || null,
        statut: "CONFIRME",
      },
      include: {
        user: { select: { nom: true, prenom: true, email: true } },
        soin: { select: { nom: true, prix: true } },
      },
    })

    // Notifier en temps réel que ce créneau est maintenant pris
    try {
      const pusher = getPusherServeur()
      const dateStr = dateRDV.toISOString().split("T")[0]
      await pusher.trigger(
        PUSHER_CHANNELS.creneaux(soinId, dateStr),
        PUSHER_EVENTS.CRENEAU_RESERVE,
        {
          soinId,
          dateHeure: dateRDV.toISOString(),
          creneauCle,
        }
      )
    } catch {
      // Notification temps réel optionnelle
    }

    return NextResponse.json({
      id: rdv.id,
      client: `${rdv.user.prenom} ${rdv.user.nom}`,
      soin: rdv.soin.nom,
      dateHeure: rdv.dateHeure.toISOString(),
      statut: rdv.statut,
    }, { status: 201 })
  } catch (error: unknown) {
    // Gestion de la race condition : contrainte unique violée
    const isPrismaDuplicateError = 
      error && typeof error === "object" && "code" in error && error.code === "P2002"
    
    if (isPrismaDuplicateError) {
      return NextResponse.json(
        { error: "Ce créneau est déjà réservé." },
        { status: 409 }
      )
    }
    logger.error("[POST /api/admin/rdv] Erreur inattendue :", error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la réservation." },
      { status: 500 }
    )
  }
}
