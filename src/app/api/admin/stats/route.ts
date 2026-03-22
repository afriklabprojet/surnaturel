import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { startOfDay, subDays, startOfMonth, format } from "date-fns"

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const now = new Date()
  const todayStart = startOfDay(now)
  const monthStart = startOfMonth(now)
  const sevenDaysAgo = subDays(todayStart, 6)

  const [
    totalClients,
    rdvAujourdhui,
    commandesEnAttente,
    revenuResult,
    rdvLast7,
    commandesParStatut,
    soinsPopulaires,
    derniersRDV,
    dernieresCommandes,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.rendezVous.count({
      where: {
        dateHeure: { gte: todayStart },
        statut: { not: "ANNULE" },
      },
    }),
    prisma.commande.count({ where: { statut: "EN_ATTENTE" } }),
    prisma.commande.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: monthStart }, statut: "PAYEE" },
    }),
    prisma.rendezVous.findMany({
      where: { dateHeure: { gte: sevenDaysAgo } },
      select: { dateHeure: true },
    }),
    prisma.commande.groupBy({
      by: ["statut"],
      _count: { id: true },
    }),
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
      include: {
        user: { select: { nom: true, prenom: true } },
      },
    }),
  ])

  // Build rdvParJour
  const rdvMap: Record<string, number> = {}
  for (let i = 0; i < 7; i++) {
    const d = format(subDays(todayStart, 6 - i), "dd/MM")
    rdvMap[d] = 0
  }
  for (const r of rdvLast7) {
    const key = format(new Date(r.dateHeure), "dd/MM")
    if (key in rdvMap) rdvMap[key]++
  }
  const rdvParJour = Object.entries(rdvMap).map(([date, count]) => ({ date, count }))

  // Soins noms
  const soinIds = soinsPopulaires.map((s) => s.soinId)
  const soins = soinIds.length > 0
    ? await prisma.soin.findMany({ where: { id: { in: soinIds } }, select: { id: true, nom: true } })
    : []
  const soinNomMap = Object.fromEntries(soins.map((s) => [s.id, s.nom]))

  return NextResponse.json({
    totalClients,
    rdvAujourdhui,
    commandesEnAttente,
    revenuMensuel: revenuResult._sum.total || 0,
    rdvParJour,
    commandesParStatut: commandesParStatut.map((c) => ({
      statut: c.statut,
      count: c._count.id,
    })),
    soinsPopulaires: soinsPopulaires.map((s) => ({
      nom: soinNomMap[s.soinId] || s.soinId,
      count: s._count.id,
    })),
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
  })
}
