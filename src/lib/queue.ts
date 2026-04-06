/**
 * BullMQ — File de jobs pour les opérations asynchrones critiques
 *
 * Queues :
 *   - "notifications" : création de notification DB + Pusher + Web Push
 *
 * Requis : REDIS_URL (même instance que src/lib/redis.ts)
 * Si Redis est absent → fallback synchrone inline (mode dégradé).
 *
 * Worker : démarré par src/worker.ts (processus PM2 dédié).
 */
import { Queue, Worker, Job } from "bullmq"
import IORedis from "ioredis"
import { prisma } from "@/lib/prisma"
import { getPusherServeur, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher"
import { envoyerPushNotification, isPushConfigured, type PushPayload } from "@/lib/web-push"
import type { NotifType } from "@/generated/prisma/client"

// ─── Connexion Redis ────────────────────────────────────────────────────────

function getRedisConnection(): IORedis | null {
  const url = process.env.REDIS_URL
  if (!url) return null
  try {
    return new IORedis(url, {
      maxRetriesPerRequest: null, // requis par BullMQ
      enableReadyCheck: false,
      tls: url.startsWith("rediss://") ? {} : undefined, // Upstash TLS
    })
  } catch {
    return null
  }
}

const redisConn = getRedisConnection()

// ─── Types des jobs ─────────────────────────────────────────────────────────

export interface NotificationJobData {
  userId: string
  type: NotifType
  titre: string
  message: string
  lien?: string
  sourceId?: string
}

// ─── Queue (côté producteur — Next.js app) ──────────────────────────────────

let _notifQueue: Queue<NotificationJobData> | null = null

export function getNotifQueue(): Queue<NotificationJobData> | null {
  if (!redisConn) return null
  if (!_notifQueue) {
    _notifQueue = new Queue<NotificationJobData>("notifications", {
      connection: redisConn,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      },
    })
  }
  return _notifQueue
}

/**
 * Enfile une notification.
 * Retourne true si mis en queue, false si envoi synchrone (pas de Redis).
 */
export async function enfileNotification(data: NotificationJobData): Promise<boolean> {
  const queue = getNotifQueue()
  if (!queue) return false
  await queue.add("send", data, { priority: 1 })
  return true
}

// ─── Worker (côté consommateur — src/worker.ts) ─────────────────────────────

export function startNotifWorker(): Worker<NotificationJobData> {
  if (!redisConn) throw new Error("Redis non configuré — worker BullMQ impossible")

  return new Worker<NotificationJobData>(
    "notifications",
    async (job: Job<NotificationJobData>) => {
      const { userId, type, titre, message, lien, sourceId } = job.data

      // 1. Vérifier la préférence utilisateur avant de créer
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
      }
      const prefField = PREF_MAP[type]
      if (prefField) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { [prefField]: true, pushSubscriptions: true },
        }) as Record<string, boolean | unknown[]> | null
        if (user && user[prefField] === false) return
      }

      // 2. Upsert notification (déduplication A9)
      const notifData = { userId, type, titre, message, lien, sourceId }
      const notif = sourceId
        ? await prisma.notification.upsert({
            where: { notif_dedup: { userId, type, sourceId } },
            create: { ...notifData, compteur: 1 },
            update: { compteur: { increment: 1 }, message, lu: false },
          })
        : await prisma.notification.create({ data: notifData })

      // 3. Pusher temps réel
      try {
        await getPusherServeur().trigger(
          PUSHER_CHANNELS.notification(userId),
          PUSHER_EVENTS.NOUVELLE_NOTIFICATION,
          notif
        )
      } catch { /* non critique */ }

      // 4. Web Push
      if (isPushConfigured()) {
        const userWithSubs = await prisma.user.findUnique({
          where: { id: userId },
          select: { pushSubscriptions: true },
        })
        if (userWithSubs?.pushSubscriptions?.length) {
          const payload: PushPayload = { title: titre, body: message, url: lien ?? "/", tag: `notif-${type}` }
          for (const sub of userWithSubs.pushSubscriptions) {
            await envoyerPushNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload
            ).catch(() => {})
          }
        }
      }
    },
    {
      connection: redisConn,
      concurrency: 5,
    }
  )
}
