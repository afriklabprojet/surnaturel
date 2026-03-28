import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface Params { params: Promise<{ slug: string }> }

// GET — Statistiques du groupe (admin/modérateur uniquement)
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { slug } = await params
  const groupe = await prisma.groupe.findUnique({ where: { slug } })
  if (!groupe) return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 })

  const membre = await prisma.membreGroupe.findUnique({
    where: { groupeId_userId: { groupeId: groupe.id, userId: session.user.id } },
  })
  if (!membre || !["ADMIN", "MODERATEUR"].includes(membre.role)) {
    return NextResponse.json({ error: "Réservé aux administrateurs et modérateurs" }, { status: 403 })
  }

  const now = new Date()
  const il7j = new Date(now.getTime() - 7 * 24 * 3600000)
  const il30j = new Date(now.getTime() - 30 * 24 * 3600000)

  // Statistiques globales
  const [
    totalMembres,
    membresActifs7j,
    nouveauxMembres7j,
    nouveauxMembres30j,
    totalPosts,
    postsThisWeek,
    postsThisMonth,
    totalCommentaires,
    totalReactions,
    totalEvenements,
    totalSondages,
    demandesEnAttente,
  ] = await Promise.all([
    prisma.membreGroupe.count({ where: { groupeId: groupe.id, approuve: true } }),
    // Membres actifs = ceux qui ont posté dans les 7 derniers jours
    prisma.post.groupBy({
      by: ["auteurId"],
      where: { groupeId: groupe.id, createdAt: { gte: il7j } },
    }).then(r => r.length),
    prisma.membreGroupe.count({ where: { groupeId: groupe.id, approuve: true, createdAt: { gte: il7j } } }),
    prisma.membreGroupe.count({ where: { groupeId: groupe.id, approuve: true, createdAt: { gte: il30j } } }),
    prisma.post.count({ where: { groupeId: groupe.id } }),
    prisma.post.count({ where: { groupeId: groupe.id, createdAt: { gte: il7j } } }),
    prisma.post.count({ where: { groupeId: groupe.id, createdAt: { gte: il30j } } }),
    prisma.commentaire.count({ where: { post: { groupeId: groupe.id } } }),
    prisma.reaction.count({ where: { post: { groupeId: groupe.id } } }),
    prisma.evenement.count({ where: { groupeId: groupe.id } }),
    prisma.sondage.count({ where: { groupeId: groupe.id } }),
    prisma.membreGroupe.count({ where: { groupeId: groupe.id, approuve: false } }),
  ])

  // Top contributeurs (plus de posts en 30j)
  const topContributeurs = await prisma.post.groupBy({
    by: ["auteurId"],
    where: { groupeId: groupe.id, createdAt: { gte: il30j } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 5,
  })

  const contributeurDetails = await prisma.user.findMany({
    where: { id: { in: topContributeurs.map(c => c.auteurId) } },
    select: { id: true, nom: true, prenom: true, photoUrl: true, pseudo: true },
  })

  const topContributeursFormatted = topContributeurs.map(c => ({
    ...contributeurDetails.find(u => u.id === c.auteurId),
    postsCount: c._count.id,
  }))

  // Posts les plus engagés (reactions + commentaires)
  const topPosts = await prisma.post.findMany({
    where: { groupeId: groupe.id, createdAt: { gte: il30j } },
    include: {
      _count: { select: { reactions: true, commentaires: true } },
      auteur: { select: { nom: true, prenom: true } },
    },
    orderBy: { reactions: { _count: "desc" } },
    take: 5,
  })

  // Croissance par semaine (4 dernières semaines)
  const croissance = []
  for (let i = 3; i >= 0; i--) {
    const debutSemaine = new Date(now.getTime() - (i + 1) * 7 * 24 * 3600000)
    const finSemaine = new Date(now.getTime() - i * 7 * 24 * 3600000)
    const count = await prisma.membreGroupe.count({
      where: {
        groupeId: groupe.id,
        approuve: true,
        createdAt: { gte: debutSemaine, lt: finSemaine },
      },
    })
    croissance.push({
      semaine: `S-${i}`,
      debut: debutSemaine.toISOString(),
      fin: finSemaine.toISOString(),
      nouveauxMembres: count,
    })
  }

  // Heures de forte activité (posts des 30 derniers jours groupés par heure)
  const recentPosts = await prisma.post.findMany({
    where: { groupeId: groupe.id, createdAt: { gte: il30j } },
    select: { createdAt: true },
  })
  const heuresActivite = Array.from({ length: 24 }, (_, h) => ({ heure: h, posts: 0 }))
  recentPosts.forEach(p => {
    const h = p.createdAt.getHours()
    heuresActivite[h].posts++
  })
  const heuresPic = heuresActivite
    .sort((a, b) => b.posts - a.posts)
    .slice(0, 3)
    .map(h => ({ heure: `${h.heure}h-${h.heure + 1}h`, posts: h.posts }))

  // Taux d'engagement (interactions / membres actifs)
  const totalInteractions = totalCommentaires + totalReactions
  const tauxEngagement = totalMembres > 0
    ? Math.round((totalInteractions / totalMembres) * 100) / 100
    : 0

  return NextResponse.json({
    general: {
      totalMembres,
      membresActifs7j,
      nouveauxMembres7j,
      nouveauxMembres30j,
      totalPosts,
      postsThisWeek,
      postsThisMonth,
      totalCommentaires,
      totalReactions,
      totalEvenements,
      totalSondages,
      demandesEnAttente,
      tauxEngagement,
    },
    topContributeurs: topContributeursFormatted,
    topPosts: topPosts.map(p => ({
      id: p.id,
      contenu: p.contenu.slice(0, 100),
      auteur: p.auteur,
      reactions: p._count.reactions,
      commentaires: p._count.commentaires,
      engagement: p._count.reactions + p._count.commentaires,
    })),
    croissance,
    heuresPic,
  })
}
