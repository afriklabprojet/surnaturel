import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const userId = session.user.id

  // Requête directe sur la table Conversation (1 row par conv, déjà dénormalisée)
  // Coût : O(k) où k = nombre de conversations de l'utilisateur, jamais O(messages)
  const convs = await prisma.conversation.findMany({
    where: {
      OR: [{ participantAId: userId }, { participantBId: userId }],
    },
    orderBy: { lastMessageAt: "desc" },
    include: {
      participantA: {
        select: { id: true, nom: true, prenom: true, photoUrl: true },
      },
      participantB: {
        select: { id: true, nom: true, prenom: true, photoUrl: true },
      },
      // Charger le dernier message pour afficher son contenu
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, contenu: true, type: true, createdAt: true, expediteurId: true },
      },
    },
  })

  const conversations = convs
    .map((conv) => {
      const isA = conv.participantAId === userId
      const interlocuteur = isA ? conv.participantB : conv.participantA
      const nonLus = isA ? conv.nonLusA : conv.nonLusB
      const dernierMsg = conv.messages[0]
      if (!dernierMsg) return null

      return {
        interlocuteur,
        dernierMessage: {
          contenu: dernierMsg.type === "VOCAL" ? "🎤 Message vocal" : dernierMsg.contenu,
          createdAt: dernierMsg.createdAt,
          expediteurId: dernierMsg.expediteurId,
          type: dernierMsg.type,
        },
        nonLus,
      }
    })
    .filter(Boolean)

  return NextResponse.json({ conversations })
}
