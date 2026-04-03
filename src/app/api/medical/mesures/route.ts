import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

const ALLOWED_ROLES = ["CLIENT", "ACCOMPAGNATEUR_MEDICAL"] as const

function verifyMedicalAccess(role: string): boolean {
  return (ALLOWED_ROLES as readonly string[]).includes(role)
}

// ── GET : Lister les mesures de santé ─────────────────────────────
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  if (!verifyMedicalAccess(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const dossier = await prisma.dossierMedical.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  if (!dossier) {
    return NextResponse.json({ mesures: [] })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200)

  const mesures = await prisma.mesureSante.findMany({
    where: {
      dossierId: dossier.id,
      ...(type ? { type: type as never } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  })

  return NextResponse.json({ mesures })
}

// ── POST : Ajouter une mesure de santé ────────────────────────────
const TYPES_MESURE = [
  "POIDS",
  "TENSION_ARTERIELLE",
  "TEMPERATURE",
  "GLYCEMIE",
  "TOUR_DE_TAILLE",
  "FREQUENCE_CARDIAQUE",
  "AUTRE",
] as const

const mesureSchema = z.object({
  type: z.enum(TYPES_MESURE),
  valeur: z.string().min(1).max(100),
  unite: z.string().max(50).optional(),
  commentaire: z.string().max(2000).optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  if (!verifyMedicalAccess(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Les informations envoyées sont incorrectes. Veuillez réessayer." }, { status: 400 })
  }

  const result = mesureSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: "Données invalides", details: z.prettifyError(result.error) },
      { status: 400 }
    )
  }

  // Upsert dossier si nécessaire
  const dossier = await prisma.dossierMedical.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id },
    update: {},
    select: { id: true },
  })

  const mesure = await prisma.mesureSante.create({
    data: {
      dossierId: dossier.id,
      type: result.data.type,
      valeur: result.data.valeur,
      unite: result.data.unite ?? "",
      commentaire: result.data.commentaire ?? null,
    },
  })

  return NextResponse.json({ mesure }, { status: 201 })
}

// ── DELETE : Supprimer une mesure ─────────────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  if (!verifyMedicalAccess(session.user.role)) {
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

  // Vérifier que la mesure appartient bien au dossier de l'utilisateur
  const mesure = await prisma.mesureSante.findFirst({
    where: { id, dossierId: dossier.id },
  })

  if (!mesure) {
    return NextResponse.json({ error: "Mesure introuvable" }, { status: 404 })
  }

  await prisma.mesureSante.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
