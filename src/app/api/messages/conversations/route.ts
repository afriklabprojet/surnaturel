import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const userId = session.user.id

  // 1) Récupérer le dernier message de chaque conversation en UNE seule requête
  //    On utilise distinctOn + orderBy pour ne garder que le plus récent par paire
  const lastMessages = await prisma.message.findMany({
    where: {
      OR: [{ expediteurId: userId }, { destinataireId: userId }],
    },
    orderBy: { createdAt: "desc" },
    // Inclure l'expéditeur pour éviter des requêtes supplémentaires
    include: {
      expediteur: {
        select: { id: true, nom: true, prenom: true, photoUrl: true },
      },
    },
  })

  // 2) Grouper côté serveur : garder seulement le dernier message par interlocuteur
  const conversationsMap = new Map<
    string,
    {
      interlocuteurId: string
      dernierMessage: { contenu: string; createdAt: Date; expediteurId: string; type: string }
      nonLus: number
    }
  >()

  for (const msg of lastMessages) {
    const interlocuteurId =
      msg.expediteurId === userId ? msg.destinataireId : msg.expediteurId

    if (!conversationsMap.has(interlocuteurId)) {
      conversationsMap.set(interlocuteurId, {
        interlocuteurId,
        dernierMessage: {
          contenu: msg.type === "VOCAL" ? "🎤 Message vocal" : msg.contenu,
          createdAt: msg.createdAt,
          expediteurId: msg.expediteurId,
          type: msg.type,
        },
        nonLus: 0,
      })
    }

    // Compter les non-lus
    if (msg.destinataireId === userId && !msg.lu) {
      const conv = conversationsMap.get(interlocuteurId)!
      conv.nonLus += 1
    }
  }

  // 3) Charger tous les interlocuteurs en UNE seule requête (pas de N+1)
  const interlocuteurIds = [...conversationsMap.keys()]
  const interlocuteurs = await prisma.user.findMany({
    where: { id: { in: interlocuteurIds } },
    select: { id: true, nom: true, prenom: true, photoUrl: true },
  })
  const interlocuteurMap = new Map(interlocuteurs.map((u) => [u.id, u]))

  // 4) Assembler et trier
  const conversations = interlocuteurIds
    .map((id) => {
      const conv = conversationsMap.get(id)!
      const interlocuteur = interlocuteurMap.get(id)
      if (!interlocuteur) return null
      return {
        interlocuteur,
        dernierMessage: conv.dernierMessage,
        nonLus: conv.nonLus,
      }
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        new Date(b!.dernierMessage.createdAt).getTime() -
        new Date(a!.dernierMessage.createdAt).getTime()
    )

  return NextResponse.json({ conversations })
}
