import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getPusherServeur, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher"

const auteurSelect = {
  id: true, nom: true, prenom: true, pseudo: true, photoUrl: true, statutProfil: true, verificationStatus: true,
}

// CRON — Publier les posts planifiés dont scheduledAt <= now()
export async function GET(req: Request) {
  // Vérifier le token cron en production
  const authHeader = req.headers.get("authorization")
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const now = new Date()
  const postsAPoster = await prisma.post.findMany({
    where: { status: "PLANIFIE", scheduledAt: { lte: now } },
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

  let pubCount = 0
  for (const post of postsAPoster) {
    await prisma.post.update({
      where: { id: post.id },
      data: { status: "PUBLIE" },
    })
    pubCount++

    // Émettre l'événement Pusher comme si le post venait d'être créé
    try {
      const channel = post.groupeId
        ? PUSHER_CHANNELS.groupe(post.groupeId)
        : PUSHER_CHANNELS.communaute
      await getPusherServeur().trigger(channel, PUSHER_EVENTS.NOUVEAU_POST, {
        ...post,
        status: "PUBLIE",
        userReaction: null,
        reactionCounts: {},
        reactionsCount: 0,
        commentairesCount: 0,
        partagesCount: 0,
        saved: false,
      })
    } catch { /* pusher optionnel */ }
  }

  return NextResponse.json({ success: true, publiees: pubCount })
}
