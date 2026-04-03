// ── Service lib pour les notifications push (Web Push API) ─────────────
import webPush from "web-push"
import { getConfig } from "@/lib/config"
import { typedLogger as logger } from "@/lib/logger"

// Configuration VAPID (Voluntary Application Server Identification)
// Les clés doivent être générées avec: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ""

let webPushInitialized = false

async function ensureWebPushConfigured() {
  if (webPushInitialized || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return
  const { email } = await getConfig()
  const subject = process.env.VAPID_SUBJECT || `mailto:${email}`
  webPush.setVapidDetails(subject, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
  webPushInitialized = true
}

export type PushPayload = {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string
  tag?: string
  data?: Record<string, unknown>
}

// Types de notifications push
export const PUSH_TYPES = {
  RDV_RAPPEL: "rdv_rappel",
  RDV_CONFIRME: "rdv_confirme",
  NOUVEAU_MESSAGE: "nouveau_message",
  COMMANDE_STATUT: "commande_statut",
  PROMO: "promo",
  AVIS_INVITATION: "avis_invitation",
  POINTS_FIDELITE: "points_fidelite",
} as const

export type PushType = (typeof PUSH_TYPES)[keyof typeof PUSH_TYPES]

// Vérifie si web-push est configuré
export function isPushConfigured(): boolean {
  return !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY)
}

// Envoyer une notification push à une subscription
export async function envoyerPushNotification(
  subscription: webPush.PushSubscription,
  payload: PushPayload
): Promise<boolean> {
  if (!isPushConfigured()) {
    logger.warn("[PUSH] Web Push non configuré — notification ignorée")
    return false
  }

  await ensureWebPushConfigured()

  try {
    const payloadString = JSON.stringify({
      ...payload,
      icon: payload.icon || "/logos/logo-192.png",
      badge: payload.badge || "/logos/badge-72.png",
    })

    await webPush.sendNotification(subscription, payloadString)
    return true
  } catch (error: unknown) {
    const err = error as { statusCode?: number }
    // 410 Gone = subscription expirée, devrait être supprimée
    if (err.statusCode === 410) {
      return false
    }
    logger.error("[PUSH] Erreur envoi:", error)
    return false
  }
}

// Génération des payloads par type
export function creerPayloadPush(
  type: PushType,
  data: Record<string, string>
): PushPayload {
  const baseUrl = process.env.NEXTAUTH_URL || "https://lesurnatureldedieu.com"

  switch (type) {
    case PUSH_TYPES.RDV_RAPPEL:
      return {
        title: "Rappel RDV demain",
        body: `Vous avez un rendez-vous "${data.soin}" demain à ${data.heure}`,
        url: `${baseUrl}/mes-rdv`,
        tag: "rdv-rappel",
      }

    case PUSH_TYPES.RDV_CONFIRME:
      return {
        title: "RDV confirmé ✓",
        body: `Votre rendez-vous "${data.soin}" du ${data.date} est confirmé`,
        url: `${baseUrl}/mes-rdv`,
        tag: "rdv-confirme",
      }

    case PUSH_TYPES.NOUVEAU_MESSAGE:
      return {
        title: `Nouveau message de ${data.expediteur}`,
        body: data.apercu || "Vous avez reçu un nouveau message",
        url: `${baseUrl}/communaute/messages`,
        tag: `message-${data.conversationId}`,
      }

    case PUSH_TYPES.COMMANDE_STATUT:
      return {
        title: `Commande ${data.statut}`,
        body: `Votre commande #${data.commandeId} est ${data.statut.toLowerCase()}`,
        url: `${baseUrl}/commandes/${data.commandeId}`,
        tag: `commande-${data.commandeId}`,
      }

    case PUSH_TYPES.PROMO:
      return {
        title: "🎁 Offre spéciale",
        body: data.message,
        url: data.lien || `${baseUrl}/boutique`,
        tag: "promo",
      }

    case PUSH_TYPES.AVIS_INVITATION:
      return {
        title: "⭐ Votre avis compte !",
        body: `Donnez votre avis sur "${data.soin}" et gagnez 50 points`,
        url: `${baseUrl}/avis/${data.rdvId}`,
        tag: `avis-${data.rdvId}`,
      }

    case PUSH_TYPES.POINTS_FIDELITE:
      return {
        title: "🎉 Points fidélité",
        body: `+${data.points} points crédités sur votre compte !`,
        url: `${baseUrl}/fidelite`,
        tag: "fidelite",
      }

    default:
      return {
        title: "Le Surnaturel de Dieu",
        body: data.message || "Nouvelle notification",
        url: baseUrl,
      }
  }
}
