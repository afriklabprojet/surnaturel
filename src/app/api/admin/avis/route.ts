import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const url = req.nextUrl.searchParams
  const page = Math.max(1, Number(url.get("page")) || 1)
  const limit = Math.min(100, Math.max(1, Number(url.get("limit")) || 20))
  const publie = url.get("publie")
  const note = url.get("note") ? Number(url.get("note")) : null

  const where: Record<string, unknown> = {}
  if (publie === "true") where.publie = true
  if (publie === "false") where.publie = false
  if (note) where.note = note

  const [avis, total] = await Promise.all([
    prisma.avis.findMany({
      where,
      include: {
        user: { select: { nom: true, prenom: true, email: true, photoUrl: true } },
        soin: { select: { nom: true } },
        rdv: { select: { dateHeure: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.avis.count({ where }),
  ])

  return NextResponse.json({
    avis: avis.map((a) => ({
      id: a.id,
      note: a.note,
      commentaire: a.commentaire,
      publie: a.publie,
      createdAt: a.createdAt.toISOString(),
      user: { nom: a.user.nom, prenom: a.user.prenom, email: a.user.email, photoUrl: a.user.photoUrl },
      soin: a.soin.nom,
      dateRdv: a.rdv.dateHeure.toISOString(),
    })),
    total,
  })
}
