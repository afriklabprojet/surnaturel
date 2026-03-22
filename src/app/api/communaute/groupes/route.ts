import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

const groupeSchema = z.object({
  nom: z.string().min(3).max(100),
  description: z.string().max(1000).optional(),
  imageUrl: z.string().url().optional(),
  visibilite: z.enum(["PUBLIC", "PRIVE", "SECRET"]).optional(),
  regles: z.string().max(2000).optional(),
  questions: z.array(z.object({ texte: z.string().min(5).max(300) })).max(3).optional(),
})

// GET — Liste des groupes
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type") || "all" // all | joined | discover
  const q = searchParams.get("q") || ""

  const userId = session.user.id

  if (type === "joined") {
    const memberships = await prisma.membreGroupe.findMany({
      where: { userId },
      include: {
        groupe: {
          include: {
            _count: { select: { membres: true, posts: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({
      groupes: memberships.map((m) => ({
        ...m.groupe,
        role: m.role,
        membresCount: m.groupe._count.membres,
        postsCount: m.groupe._count.posts,
      })),
    })
  }

  // Groupes publics / privés (pas secrets) pour la découverte
  const where: Record<string, unknown> = {
    visibilite: { in: ["PUBLIC", "PRIVE"] },
  }
  if (q) {
    where.OR = [
      { nom: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ]
  }
  if (type === "discover") {
    where.membres = { none: { userId } }
  }

  const groupes = await prisma.groupe.findMany({
    where,
    include: {
      _count: { select: { membres: true, posts: true } },
      membres: { where: { userId }, select: { role: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json({
    groupes: groupes.map((g) => ({
      ...g,
      isMember: g.membres.length > 0,
      myRole: g.membres[0]?.role ?? null,
      membres: undefined,
      membresCount: g._count.membres,
      postsCount: g._count.posts,
    })),
  })
}

// POST — Créer un groupe
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await req.json()
  const result = groupeSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
  }

  let slug = slugify(result.data.nom)
  // Assurer l'unicité du slug
  const existing = await prisma.groupe.findUnique({ where: { slug } })
  if (existing) slug = `${slug}-${Date.now().toString(36)}`

  const { questions, ...groupeData } = result.data

  const groupe = await prisma.groupe.create({
    data: {
      ...groupeData,
      slug,
      visibilite: groupeData.visibilite || "PUBLIC",
      membres: {
        create: { userId: session.user.id, role: "ADMIN" },
      },
      ...(questions && questions.length > 0 ? {
        questions: {
          create: questions.map((q, i) => ({ texte: q.texte, ordre: i })),
        },
      } : {}),
    },
    include: { _count: { select: { membres: true } } },
  })

  return NextResponse.json(groupe, { status: 201 })
}
