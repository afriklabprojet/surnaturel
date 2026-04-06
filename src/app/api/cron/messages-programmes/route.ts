import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getPusherServeur, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher"
import { envoyerPushNotification, isPushConfigured, type PushPayload } from "@/lib/web-push"

// GET /api/cron/messages-programmes — Déclenché toutes les minutes par Vercel Cron
// Envoie les messages programmés dont la date est passée
export async function GET(req: NextRequest) {
  // Vérification de sécurité Vercel Cron
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const now = new Date()

  // Trouver les messages programmés dont la date est passée et qui n'ont pas encore été envoyés
  const messagesDus = await prisma.message.findMany({
    where: {
      programmeA: { not: null, lte: now },
      programmeEnvoye: false,
    },
    include: {
      expediteur: { select: { id: true, nom: true, prenom: true, photoUrl: true } },
      replyTo: {
        select: {
          id: true, contenu: true, type: true,
          expediteur: { select: { id: true, prenom: true, nom: true } },
        },
      },
    },
    take: 100, // limite de sécurité
  })

  if (messagesDus.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  const pusher = getPusherServeur()
  const sentIds: string[] = []

  // Pré-charger tous les destinataires en une seule requête (évite N+1)
  const destIds = [...new Set(messagesDus.map(m => m.destinataireId))]
  const destUsersMap = new Map<string, { notifMessages: boolean; pushSubscriptions: { endpoint: string; p256dh: string; auth: string }[] }>()

  if (isPushConfigured() && destIds.length > 0) {
    const destUsers = await prisma.user.findMany({
      where: { id: { in: destIds } },
      select: { id: true, notifMessages: true, pushSubscriptions: true },
    })
    for (const u of destUsers) {
      destUsersMap.set(u.id, u)
    }
  }

  for (const message of messagesDus) {
    try {
      // Émettre via Pusher
      const channelName = PUSHER_CHANNELS.conversation(
        message.expediteurId,
        message.destinataireId
      )
      await pusher.trigger(channelName, PUSHER_EVENTS.NOUVEAU_MESSAGE, message)

      sentIds.push(message.id)

      // Push notification pour le destinataire
      const destUser = destUsersMap.get(message.destinataireId)
      if (destUser?.notifMessages && destUser.pushSubscriptions.length > 0) {
        const payload: PushPayload = {
          title: `${message.expediteur.prenom} ${message.expediteur.nom}`,
          body: message.contenu.length > 80
            ? message.contenu.slice(0, 80) + "…"
            : message.contenu,
          url: "/communaute/messages",
          tag: `message-${message.expediteurId}`,
        }
        for (const sub of destUser.pushSubscriptions) {
          await envoyerPushNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          ).catch(() => {})
        }
      }
    } catch {
      // Continuer sur les autres messages même en cas d'erreur
    }
  }

  // Batch update: marquer tous les messages envoyés en une seule requête
  if (sentIds.length > 0) {
    await prisma.message.updateMany({
      where: { id: { in: sentIds } },
      data: { programmeEnvoye: true },
    })
  }

  return NextResponse.json({ sent: sentIds.length, total: messagesDus.length })
}
