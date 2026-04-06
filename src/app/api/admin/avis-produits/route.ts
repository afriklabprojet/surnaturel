import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const MODERATEUR_ROLES = ["ADMIN", "MODERATEUR"]

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || !MODERATEUR_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const url = req.nextUrl.searchParams
  const page = Math.max(1, Number(url.get("page")) || 1)
  const limit = Math.min(100, Math.max(1, Number(url.get("limit")) || 20))
  const publie = url.get("publie")
  const note = url.get("note") ? Number(url.get("note")) : null
  const signale = url.get("signale")

  const where: Record<string, unknown> = {}
  if (publie === "true") where.publie = true
  if (publie === "false") where.publie = false
  if (note) where.note = note
  if (signale === "true") where.signale = true

  const [avis, total] = await Promise.all([
    prisma.avisProduit.findMany({
      where,
      include: {
        user: { select: { nom: true, prenom: true, email: true, photoUrl: true } },
        produit: { select: { nom: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.avisProduit.count({ where }),
  ])

  return NextResponse.json({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    avis: avis.map((a: any) => ({
      id: a.id,
      note: a.note,
      titre: a.titre,
      commentaire: a.commentaire,
      publie: a.publie,
      verifie: a.verifie,
      signale: a.signale,
      raisonRejet: a.raisonRejet,
      moderePar: a.moderePar,
      modereAt: a.modereAt?.toISOString() ?? null,
      createdAt: a.createdAt.toISOString(),
      user: { nom: a.user.nom, prenom: a.user.prenom, email: a.user.email, photoUrl: a.user.photoUrl },
      produit: a.produit.nom,
    })),
    total,
  })
}
