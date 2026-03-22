import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"
import { getPusherServeur, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher"
import { creerNotification } from "@/lib/notifications"

interface Params { params: Promise<{ userId: string }> }

const reactionSchema = z.object({
  messageId: z.string().min(1),
  type: z.enum(["JAIME", "SOUTIEN", "ENCOURAGEMENT", "BRAVO", "INSPIRATION"]),
})

// POST — Ajouter / changer / retirer une réaction sur un message
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { userId: interlocuteurId } = await params

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 })
  }

  const result = reactionSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 })
  }

  const { messageId, type } = result.data

  // Vérifier que le message appartient à cette conversation
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { id: true, expediteurId: true, destinataireId: true },
  })

  if (!message) {
    return NextResponse.json({ error: "Message introuvable" }, { status: 404 })
  }

  const participants = [message.expediteurId, message.destinataireId]
  if (!participants.includes(session.user.id)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  // Toggle / change
  const existing = await prisma.reaction.findFirst({
    where: { messageId, userId: session.user.id },
  })

  let reactionType: string | null = null

  if (existing) {
    if (existing.type === type) {
      await prisma.reaction.delete({ where: { id: existing.id } })
      reactionType = null
    } else {
      await prisma.reaction.update({ where: { id: existing.id }, data: { type } })
      reactionType = type
    }
  } else {
    await prisma.reaction.create({
      data: { messageId, userId: session.user.id, type },
    })
    reactionType = type
  }

  // Récupérer réactions groupées pour ce message
  const reactions = await prisma.reaction.groupBy({
    by: ["type"],
    where: { messageId },
    _count: true,
  })

  const reactionsMap = reactions.map((r) => ({ type: r.type, count: r._count }))

  // Pusher temps réel
  const channelName = PUSHER_CHANNELS.conversation(session.user.id, interlocuteurId)
  try {
    await getPusherServeur().trigger(channelName, PUSHER_EVENTS.REACTION_MESSAGE, {
      messageId,
      reactions: reactionsMap,
      userId: session.user.id,
    })
  } catch { /* pusher optionnel */ }

  // Notifier l'auteur du message (uniquement si ajout, pas toggle off)
  if (reactionType && message.expediteurId !== session.user.id) {
    const reacteur = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { prenom: true, nom: true },
    })
    try {
      await creerNotification({
        userId: message.expediteurId,
        type: "REACTION_MESSAGE",
        titre: "Réaction à votre message",
        message: `${reacteur?.prenom} ${reacteur?.nom} a réagi à votre message`,
        lien: "/communaute/messages",
      })
    } catch { /* notification optionnelle */ }
  }

  return NextResponse.json({ reaction: reactionType, reactions: reactionsMap })
}

// DELETE — Supprimer une réaction
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const messageId = searchParams.get("messageId")
  if (!messageId) {
    return NextResponse.json({ error: "messageId requis" }, { status: 400 })
  }

  const existing = await prisma.reaction.findFirst({
    where: { messageId, userId: session.user.id },
  })

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } })
  }

  return NextResponse.json({ ok: true })
}
