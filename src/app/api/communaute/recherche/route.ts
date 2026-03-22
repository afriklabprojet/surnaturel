import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET — Recherche globale (membres, groupes, posts, hashtags)
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")?.trim()
  const type = searchParams.get("type") || "all" // all | membres | groupes | posts | hashtags

  if (!q || q.length < 2) {
    return NextResponse.json({ error: "Recherche trop courte (min 2 caractères)" }, { status: 400 })
  }

  // Utilisateurs bloqués
  const blocages = await prisma.blocage.findMany({
    where: { OR: [{ bloqueurId: session.user.id }, { bloqueId: session.user.id }] },
    select: { bloqueurId: true, bloqueId: true },
  })
  const blockedIds = blocages.map((b) =>
    b.bloqueurId === session.user.id ? b.bloqueId : b.bloqueurId
  )

  const results: Record<string, unknown[]> = {}

  if (type === "all" || type === "membres") {
    const membres = await prisma.user.findMany({
      where: {
        id: { notIn: blockedIds },
        profilPublic: true,
        OR: [
          { nom: { contains: q, mode: "insensitive" } },
          { prenom: { contains: q, mode: "insensitive" } },
          { pseudo: { contains: q, mode: "insensitive" } },
          { bio: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true, nom: true, prenom: true, pseudo: true,
        photoUrl: true, bio: true, statutProfil: true, role: true,
      },
      take: 10,
    })
    results.membres = membres
  }

  if (type === "all" || type === "groupes") {
    const groupes = await prisma.groupe.findMany({
      where: {
        visibilite: { in: ["PUBLIC", "PRIVE"] },
        OR: [
          { nom: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      include: { _count: { select: { membres: true } } },
      take: 10,
    })
    results.groupes = groupes.map((g) => ({
      ...g,
      membresCount: g._count.membres,
    }))
  }

  if (type === "all" || type === "posts") {
    const posts = await prisma.post.findMany({
      where: {
        auteurId: { notIn: blockedIds },
        groupeId: null,
        contenu: { contains: q, mode: "insensitive" },
      },
      include: {
        auteur: { select: { id: true, nom: true, prenom: true, photoUrl: true } },
        _count: { select: { reactions: true, commentaires: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    })
    results.posts = posts
  }

  if (type === "all" || type === "hashtags") {
    // Rechercher les posts par hashtag
    const hashtag = q.startsWith("#") ? q.toLowerCase() : `#${q.toLowerCase()}`
    const hashtagPosts = await prisma.post.findMany({
      where: {
        auteurId: { notIn: blockedIds },
        hashtags: { has: hashtag },
      },
      include: {
        auteur: { select: { id: true, nom: true, prenom: true, photoUrl: true } },
        _count: { select: { reactions: true, commentaires: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    })
    results.hashtags = hashtagPosts
  }

  return NextResponse.json(results)
}
