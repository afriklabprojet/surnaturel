import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET — Suggestions de connexion (par intérêts communs, ville, etc.)
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const userId = session.user.id

  // Récupérer le profil de l'utilisateur courant
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { centresInteret: true, ville: true, localisation: true },
  })

  // Récupérer les IDs des connexions existantes et blocages
  const [connexions, blocages] = await Promise.all([
    prisma.connexion.findMany({
      where: { OR: [{ demandeurId: userId }, { destinataireId: userId }] },
      select: { demandeurId: true, destinataireId: true },
    }),
    prisma.blocage.findMany({
      where: { OR: [{ bloqueurId: userId }, { bloqueId: userId }] },
      select: { bloqueurId: true, bloqueId: true },
    }),
  ])

  const excludeIds = new Set<string>([userId])
  connexions.forEach((c) => {
    excludeIds.add(c.demandeurId)
    excludeIds.add(c.destinataireId)
  })
  blocages.forEach((b) => {
    excludeIds.add(b.bloqueurId)
    excludeIds.add(b.bloqueId)
  })

  const suggestions = await prisma.user.findMany({
    where: {
      id: { notIn: [...excludeIds] },
      profilPublic: true,
    },
    select: {
      id: true, nom: true, prenom: true, pseudo: true,
      photoUrl: true, bio: true, centresInteret: true,
      ville: true, localisation: true, statutProfil: true,
      _count: { select: { posts: true } },
    },
    take: 20,
    orderBy: { createdAt: "desc" },
  })

  // Trier par pertinence (intérêts communs, même ville)
  const scored = suggestions.map((user) => {
    let score = 0
    if (currentUser?.centresInteret && user.centresInteret) {
      const common = user.centresInteret.filter((i) =>
        currentUser.centresInteret.includes(i)
      )
      score += common.length * 3
    }
    if (currentUser?.ville && user.ville === currentUser.ville) score += 2
    if (currentUser?.localisation && user.localisation === currentUser.localisation) score += 1
    score += Math.min(user._count.posts, 5) // Actifs en priorité
    return { ...user, score, postsCount: user._count.posts }
  })

  scored.sort((a, b) => b.score - a.score)

  return NextResponse.json({ suggestions: scored.slice(0, 10) })
}
