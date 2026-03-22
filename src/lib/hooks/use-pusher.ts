"use client"

import { useEffect } from "react"
import { getPusherClient, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher"

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

export function usePusherChat(
  monUserId: string,
  interlocuteurId: string,
  onNouveauMessage: (message: Message) => void,
  onEcritureEnCours: (actif: boolean) => void,
  onReactionMessage?: (data: { messageId: string; reactions: { type: string; count: number }[]; userId: string }) => void
) {
  useEffect(() => {
    if (!monUserId || !interlocuteurId) return

    const channelName = PUSHER_CHANNELS.conversation(monUserId, interlocuteurId)
    const client = getPusherClient()
    const channel = client.subscribe(channelName)

    channel.bind(PUSHER_EVENTS.NOUVEAU_MESSAGE, onNouveauMessage)
    channel.bind(
      PUSHER_EVENTS.ECRITURE_EN_COURS,
      ({ actif }: { actif: boolean }) => onEcritureEnCours(actif)
    )
    if (onReactionMessage) {
      channel.bind(PUSHER_EVENTS.REACTION_MESSAGE, onReactionMessage)
    }

    return () => {
      channel.unbind_all()
      client.unsubscribe(channelName)
    }
  }, [monUserId, interlocuteurId])
}
