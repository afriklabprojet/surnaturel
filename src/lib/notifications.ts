import { prisma } from "@/lib/prisma"
import { typedLogger as logger } from "@/lib/logger"
import { getPusherServeur, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher"
import { enfileNotification } from "@/lib/queue"
import type { NotifType } from "@/generated/prisma/client"

// Mapping type → préférence utilisateur
const PREF_MAP: Partial<Record<NotifType, string>> = {
  NOUVEAU_LIKE: "notifLikes",
  NOUVEAU_COMMENTAIRE: "notifCommentaires",
  MENTION: "notifCommentaires",
  DEMANDE_CONNEXION: "notifConnexions",
  NOUVELLE_CONNEXION: "notifConnexions",
  NOUVEAU_MESSAGE: "notifMessages",
  REACTION_MESSAGE: "notifMessages",
  EVENEMENT_RAPPEL: "notifEvenements",
  INVITATION_GROUPE: "notifGroupes",
  // ANNONCE_GROUPE : pas dans PREF_MAP → notification forcée (non désactivable)
}

interface CreerNotificationParams {
  userId: string
  type: NotifType
  titre: string
  message: string
  lien?: string
  sourceId?: string
}

export async function creerNotification(params: CreerNotificationParams) {
  // Vérifier la préférence utilisateur
  const prefField = PREF_MAP[params.type]
  if (prefField) {
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { [prefField]: true },
    }) as Record<string, boolean> | null
    if (user && user[prefField] === false) return null
  }

  // Si BullMQ + Redis disponibles → enfile le job (retry automatique, no perte)
  // Sinon → exécution synchrone directe (fallback)
  const queued = await enfileNotification(params)
  if (queued) return { queued: true }

  // ── Fallback synchrone (pas de Redis) ────────────────────────────────────
  const notifData = {
    userId: params.userId,
    type: params.type,
    titre: params.titre,
    message: params.message,
    lien: params.lien,
    sourceId: params.sourceId,
  }

  const notif = params.sourceId
    ? await prisma.notification.upsert({
        where: {
          notif_dedup: {
            userId: params.userId,
            type: params.type,
            sourceId: params.sourceId,
          },
        },
        create: { ...notifData, compteur: 1 },
        update: {
          compteur: { increment: 1 },
          message: params.message,
          lu: false, // remettre "non lu" quand une nouvelle action arrive
        },
      })
    : await prisma.notification.create({ data: notifData })

  // Envoyer en temps réel via Pusher
  try {
    await getPusherServeur().trigger(
      PUSHER_CHANNELS.notification(params.userId),
      PUSHER_EVENTS.NOUVELLE_NOTIFICATION,
      notif
    )
  } catch (error) {
    logger.error("Erreur Pusher notification:", error)
  }

  return notif
}

// Notifications automatiques pour différents événements
export async function notifierRDVConfirme(userId: string, soinNom: string, dateHeure: Date) {
  const dateFormatee = dateHeure.toLocaleDateString("fr", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  })

  return creerNotification({
    userId,
    type: "RDV_CONFIRME",
    titre: "Rendez-vous confirmé !",
    message: `Votre soin ${soinNom} est confirmé pour ${dateFormatee}`,
    lien: "/mes-rdv",
  })
}

export async function notifierRDVAnnule(userId: string, soinNom: string) {
  return creerNotification({
    userId,
    type: "RDV_ANNULE",
    titre: "Rendez-vous annulé",
    message: `Votre rendez-vous pour ${soinNom} a été annulé`,
    lien: "/mes-rdv",
  })
}

export async function notifierCommandePayee(userId: string, montant: number) {
  return creerNotification({
    userId,
    type: "COMMANDE_PAYEE",
    titre: "Commande confirmée !",
    message: `Votre commande de ${montant.toLocaleString("fr")} FCFA est en cours de préparation`,
    lien: "/mes-commandes",
  })
}

export async function notifierCommandeExpediee(userId: string, commandeId: string) {
  return creerNotification({
    userId,
    type: "COMMANDE_EXPEDIEE",
    titre: "Commande expédiée !",
    message: "Votre colis est en route. Vous le recevrez bientôt !",
    lien: `/mes-commandes`,
  })
}

export async function notifierNouveauMessage(userId: string, expediteurNom: string) {
  return creerNotification({
    userId,
    type: "NOUVEAU_MESSAGE",
    titre: "Nouveau message",
    message: `${expediteurNom} vous a envoyé un message`,
    lien: "/messagerie",
  })
}

export async function notifierPointsFidelite(userId: string, points: number, raison: string) {
  return creerNotification({
    userId,
    type: "FIDELITE_POINTS",
    titre: "Points fidélité ajoutés !",
    message: `+${points} points — ${raison}`,
    lien: "/fidelite",
  })
}

export async function notifierRecompenseFidelite(userId: string, recompense: string) {
  return creerNotification({
    userId,
    type: "FIDELITE_RECOMPENSE",
    titre: "Récompense débloquée !",
    message: `Vous avez débloqué : ${recompense}`,
    lien: "/fidelite",
  })
}

export async function notifierParrainage(userId: string, filleulPrenom: string) {
  return creerNotification({
    userId,
    type: "PARRAINAGE",
    titre: "Parrainage activé !",
    message: `${filleulPrenom} a utilisé votre code ! +200 points`,
    lien: "/parrainage",
  })
}
