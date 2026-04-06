import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { envoyerEmailRappelRDV } from "@/lib/email"
import { envoyerPushAUtilisateur } from "@/lib/push-service"
import { PUSH_TYPES } from "@/lib/web-push"

// GET — appelé par node-cron (PM2) chaque jour à 8h
export async function GET(request: Request) {
  // Protection par secret partagé
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const demain = new Date()
  demain.setDate(demain.getDate() + 1)
  demain.setHours(0, 0, 0, 0)

  const apresdemain = new Date(demain)
  apresdemain.setDate(apresdemain.getDate() + 1)

  const rdvsDemain = await prisma.rendezVous.findMany({
    where: {
      dateHeure: { gte: demain, lt: apresdemain },
      statut: { in: ["EN_ATTENTE", "CONFIRME"] },
    },
    include: {
      user: { select: { email: true, prenom: true, nom: true } },
      soin: { select: { nom: true } },
    },
  })

  const formatter = new Intl.DateTimeFormat("fr-CI", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Abidjan",
  })

  const heureFormatter = new Intl.DateTimeFormat("fr-CI", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Abidjan",
  })

  let envoyes = 0
  let erreurs = 0
  let pushEnvoyes = 0

  await Promise.allSettled(
    rdvsDemain.map(async (rdv) => {
      try {
        await envoyerEmailRappelRDV({
          destinataire: rdv.user.email,
          nom: `${rdv.user.prenom} ${rdv.user.nom}`,
          soin: rdv.soin.nom,
          date: formatter.format(rdv.dateHeure),
          heure: heureFormatter.format(rdv.dateHeure),
        })
        envoyes++

        // Notification push en complément
        const pushResult = await envoyerPushAUtilisateur(
          rdv.userId,
          PUSH_TYPES.RDV_RAPPEL,
          { soin: rdv.soin.nom, heure: heureFormatter.format(rdv.dateHeure) }
        )
        pushEnvoyes += pushResult.envoyes
      } catch {
        erreurs++
      }
    })
  )

  return NextResponse.json({
    success: true,
    rdvsTotal: rdvsDemain.length,
    envoyes,
    pushEnvoyes,
    erreurs,
  })
}
