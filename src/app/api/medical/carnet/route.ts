import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

const ALLOWED_ROLES = ["CLIENT", "ACCOMPAGNATEUR_MEDICAL"] as const

function verifyAccess(role: string): boolean {
  return (ALLOWED_ROLES as readonly string[]).includes(role)
}

// ── GET : Lister les entrées du carnet ─────────────────────────────
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  if (!verifyAccess(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const dossier = await prisma.dossierMedical.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  if (!dossier) {
    return NextResponse.json({ entrees: [] })
  }

  const { searchParams } = new URL(req.url)
  const dateDebut = searchParams.get("debut") // YYYY-MM-DD
  const dateFin = searchParams.get("fin")     // YYYY-MM-DD
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "60"), 365)

  const where: Record<string, unknown> = { dossierId: dossier.id }
  if (dateDebut || dateFin) {
    where.date = {
      ...(dateDebut ? { gte: dateDebut } : {}),
      ...(dateFin ? { lte: dateFin } : {}),
    }
  }

  const entrees = await prisma.entreeCarnet.findMany({
    where,
    orderBy: { date: "desc" },
    take: limit,
  })

  return NextResponse.json({ entrees })
}

// ── POST : Créer ou mettre à jour l'entrée d'un jour (upsert) ────
const EntreeSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD requis"),
  humeur: z.number().int().min(1).max(5).nullable().optional(),
  energie: z.number().int().min(1).max(5).nullable().optional(),
  sommeil: z.number().min(0).max(12).nullable().optional(),
  hydratation: z.number().int().min(0).max(15).nullable().optional(),
  symptomes: z.array(z.string()).nullable().optional(),
  cycleMenstruel: z.boolean().optional(),
  jourCycle: z.number().int().min(1).max(45).nullable().optional(),
  fluxCycle: z.enum(["leger", "moyen", "abondant"]).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  partageAvecPraticien: z.boolean().optional(),
  tags: z.array(z.string()).nullable().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  if (!verifyAccess(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 })
  }

  const parsed = EntreeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.issues }, { status: 422 })
  }

  const data = parsed.data

  // Créer le dossier si inexistant
  let dossier = await prisma.dossierMedical.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!dossier) {
    dossier = await prisma.dossierMedical.create({
      data: { userId: session.user.id },
      select: { id: true },
    })
  }

  const upsertData = {
    humeur: data.humeur ?? null,
    energie: data.energie ?? null,
    sommeil: data.sommeil ?? null,
    hydratation: data.hydratation ?? null,
    symptomes: data.symptomes ? JSON.stringify(data.symptomes) : null,
    cycleMenstruel: data.cycleMenstruel ?? false,
    jourCycle: data.jourCycle ?? null,
    fluxCycle: data.fluxCycle ?? null,
    notes: data.notes ?? null,
    partageAvecPraticien: data.partageAvecPraticien ?? false,
    tags: data.tags ? JSON.stringify(data.tags) : null,
  }

  const entree = await prisma.entreeCarnet.upsert({
    where: {
      dossierId_date: {
        dossierId: dossier.id,
        date: data.date,
      },
    },
    update: upsertData,
    create: {
      dossierId: dossier.id,
      date: data.date,
      ...upsertData,
    },
  })

  return NextResponse.json({ entree }, { status: 201 })
}

// ── DELETE : Supprimer une entrée ────────────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  if (!verifyAccess(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "ID requis" }, { status: 400 })
  }

  const dossier = await prisma.dossierMedical.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!dossier) {
    return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 })
  }

  const entree = await prisma.entreeCarnet.findFirst({
    where: { id, dossierId: dossier.id },
  })
  if (!entree) {
    return NextResponse.json({ error: "Entrée introuvable" }, { status: 404 })
  }

  await prisma.entreeCarnet.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
