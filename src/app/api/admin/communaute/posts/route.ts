import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET — Liste paginée des publications (admin)
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit = 20
  const skip = (page - 1) * limit
  const status = searchParams.get("status")
  const q = (searchParams.get("q") ?? "").trim()

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (q) where.contenu = { contains: q, mode: "insensitive" }

  const [total, posts] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      include: {
        auteur: { select: { id: true, nom: true, prenom: true, photoUrl: true } },
        _count: { select: { commentaires: true, reactions: true, signalements: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ])

  return NextResponse.json({
    posts: posts.map((p) => ({
      id: p.id,
      contenu: p.contenu,
      imageUrl: p.imageUrl,
      format: p.format,
      status: p.status,
      epingle: p.epingle,
      isAnnonce: p.isAnnonce,
      masque: p.masque,
      groupeId: p.groupeId,
      createdAt: p.createdAt,
      auteur: p.auteur,
      commentairesCount: p._count.commentaires,
      reactionsCount: p._count.reactions,
      signalementsCount: p._count.signalements,
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  })
}

// PATCH — Modifier une publication (epingler, masquer, annonce)
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const body = await req.json()
  const { postId, ...data } = body as {
    postId: string
    epingle?: boolean
    isAnnonce?: boolean
    masque?: boolean
    status?: string
  }

  if (!postId) return NextResponse.json({ error: "postId requis" }, { status: 400 })

  const updateData: Record<string, unknown> = {}
  if (typeof data.epingle === "boolean") updateData.epingle = data.epingle
  if (typeof data.isAnnonce === "boolean") updateData.isAnnonce = data.isAnnonce
  if (typeof data.masque === "boolean") updateData.masque = data.masque
  if (data.status) updateData.status = data.status

  const post = await prisma.post.update({
    where: { id: postId },
    data: updateData,
    select: { id: true, epingle: true, isAnnonce: true, masque: true, status: true },
  })

  return NextResponse.json({ success: true, post })
}

// DELETE — Supprimer une publication
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const postId = searchParams.get("id")

  if (!postId) return NextResponse.json({ error: "id requis" }, { status: 400 })

  await prisma.post.delete({ where: { id: postId } })

  return NextResponse.json({ success: true })
}
