import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { envoyerSms } from "@/lib/sms"
import { SITE_URL } from "@/lib/site"

// Relance par SMS les commandes dont le paiement a échoué
// Exécuté toutes les 30 minutes via Vercel CRON
// Ne relance qu'une fois par commande (relanceSmsEnvoyee)
// Ne relance que les commandes échouées depuis > 5 min et < 24h

export async function GET(req: NextRequest) {
  // Vérifier l'authentification CRON (Vercel ou clé secrète)
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const cinqMinutes = new Date(Date.now() - 5 * 60 * 1000)
  const vingtQuatreHeures = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const commandesEchouees = await prisma.commande.findMany({
    where: {
      statut: "EN_ATTENTE",
      dernierEchecAt: {
        gte: vingtQuatreHeures,
        lte: cinqMinutes,
      },
      relanceSmsEnvoyee: false,
      tentativesPaiement: { gte: 1 },
    },
    include: {
      user: {
        select: { id: true, prenom: true, telephone: true, email: true },
      },
    },
    take: 50,
  })

  let relancees = 0

  for (const commande of commandesEchouees) {
    const telephone = commande.user.telephone
    if (!telephone) continue

    const message =
      `Bonjour ${commande.user.prenom}, votre paiement de ${Math.round(commande.total).toLocaleString("fr-FR")} F CFA n'a pas abouti. ` +
      `Vous pouvez réessayer depuis votre espace client : ${SITE_URL}/commandes/${commande.id}. ` +
      `Si le problème persiste, contactez-nous.`

    try {
      const sent = await envoyerSms(telephone, message)
      if (sent) {
        await prisma.commande.update({
          where: { id: commande.id },
          data: { relanceSmsEnvoyee: true },
        })
        relancees++
      }
    } catch (error) {
      capturePaymentError(error, commande.paiementId ?? commande.id, {
        commandeId: commande.id,
        montant: commande.total,
        methode: commande.methodePaiement ?? undefined,
      })
    }
  }

  return NextResponse.json({
    ok: true,
    relancees,
    total: commandesEchouees.length,
  })
}
