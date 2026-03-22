import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get("page") || 1))
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 20)))
  const statut = searchParams.get("statut") // EN_ATTENTE | ACTIF | RECOMPENSE_ACCORDEE
  const search = searchParams.get("search")?.trim()

  const where: Record<string, unknown> = {}
  if (statut) where.statut = statut
  if (search) {
    where.parrain = {
      OR: [
        { nom: { contains: search, mode: "insensitive" } },
        { prenom: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    }
  }

  const [parrainages, total] = await Promise.all([
    prisma.parrainage.findMany({
      where,
      include: {
        parrain: { select: { id: true, nom: true, prenom: true, email: true, photoUrl: true } },
        filleul: { select: { id: true, nom: true, prenom: true, email: true, photoUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.parrainage.count({ where }),
  ])

  return NextResponse.json({ parrainages, total })
}
