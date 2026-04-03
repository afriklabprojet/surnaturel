import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getPusherServeur, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher"

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { userId } = await params
  const currentUserId = session.user.id

  // Marquer comme lus tous les messages reçus de cet interlocuteur
  const result = await prisma.message.updateMany({
    where: {
      expediteurId: userId,
      destinataireId: currentUserId,
      lu: false,
    },
    data: { lu: true, luLe: new Date() },
  })

  // Reset le compteur de non-lus dans la Conversation dénormalisée
  if (result.count > 0) {
    const [pA, pB] = [currentUserId, userId].sort()
    const isCurrentA = currentUserId === pA
    await prisma.conversation.updateMany({
      where: { participantAId: pA, participantBId: pB },
      data: isCurrentA ? { nonLusA: 0 } : { nonLusB: 0 },
    })
  }

  // Notifier l'expéditeur en temps réel que ses messages ont été lus
  if (result.count > 0) {
    const pusher = getPusherServeur()
    const channelName = PUSHER_CHANNELS.conversation(userId, currentUserId)
    await pusher.trigger(channelName, PUSHER_EVENTS.MESSAGE_LU, {
      parUserId: currentUserId,
    })
  }

  return NextResponse.json({
    success: true,
    count: result.count,
  })
}
