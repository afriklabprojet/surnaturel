import { typedLogger as logger } from "@/lib/logger"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/admin/sage-femme/stats
 * Statistiques mensuelles de l'année en cours.
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SAGE_FEMME")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const annee = new Date().getFullYear()
    const debutAnnee = new Date(annee, 0, 1)
    const finAnnee = new Date(annee + 1, 0, 1)

    // Tous les RDV de l'année
    const rdvAnnee = await prisma.rendezVous.findMany({
      where: { dateHeure: { gte: debutAnnee, lt: finAnnee } },
      select: {
        dateHeure: true,
        statut: true,
        soin: { select: { prix: true, duree: true } },
      },
      orderBy: { dateHeure: "asc" },
    })

    // Agréger par mois
    const par_mois = Array.from({ length: 12 }, (_, i) => ({
      mois: i + 1,
      label: new Date(annee, i).toLocaleDateString("fr-FR", { month: "short" }),
      rdvTotal: 0,
      rdvTermines: 0,
      rdvAnnules: 0,
      revenu: 0,
      dureeMin: 0,
    }))

    for (const rdv of rdvAnnee) {
      const m = new Date(rdv.dateHeure).getMonth() // 0-based
      par_mois[m].rdvTotal++
      if (rdv.statut === "TERMINE") {
        par_mois[m].rdvTermines++
        par_mois[m].revenu += rdv.soin?.prix ?? 0
        par_mois[m].dureeMin += rdv.soin?.duree ?? 0
      }
      if (rdv.statut === "ANNULE") par_mois[m].rdvAnnules++
    }

    // Totaux annuels
    const totalRdv = rdvAnnee.length
    const totalTermines = rdvAnnee.filter((r) => r.statut === "TERMINE").length
    const totalRevenu = rdvAnnee
      .filter((r) => r.statut === "TERMINE")
      .reduce((s, r) => s + (r.soin?.prix ?? 0), 0)
    const tauxAnnulation =
      totalRdv > 0 ? Math.round((rdvAnnee.filter((r) => r.statut === "ANNULE").length / totalRdv) * 100) : 0

    // Répartition par type de soin (top 5)
    const parSoin: Record<string, { nom: string; count: number }> = {}
    const rdvDetailSoin = await prisma.rendezVous.findMany({
      where: { dateHeure: { gte: debutAnnee, lt: finAnnee }, statut: "TERMINE" },
      select: { soin: { select: { nom: true } } },
    })
    for (const rdv of rdvDetailSoin) {
      const nom = rdv.soin?.nom ?? "Autre"
      if (!parSoin[nom]) parSoin[nom] = { nom, count: 0 }
      parSoin[nom].count++
    }
    const topSoins = Object.values(parSoin)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return NextResponse.json({
      annee,
      parMois: par_mois,
      totaux: { rdvTotal: totalRdv, rdvTermines: totalTermines, revenu: totalRevenu, tauxAnnulation },
      topSoins,
    })
  } catch (error) {
    logger.error("Erreur stats sage-femme:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
