import Pusher from "pusher"

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

// Client navigateur (écouter les événements) — lazy init + dynamic import
// pusher-js n'est chargé que quand un composant client demande la connexion
type PusherClientType = import("pusher-js").default
let _pusherClient: PusherClientType | null = null
let _pusherClientPromise: Promise<PusherClientType> | null = null

export function getPusherClient(): PusherClientType {
  if (_pusherClient) return _pusherClient
  // Fallback sync si déjà importé
  throw new Error("Pusher client not initialized. Call initPusherClient() first.")
}

export async function initPusherClient(): Promise<PusherClientType> {
  if (_pusherClient) return _pusherClient
  if (!_pusherClientPromise) {
    _pusherClientPromise = import("pusher-js").then(({ default: PusherJS }) => {
      _pusherClient = new PusherJS(
        process.env.NEXT_PUBLIC_PUSHER_KEY!,
        {
          cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
          // Authentification des canaux privés (private-*)
          // La route /api/pusher/auth vérifie que l'utilisateur
          // a bien le droit d'accéder au canal demandé.
          channelAuthorization: {
            endpoint: "/api/pusher/auth",
            transport: "ajax",
          },
        }
      )
      return _pusherClient
    })
  }
  return _pusherClientPromise
}

// Noms des channels et events — toujours utiliser ces constantes
//
// Convention :
//   private-*   → canal authentifié (Pusher exige une auth via /api/pusher/auth)
//   public       → canal public (feeds non-sensibles)
//
// ⚠️  Ne JAMAIS revenir à des canaux publics pour conversation/médical/notification.
export const PUSHER_CHANNELS = {
  // Canal privé : seuls les deux participants peuvent s'abonner
  conversation: (id1: string, id2: string) =>
    `private-conversation-${[id1, id2].sort().join("-")}`,
  // Canal privé : messages médicaux chiffrés
  medical: (userId: string) =>
    `private-medical-${userId}`,
  // Canal public : fil d'actualité communautaire (pas de donnée sensible)
  communaute: "communaute-feed",
  // Canal privé : groupes (posts, annonces du groupe)
  groupe: (groupeId: string) =>
    `private-groupe-${groupeId}`,
  // Canal privé : notifications personnelles
  notification: (userId: string) =>
    `private-notification-${userId}`,
  // Canal public : disponibilité créneaux RDV
  creneaux: (soinId: string, date: string) =>
    `creneaux-${soinId}-${date}`,
}

export const PUSHER_EVENTS = {
  NOUVEAU_MESSAGE:         "nouveau-message",
  ECRITURE_EN_COURS:       "ecriture-en-cours",
  MESSAGE_LU:              "message-lu",
  MESSAGE_SUPPRIME:        "message-supprime",
  MESSAGE_MODIFIE:         "message-modifie",
  MESSAGE_EPINGLE:         "message-epingle",
  REACTION_MESSAGE:        "nouvelle-reaction-message",
  NOUVEAU_POST:            "nouveau-post",
  NOUVEAU_COMMENTAIRE:     "nouveau-commentaire",
  NOUVELLE_REACTION:       "nouvelle-reaction",
  POST_SUPPRIME:           "post-supprime",
  NOUVELLE_NOTIFICATION:   "nouvelle-notification",
  NOUVELLE_STORY:          "nouvelle-story",
  UTILISATEUR_EN_LIGNE:    "utilisateur-en-ligne",
  UTILISATEUR_HORS_LIGNE:  "utilisateur-hors-ligne",
  CRENEAU_RESERVE:         "creneau-reserve",
  CRENEAU_LIBERE:          "creneau-libere",
}
