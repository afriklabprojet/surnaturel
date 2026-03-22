import Pusher from "pusher"
import PusherClient from "pusher-js"

// Serveur (émettre les événements) — lazy init
let _pusherServeur: Pusher | null = null
export function getPusherServeur() {
  if (!_pusherServeur) {
    _pusherServeur = new Pusher({
      appId:   process.env.PUSHER_APP_ID!,
      key:     process.env.PUSHER_KEY!,
      secret:  process.env.PUSHER_SECRET!,
      cluster: process.env.PUSHER_CLUSTER!,
      useTLS:  true,
    })
  }
  return _pusherServeur
}

// Client navigateur (écouter les événements) — lazy init
let _pusherClient: PusherClient | null = null
export function getPusherClient() {
  if (!_pusherClient) {
    _pusherClient = new PusherClient(
      process.env.NEXT_PUBLIC_PUSHER_KEY!,
      { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! }
    )
  }
  return _pusherClient
}

// Noms des channels et events — toujours utiliser ces constantes
export const PUSHER_CHANNELS = {
  conversation: (id1: string, id2: string) =>
    `conversation-${[id1, id2].sort().join("-")}`,
  medical: (userId: string) =>
    `medical-${userId}`,
  communaute: "communaute-feed",
  groupe: (groupeId: string) =>
    `groupe-${groupeId}`,
  notification: (userId: string) =>
    `notification-${userId}`,
}

export const PUSHER_EVENTS = {
  NOUVEAU_MESSAGE:       "nouveau-message",
  ECRITURE_EN_COURS:     "ecriture-en-cours",
  MESSAGE_LU:            "message-lu",
  REACTION_MESSAGE:      "nouvelle-reaction-message",
  NOUVEAU_POST:          "nouveau-post",
  NOUVEAU_COMMENTAIRE:   "nouveau-commentaire",
  NOUVELLE_REACTION:     "nouvelle-reaction",
  POST_SUPPRIME:         "post-supprime",
  NOUVELLE_NOTIFICATION: "nouvelle-notification",
  NOUVELLE_STORY:        "nouvelle-story",
}
