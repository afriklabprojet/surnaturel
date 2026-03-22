import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"
import { getPusherServeur, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher"
import { creerNotification } from "@/lib/notifications"

const postSchema = z.object({
  contenu: z.string().min(1, "Le contenu est requis").max(2000),
  imageUrl: z.string().url().optional(),
  images: z.array(z.string().url()).max(4).optional(),
  videoUrl: z.string().url().optional(),
  lienUrl: z.string().url().optional(),
  lienTitre: z.string().max(200).optional(),
  lienDescription: z.string().max(500).optional(),
  lienImage: z.string().url().optional(),
  documentUrl: z.string().url().optional(),
  documentNom: z.string().max(200).optional(),
  format: z.enum(["TEXTE", "IMAGE", "VIDEO", "LIEN", "DOCUMENT"]).optional(),
  groupeId: z.string().optional(),
  partageDeId: z.string().optional(),
  commentairePartage: z.string().max(500).optional(),
  mentions: z.array(z.string()).optional(),
})

function extractHashtags(contenu: string): string[] {
  const matches = contenu.match(/#[a-zA-ZÀ-ÿ0-9_]+/g)
  return matches ? [...new Set(matches.map((h) => h.toLowerCase()))] : []
}

function extractMentionPseudos(contenu: string): string[] {
  const matches = contenu.match(/@([a-zA-ZÀ-ÿ0-9_]+)/g)
  return matches ? [...new Set(matches.map((m) => m.slice(1).toLowerCase()))] : []
}

const auteurSelect = {
  id: true, nom: true, prenom: true, pseudo: true, photoUrl: true, statutProfil: true, verificationStatus: true,
}

// GET — Fil d'actualité
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
  const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") || "10")))
  const skip = (page - 1) * limit
  const groupeId = searchParams.get("groupeId")
  const userId = searchParams.get("userId")
  const hashtag = searchParams.get("hashtag")
  const saved = searchParams.get("saved") === "true"

  // Utilisateurs bloqués
  const blocages = await prisma.blocage.findMany({
    where: { OR: [{ bloqueurId: session.user.id }, { bloqueId: session.user.id }] },
    select: { bloqueurId: true, bloqueId: true },
  })
  const blockedIds = blocages.map((b) =>
    b.bloqueurId === session.user.id ? b.bloqueId : b.bloqueurId
  )

  // Construire le filtre
  const where: Record<string, unknown> = {
    auteurId: { notIn: blockedIds },
    status: "PUBLIE",
  }
  if (groupeId) where.groupeId = groupeId
  else if (!userId && !saved) where.groupeId = null // feed public = pas de groupe
  if (userId) where.auteurId = userId
  if (hashtag) where.hashtags = { has: hashtag.toLowerCase() }
  if (saved) {
    const savedIds = await prisma.postSauvegarde.findMany({
      where: { userId: session.user.id },
      select: { postId: true },
    })
    where.id = { in: savedIds.map((s) => s.postId) }
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: [{ epingle: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
      include: {
        auteur: { select: auteurSelect },
        commentaires: {
          orderBy: { createdAt: "asc" },
          take: 3,
          include: { auteur: { select: auteurSelect } },
        },
        reactions: { select: { userId: true, type: true } },
        sauvegardes: { where: { userId: session.user.id }, select: { id: true } },
        _count: { select: { commentaires: true, reactions: true, partages: true } },
        partageDe: {
          include: {
            auteur: { select: auteurSelect },
            _count: { select: { commentaires: true, reactions: true } },
          },
        },
      },
    }),
    prisma.post.count({ where }),
  ])

  const enriched = posts.map((post) => {
    const userReaction = post.reactions.find((r) => r.userId === session.user.id)
    // Compter les réactions par type
    const reactionCounts: Record<string, number> = {}
    for (const r of post.reactions) {
      reactionCounts[r.type] = (reactionCounts[r.type] || 0) + 1
    }
    return {
      ...post,
      reactions: undefined,
      sauvegardes: undefined,
      userReaction: userReaction?.type ?? null,
      reactionCounts,
      reactionsCount: post._count.reactions,
      commentairesCount: post._count.commentaires,
      partagesCount: post._count.partages,
      saved: post.sauvegardes.length > 0,
    }
  })

  return NextResponse.json({ posts: enriched, total, pages: Math.ceil(total / limit), page })
}

// POST — Créer un post
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await req.json()
  const result = postSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
  }

  const { contenu, groupeId, partageDeId, commentairePartage, mentions: mentionIds, ...rest } = result.data
  const hashtags = extractHashtags(contenu)

  // Vérifier appartenance au groupe si spécifié
  if (groupeId) {
    const membre = await prisma.membreGroupe.findUnique({
      where: { groupeId_userId: { groupeId, userId: session.user.id } },
    })
    if (!membre) {
      return NextResponse.json({ error: "Vous n'êtes pas membre de ce groupe" }, { status: 403 })
    }
  }

  // Vérifier le post original si c'est un partage
  if (partageDeId) {
    const original = await prisma.post.findUnique({ where: { id: partageDeId }, select: { id: true } })
    if (!original) {
      return NextResponse.json({ error: "Post original introuvable" }, { status: 404 })
    }
  }

  const format = rest.format || (rest.videoUrl ? "VIDEO" : rest.images?.length || rest.imageUrl ? "IMAGE" : rest.lienUrl ? "LIEN" : rest.documentUrl ? "DOCUMENT" : "TEXTE")

  const post = await prisma.post.create({
    data: {
      contenu,
      hashtags,
      format,
      groupeId,
      auteurId: session.user.id,
      imageUrl: rest.imageUrl,
      images: rest.images || [],
      videoUrl: rest.videoUrl,
      lienUrl: rest.lienUrl,
      lienTitre: rest.lienTitre,
      lienDescription: rest.lienDescription,
      lienImage: rest.lienImage,
      documentUrl: rest.documentUrl,
      documentNom: rest.documentNom,
      partageDeId: partageDeId || null,
      commentairePartage: commentairePartage || null,
    },
    include: {
      auteur: { select: auteurSelect },
      commentaires: true,
      _count: { select: { commentaires: true, reactions: true, partages: true } },
      partageDe: {
        include: {
          auteur: { select: auteurSelect },
          _count: { select: { commentaires: true, reactions: true } },
        },
      },
    },
  })

  // Gérer les mentions (@pseudo extraits du contenu + IDs explicites)
  try {
    const pseudos = extractMentionPseudos(contenu)
    const mentionUserIds = new Set<string>(mentionIds || [])

    if (pseudos.length > 0) {
      const usersFromPseudos = await prisma.user.findMany({
        where: { pseudo: { in: pseudos, mode: "insensitive" } },
        select: { id: true },
      })
      usersFromPseudos.forEach((u) => mentionUserIds.add(u.id))
    }

    // Exclure le propre auteur
    mentionUserIds.delete(session.user.id)

    if (mentionUserIds.size > 0) {
      await prisma.mention.createMany({
        data: [...mentionUserIds].map((userId) => ({
          userId,
          postId: post.id,
          mentionneurId: session.user.id,
        })),
      })

      // Notifier chaque utilisateur mentionné
      const mentionneur = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { prenom: true, nom: true },
      })
      for (const userId of mentionUserIds) {
        await creerNotification({
          userId,
          type: "MENTION",
          titre: "Vous avez été mentionné",
          message: `${mentionneur?.prenom} ${mentionneur?.nom} vous a mentionné dans une publication`,
          lien: "/communaute",
        })
      }
    }
  } catch { /* mentions optionnelles */ }

  // Notifier l'auteur du post original si c'est un partage
  if (partageDeId) {
    try {
      const original = await prisma.post.findUnique({
        where: { id: partageDeId },
        select: { auteurId: true },
      })
      if (original && original.auteurId !== session.user.id) {
        const partageur = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { prenom: true, nom: true },
        })
        await creerNotification({
          userId: original.auteurId,
          type: "NOUVEAU_LIKE",
          titre: "Votre publication a été partagée",
          message: `${partageur?.prenom} ${partageur?.nom} a partagé votre publication`,
          lien: "/communaute",
        })
      }
    } catch { /* notification optionnelle */ }
  }

  const enrichedPost = {
    ...post,
    userReaction: null,
    reactionCounts: {},
    reactionsCount: 0,
    commentairesCount: 0,
    partagesCount: 0,
    saved: false,
  }

  // Émettre en temps réel
  try {
    const pusher = getPusherServeur()
    const channel = groupeId ? PUSHER_CHANNELS.groupe(groupeId) : PUSHER_CHANNELS.communaute
    await pusher.trigger(channel, PUSHER_EVENTS.NOUVEAU_POST, {
      post: enrichedPost,
      auteurId: session.user.id,
    })
  } catch { /* Pusher optionnel */ }

  return NextResponse.json(enrichedPost, { status: 201 })
}
