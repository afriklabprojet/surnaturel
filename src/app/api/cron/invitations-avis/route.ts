import { typedLogger as logger } from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { envoyerEmailInvitationAvis } from "@/lib/email"

// GET /api/cron/invitations-avis
// Envoie un email d'invitation à laisser un avis 24h après un RDV terminé.
// Les RDV doivent avoir le statut TERMINE et ne pas avoir déjà reçu l'email.
//
// Doit être appelé quotidiennement (node-cron PM2 ou cron externe).
// Protégé par CRON_SECRET pour éviter les appels non autorisés.

export async function GET(req: NextRequest) {
  // Vérifier le secret pour autoriser l'appel cron
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  // Trouver les RDV terminés il y a 24h qui n'ont pas encore reçu l'email
  // et qui n'ont pas encore d'avis associé
  const maintenant = new Date()
  const il24h = new Date(maintenant.getTime() - 24 * 60 * 60 * 1000)
  const il48h = new Date(maintenant.getTime() - 48 * 60 * 60 * 1000)

  const rdvsTermines = await prisma.rendezVous.findMany({
    where: {
      statut: "TERMINE",
      emailAvisEnvoye: false,
      // RDV terminé entre 24h et 48h pour ne pas relancer trop de fois
      dateHeure: { gte: il48h, lte: il24h },
      // Pas encore d'avis associé
      avis: null,
    },
    include: {
      user: { select: { email: true, prenom: true } },
      soin: { select: { nom: true } },
    },
  })

  let envoyes = 0
  let erreurs = 0

  for (const rdv of rdvsTermines) {
    if (!rdv.user.email) continue

    try {
      await envoyerEmailInvitationAvis({
        destinataire: rdv.user.email,
        prenom: rdv.user.prenom,
        soin: rdv.soin.nom,
        rdvId: rdv.id,
      })

      // Marquer comme envoyé
      await prisma.rendezVous.update({
        where: { id: rdv.id },
        data: { emailAvisEnvoye: true },
      })

      envoyes++
    } catch (error) {
      logger.error(
        `[CRON invitations-avis] Erreur pour RDV ${rdv.id}:`,
        error
      )
      erreurs++
    }
  }

  return NextResponse.json({
    ok: true,
    traites: rdvsTermines.length,
    envoyes,
    erreurs,
    timestamp: maintenant.toISOString(),
  })
}
