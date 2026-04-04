import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getPusherServeur, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher"
import { z } from "zod/v4"
import { creerNotification } from "@/lib/notifications"
import { envoyerPushNotification, isPushConfigured, type PushPayload } from "@/lib/web-push"
import { createRateLimiter } from "@/lib/rate-limit"

// 30 messages par minute par utilisateur — protège contre spam et boucles client
const messageLimiter = createRateLimiter({ limit: 30, windowMs: 60 * 1000, prefix: "msg" })

const messageSchema = z.object({
  destinataireId: z.string().min(1),
  contenu: z.string().min(1).max(2000),
  replyToId: z.string().optional(),
  ephemere: z.boolean().optional(),
  programmeA: z.string().datetime().optional(), // ISO 8601 — message programmé
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  // Rate limiting par userId — 30 messages/min max
  const rl = await Promise.resolve(messageLimiter(session.user.id))
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Trop de messages envoyés. Veuillez patienter avant d'en envoyer d'autres." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rl.retryAfterSeconds),
          "X-RateLimit-Limit": String(rl.limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Les informations envoyées sont incorrectes. Veuillez réessayer." }, { status: 400 })
  }

  const result = messageSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: "Données invalides", details: z.prettifyError(result.error) },
      { status: 400 }
    )
  }

  const { destinataireId, contenu, replyToId, ephemere, programmeA } = result.data

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

  const programmeDate = programmeA ? new Date(programmeA) : null
  const estProgramme = programmeDate !== null && programmeDate > new Date()

  // participantA < participantB — clé unique normalisée
  const [pA, pB] = [session.user.id, destinataireId].sort()

  // Upsert la Conversation + création du Message en parallèle via transaction
  const message = await prisma.$transaction(async (tx) => {
    // 1. Créer le message d'abord (sans conversationId)
    const msg = await tx.message.create({
      data: {
        expediteurId: session.user.id,
        destinataireId,
        contenu,
        type: "TEXTE",
        ...(replyToId ? { replyToId } : {}),
        ...(ephemere ? { expiresAt: new Date(Date.now() + 24 * 3600 * 1000) } : {}),
        ...(estProgramme ? { programmeA: programmeDate } : {}),
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

    // 2. Upsert la Conversation et incrémenter nonLus du destinataire
    const isParticipantA = session.user.id === pA
    await tx.conversation.upsert({
      where: { participantAId_participantBId: { participantAId: pA, participantBId: pB } },
      create: {
        participantAId: pA,
        participantBId: pB,
        lastMessageId: msg.id,
        lastMessageAt: msg.createdAt,
        nonLusA: isParticipantA ? 0 : 1,
        nonLusB: isParticipantA ? 1 : 0,
      },
      update: {
        lastMessageId: msg.id,
        lastMessageAt: msg.createdAt,
        // Incrémenter les non-lus du destinataire uniquement si message non programmé
        ...(!estProgramme && isParticipantA
          ? { nonLusB: { increment: 1 } }
          : !estProgramme
          ? { nonLusA: { increment: 1 } }
          : {}),
      },
    })

    // 3. Rattacher le message à la conversation
    const conv = await tx.conversation.findUnique({
      where: { participantAId_participantBId: { participantAId: pA, participantBId: pB } },
      select: { id: true },
    })
    if (conv) {
      await tx.message.update({
        where: { id: msg.id },
        data: { conversationId: conv.id },
      })
    }

    return msg
  })

  // Si le message est programmé, ne pas l'émettre immédiatement
  if (!estProgramme) {
    const channelName = PUSHER_CHANNELS.conversation(session.user.id, destinataireId)
    /* v8 ignore next -- best-effort realtime broadcast */
    getPusherServeur().trigger(channelName, PUSHER_EVENTS.NOUVEAU_MESSAGE, message).catch(() => {})

    // Notification + push en arrière-plan
    void (async () => {
      try {
        const destUser = await prisma.user.findUnique({
          where: { id: destinataireId },
          select: { notifMessages: true, pushSubscriptions: true },
        })
        if (destUser?.notifMessages) {
          await creerNotification({
            userId: destinataireId,
            type: "NOUVEAU_MESSAGE",
            titre: "Nouveau message",
            message: `${message.expediteur.prenom} ${message.expediteur.nom} vous a envoyé un message`,
            lien: "/communaute/messages",
          })
        }
        // Push Web Push notification
        if (isPushConfigured() && destUser?.pushSubscriptions?.length) {
          const payload: PushPayload = {
            title: `${message.expediteur.prenom} ${message.expediteur.nom}`,
            body: contenu.length > 80 ? contenu.slice(0, 80) + "…" : contenu,
            url: "/communaute/messages",
            tag: `message-${session.user.id}`,
          }
          for (const sub of destUser.pushSubscriptions) {
            await envoyerPushNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload
            ).catch(() => {})
          }
        }
      } catch { /* optionnel */ }
    })()
  }

  return NextResponse.json({ message }, { status: 201 })
}
