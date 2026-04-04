import { describe, it, expect, vi } from "vitest"

// Use real rate-limit implementation for these tests
vi.unmock("@/lib/rate-limit")

// Test utility functions and validation logic used across the app
describe("Utility functions", () => {
  describe("formatPrix", () => {
    it("formats numbers with thousand separators", async () => {
      const { formatPrix } = await import("../src/lib/utils")
      expect(formatPrix(15000)).toContain("15")
      expect(formatPrix(0)).toBeDefined()
    })

    it("handles edge cases", async () => {
      const { formatPrix } = await import("../src/lib/utils")
      expect(formatPrix(0)).toBeDefined()
      expect(formatPrix(999999)).toBeDefined()
    })
  })

  describe("cn utility", () => {
    it("merges class names", async () => {
      const { cn } = await import("../src/lib/utils")
      const result = cn("px-4", "py-2", undefined, "text-sm")
      expect(result).toContain("px-4")
      expect(result).toContain("py-2")
      expect(result).toContain("text-sm")
    })
  })
})

describe("i18n dictionaries", () => {
  it("fr.json has all required keys", async () => {
    const fr = await import("../src/lib/i18n/fr.json")
    expect(fr.nav).toBeDefined()
    expect(fr.nav.soins).toBeDefined()
    expect(fr.nav.connexion).toBeDefined()
    expect(fr.nav.prendreRdv).toBeDefined()
    expect(fr.hero).toBeDefined()
    expect(fr.footer).toBeDefined()
    expect(fr.common).toBeDefined()
    expect(fr.contact).toBeDefined()
    expect(fr.auth).toBeDefined()
  })

  it("en.json has all the same keys as fr.json", async () => {
    const fr = await import("../src/lib/i18n/fr.json")
    const en = await import("../src/lib/i18n/en.json")

    // Check all top-level keys match
    const frKeys = Object.keys(fr).filter((k) => k !== "default")
    const enKeys = Object.keys(en).filter((k) => k !== "default")
    expect(enKeys.sort()).toEqual(frKeys.sort())

    // Check nested keys match for nav
    expect(Object.keys(en.nav).sort()).toEqual(Object.keys(fr.nav).sort())
    expect(Object.keys(en.footer).sort()).toEqual(Object.keys(fr.footer).sort())
    expect(Object.keys(en.common).sort()).toEqual(Object.keys(fr.common).sort())
  })

  it("en.json values are in English", async () => {
    const en = await import("../src/lib/i18n/en.json")
    expect(en.nav.connexion).toBe("Sign In")
    expect(en.nav.prendreRdv).toBe("Book Now")
    expect(en.hero.title).toContain("wellness")
  })
})

describe("calendrier", () => {
  it("exports functions", async () => {
    const mod = await import("../src/lib/calendrier")
    expect(typeof mod).toBe("object")
  })
})

describe("fidelite", () => {
  it("exports fidelite logic", async () => {
    const mod = await import("../src/lib/fidelite")
    expect(typeof mod).toBe("object")
  })
})

describe("rate-limit", () => {
  it("allows requests under the limit", async () => {
    const { createRateLimiter } = await import("../src/lib/rate-limit")
    const limiter = createRateLimiter({ limit: 3, windowMs: 60_000 })

    const r1 = await Promise.resolve(limiter("ip-test"))
    expect(r1.allowed).toBe(true)
    expect(r1.remaining).toBe(2)

    const r2 = await Promise.resolve(limiter("ip-test"))
    expect(r2.allowed).toBe(true)
    expect(r2.remaining).toBe(1)

    const r3 = await Promise.resolve(limiter("ip-test"))
    expect(r3.allowed).toBe(true)
    expect(r3.remaining).toBe(0)
  })

  it("blocks requests over the limit", async () => {
    const { createRateLimiter } = await import("../src/lib/rate-limit")
    const limiter = createRateLimiter({ limit: 2, windowMs: 60_000 })

    await Promise.resolve(limiter("ip-block"))
    await Promise.resolve(limiter("ip-block"))

    const r3 = await Promise.resolve(limiter("ip-block"))
    expect(r3.allowed).toBe(false)
    expect(r3.remaining).toBe(0)
    expect(r3.retryAfterSeconds).toBeGreaterThan(0)
  })

  it("isolates different keys", async () => {
    const { createRateLimiter } = await import("../src/lib/rate-limit")
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 })

    await Promise.resolve(limiter("ip-a"))
    const ra = await Promise.resolve(limiter("ip-a"))
    expect(ra.allowed).toBe(false)

    const rb = await Promise.resolve(limiter("ip-b"))
    expect(rb.allowed).toBe(true)
  })

  it("resets after window expires", async () => {
    const { createRateLimiter } = await import("../src/lib/rate-limit")
    const limiter = createRateLimiter({ limit: 1, windowMs: 50 }) // 50ms window

    await Promise.resolve(limiter("ip-expire"))
    const blocked = await Promise.resolve(limiter("ip-expire"))
    expect(blocked.allowed).toBe(false)

    await new Promise((r) => setTimeout(r, 60))

    const after = await Promise.resolve(limiter("ip-expire"))
    expect(after.allowed).toBe(true)
  })

  it("cleanup retains valid entries while removing expired ones", async () => {
    // Use fake timers to control cleanup timing
    vi.useFakeTimers()
    try {
      const { createRateLimiter } = await import("../src/lib/rate-limit")
      // 2 min window — allows entries to survive across 61s advance
      const limiter = createRateLimiter({ limit: 10, windowMs: 120_000 })

      // Add initial requests for two keys
      await Promise.resolve(limiter("ip-cleanup-a"))
      await Promise.resolve(limiter("ip-cleanup-b"))

      // Advance past the 60s cleanup threshold
      vi.advanceTimersByTime(61_000)

      // This call triggers cleanup — both keys have timestamps within 120s window
      // so the else branch (store.set(key, valid)) is taken
      const result = await Promise.resolve(limiter("ip-cleanup-a"))
      expect(result.allowed).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })

  it("upstash limiter allows request under limit", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://fake-redis.upstash.io"
    process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token"
    const originalFetch = globalThis.fetch
    try {
      vi.resetModules()
      const mockFetch = vi.fn()
      globalThis.fetch = mockFetch
      // Pipeline response: [ZREMRANGEBYSCORE, ZADD, ZCARD, EXPIRE]
      mockFetch.mockResolvedValueOnce({
        json: async () => [{}, {}, { result: 2 }, {}],
      })
      const { createRateLimiter } = await import("../src/lib/rate-limit")
      const limiter = createRateLimiter({ limit: 5, windowMs: 60_000 })
      const result = await limiter("test-upstash-key")
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(3) // 5 - 2
    } finally {
      delete process.env.UPSTASH_REDIS_REST_URL
      delete process.env.UPSTASH_REDIS_REST_TOKEN
      globalThis.fetch = originalFetch
    }
  })

  it("upstash limiter blocks request over limit with ZRANGE data", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://fake-redis.upstash.io"
    process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token"
    const originalFetch = globalThis.fetch
    try {
      vi.resetModules()
      const mockFetch = vi.fn()
      globalThis.fetch = mockFetch
      // Pipeline: count = 6 (over limit of 5)
      mockFetch.mockResolvedValueOnce({
        json: async () => [{}, {}, { result: 6 }, {}],
      })
      // redisCommand for ZRANGE oldest entry
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ result: [`${Date.now() - 30000}:abc`, String(Date.now() - 30000)] }),
      })
      const { createRateLimiter } = await import("../src/lib/rate-limit")
      const limiter = createRateLimiter({ limit: 5, windowMs: 60_000 })
      const result = await limiter("test-upstash-blocked")
      expect(result.allowed).toBe(false)
      expect(result.retryAfterSeconds).toBeGreaterThan(0)
    } finally {
      delete process.env.UPSTASH_REDIS_REST_URL
      delete process.env.UPSTASH_REDIS_REST_TOKEN
      globalThis.fetch = originalFetch
    }
  })

  it("upstash limiter handles missing pipeline result (count ?? 0)", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://fake-redis.upstash.io"
    process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token"
    const originalFetch = globalThis.fetch
    try {
      vi.resetModules()
      const mockFetch = vi.fn()
      globalThis.fetch = mockFetch
      // Pipeline returns incomplete results (missing ZCARD)
      mockFetch.mockResolvedValueOnce({
        json: async () => [{}, {}],
      })
      const { createRateLimiter } = await import("../src/lib/rate-limit")
      const limiter = createRateLimiter({ limit: 5, windowMs: 60_000 })
      const result = await limiter("test-missing-count")
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(5) // 5 - 0
    } finally {
      delete process.env.UPSTASH_REDIS_REST_URL
      delete process.env.UPSTASH_REDIS_REST_TOKEN
      globalThis.fetch = originalFetch
    }
  })

  it("upstash limiter falls back to now when ZRANGE returns empty", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://fake-redis.upstash.io"
    process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token"
    const originalFetch = globalThis.fetch
    try {
      vi.resetModules()
      const mockFetch = vi.fn()
      globalThis.fetch = mockFetch
      // count = 10 (over limit)
      mockFetch.mockResolvedValueOnce({
        json: async () => [{}, {}, { result: 10 }, {}],
      })
      // ZRANGE returns empty array (no oldest entry)
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ result: [] }),
      })
      const { createRateLimiter } = await import("../src/lib/rate-limit")
      const limiter = createRateLimiter({ limit: 5, windowMs: 60_000 })
      const result = await limiter("test-empty-zrange")
      expect(result.allowed).toBe(false)
      expect(result.retryAfterSeconds).toBeGreaterThanOrEqual(1) // Math.max(..., 1)
    } finally {
      delete process.env.UPSTASH_REDIS_REST_URL
      delete process.env.UPSTASH_REDIS_REST_TOKEN
      globalThis.fetch = originalFetch
    }
  })
})
