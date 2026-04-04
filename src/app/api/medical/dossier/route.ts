import { NextRequest, NextResponse } from "next/server"
import { auth, verifyActiveJti } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { encrypt, decrypt } from "@/lib/crypto"
import { z } from "zod/v4"

const ALLOWED_ROLES = ["CLIENT", "ACCOMPAGNATEUR_MEDICAL"] as const

function verifyMedicalAccess(role: string): boolean {
  return (ALLOWED_ROLES as readonly string[]).includes(role)
}

// ── GET : Récupérer le dossier médical de l'utilisateur connecté ──
export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  // Vérifier que la session n'a pas été révoquée (jti check)
  if (session.jti) {
    const active = await verifyActiveJti(session.jti)
    if (!active) {
      return NextResponse.json({ error: "Session révoquée. Reconnectez-vous." }, { status: 401 })
    }
  }

  if (!verifyMedicalAccess(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const dossier = await prisma.dossierMedical.findUnique({
    where: { userId: session.user.id },
  })

  if (!dossier) {
    return NextResponse.json({ dossier: null })
  }

  const safeDecrypt = (val: string | null) => {
    if (!val) return ""
    try {
      return decrypt(val)
    } catch {
      return ""
    }
  }

  return NextResponse.json({
    dossier: {
      id: dossier.id,
      pathologie: safeDecrypt(dossier.pathologie),
      notes: safeDecrypt(dossier.notes),
      allergies: safeDecrypt(dossier.allergies),
      antecedents: safeDecrypt(dossier.antecedents),
      medicaments: safeDecrypt(dossier.medicaments),
      groupeSanguin: safeDecrypt(dossier.groupeSanguin),
      contactUrgence: safeDecrypt(dossier.contactUrgence),
      updatedAt: dossier.updatedAt,
    },
  })
}

// ── PATCH : Mettre à jour le dossier médical ──────────────────────
const GROUPES_SANGUINS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""] as const

const dossierSchema = z.object({
  pathologie: z.string().max(5000).optional(),
  notes: z.string().max(10000).optional(),
  allergies: z.string().max(5000).optional(),
  antecedents: z.string().max(5000).optional(),
  medicaments: z.string().max(5000).optional(),
  groupeSanguin: z.enum(GROUPES_SANGUINS).optional(),
  contactUrgence: z.string().max(2000).optional(),
})

export async function PATCH(req: NextRequest) {
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

  const result = dossierSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: "Données invalides", details: z.prettifyError(result.error) },
      { status: 400 }
    )
  }

  const d = result.data
  const encryptOpt = (v: string | undefined) => v ? encrypt(v) : null

  await prisma.dossierMedical.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      pathologie: encryptOpt(d.pathologie),
      notes: encryptOpt(d.notes),
      allergies: encryptOpt(d.allergies),
      antecedents: encryptOpt(d.antecedents),
      medicaments: encryptOpt(d.medicaments),
      groupeSanguin: d.groupeSanguin ? encrypt(d.groupeSanguin) : null,
      contactUrgence: encryptOpt(d.contactUrgence),
    },
    update: {
      pathologie: encryptOpt(d.pathologie),
      notes: encryptOpt(d.notes),
      allergies: encryptOpt(d.allergies),
      antecedents: encryptOpt(d.antecedents),
      medicaments: encryptOpt(d.medicaments),
      groupeSanguin: d.groupeSanguin ? encrypt(d.groupeSanguin) : null,
      contactUrgence: encryptOpt(d.contactUrgence),
    },
  })

  return NextResponse.json({
    success: true,
    message: "Dossier médical mis à jour",
  })
}

// POST alias pour créer / mettre à jour le dossier (même logique que PATCH)
export { PATCH as POST }
