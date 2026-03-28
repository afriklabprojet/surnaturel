import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"
import { getPusherServeur, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher"
import { creerNotification } from "@/lib/notifications"

interface Params { params: Promise<{ id: string }> }

const auteurSelect = {
  id: true, nom: true, prenom: true, pseudo: true, photoUrl: true, verificationStatus: true,
}

const commentSchema = z.object({
  contenu: z.string().min(1).max(1000),
  mentions: z.array(z.string()).optional(),
})

function extractMentionPseudos(contenu: string): string[] {
  const matches = contenu.match(/@([a-zA-ZÀ-ÿ0-9_]+)/g)
  return matches ? [...new Set(matches.map((m) => m.slice(1).toLowerCase()))] : []
}

// GET — Charger les commentaires d'un post (paginé)
export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id: postId } = await params
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")))
  const skip = (page - 1) * limit

  const [commentaires, total] = await Promise.all([
    prisma.commentaire.findMany({
      where: { postId },
      orderBy: { createdAt: "asc" },
      skip,
      take: limit,
      include: { auteur: { select: auteurSelect } },
    }),
    prisma.commentaire.count({ where: { postId } }),
  ])

  return NextResponse.json({
    commentaires,
    total,
    pages: Math.ceil(total / limit),
    page,
  })
}

// POST — Ajouter un commentaire
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id: postId } = await params
  const body = await req.json()
  const result = commentSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
  }

  const commentaire = await prisma.commentaire.create({
    data: {
      contenu: result.data.contenu,
      postId,
      auteurId: session.user.id,
    },
    include: {
      auteur: { select: auteurSelect },
    },
  })

  // Gérer les mentions dans le commentaire
  try {
    const pseudos = extractMentionPseudos(result.data.contenu)
    const mentionUserIds = new Set<string>(result.data.mentions || [])

    if (pseudos.length > 0) {
      const usersFromPseudos = await prisma.user.findMany({
        where: { pseudo: { in: pseudos, mode: "insensitive" } },
        select: { id: true },
      })
      usersFromPseudos.forEach((u) => mentionUserIds.add(u.id))
    }

    mentionUserIds.delete(session.user.id)

    if (mentionUserIds.size > 0) {
      await prisma.mention.createMany({
        data: [...mentionUserIds].map((userId) => ({
          userId,
          commentaireId: commentaire.id,
          mentionneurId: session.user.id,
        })),
      })

      const mentionneur = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { prenom: true, nom: true },
      })
      for (const userId of mentionUserIds) {
        await creerNotification({
          userId,
          type: "MENTION",
          titre: "Vous avez été mentionné",
          message: `${mentionneur?.prenom} ${mentionneur?.nom} vous a mentionné dans un commentaire`,
          lien: "/communaute",
        })
      }
    }
  } catch { /* mentions optionnelles */ }

  // Notifier l'auteur du post
  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { auteurId: true },
    })
    if (post && post.auteurId !== session.user.id) {
      const auteurPrefs = await prisma.user.findUnique({
        where: { id: post.auteurId },
        select: { notifCommentaires: true },
      })
      if (auteurPrefs?.notifCommentaires) {
        const commenteur = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { prenom: true, nom: true },
        })
        await creerNotification({
          userId: post.auteurId,
          type: "NOUVEAU_COMMENTAIRE",
          titre: "Nouveau commentaire",
          message: `${commenteur?.prenom} ${commenteur?.nom} a commenté votre publication`,
          lien: "/communaute",
        })
      }
    }
  } catch { /* notification optionnelle */ }

  // Émettre en temps réel
  try {
    const pusher = getPusherServeur()
    await pusher.trigger(
      PUSHER_CHANNELS.communaute,
      PUSHER_EVENTS.NOUVEAU_COMMENTAIRE,
      { postId, commentaire }
    )
  } catch { /* Pusher optionnel */ }

  return NextResponse.json(commentaire, { status: 201 })
}

// PATCH — Masquer/afficher un commentaire (admin/modérateur)
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { id: postId } = await params
  const body = await req.json()
  const { commentaireId, masque } = body

  if (!commentaireId || masque === undefined) {
    return NextResponse.json({ error: "commentaireId et masque requis" }, { status: 400 })
  }

  const commentaire = await prisma.commentaire.findUnique({
    where: { id: commentaireId },
    select: { id: true, postId: true, auteurId: true },
  })
  if (!commentaire || commentaire.postId !== postId) {
    return NextResponse.json({ error: "Commentaire introuvable" }, { status: 404 })
  }

  // Vérifier les permissions
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { groupeId: true },
  })

  let canModerate = session.user.role === "ADMIN"
  if (post?.groupeId && !canModerate) {
    const membre = await prisma.membreGroupe.findUnique({
      where: { groupeId_userId: { groupeId: post.groupeId, userId: session.user.id } },
    })
    canModerate = membre?.role === "ADMIN" || membre?.role === "MODERATEUR"
  }

  if (!canModerate) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const updated = await prisma.commentaire.update({
    where: { id: commentaireId },
    data: { masque: Boolean(masque) },
    include: { auteur: { select: auteurSelect } },
  })

  // Journal de modération
  if (post?.groupeId) {
    try {
      await prisma.journalModeration.create({
        data: {
          groupeId: post.groupeId,
          moderateurId: session.user.id,
          action: masque ? "MASQUER_COMMENTAIRE" : "AFFICHER_COMMENTAIRE",
          cibleCommentId: commentaireId,
          cibleUserId: commentaire.auteurId,
        },
      })
    } catch { /* journal optionnel */ }
  }

  return NextResponse.json(updated)
}

// DELETE — Supprimer un commentaire (auteur, admin ou modérateur)
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { id: postId } = await params
  const { searchParams } = new URL(req.url)
  const commentaireId = searchParams.get("commentaireId")
  if (!commentaireId) return NextResponse.json({ error: "commentaireId requis" }, { status: 400 })

  const commentaire = await prisma.commentaire.findUnique({
    where: { id: commentaireId },
    select: { id: true, postId: true, auteurId: true, contenu: true },
  })
  if (!commentaire || commentaire.postId !== postId) {
    return NextResponse.json({ error: "Commentaire introuvable" }, { status: 404 })
  }

  // L'auteur peut supprimer son propre commentaire
  const isAuteur = commentaire.auteurId === session.user.id
  const isSiteAdmin = session.user.role === "ADMIN"

  let isGroupeMod = false
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { groupeId: true },
  })
  if (post?.groupeId) {
    const membre = await prisma.membreGroupe.findUnique({
      where: { groupeId_userId: { groupeId: post.groupeId, userId: session.user.id } },
    })
    isGroupeMod = membre?.role === "ADMIN" || membre?.role === "MODERATEUR"
  }

  if (!isAuteur && !isSiteAdmin && !isGroupeMod) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  await prisma.commentaire.delete({ where: { id: commentaireId } })

  // Journal de modération si supprimé par un modérateur (pas l'auteur)
  if (!isAuteur && post?.groupeId) {
    try {
      await prisma.journalModeration.create({
        data: {
          groupeId: post.groupeId,
          moderateurId: session.user.id,
          action: "SUPPRIMER_COMMENTAIRE",
          cibleUserId: commentaire.auteurId,
          details: `Commentaire supprimé : "${commentaire.contenu.slice(0, 100)}"`,
        },
      })
    } catch { /* journal optionnel */ }
  }

  return NextResponse.json({ success: true })
}
