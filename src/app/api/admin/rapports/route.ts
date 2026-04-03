import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { subMonths, startOfMonth, format } from "date-fns"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const debut = searchParams.get("debut")
  const fin = searchParams.get("fin")
  const fmt = searchParams.get("format") // json | csv

  const dateFilter: Record<string, unknown> = {}
  if (debut) dateFilter.gte = new Date(debut)
  if (fin) dateFilter.lte = new Date(fin)
  const hasDateFilter = debut || fin

  // Parallel queries
  const [
    totalClients,
    nouveauxClients,
    totalRdv,
    rdvParStatut,
    totalCommandes,
    caCommandes,
    totalAvis,
    moyenneAvis,
    totalParrainages,
    totalPointsFidelite,
    soinsPopulaires,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.user.count({ where: { role: "CLIENT", ...(hasDateFilter ? { createdAt: dateFilter } : {}) } }),
    prisma.rendezVous.count({ where: hasDateFilter ? { dateHeure: dateFilter } : {} }),
    prisma.rendezVous.groupBy({
      by: ["statut"],
      _count: true,
      ...(hasDateFilter ? { where: { dateHeure: dateFilter } } : {}),
    }),
    prisma.commande.count({ where: hasDateFilter ? { createdAt: dateFilter } : {} }),
    prisma.commande.aggregate({
      _sum: { total: true },
      ...(hasDateFilter ? { where: { createdAt: dateFilter } } : {}),
    }),
    prisma.avis.count({ where: hasDateFilter ? { createdAt: dateFilter } : {} }),
    prisma.avis.aggregate({
      _avg: { note: true },
      ...(hasDateFilter ? { where: { createdAt: dateFilter } } : {}),
    }),
    prisma.parrainage.count({ where: hasDateFilter ? { createdAt: dateFilter } : {} }),
    prisma.pointsFidelite.aggregate({ _sum: { total: true } }),
    prisma.rendezVous.groupBy({
      by: ["soinId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 8,
      ...(hasDateFilter ? { where: { dateHeure: dateFilter } } : {}),
    }),
  ])

  // Revenu mensuel sur 6 mois — une seule requête GROUP BY au lieu de 12 requêtes séquentielles
  const now = new Date()
  const [revenuMensuelRaw, rdvMensuelRaw] = await Promise.all([
    prisma.$queryRaw<{ mois: Date; ca: number }[]>`
      SELECT date_trunc('month', "createdAt") AS mois, COALESCE(SUM(total), 0)::float AS ca
      FROM "Commande"
      WHERE "createdAt" >= ${subMonths(now, 5)}
        AND statut != 'ANNULEE'
      GROUP BY mois
      ORDER BY mois ASC
    `,
    prisma.$queryRaw<{ mois: Date; rdv: number }[]>`
      SELECT date_trunc('month', "dateHeure") AS mois, COUNT(*)::int AS rdv
      FROM "RendezVous"
      WHERE "dateHeure" >= ${subMonths(now, 5)}
      GROUP BY mois
      ORDER BY mois ASC
    `,
  ])

  const revenuMensuel: { mois: string; ca: number; rdv: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const mStart = startOfMonth(subMonths(now, i))
    const key = format(mStart, "MMM yyyy")
    const caRow = revenuMensuelRaw.find((r) => format(new Date(r.mois), "MMM yyyy") === key)
    const rdvRow = rdvMensuelRaw.find((r) => format(new Date(r.mois), "MMM yyyy") === key)
    revenuMensuel.push({ mois: key, ca: caRow?.ca ?? 0, rdv: rdvRow?.rdv ?? 0 })
  }

  // Soins noms
  const soinIds = soinsPopulaires.map((s) => s.soinId)
  const soins = soinIds.length > 0
    ? await prisma.soin.findMany({ where: { id: { in: soinIds } }, select: { id: true, nom: true } })
    : []
  const soinNomMap = Object.fromEntries(soins.map((s) => [s.id, s.nom]))

  // Taux de conversion RDV (confirmé+terminé / total)
  const rdvTotal = rdvParStatut.reduce((s, r) => s + r._count, 0)
  const rdvConvertis = rdvParStatut
    .filter((r) => r.statut === "CONFIRME" || r.statut === "TERMINE")
    .reduce((s, r) => s + r._count, 0)
  const tauxConversion = rdvTotal > 0 ? Math.round((rdvConvertis / rdvTotal) * 100) : 0

  const rapport = {
    periode: { debut: debut || "tout", fin: fin || "tout" },
    clients: { total: totalClients, nouveaux: nouveauxClients },
    rdv: {
      total: totalRdv,
      parStatut: Object.fromEntries(rdvParStatut.map((r) => [r.statut, r._count])),
      tauxConversion,
    },
    commandes: { total: totalCommandes, ca: caCommandes._sum.total || 0 },
    avis: { total: totalAvis, moyenne: Number((moyenneAvis._avg.note || 0).toFixed(1)) },
    parrainages: { total: totalParrainages },
    fidelite: { totalPoints: totalPointsFidelite._sum.total || 0 },
    revenuMensuel,
    soinsPopulaires: soinsPopulaires.map((s) => ({
      nom: soinNomMap[s.soinId] || "Inconnu",
      count: s._count.id,
    })),
  }

  // CSV export
  if (fmt === "csv") {
    const lines = [
      "Métrique,Valeur",
      `Clients total,${rapport.clients.total}`,
      `Clients nouveaux (période),${rapport.clients.nouveaux}`,
      `RDV total,${rapport.rdv.total}`,
      `Taux conversion RDV,${rapport.rdv.tauxConversion}%`,
      ...Object.entries(rapport.rdv.parStatut).map(([k, v]) => `RDV ${k},${v}`),
      `Commandes total,${rapport.commandes.total}`,
      `CA total,${rapport.commandes.ca}`,
      `Avis total,${rapport.avis.total}`,
      `Note moyenne,${rapport.avis.moyenne}`,
      `Parrainages total,${rapport.parrainages.total}`,
      `Points fidélité distribués,${rapport.fidelite.totalPoints}`,
      "",
      "Mois,CA,RDV",
      ...rapport.revenuMensuel.map((m) => `${m.mois},${m.ca},${m.rdv}`),
      "",
      "Soin,Réservations",
      ...rapport.soinsPopulaires.map((s) => `${s.nom},${s.count}`),
    ]
    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="rapport-${debut || "all"}-${fin || "all"}.csv"`,
      },
    })
  }

  return NextResponse.json(rapport)
}
