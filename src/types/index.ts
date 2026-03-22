import type {
  Role,
  CategorieSoin,
  StatutRDV,
  StatutCommande,
} from "@/generated/prisma/client"

// ─── Ré-export des enums Prisma ──────────────────────────────────
export type { Role, CategorieSoin, StatutRDV, StatutCommande }

// ─── Types utilisateur ───────────────────────────────────────────
export interface UserSession {
  id: string
  email: string
  nom: string
  prenom: string
  role: Role
  photoUrl?: string | null
}

// ─── Types navigation ────────────────────────────────────────────
export interface NavItem {
  label: string
  href: string
  badge?: string
  requiresAuth?: boolean
  children?: NavChild[]
}

export interface NavChild {
  label: string
  href: string
  icon?: string
}

// ─── Types paiement ──────────────────────────────────────────────
export interface PaiementParams {
  commandeId: string
  montantFCFA: number
  methodePaiement: "wave" | "orange" | "mtn" | "moov" | "djamo"
}

// ─── Types messagerie Socket.io ──────────────────────────────────
export const SOCKET_EVENTS = {
  REJOINDRE_CONVERSATION: "rejoindre_conversation",
  ENVOYER_MESSAGE: "envoyer_message",
  MARQUER_LU: "marquer_lu",
  ECRITURE_EN_COURS: "ecriture_en_cours",
  NOUVEAU_MESSAGE: "nouveau_message",
  MESSAGE_LU: "message_lu",
  UTILISATEUR_EN_LIGNE: "utilisateur_en_ligne",
  UTILISATEUR_HORS_LIGNE: "utilisateur_hors_ligne",
} as const

// ─── Types API response ──────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
