"use client"

import { useEffect, useRef } from "react"
import { initPusherClient, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher"

interface Message {
  id: string
  contenu: string
  expediteurId: string
  destinataireId: string
  lu: boolean
  createdAt: string
  expediteur: {
    id: string
    nom: string
    prenom: string
    photoUrl: string | null
  }
}

type OnReaction = (data: { messageId: string; reactions: { type: string; count: number }[]; userId: string }) => void
type OnMessageLu = (data: { parUserId: string }) => void
type OnMessageSupprime = (data: { messageId: string }) => void
type OnMessageModifie = (data: { messageId: string; contenu: string; modifieLeAt: string }) => void
type OnMessageEpingle = (data: { messageId: string; epingle: boolean; message: Message | null }) => void

export function usePusherChat(
  monUserId: string,
  interlocuteurId: string,
  onNouveauMessage: (message: Message) => void,
  onEcritureEnCours: (actif: boolean) => void,
  onReactionMessage?: OnReaction,
  onMessageLu?: OnMessageLu,
  onMessageSupprime?: OnMessageSupprime,
  onMessageModifie?: OnMessageModifie,
  onMessageEpingle?: OnMessageEpingle
) {
  // Toujours frais — mis à jour à chaque rendu, jamais stale dans les handlers Pusher
  const handlersRef = useRef({
    onNouveauMessage,
    onEcritureEnCours,
    onReactionMessage,
    onMessageLu,
    onMessageSupprime,
    onMessageModifie,
    onMessageEpingle,
  })
  useEffect(() => {
    handlersRef.current = {
      onNouveauMessage,
      onEcritureEnCours,
      onReactionMessage,
      onMessageLu,
      onMessageSupprime,
      onMessageModifie,
      onMessageEpingle,
    }
  })

  useEffect(() => {
    if (!monUserId || !interlocuteurId) return

    const channelName = PUSHER_CHANNELS.conversation(monUserId, interlocuteurId)
    let channel: ReturnType<Awaited<ReturnType<typeof initPusherClient>>["subscribe"]> | null = null

    initPusherClient().then((client) => {
      channel = client.subscribe(channelName)

      // Wrappers stables — délèguent vers les handlers courants via la ref
      channel.bind(PUSHER_EVENTS.NOUVEAU_MESSAGE, (msg: Message) =>
        handlersRef.current.onNouveauMessage(msg)
      )
      channel.bind(PUSHER_EVENTS.ECRITURE_EN_COURS, ({ actif }: { actif: boolean }) =>
        handlersRef.current.onEcritureEnCours(actif)
      )
      channel.bind(PUSHER_EVENTS.REACTION_MESSAGE, (data: Parameters<OnReaction>[0]) =>
        handlersRef.current.onReactionMessage?.(data)
      )
      channel.bind(PUSHER_EVENTS.MESSAGE_LU, (data: Parameters<OnMessageLu>[0]) =>
        handlersRef.current.onMessageLu?.(data)
      )
      channel.bind(PUSHER_EVENTS.MESSAGE_SUPPRIME, (data: Parameters<OnMessageSupprime>[0]) =>
        handlersRef.current.onMessageSupprime?.(data)
      )
      channel.bind(PUSHER_EVENTS.MESSAGE_MODIFIE, (data: Parameters<OnMessageModifie>[0]) =>
        handlersRef.current.onMessageModifie?.(data)
      )
      channel.bind(PUSHER_EVENTS.MESSAGE_EPINGLE, (data: Parameters<OnMessageEpingle>[0]) =>
        handlersRef.current.onMessageEpingle?.(data)
      )
    })

    return () => {
      if (channel) {
        channel.unbind_all()
        initPusherClient().then((c) => c.unsubscribe(channelName))
      }
    }
  }, [monUserId, interlocuteurId])
}
