import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const url = req.nextUrl.searchParams
  const page = Math.max(1, Number(url.get("page")) || 1)
  const limit = Math.min(100, Math.max(1, Number(url.get("limit")) || 20))
  const search = url.get("search")?.trim()
  const visibilite = url.get("visibilite")

  const where: Record<string, unknown> = {}
  if (search) where.nom = { contains: search, mode: "insensitive" }
  if (visibilite) where.visibilite = visibilite

  const [groupes, total] = await Promise.all([
    prisma.groupe.findMany({
      where,
      include: {
        _count: { select: { membres: true, posts: true, evenements: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.groupe.count({ where }),
  ])

  return NextResponse.json({
    groupes: groupes.map((g) => ({
      id: g.id,
      nom: g.nom,
      slug: g.slug,
      description: g.description,
      imageUrl: g.imageUrl,
      visibilite: g.visibilite,
      regles: g.regles,
      nbMembres: g._count.membres,
      nbPosts: g._count.posts,
      nbEvenements: g._count.evenements,
      createdAt: g.createdAt.toISOString(),
    })),
    total,
  })
}

const createSchema = z.object({
  nom: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  visibilite: z.enum(["PUBLIC", "PRIVE", "SECRET"]),
  regles: z.string().max(2000).optional(),
  imageUrl: z.url().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const body = await req.json()
  const result = z.safeParse(createSchema, body)
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  const slug = result.data.nom
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

  const existing = await prisma.groupe.findUnique({ where: { slug } })
  const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug

  const groupe = await prisma.groupe.create({
    data: {
      ...result.data,
      slug: finalSlug,
    },
  })

  return NextResponse.json(groupe, { status: 201 })
}
