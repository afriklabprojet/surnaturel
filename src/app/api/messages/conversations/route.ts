import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const userId = session.user.id

  // Tous les messages où l'utilisateur est expéditeur ou destinataire
  const messages = await prisma.message.findMany({
    where: {
      OR: [{ expediteurId: userId }, { destinataireId: userId }],
    },
    include: {
      expediteur: {
        select: { id: true, nom: true, prenom: true, photoUrl: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Grouper par conversation (interlocuteur)
  const conversationsMap = new Map<
    string,
    {
      interlocuteur: { id: string; nom: string; prenom: string; photoUrl: string | null }
      dernierMessage: { contenu: string; createdAt: Date; expediteurId: string }
      nonLus: number
    }
  >()

  for (const msg of messages) {
    const interlocuteurId =
      msg.expediteurId === userId ? msg.destinataireId : msg.expediteurId

    if (!conversationsMap.has(interlocuteurId)) {
      // Charger les infos de l'interlocuteur si ce n'est pas l'expéditeur du message
      let interlocuteur: { id: string; nom: string; prenom: string; photoUrl: string | null }

      if (msg.expediteurId === userId) {
        // L'interlocuteur est le destinataire — on doit le charger
        const dest = await prisma.user.findUnique({
          where: { id: interlocuteurId },
          select: { id: true, nom: true, prenom: true, photoUrl: true },
        })
        if (!dest) continue
        interlocuteur = dest
      } else {
        interlocuteur = msg.expediteur
      }

      conversationsMap.set(interlocuteurId, {
        interlocuteur,
        dernierMessage: {
          contenu: msg.contenu,
          createdAt: msg.createdAt,
          expediteurId: msg.expediteurId,
        },
        nonLus: 0,
      })
    }

    // Compter les non-lus (messages reçus non lus)
    if (msg.destinataireId === userId && !msg.lu) {
      const conv = conversationsMap.get(interlocuteurId)!
      conv.nonLus += 1
    }
  }

  const conversations = Array.from(conversationsMap.values()).sort(
    (a, b) =>
      new Date(b.dernierMessage.createdAt).getTime() -
      new Date(a.dernierMessage.createdAt).getTime()
  )

  return NextResponse.json({ conversations })
}
