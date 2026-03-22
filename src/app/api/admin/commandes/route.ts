import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { StatutCommande } from "@/generated/prisma/client"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const url = req.nextUrl.searchParams
  const page = Math.max(1, Number(url.get("page")) || 1)
  const limit = Math.min(100, Math.max(1, Number(url.get("limit")) || 20))
  const statut = url.get("statut") as StatutCommande | null

  const where = statut ? { statut } : {}

  const [commandes, total] = await Promise.all([
    prisma.commande.findMany({
      where,
      include: {
        user: { select: { nom: true, prenom: true, email: true } },
        lignes: { include: { produit: { select: { nom: true } } } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.commande.count({ where }),
  ])

  return NextResponse.json({
    commandes: commandes.map((c) => ({
      id: c.id,
      client: `${c.user.prenom} ${c.user.nom}`,
      email: c.user.email,
      total: c.total,
      statut: c.statut,
      paiementId: c.paiementId,
      createdAt: c.createdAt.toISOString(),
      lignes: c.lignes.map((l) => ({
        produit: l.produit.nom,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
      })),
    })),
    total,
  })
}
