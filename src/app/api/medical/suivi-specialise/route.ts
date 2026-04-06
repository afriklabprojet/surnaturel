import { typedLogger as logger } from "@/lib/logger"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { encrypt, decrypt } from "@/lib/crypto"

const ALLOWED_ROLES = ["CLIENT", "ACCOMPAGNATEUR_MEDICAL"]

const SuiviSchema = z.object({
  type: z.enum(["GROSSESSE", "POST_PARTUM", "NOURRISSON", "PEDIATRIQUE", "GYNECOLOGIQUE", "GENERAL"]),
  actif: z.boolean().optional(),
  // Grossesse
  dateDebutGrossesse: z.string().nullable().optional(),
  semainesAmenorhee: z.number().int().min(0).max(45).nullable().optional(),
  datePrevueAccouchement: z.string().nullable().optional(),
  parite: z.string().max(20).nullable().optional(),
  // Pédiatrie/Nourrisson
  dateNaissancePatient: z.string().nullable().optional(),
  prenomPatient: z.string().max(60).nullable().optional(),
  // Biométrie
  poidsKg: z.number().min(0).max(500).nullable().optional(),
  tailleCm: z.number().min(0).max(250).nullable().optional(),
  perimCranienCm: z.number().min(0).max(60).nullable().optional(),
  // Général
  notes: z.string().max(4000).nullable().optional(),
  examensRealises: z.array(z.string()).nullable().optional(),
  prochainControle: z.string().nullable().optional(),
})

async function getOrCreateDossier(userId: string) {
  return prisma.dossierMedical.upsert({
    where: { userId },
    create: { userId },
    update: {},
    select: { id: true },
  })
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const dossier = await prisma.dossierMedical.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!dossier) {
      return NextResponse.json({ suivis: [] })
    }

    const suivis = await (prisma as any).suiviSpecialise.findMany({
      where: { dossierId: dossier.id },
      orderBy: [{ actif: "desc" }, { updatedAt: "desc" }],
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decrypted = suivis.map((s: any) => ({
      ...s,
      notes: s.notes ? decrypt(s.notes) : null,
      examensRealises: s.examensRealises ? JSON.parse(s.examensRealises) : [],
    }))

    return NextResponse.json({ suivis: decrypted })
  } catch (error) {
    logger.error("Erreur GET suivi-specialise:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = SuiviSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 })
    }

    const dossier = await getOrCreateDossier(session.user.id)
    const data = parsed.data

    const suivi = await (prisma as any).suiviSpecialise.create({
      data: {
        dossierId: dossier.id,
        type: data.type,
        actif: data.actif ?? true,
        dateDebutGrossesse: data.dateDebutGrossesse ? new Date(data.dateDebutGrossesse) : null,
        semainesAmenorhee: data.semainesAmenorhee ?? null,
        datePrevueAccouchement: data.datePrevueAccouchement ? new Date(data.datePrevueAccouchement) : null,
        parite: data.parite ?? null,
        dateNaissancePatient: data.dateNaissancePatient ? new Date(data.dateNaissancePatient) : null,
        prenomPatient: data.prenomPatient ?? null,
        poidsKg: data.poidsKg ?? null,
        tailleCm: data.tailleCm ?? null,
        perimCranienCm: data.perimCranienCm ?? null,
        notes: data.notes ? encrypt(data.notes) : null,
        examensRealises: data.examensRealises ? JSON.stringify(data.examensRealises) : null,
        prochainControle: data.prochainControle ? new Date(data.prochainControle) : null,
      },
    })

    return NextResponse.json({ suivi: { ...suivi, notes: data.notes ?? null, examensRealises: data.examensRealises ?? [] } }, { status: 201 })
  } catch (error) {
    logger.error("Erreur POST suivi-specialise:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...rest } = body
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 })

    const parsed = SuiviSchema.partial().safeParse(rest)
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 })
    }

    // Vérifier que le suivi appartient bien à cet utilisateur
    const dossier = await prisma.dossierMedical.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!dossier) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 })

    const existing = await (prisma as any).suiviSpecialise.findFirst({
      where: { id, dossierId: dossier.id },
    })
    if (!existing) return NextResponse.json({ error: "Suivi introuvable" }, { status: 404 })

    const data = parsed.data
    const updateData: Record<string, unknown> = { ...data }

    if (data.notes !== undefined) {
      updateData.notes = data.notes ? encrypt(data.notes) : null
    }
    if (data.examensRealises !== undefined) {
      updateData.examensRealises = data.examensRealises ? JSON.stringify(data.examensRealises) : null
    }
    if (data.dateDebutGrossesse !== undefined) {
      updateData.dateDebutGrossesse = data.dateDebutGrossesse ? new Date(data.dateDebutGrossesse as string) : null
    }
    if (data.datePrevueAccouchement !== undefined) {
      updateData.datePrevueAccouchement = data.datePrevueAccouchement ? new Date(data.datePrevueAccouchement as string) : null
    }
    if (data.dateNaissancePatient !== undefined) {
      updateData.dateNaissancePatient = data.dateNaissancePatient ? new Date(data.dateNaissancePatient as string) : null
    }
    if (data.prochainControle !== undefined) {
      updateData.prochainControle = data.prochainControle ? new Date(data.prochainControle as string) : null
    }

    await (prisma as any).suiviSpecialise.update({ where: { id }, data: updateData })

    return NextResponse.json({ ok: true })
  } catch (error) {
    logger.error("Erreur PATCH suivi-specialise:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 })

    const dossier = await prisma.dossierMedical.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!dossier) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 })

    const existing = await (prisma as any).suiviSpecialise.findFirst({
      where: { id, dossierId: dossier.id },
    })
    if (!existing) return NextResponse.json({ error: "Suivi introuvable" }, { status: 404 })

    await (prisma as any).suiviSpecialise.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    logger.error("Erreur DELETE suivi-specialise:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
