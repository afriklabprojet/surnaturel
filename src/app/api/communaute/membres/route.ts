import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET — Annuaire des membres filtrable
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
  const limit = 20
  const skip = (page - 1) * limit
  const q = searchParams.get("q")
  const role = searchParams.get("role")
  const interet = searchParams.get("interet")

  // Utilisateurs bloqués
  const blocages = await prisma.blocage.findMany({
    where: { OR: [{ bloqueurId: session.user.id }, { bloqueId: session.user.id }] },
    select: { bloqueurId: true, bloqueId: true },
  })
  const blockedIds = blocages.map((b) =>
    b.bloqueurId === session.user.id ? b.bloqueId : b.bloqueurId
  )

  const where: Record<string, unknown> = {
    id: { notIn: [...blockedIds, session.user.id] },
    profilPublic: true,
  }

  if (q) {
    where.OR = [
      { nom: { contains: q, mode: "insensitive" } },
      { prenom: { contains: q, mode: "insensitive" } },
      { pseudo: { contains: q, mode: "insensitive" } },
    ]
  }
  if (role) where.role = role
  if (interet) where.centresInteret = { has: interet }

  const [membres, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, nom: true, prenom: true, pseudo: true,
        photoUrl: true, bio: true, centresInteret: true,
        statutProfil: true, role: true, localisation: true,
        verificationStatus: true,
        _count: { select: { posts: true } },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ])

  return NextResponse.json({
    membres: membres.map((m) => ({ ...m, postsCount: m._count.posts })),
    total,
    pages: Math.ceil(total / limit),
    page,
  })
}
