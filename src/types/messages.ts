// Types partagés — Messagerie (chat communauté + messagerie médicale)
// Source unique de vérité — ne pas redéfinir localement dans les composants

export interface ReactionData {
  type: string
  userId: string
}

export interface ReplyToData {
  id: string
  contenu: string
  type?: string
  expediteur: { id: string; prenom: string; nom: string }
}

export interface MessageData {
  id: string
  expediteurId: string
  destinataireId: string
  contenu: string
  type?: string
  dureeSecondes?: number | null
  lu: boolean
  luLe?: string | null
  modifie?: boolean
  modifieLeAt?: string | null
  epingle?: boolean
  expiresAt?: string | null
  createdAt: string
  replyTo?: ReplyToData | null
  reactions?: ReactionData[]
  expediteur: {
    id: string
    nom: string
    prenom: string
    photoUrl: string | null
  }
  // Optimistic update state — client-side only, never in DB
  _optimistic?: boolean
  _status?: "sending" | "sent" | "error"
  _tempId?: string
  _mediaSubtype?: "image" | "video"
  programmeA?: string | null
  programmeEnvoye?: boolean
}

export interface Interlocuteur {
  id: string
  nom: string
  prenom: string
  photoUrl: string | null
  enLigne?: boolean
}

export interface Conversation {
  interlocuteur: Interlocuteur
  dernierMessage: {
    contenu: string
    createdAt: string
    expediteurId: string
    type?: string
  }
  nonLus: number
}
