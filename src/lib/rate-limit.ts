/**
 * Rate limiter compatible Edge Runtime (middleware Next.js).
 * Utilise un Map en mémoire — adapté projet solo sans Redis.
 *
 * Sur Vercel Edge : le Map vit dans l'isolate V8, reset au cold start.
 * Suffisant pour bloquer le spam/brute-force sur un projet à trafic modéré.
 */

interface RateLimitConfig {
  /** Nombre max de requêtes autorisées dans la fenêtre */
  limit: number
  /** Durée de la fenêtre en millisecondes */
  windowMs: number
}

interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  /** Secondes avant prochain essai (0 si autorisé) */
  retryAfterSeconds: number
}

export function createRateLimiter({ limit, windowMs }: RateLimitConfig) {
  const store = new Map<string, number[]>()
  let lastCleanup = Date.now()

  function cleanup() {
    const now = Date.now()
    if (now - lastCleanup < 60_000) return
    lastCleanup = now

    for (const [key, timestamps] of store) {
      const valid = timestamps.filter((t) => now - t < windowMs)
      if (valid.length === 0) {
        store.delete(key)
      } else {
        store.set(key, valid)
      }
    }
  }

  return function check(key: string): RateLimitResult {
    cleanup()

    const now = Date.now()
    const timestamps = store.get(key) ?? []
    const valid = timestamps.filter((t) => now - t < windowMs)

    if (valid.length >= limit) {
      const oldestInWindow = valid[0]
      const retryAfterMs = windowMs - (now - oldestInWindow)
      const retryAfterSeconds = Math.ceil(retryAfterMs / 1000)

      store.set(key, valid)

      return { allowed: false, limit, remaining: 0, retryAfterSeconds }
    }

    valid.push(now)
    store.set(key, valid)

    return {
      allowed: true,
      limit,
      remaining: limit - valid.length,
      retryAfterSeconds: 0,
    }
  }
}
