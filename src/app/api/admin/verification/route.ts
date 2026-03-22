import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

// GET — Liste des utilisateurs avec leur statut de vérification
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const url = req.nextUrl.searchParams
  const page = Math.max(1, Number(url.get("page")) || 1)
  const limit = Math.min(100, Math.max(1, Number(url.get("limit")) || 20))
  const statut = url.get("statut")
  const search = url.get("search")?.trim()

  const where: Record<string, unknown> = {}
  if (statut) where.verificationStatus = statut
  if (search) {
    where.OR = [
      { nom: { contains: search, mode: "insensitive" } },
      { prenom: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ]
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, nom: true, prenom: true, email: true, photoUrl: true,
        role: true, verificationStatus: true, createdAt: true,
        _count: { select: { rendezVous: true, commandes: true, posts: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ])

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id, nom: u.nom, prenom: u.prenom, email: u.email, photoUrl: u.photoUrl,
      role: u.role, verificationStatus: u.verificationStatus,
      createdAt: u.createdAt.toISOString(),
      nbRdv: u._count.rendezVous, nbCommandes: u._count.commandes, nbPosts: u._count.posts,
    })),
    total,
  })
}

const verificationSchema = z.object({
  userId: z.string().min(1),
  verificationStatus: z.enum(["AUCUNE", "MEMBRE_VERIFIE", "PROFESSIONNEL_SANTE"]),
})

// PATCH — Modifier le statut de vérification d'un utilisateur (admin uniquement)
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const body = await req.json()
  const result = verificationSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id: result.data.userId },
    data: { verificationStatus: result.data.verificationStatus },
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      verificationStatus: true,
    },
  })

  return NextResponse.json(user)
}
