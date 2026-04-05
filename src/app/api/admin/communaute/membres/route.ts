import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET — Liste paginée des membres (admin)
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit = 20
  const skip = (page - 1) * limit
  const q = (searchParams.get("q") ?? "").trim()
  const role = searchParams.get("role") // ADMIN | USER | MODERATEUR | etc.

  const where: Record<string, unknown> = {}
  if (role) where.role = role
  if (q) {
    where.OR = [
      { nom: { contains: q, mode: "insensitive" } },
      { prenom: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ]
  }

  const [total, membres] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        photoUrl: true,
        role: true,
        createdAt: true,
        _count: { select: { posts: true, commentaires: true, signalements: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ])

  return NextResponse.json({
    membres: membres.map((m) => ({
      id: m.id,
      nom: m.nom,
      prenom: m.prenom,
      email: m.email,
      photoUrl: m.photoUrl,
      role: m.role,
      createdAt: m.createdAt,
      postsCount: m._count.posts,
      commentairesCount: m._count.commentaires,
      signalementsRecusCount: m._count.signalements,
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  })
}
