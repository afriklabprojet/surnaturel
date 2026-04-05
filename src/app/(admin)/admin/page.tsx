import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { startOfDay, subDays, startOfMonth, format } from "date-fns"
import AdminDashboardClient, { type DashboardData } from "./AdminDashboardClient"

async function getAdminStats(): Promise<DashboardData> {
  const now = new Date()
  const todayStart = startOfDay(now)
  const monthStart = startOfMonth(now)
  const sevenDaysAgo = subDays(todayStart, 6)

  const [
    totalClients,
    rdvAujourdhui,
    rdvEnAttente,
    commandesEnAttente,
    revenuResult,
    rdvLast7,
    commandesParStatut,
    soinsPopulaires,
    derniersRDV,
    dernieresCommandes,
    signalements,
    avisStats,
    derniersAvis,
    postsAujourdhui,
    promosActives,
    abonnesNewsletter,
    pointsFideliteMois,
    caRevenuMensuel,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.rendezVous.count({
      where: { dateHeure: { gte: todayStart }, statut: { not: "ANNULE" } },
    }),
    prisma.rendezVous.count({ where: { statut: "EN_ATTENTE" } }),
    prisma.commande.count({ where: { statut: "EN_ATTENTE" } }),
    prisma.commande.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: monthStart }, statut: "PAYEE" },
    }),
    prisma.rendezVous.findMany({
      where: { dateHeure: { gte: sevenDaysAgo } },
      select: { dateHeure: true },
    }),
    prisma.commande.groupBy({ by: ["statut"], _count: { id: true } }),
    prisma.rendezVous.groupBy({
      by: ["soinId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
    prisma.rendezVous.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { nom: true, prenom: true } },
        soin: { select: { nom: true } },
      },
    }),
    prisma.commande.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { nom: true, prenom: true } } },
    }),
    prisma.signalement.count({ where: { statut: "EN_ATTENTE" } }),
    prisma.avis.aggregate({ _count: { id: true }, _avg: { note: true } }),
    prisma.avis.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { prenom: true, nom: true } },
        soin: { select: { nom: true } },
      },
    }),
    prisma.post.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.codePromo.count({ where: { actif: true } }),
    prisma.user.count({ where: { notifNewsletter: true, role: "CLIENT" } }),
    prisma.historiqueFidelite.aggregate({
      _sum: { points: true },
      where: { createdAt: { gte: monthStart }, points: { gt: 0 } },
    }),
    prisma.commande.findMany({
      where: { createdAt: { gte: subDays(todayStart, 180) }, statut: "PAYEE" },
      select: { createdAt: true, total: true },
    }),
  ])

  // RDV par jour (7 derniers jours)
  const rdvMap: Record<string, number> = {}
  for (let i = 0; i < 7; i++) {
    rdvMap[format(subDays(todayStart, 6 - i), "dd/MM")] = 0
  }
  for (const r of rdvLast7) {
    const key = format(new Date(r.dateHeure), "dd/MM")
    if (key in rdvMap) rdvMap[key]++
  }
  const rdvParJour = Object.entries(rdvMap).map(([date, count]) => ({ date, count }))

  // CA 6 derniers mois
  const caMap: Record<string, number> = {}
  for (let i = 5; i >= 0; i--) {
    caMap[format(subDays(todayStart, i * 30), "MM/yyyy")] = 0
  }
  for (const c of caRevenuMensuel) {
    const key = format(new Date(c.createdAt), "MM/yyyy")
    if (key in caMap) caMap[key] = (caMap[key] || 0) + c.total
  }
  const caParMois = Object.entries(caMap).map(([mois, ca]) => ({ mois, ca }))

  // Résoudre les noms des soins
  const soinIds = soinsPopulaires.map((s) => s.soinId)
  const soins = soinIds.length > 0
    ? await prisma.soin.findMany({ where: { id: { in: soinIds } }, select: { id: true, nom: true } })
    : []
  const soinNomMap = Object.fromEntries(soins.map((s) => [s.id, s.nom]))

  return {
    totalClients,
    rdvAujourdhui,
    rdvEnAttente,
    commandesEnAttente,
    revenuMensuel: revenuResult._sum.total || 0,
    signalements,
    avisTotal: avisStats._count.id,
    avisMoyenne: Math.round((avisStats._avg.note ?? 0) * 10) / 10,
    postsAujourdhui,
    promosActives,
    abonnesNewsletter,
    pointsFideliteMois: pointsFideliteMois._sum.points || 0,
    rdvParJour,
    caParMois,
    commandesParStatut: commandesParStatut.map((c) => ({ statut: c.statut, count: c._count.id })),
    soinsPopulaires: soinsPopulaires.map((s) => ({ nom: soinNomMap[s.soinId] || s.soinId, count: s._count.id })),
    derniersRDV: derniersRDV.map((r) => ({
      id: r.id,
      client: `${r.user.prenom} ${r.user.nom}`,
      soin: r.soin.nom,
      dateHeure: r.dateHeure.toISOString(),
      statut: r.statut,
    })),
    dernieresCommandes: dernieresCommandes.map((c) => ({
      id: c.id,
      client: `${c.user.prenom} ${c.user.nom}`,
      total: c.total,
      statut: c.statut,
      createdAt: c.createdAt.toISOString(),
    })),
    derniersAvis: derniersAvis.map((a) => ({
      id: a.id,
      client: `${a.user.prenom} ${a.user.nom}`,
      soin: a.soin.nom,
      note: a.note,
      commentaire: a.commentaire,
      createdAt: a.createdAt.toISOString(),
    })),
  }
}

export default async function AdminDashboard() {
  const session = await auth()
  if (!session?.user) {
    redirect("/admin/login")
  }
  if (session.user.role === "SAGE_FEMME") {
    redirect("/admin/sage-femme")
  }
  if (session.user.role !== "ADMIN") {
    redirect("/admin/login")
  }

  const data = await getAdminStats()
  return <AdminDashboardClient data={data} />
}
