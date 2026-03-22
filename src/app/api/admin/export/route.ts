import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function csvResponse(filename: string, content: string) {
  return new NextResponse("\uFEFF" + content, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}

function escapeCsv(val: string | null | undefined): string {
  if (!val) return ""
  const s = String(val)
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const type = req.nextUrl.searchParams.get("type")
  const now = new Date().toISOString().split("T")[0]

  if (type === "clients") {
    const clients = await prisma.user.findMany({
      where: { role: "CLIENT" },
      include: {
        _count: { select: { rendezVous: true, commandes: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    const rows = [
      "Prénom,Nom,Email,Téléphone,Ville,Inscription,RDV,Commandes",
      ...clients.map((c) =>
        [
          escapeCsv(c.prenom),
          escapeCsv(c.nom),
          escapeCsv(c.email),
          escapeCsv(c.telephone),
          escapeCsv(c.ville),
          c.createdAt.toISOString().split("T")[0],
          c._count.rendezVous,
          c._count.commandes,
        ].join(",")
      ),
    ]
    return csvResponse(`clients-${now}.csv`, rows.join("\n"))
  }

  if (type === "commandes") {
    const commandes = await prisma.commande.findMany({
      include: {
        user: { select: { prenom: true, nom: true, email: true } },
        lignes: { select: { produit: { select: { nom: true } }, quantite: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    const rows = [
      "ID,Client,Email,Total,Statut,Date,Produits",
      ...commandes.map((c) =>
        [
          escapeCsv(c.id),
          escapeCsv(`${c.user.prenom} ${c.user.nom}`),
          escapeCsv(c.user.email),
          c.total,
          c.statut,
          c.createdAt.toISOString().split("T")[0],
          escapeCsv(c.lignes.map((l) => `${l.produit.nom} x${l.quantite}`).join("; ")),
        ].join(",")
      ),
    ]
    return csvResponse(`commandes-${now}.csv`, rows.join("\n"))
  }

  if (type === "rdv") {
    const rdvs = await prisma.rendezVous.findMany({
      include: {
        user: { select: { prenom: true, nom: true, email: true, telephone: true } },
        soin: { select: { nom: true, prix: true } },
      },
      orderBy: { dateHeure: "desc" },
    })

    const rows = [
      "ID,Client,Email,Téléphone,Soin,Prix,Date,Statut",
      ...rdvs.map((r) =>
        [
          escapeCsv(r.id),
          escapeCsv(`${r.user.prenom} ${r.user.nom}`),
          escapeCsv(r.user.email),
          escapeCsv(r.user.telephone),
          escapeCsv(r.soin.nom),
          r.soin.prix,
          r.dateHeure.toISOString().replace("T", " ").slice(0, 16),
          r.statut,
        ].join(",")
      ),
    ]
    return csvResponse(`rdv-${now}.csv`, rows.join("\n"))
  }

  if (type === "avis") {
    const avis = await prisma.avis.findMany({
      include: {
        user: { select: { prenom: true, nom: true } },
        rdv: { select: { soin: { select: { nom: true } } } },
      },
      orderBy: { createdAt: "desc" },
    })

    const rows = [
      "Client,Soin,Note,Commentaire,Publié,Date",
      ...avis.map((a) =>
        [
          escapeCsv(`${a.user.prenom} ${a.user.nom}`),
          escapeCsv(a.rdv?.soin?.nom ?? ""),
          a.note,
          escapeCsv(a.commentaire),
          a.publie ? "Oui" : "Non",
          a.createdAt.toISOString().split("T")[0],
        ].join(",")
      ),
    ]
    return csvResponse(`avis-${now}.csv`, rows.join("\n"))
  }

  return NextResponse.json({ error: "Type d'export invalide. Utilisez: clients, commandes, rdv, avis" }, { status: 400 })
}
