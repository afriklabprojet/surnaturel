import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

const profilSocialSchema = z.object({
  bio: z.string().max(500).optional(),
  centresInteret: z.array(z.string().max(50)).max(10).optional(),
  couvertureUrl: z.string().url().optional(),
  pseudo: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  localisation: z.string().max(100).optional(),
  profilPublic: z.boolean().optional(),
  // Préférences notifications
  notifLikes: z.boolean().optional(),
  notifCommentaires: z.boolean().optional(),
  notifConnexions: z.boolean().optional(),
  notifMessages: z.boolean().optional(),
  notifEvenements: z.boolean().optional(),
  notifGroupes: z.boolean().optional(),
})

// GET — Récupérer le profil social d'un utilisateur
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId") || session.user.id

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      nom: true,
      prenom: true,
      pseudo: true,
      photoUrl: true,
      couvertureUrl: true,
      bio: true,
      centresInteret: true,
      localisation: true,
      profilPublic: true,
      statutProfil: true,
      role: true,
      verificationStatus: true,
      createdAt: true,
      profilDetail: true,
      _count: {
        select: {
          posts: true,
          connexionsEnvoyees: { where: { statut: "ACCEPTEE" } },
          connexionsRecues: { where: { statut: "ACCEPTEE" } },
          abonnes: true,
          abonnements: true,
        },
      },
    },
  })

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
  }

  // Vérifier si l'utilisateur courant est connecté avec ce profil
  const isOwn = userId === session.user.id
  let isConnected = false
  let isFollowing = false
  let connectionStatus: string | null = null

  if (!isOwn) {
    const [connexion, abonnement] = await Promise.all([
      prisma.connexion.findFirst({
        where: {
          OR: [
            { demandeurId: session.user.id, destinataireId: userId },
            { demandeurId: userId, destinataireId: session.user.id },
          ],
        },
      }),
      prisma.abonnement.findUnique({
        where: { abonneId_suiviId: { abonneId: session.user.id, suiviId: userId } },
      }),
    ])
    isConnected = connexion?.statut === "ACCEPTEE"
    connectionStatus = connexion?.statut ?? null
    isFollowing = !!abonnement
  }

  const totalConnexions =
    user._count.connexionsEnvoyees + user._count.connexionsRecues

  // Masquer le numéro d'ordre professionnel pour les non-propriétaires/non-admins
  let profilDetail = user.profilDetail
  if (profilDetail && !isOwn && session.user.role !== "ADMIN") {
    const { numeroOrdre: _, ...rest } = profilDetail
    profilDetail = { ...rest, numeroOrdre: null }
  }

  return NextResponse.json({
    ...user,
    profilDetail,
    totalConnexions,
    totalAbonnes: user._count.abonnes,
    totalPosts: user._count.posts,
    isOwn,
    isConnected,
    isFollowing,
    connectionStatus,
  })
}

// PATCH — Mettre à jour le profil social
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await req.json()
  const result = profilSocialSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
  }

  // Vérifier unicité du pseudo
  if (result.data.pseudo) {
    const existing = await prisma.user.findUnique({
      where: { pseudo: result.data.pseudo },
    })
    if (existing && existing.id !== session.user.id) {
      return NextResponse.json({ error: "Ce pseudo est déjà pris" }, { status: 409 })
    }
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: result.data,
    select: {
      id: true,
      bio: true,
      centresInteret: true,
      couvertureUrl: true,
      pseudo: true,
      localisation: true,
      profilPublic: true,
      notifLikes: true,
      notifCommentaires: true,
      notifConnexions: true,
      notifMessages: true,
      notifEvenements: true,
      notifGroupes: true,
    },
  })

  return NextResponse.json(user)
}
