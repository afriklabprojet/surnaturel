import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getPusherServeur, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher"
import { z } from "zod/v4"
import { creerNotification } from "@/lib/notifications"

const messageSchema = z.object({
  destinataireId: z.string().min(1),
  contenu: z.string().min(1).max(2000),
  replyToId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 })
  }

  const result = messageSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: "Données invalides", details: z.prettifyError(result.error) },
      { status: 400 }
    )
  }

  const { destinataireId, contenu, replyToId } = result.data

  // Vérifier que le destinataire existe
  const destinataire = await prisma.user.findUnique({
    where: { id: destinataireId },
    select: { id: true },
  })

  if (!destinataire) {
    return NextResponse.json(
      { error: "Destinataire introuvable" },
      { status: 404 }
    )
  }

  // Empêcher l'envoi à soi-même
  if (destinataireId === session.user.id) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas vous envoyer un message" },
      { status: 400 }
    )
  }

  const message = await prisma.message.create({
    data: {
      expediteurId: session.user.id,
      destinataireId,
      contenu,
      type: "TEXTE",
      ...(replyToId ? { replyToId } : {}),
    },
    include: {
      expediteur: {
        select: { id: true, nom: true, prenom: true, photoUrl: true },
      },
      replyTo: {
        select: {
          id: true, contenu: true, type: true,
          expediteur: { select: { id: true, prenom: true, nom: true } },
        },
      },
    },
  })

  // Émettre l'événement en temps réel via Pusher (fire-and-forget pour ne pas bloquer la réponse)
  const channelName = PUSHER_CHANNELS.conversation(session.user.id, destinataireId)
  getPusherServeur().trigger(channelName, PUSHER_EVENTS.NOUVEAU_MESSAGE, message).catch(() => {})

  // Notification persistante en arrière-plan (ne bloque pas la réponse)
  void (async () => {
    try {
      const destPrefs = await prisma.user.findUnique({
        where: { id: destinataireId },
        select: { notifMessages: true },
      })
      if (destPrefs?.notifMessages) {
        await creerNotification({
          userId: destinataireId,
          type: "NOUVEAU_MESSAGE",
          titre: "Nouveau message",
          message: `${message.expediteur.prenom} ${message.expediteur.nom} vous a envoyé un message`,
          lien: "/communaute/messages",
        })
      }
    } catch { /* notification optionnelle */ }
  })()

  return NextResponse.json({ message }, { status: 201 })
}
