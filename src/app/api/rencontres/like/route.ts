import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"
import { creerNotification } from "@/lib/notifications"

const LIKE_DAILY_LIMIT = 20

const likeSchema = z.object({
  toUserId: z.string().min(1),
  type: z.enum(["LIKE", "SUPER_LIKE", "PASS"]).default("LIKE"),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const userId = session.user.id

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 })
  }

  const result = likeSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: "Données invalides", details: z.prettifyError(result.error) },
      { status: 400 }
    )
  }

  const { toUserId, type } = result.data

  if (toUserId === userId) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas vous liker vous-même" },
      { status: 400 }
    )
  }

  // Vérifier la limite journalière de likes (pas pour les PASS)
  if (type !== "PASS") {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const likesToday = await prisma.rencontreLike.count({
      where: { fromUserId: userId, type: { not: "PASS" }, createdAt: { gte: today } },
    })
    if (likesToday >= LIKE_DAILY_LIMIT) {
      const resetAt = new Date(today)
      resetAt.setDate(resetAt.getDate() + 1)
      return NextResponse.json(
        { error: `Limite de ${LIKE_DAILY_LIMIT} likes atteinte pour aujourd'hui`, resetAt: resetAt.toISOString() },
        { status: 429 }
      )
    }
  }

  // Vérifier que la cible existe
  const target = await prisma.user.findUnique({
    where: { id: toUserId },
    select: { id: true },
  })
  if (!target) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
  }

  // Créer ou mettre à jour le like (idempotent)
  await prisma.rencontreLike.upsert({
    where: { fromUserId_toUserId: { fromUserId: userId, toUserId } },
    create: { fromUserId: userId, toUserId, type },
    update: { type },
  })

  // Si PASS, pas de vérification de match
  if (type === "PASS") {
    return NextResponse.json({ matched: false, likesRestants: LIKE_DAILY_LIMIT })
  }

  // Calculer les likes restants aujourd'hui
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const likesDone = await prisma.rencontreLike.count({
    where: { fromUserId: userId, type: { not: "PASS" }, createdAt: { gte: todayStart } },
  })
  const likesRestants = Math.max(0, LIKE_DAILY_LIMIT - likesDone)

  // Vérifier si c'est un match mutuel (l'autre a aussi liké)
  const reciproque = await prisma.rencontreLike.findUnique({
    where: { fromUserId_toUserId: { fromUserId: toUserId, toUserId: userId } },
    select: { type: true },
  })

  if (!reciproque || reciproque.type === "PASS") {
    return NextResponse.json({ matched: false, likesRestants })
  }

  // Déduplication — vérifier si le match existe déjà
  const [userA, userB] = [userId, toUserId].sort()
  const matchExistant = await prisma.rencontreMatch.findUnique({
    where: { userAId_userBId: { userAId: userA, userBId: userB } },
  })

  if (matchExistant) {
    return NextResponse.json({ matched: true, matchId: matchExistant.id, alreadyExisted: true, likesRestants })
  }

  // Créer la conversation dédiée au match
  const [partA, partB] = [userId, toUserId].sort()
  const conversation = await prisma.conversation.upsert({
    where: { participantAId_participantBId: { participantAId: partA, participantBId: partB } },
    create: { participantAId: partA, participantBId: partB },
    update: {},
  })

  // Créer le match
  const match = await prisma.rencontreMatch.create({
    data: {
      userAId: userA,
      userBId: userB,
      conversationId: conversation.id,
    },
  })

  // Notifier les deux utilisateurs
  await creerNotification({
    userId,
    type: "NOUVELLE_CONNEXION",
    titre: "Nouveau match !",
    message: "Vous avez un nouveau match. Commencez à discuter !",
    lien: `/communaute/rencontres`,
    sourceId: match.id,
  })
  await creerNotification({
    userId: toUserId,
    type: "NOUVELLE_CONNEXION",
    titre: "Nouveau match !",
    message: "Vous avez un nouveau match. Commencez à discuter !",
    lien: `/communaute/rencontres`,
    sourceId: match.id,
  })

  return NextResponse.json({ matched: true, matchId: match.id, conversationId: conversation.id, likesRestants })
}
