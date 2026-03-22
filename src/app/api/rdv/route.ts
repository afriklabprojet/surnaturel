import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatPrix, formatDate } from "@/lib/utils"
import { envoyerEmailConfirmationRDV } from "@/lib/email"
import { notifierRDVConfirme } from "@/lib/notifications"

// ── GET : Liste des RDV de l'utilisateur connecté ─────────────────
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const url = new URL(req.url)
  const categorie = url.searchParams.get("categorie")

  const where: Record<string, unknown> = { userId: session.user.id }
  if (categorie) {
    where.soin = { categorie }
  }

  const rdvs = await prisma.rendezVous.findMany({
    where,
    include: { soin: true },
    orderBy: { dateHeure: "desc" },
  })

  return NextResponse.json({ rdvs })
}

const rdvSchema = z.object({
  soinId: z.string().min(1),
  dateHeure: z.string().datetime(),
  notes: z.string().max(500).optional(),
  // Champs invité (si non connecté)
  nom: z.string().min(2).max(50).optional(),
  prenom: z.string().min(2).max(50).optional(),
  telephone: z.string().optional(),
})

export async function POST(request: Request) {
  const session = await auth()

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide." },
      { status: 400 }
    )
  }

  const result = rdvSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Données invalides." },
      { status: 400 }
    )
  }

  const { soinId, dateHeure, notes } = result.data

  // Vérifier que le soin existe
  const soin = await prisma.soin.findUnique({ where: { id: soinId } })
  if (!soin) {
    return NextResponse.json({ error: "Soin introuvable." }, { status: 404 })
  }

  // Vérifier que le créneau est libre
  const dateRDV = new Date(dateHeure)
  const debutHeure = new Date(dateRDV)
  debutHeure.setMinutes(0, 0, 0)
  const finHeure = new Date(debutHeure)
  finHeure.setHours(finHeure.getHours() + 1)

  const creneauPris = await prisma.rendezVous.findFirst({
    where: {
      soinId,
      dateHeure: { gte: debutHeure, lt: finHeure },
      statut: { not: "ANNULE" },
    },
  })

  if (creneauPris) {
    return NextResponse.json(
      { error: "Ce créneau est déjà réservé. Veuillez en choisir un autre." },
      { status: 409 }
    )
  }

  // L'utilisateur doit être connecté pour prendre RDV
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const rdv = await prisma.rendezVous.create({
    data: {
      userId: session.user.id,
      soinId,
      dateHeure: dateRDV,
      notes: notes ?? null,
    },
    include: { soin: true },
  })

  // Envoyer l'email de confirmation
  try {
    const heureFormatee = dateRDV.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Africa/Abidjan",
    })
    await envoyerEmailConfirmationRDV({
      destinataire: session.user.email,
      nom: session.user.prenom,
      soin: rdv.soin.nom,
      date: formatDate(dateRDV),
      heure: heureFormatee,
      prix: formatPrix(rdv.soin.prix),
    })
  } catch {
    // L'email échoue silencieusement — le RDV est quand même créé
  }

  // Notification in-app
  try {
    await notifierRDVConfirme(session.user.id, rdv.soin.nom, dateRDV)
  } catch { /* notification optionnelle */ }

  return NextResponse.json(
    { rdvId: rdv.id, message: "Rendez-vous créé avec succès." },
    { status: 201 }
  )
}
