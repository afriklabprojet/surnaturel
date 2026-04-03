import { typedLogger as logger } from "@/lib/logger"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { envoyerEmailReactivation } from "@/lib/email"

// ─── CRON: Réactivation des comptes inactifs >30 jours ───────────
// Exécuté tous les lundis à 10h

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`

  if (authHeader !== expectedToken) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Soixante jours pour ne pas relancer trop vieux comptes
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    // Utilisateurs inactifs entre 30 et 60 jours
    const inactifs = await prisma.user.findMany({
      where: {
        derniereVueAt: {
          lte: thirtyDaysAgo,
          gte: sixtyDaysAgo,
        },
        notifNewsletter: true,
        statutProfil: "ACTIF",
        role: "CLIENT",
      },
      select: {
        id: true,
        email: true,
        prenom: true,
        pointsFidelite: { select: { total: true } },
      },
      take: 50,
    })

    let sent = 0
    let errors = 0

    for (const user of inactifs) {
      try {
        // Derniers soins consultés (3 derniers RDV)
        const dernierRdv = await prisma.rendezVous.findMany({
          where: { userId: user.id },
          orderBy: { dateHeure: "desc" },
          take: 3,
          select: { soin: { select: { nom: true } } },
        })

        const derniersSoins = dernierRdv.map((r) => r.soin.nom)
        const points = user.pointsFidelite?.total ?? 0

        await envoyerEmailReactivation({
          destinataire: user.email,
          prenom: user.prenom || "Chère cliente",
          derniersSoins: derniersSoins,
          pointsFidelite: points,
        })

        sent++
      } catch {
        errors++
      }
    }

    return NextResponse.json({
      success: true,
      found: inactifs.length,
      sent,
      errors,
    })
  } catch (error) {
    logger.error("Erreur cron réactivation:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'envoi des emails de réactivation" },
      { status: 500 }
    )
  }
}
