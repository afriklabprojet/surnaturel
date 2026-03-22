import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const debut = searchParams.get("debut")
  const fin = searchParams.get("fin")
  const format = searchParams.get("format") // json | csv

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
  ])

  const rapport = {
    periode: { debut: debut || "tout", fin: fin || "tout" },
    clients: { total: totalClients, nouveaux: nouveauxClients },
    rdv: {
      total: totalRdv,
      parStatut: Object.fromEntries(rdvParStatut.map((r) => [r.statut, r._count])),
    },
    commandes: { total: totalCommandes, ca: caCommandes._sum.total || 0 },
    avis: { total: totalAvis, moyenne: Number((moyenneAvis._avg.note || 0).toFixed(1)) },
    parrainages: { total: totalParrainages },
    fidelite: { totalPoints: totalPointsFidelite._sum.total || 0 },
  }

  // CSV export
  if (format === "csv") {
    const lines = [
      "Métrique,Valeur",
      `Clients total,${rapport.clients.total}`,
      `Clients nouveaux (période),${rapport.clients.nouveaux}`,
      `RDV total,${rapport.rdv.total}`,
      ...Object.entries(rapport.rdv.parStatut).map(([k, v]) => `RDV ${k},${v}`),
      `Commandes total,${rapport.commandes.total}`,
      `CA total,${rapport.commandes.ca}`,
      `Avis total,${rapport.avis.total}`,
      `Note moyenne,${rapport.avis.moyenne}`,
      `Parrainages total,${rapport.parrainages.total}`,
      `Points fidélité distribués,${rapport.fidelite.totalPoints}`,
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
