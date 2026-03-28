import { prisma } from "@/lib/prisma"
import { 
  envoyerPushNotification, 
  creerPayloadPush, 
  isPushConfigured,
  type PushType 
} from "@/lib/web-push"

// Envoyer une notification push à un utilisateur
// Cette fonction est appelée depuis les autres services (RDV, commandes, etc.)
export async function envoyerPushAUtilisateur(
  userId: string,
  type: PushType,
  data: Record<string, string>
): Promise<{ envoyes: number; erreurs: number }> {
  if (!isPushConfigured()) {
    return { envoyes: 0, erreurs: 0 }
  }

  // Récupérer toutes les subscriptions de l'utilisateur
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  })

  if (subscriptions.length === 0) {
    return { envoyes: 0, erreurs: 0 }
  }

  const payload = creerPayloadPush(type, data)
  let envoyes = 0
  let erreurs = 0

  for (const sub of subscriptions) {
    const success = await envoyerPushNotification(
      {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      },
      payload
    )

    if (success) {
      envoyes++
    } else {
      erreurs++
      // Si la subscription est expirée (410), la supprimer
      await prisma.pushSubscription.delete({
        where: { id: sub.id },
      }).catch(() => {})
    }
  }

  return { envoyes, erreurs }
}

// Envoyer une notification push à plusieurs utilisateurs
export async function envoyerPushAUtilisateurs(
  userIds: string[],
  type: PushType,
  data: Record<string, string>
): Promise<{ envoyes: number; erreurs: number }> {
  let totalEnvoyes = 0
  let totalErreurs = 0

  for (const userId of userIds) {
    const { envoyes, erreurs } = await envoyerPushAUtilisateur(userId, type, data)
    totalEnvoyes += envoyes
    totalErreurs += erreurs
  }

  return { envoyes: totalEnvoyes, erreurs: totalErreurs }
}

// Envoyer une notification push à tous les utilisateurs (pour les promos)
export async function envoyerPushATous(
  type: PushType,
  data: Record<string, string>
): Promise<{ envoyes: number; erreurs: number }> {
  if (!isPushConfigured()) {
    return { envoyes: 0, erreurs: 0 }
  }

  // Récupérer tous les userIds avec des subscriptions actives
  const users = await prisma.pushSubscription.findMany({
    select: { userId: true },
    distinct: ["userId"],
  })

  const userIds = users.map((u) => u.userId)
  return envoyerPushAUtilisateurs(userIds, type, data)
}
