// Types partagés de la communauté

export interface Auteur {
  id: string
  nom: string
  prenom: string
  pseudo?: string | null
  photoUrl: string | null
  statutProfil?: string | null
  verificationStatus?: string | null
}

export interface CommentaireData {
  id: string
  contenu: string
  createdAt: string
  auteur: Auteur
}

export type ReactionType = "JAIME" | "SOUTIEN" | "ENCOURAGEMENT" | "BRAVO" | "INSPIRATION"

export interface PartageDeData {
  id: string
  contenu: string
  imageUrl: string | null
  images: string[]
  videoUrl: string | null
  lienUrl: string | null
  format: string
  auteur: Auteur
  createdAt: string
  _count: { commentaires: number; reactions: number }
}

export interface PostData {
  id: string
  contenu: string
  imageUrl: string | null
  images: string[]
  videoUrl: string | null
  lienUrl: string | null
  lienTitre: string | null
  lienDescription: string | null
  lienImage: string | null
  documentUrl: string | null
  documentNom: string | null
  format: string
  hashtags: string[]
  epingle: boolean
  createdAt: string
  auteur: Auteur
  commentaires: CommentaireData[]
  userReaction: ReactionType | null
  reactionCounts: Record<string, number>
  reactionsCount: number
  commentairesCount: number
  partagesCount: number
  saved: boolean
  partageDeId: string | null
  commentairePartage: string | null
  partageDe: PartageDeData | null
}

export interface MentionUser {
  id: string
  nom: string
  prenom: string
  pseudo?: string | null
  photoUrl: string | null
}

export const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: "JAIME", emoji: "👍", label: "J'aime" },
  { type: "SOUTIEN", emoji: "❤️", label: "Soutien" },
  { type: "ENCOURAGEMENT", emoji: "💪", label: "Courage" },
  { type: "BRAVO", emoji: "👏", label: "Bravo" },
  { type: "INSPIRATION", emoji: "✨", label: "Inspiration" },
]
