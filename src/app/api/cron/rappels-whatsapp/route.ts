import { typedLogger as logger } from "@/lib/logger"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  envoyerWhatsAppRappelRDV,
  isWhatsAppConfigured,
} from "@/lib/whatsapp"

/**
 * Route CRON pour envoyer des rappels WhatsApp de RDV
 * À programmer pour s'exécuter quotidiennement (ex: 18h la veille)
 * 
 * node-cron (PM2): Configuré dans ecosystem.config.js
 * {
 *   "crons": [{
 *     "path": "/api/cron/rappels-whatsapp",
 *     "schedule": "0 18 * * *"
 *   }]
 * }
 */
export async function GET(request: Request) {
  try {
    // Vérifier le secret CRON pour sécuriser l'endpoint
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    if (!isWhatsAppConfigured()) {
      return NextResponse.json({
        skipped: true,
        message: "WhatsApp non configuré",
      })
    }

    // Trouver les RDV de demain qui n'ont pas encore reçu de rappel
    const demain = new Date()
    demain.setDate(demain.getDate() + 1)
    demain.setHours(0, 0, 0, 0)

    const apresDemain = new Date(demain)
    apresDemain.setDate(apresDemain.getDate() + 1)

    const rdvsDemain = await prisma.rendezVous.findMany({
      where: {
        dateHeure: {
          gte: demain,
          lt: apresDemain,
        },
        statut: "CONFIRME",
        smsRappelEnvoye: false, // Réutiliser ce champ pour WhatsApp
      },
      include: {
        user: {
          select: {
            prenom: true,
            telephone: true,
          },
        },
        soin: {
          select: {
            nom: true,
          },
        },
      },
    })

    let envoyes = 0
    let erreurs = 0
    const details: Array<{ rdvId: string; success: boolean; error?: string }> = []

    for (const rdv of rdvsDemain) {
      if (!rdv.user.telephone) {
        details.push({ rdvId: rdv.id, success: false, error: "Pas de téléphone" })
        continue
      }

      const result = await envoyerWhatsAppRappelRDV(
        rdv.user.telephone,
        rdv.user.prenom || "Client",
        rdv.soin?.nom || "Soin",
        rdv.dateHeure
      )

      if (result.success) {
        envoyes++
        // Marquer comme envoyé
        await prisma.rendezVous.update({
          where: { id: rdv.id },
          data: { smsRappelEnvoye: true },
        })
        details.push({ rdvId: rdv.id, success: true })
      } else {
        erreurs++
        details.push({ rdvId: rdv.id, success: false, error: result.error })
      }

      // Pause entre les envois pour respecter les limites de rate
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    return NextResponse.json({
      success: true,
      total: rdvsDemain.length,
      envoyes,
      erreurs,
      details,
    })
  } catch (error) {
    logger.error("Erreur CRON rappels WhatsApp:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}
