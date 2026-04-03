import { typedLogger as logger } from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod/v4"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatPrix, formatDate, genererCreneauCle } from "@/lib/utils"
import { envoyerEmailConfirmationRDV } from "@/lib/email"
import { notifierRDVConfirme } from "@/lib/notifications"
import { getPusherServeur, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher"

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

  // L'utilisateur doit être connecté pour prendre RDV
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Les informations envoyées sont incorrectes. Veuillez réessayer." },
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
  const dateRDV = new Date(dateHeure)

  // Vérifier que le soin existe
  const soin = await prisma.soin.findUnique({ where: { id: soinId } })
  if (!soin) {
    return NextResponse.json({ error: "Soin introuvable." }, { status: 404 })
  }

  // Générer la clé unique du créneau
  const creneauCle = genererCreneauCle(soinId, dateRDV)

  try {
    // Transaction atomique avec gestion de la contrainte unique
    const rdv = await prisma.$transaction(async (tx) => {
      // Vérifier si un créneau actif existe déjà (double-vérification)
      const creneauExistant = await tx.rendezVous.findUnique({
        where: { creneauCle },
      })

      if (creneauExistant) {
        throw new Error("CRENEAU_PRIS")
      }

      // Créer le RDV avec la clé de créneau
      return tx.rendezVous.create({
        data: {
          userId: session.user.id,
          soinId,
          dateHeure: dateRDV,
          creneauCle,
          notes: notes ?? null,
        },
        include: { soin: true },
      })
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

    // Envoyer l'email de confirmation
    try {
      const heureFormatee = dateRDV.toLocaleTimeString("fr", {
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
  } catch (error: unknown) {
    // Gestion de la race condition : contrainte unique violée
    const isPrismaDuplicateError = 
      error && typeof error === "object" && "code" in error && error.code === "P2002"
    
    if (
      (error instanceof Error && error.message === "CRENEAU_PRIS") ||
      isPrismaDuplicateError
    ) {
      return NextResponse.json(
        { error: "Ce créneau vient d'être réservé par un autre client. Veuillez en choisir un autre." },
        { status: 409 }
      )
    }
    logger.error("[POST /api/rdv] Erreur inattendue :", error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la réservation. Veuillez réessayer." },
      { status: 500 }
    )
  }
}
