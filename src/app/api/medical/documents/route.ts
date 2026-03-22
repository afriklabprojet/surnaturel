import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { encrypt, decrypt } from "@/lib/crypto"
import { z } from "zod/v4"

const ALLOWED_ROLES = ["CLIENT", "ACCOMPAGNATEUR_MEDICAL"] as const

function verifyMedicalAccess(role: string): boolean {
  return (ALLOWED_ROLES as readonly string[]).includes(role)
}

// ── GET : Lister les documents médicaux ───────────────────────────
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
    return NextResponse.json({ documents: [] })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")

  const documents = await prisma.documentMedical.findMany({
    where: {
      dossierId: dossier.id,
      ...(type ? { type: type as never } : {}),
    },
    orderBy: { createdAt: "desc" },
  })

  // Déchiffrer la description
  const decrypted = documents.map((doc) => ({
    ...doc,
    description: doc.description ? (() => { try { return decrypt(doc.description!) } catch { return "" } })() : "",
  }))

  return NextResponse.json({ documents: decrypted })
}

// ── POST : Ajouter un document médical ────────────────────────────
const TYPES_DOCUMENT = [
  "ORDONNANCE",
  "ANALYSE",
  "RADIO_IMAGERIE",
  "COMPTE_RENDU",
  "CERTIFICAT",
  "AUTRE",
] as const

const documentSchema = z.object({
  nom: z.string().min(1).max(255),
  type: z.enum(TYPES_DOCUMENT),
  fileUrl: z.string().url().max(2000),
  taille: z.number().int().nonnegative().optional(),
  description: z.string().max(5000).optional(),
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
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 })
  }

  const result = documentSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: "Données invalides", details: z.prettifyError(result.error) },
      { status: 400 }
    )
  }

  const dossier = await prisma.dossierMedical.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id },
    update: {},
    select: { id: true },
  })

  const d = result.data
  const document = await prisma.documentMedical.create({
    data: {
      dossierId: dossier.id,
      nom: d.nom,
      type: d.type,
      fileUrl: d.fileUrl,
      taille: d.taille ?? null,
      description: d.description ? encrypt(d.description) : null,
    },
  })

  console.log(
    `[MEDICAL] document:create userId:${session.user.id} type:${document.type} at:${new Date().toISOString()}`
  )

  return NextResponse.json({ document }, { status: 201 })
}

// ── DELETE : Supprimer un document ────────────────────────────────
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

  const document = await prisma.documentMedical.findFirst({
    where: { id, dossierId: dossier.id },
  })

  if (!document) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 })
  }

  await prisma.documentMedical.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
