/**
 * Client Redis partagé (ioredis) — singleton compatible Next.js HMR
 *
 * Usage :
 *   import { redis } from "@/lib/redis"
 *   await redis.set("key", "value", "EX", 60)
 *   await redis.get("key")
 *
 * Requis : variable d'environnement REDIS_URL (redis://localhost:6379)
 * Sur Hostinger VPS, Redis est disponible via `redis-server` ou Valkey.
 * Si REDIS_URL est absent, toutes les opérations sont des no-ops (mode dégradé).
 */
import Redis from "ioredis"

declare global {
  // eslint-disable-next-line no-var
  var _redis: Redis | null | undefined
}

function createRedis(): Redis | null {
  const url = process.env.REDIS_URL
  if (!url) {
    // Pas de Redis configuré — mode dégradé silencieux
    return null
  }
  try {
    const client = new Redis(url, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: false,
      lazyConnect: true,
    })
    client.on("error", () => { /* silencieux — Redis optionnel */ })
    return client
  } catch {
    return null
  }
}

// Singleton — évite de créer N connexions en hot-reload Next.js
export const redis: Redis | null =
  globalThis._redis ?? (globalThis._redis = createRedis())

// ─── Helpers présence ──────────────────────────────────────────────────────

const PRESENCE_TTL = 65 // secondes — un peu plus que l'intervalle heartbeat (60s)

/** Marque un utilisateur comme en ligne (TTL 65s). */
export async function setPresence(userId: string): Promise<void> {
  if (!redis) return
  await redis.set(`presence:${userId}`, "1", "EX", PRESENCE_TTL)
}

/** Retourne true si l'utilisateur est en ligne (clé Redis encore vivante). */
export async function isOnline(userId: string): Promise<boolean> {
  if (!redis) return false
  return (await redis.exists(`presence:${userId}`)) === 1
}

/** Récupère la présence de plusieurs utilisateurs en un seul pipeline. */
export async function bulkIsOnline(userIds: string[]): Promise<Record<string, boolean>> {
  if (!redis || userIds.length === 0) return {}
  const pipeline = redis.pipeline()
  for (const id of userIds) pipeline.exists(`presence:${id}`)
  const results = await pipeline.exec()
  return Object.fromEntries(
    userIds.map((id, i) => [id, results?.[i]?.[1] === 1])
  )
}
