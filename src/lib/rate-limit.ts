/**
 * Rate limiter compatible Edge Runtime (middleware Next.js).
 *
 * Si UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN sont définis,
 * utilise Upstash Redis (persistent across cold starts, compatible serverless).
 *
 * Sinon, fallback Map en mémoire — suffisant pour dev/staging.
 */

interface RateLimitConfig {
  /** Nombre max de requêtes autorisées dans la fenêtre */
  limit: number
  /** Durée de la fenêtre en millisecondes */
  windowMs: number
  /** Préfixe pour les clés Redis (éviter les collisions) */
  prefix?: string
}

interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  /** Secondes avant prochain essai (0 si autorisé) */
  retryAfterSeconds: number
}

// ── Upstash Redis rate limiter (serverless-friendly) ──────────────────

function createUpstashLimiter({ limit, windowMs, prefix = "rl" }: RateLimitConfig) {
  const baseUrl = process.env.UPSTASH_REDIS_REST_URL!
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!

  async function redisCommand(command: string[]): Promise<unknown> {
    const res = await fetch(`${baseUrl}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
    })
    const data = await res.json()
    return data.result
  }

  return async function check(key: string): Promise<RateLimitResult> {
    const redisKey = `${prefix}:${key}`
    const windowSeconds = Math.ceil(windowMs / 1000)
    const now = Date.now()

    // Sliding window: add current timestamp, remove expired, count
    const pipeline = [
      // Remove expired entries
      ["ZREMRANGEBYSCORE", redisKey, "0", String(now - windowMs)],
      // Add current request
      ["ZADD", redisKey, String(now), `${now}:${Math.random().toString(36).slice(2, 8)}`],
      // Count entries in window
      ["ZCARD", redisKey],
      // Set TTL on key
      ["EXPIRE", redisKey, String(windowSeconds + 1)],
    ]

    // Execute pipeline via Upstash REST
    const res = await fetch(`${baseUrl}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pipeline),
    })
    const results = await res.json()
    const count = results[2]?.result ?? 0

    if (count > limit) {
      // Get oldest entry in window for retry-after calculation
      const oldestRes = await redisCommand(["ZRANGE", redisKey, "0", "0", "WITHSCORES"])
      const oldestScore = Array.isArray(oldestRes) && oldestRes.length >= 2
        ? parseInt(String(oldestRes[1]), 10)
        : now
      const retryAfterMs = windowMs - (now - oldestScore)
      const retryAfterSeconds = Math.max(Math.ceil(retryAfterMs / 1000), 1)

      return { allowed: false, limit, remaining: 0, retryAfterSeconds }
    }

    return {
      allowed: true,
      limit,
      remaining: Math.max(limit - count, 0),
      retryAfterSeconds: 0,
    }
  }
}

// ── In-memory fallback (dev / staging without Redis) ──────────────────

function createMemoryLimiter({ limit, windowMs }: RateLimitConfig) {
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

// ── Factory — choisit automatiquement le bon backend ──────────────────

const useUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)

export function createRateLimiter(config: RateLimitConfig) {
  if (useUpstash) {
    const upstashCheck = createUpstashLimiter(config)
    // Middleware Edge Runtime needs sync signature — wrap async with fallback
    // For Edge: we return a function that returns a Promise or sync result
    return function check(key: string): RateLimitResult | Promise<RateLimitResult> {
      return upstashCheck(key)
    }
  }

  return createMemoryLimiter(config)
}
