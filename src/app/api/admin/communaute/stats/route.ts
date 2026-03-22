import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET — Statistiques du réseau social (admin)
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  try {
    const now = new Date()
    const il7jours = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const il30jours = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [
      totalMembres,
      membresActifs7j,
      membresActifs30j,
      totalPosts,
      posts7j,
      posts30j,
      totalCommentaires,
      totalReactions,
      totalGroupes,
      totalEvenements,
      signalementsEnAttente,
      totalConnexions,
      topAuteurs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { posts: { some: { createdAt: { gte: il7jours } } } } }),
      prisma.user.count({ where: { posts: { some: { createdAt: { gte: il30jours } } } } }),
      prisma.post.count(),
      prisma.post.count({ where: { createdAt: { gte: il7jours } } }),
      prisma.post.count({ where: { createdAt: { gte: il30jours } } }),
      prisma.commentaire.count(),
      prisma.reaction.count(),
      prisma.groupe.count(),
      prisma.evenement.count(),
      prisma.signalement.count({ where: { statut: "EN_ATTENTE" } }),
      prisma.connexion.count({ where: { statut: "ACCEPTEE" } }),
      prisma.user.findMany({
        select: {
          id: true, nom: true, prenom: true, photoUrl: true,
          _count: { select: { posts: true } },
        },
        orderBy: { posts: { _count: "desc" } },
        take: 10,
      }),
    ])

    return NextResponse.json({
      totalMembres,
      membresActifs7j,
      membresActifs30j,
      totalPosts,
      posts7j,
      posts30j,
      totalCommentaires,
      totalReactions,
      totalGroupes,
      totalEvenements,
      signalementsEnAttente,
      totalConnexions,
      tauxEngagement7j: totalMembres > 0 ? Math.round((membresActifs7j / totalMembres) * 100) : 0,
      tauxEngagement30j: totalMembres > 0 ? Math.round((membresActifs30j / totalMembres) * 100) : 0,
      topAuteurs: topAuteurs.map((u) => ({
        ...u,
        postsCount: u._count.posts,
      })),
    })
  } catch (e) {
    console.error("[admin/communaute/stats] Erreur:", e)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
