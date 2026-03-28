import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { envoyerSmsRappelRDV } from "@/lib/sms"
import { formatDate } from "@/lib/utils"

// GET /api/cron/rappels-sms
// Envoie un SMS de rappel aux clientes qui ont un RDV le lendemain
// et qui ont renseigné leur numéro de téléphone.
//
// Doit être appelé quotidiennement (Vercel Cron ou cron externe).
// Protégé par CRON_SECRET pour éviter les appels non autorisés.

export async function GET(req: NextRequest) {
  // Vérifier le secret pour autoriser l'appel cron
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  // Trouver les RDV de demain qui n'ont pas encore reçu de SMS
  const maintenant = new Date()
  const demainDebut = new Date(maintenant)
  demainDebut.setDate(demainDebut.getDate() + 1)
  demainDebut.setHours(0, 0, 0, 0)

  const demainFin = new Date(demainDebut)
  demainFin.setHours(23, 59, 59, 999)

  const rdvsDemain = await prisma.rendezVous.findMany({
    where: {
      dateHeure: { gte: demainDebut, lte: demainFin },
      statut: { in: ["EN_ATTENTE", "CONFIRME"] },
      smsRappelEnvoye: false,
      telephoneSms: { not: null },
    },
    include: {
      user: { select: { prenom: true, telephone: true } },
      soin: { select: { nom: true } },
    },
  })

  let envoyes = 0
  let erreurs = 0

  for (const rdv of rdvsDemain) {
    const telephone = rdv.telephoneSms || rdv.user.telephone
    if (!telephone) continue

    const heure = rdv.dateHeure.toLocaleTimeString("fr", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Africa/Abidjan",
    })

    const ok = await envoyerSmsRappelRDV({
      telephone,
      prenom: rdv.user.prenom,
      soin: rdv.soin.nom,
      date: formatDate(rdv.dateHeure),
      heure,
    })

    if (ok) {
      await prisma.rendezVous.update({
        where: { id: rdv.id },
        data: { smsRappelEnvoye: true },
      })
      envoyes++
    } else {
      erreurs++
    }
  }

  return NextResponse.json({
    message: `Rappels SMS envoyés : ${envoyes}, erreurs : ${erreurs}, total RDV demain : ${rdvsDemain.length}`,
    envoyes,
    erreurs,
    total: rdvsDemain.length,
  })
}
