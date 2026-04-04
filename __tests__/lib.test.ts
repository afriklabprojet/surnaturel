import { describe, it, expect, beforeEach, vi, afterEach } from "vitest"
import { prismaMock } from "./setup"

// ── Calendrier ────────────────────────────────────────────────────
const { genererLienGoogle, genererFichierICS, genererLienOutlook } = await import(
  "@/lib/calendrier"
)

const RDV_TEST = {
  id: "rdv_1",
  soin: "Hammam",
  date: new Date("2025-04-15T10:00:00Z"),
  duree: 60,
}

describe("Calendrier — genererLienGoogle", () => {
  beforeEach(() => vi.clearAllMocks())

  it("generates a valid Google Calendar link", async () => {
    const url = await genererLienGoogle(RDV_TEST)
    expect(url).toContain("https://calendar.google.com/calendar/render")
    expect(url).toContain("Hammam")
    expect(url).toContain("Surnaturel")
  })

  it("uses custom address when provided", async () => {
    const rdv = { ...RDV_TEST, adresse: "123 Custom Street" }
    const url = await genererLienGoogle(rdv)
    expect(url).toContain(encodeURIComponent("123 Custom Street"))
  })
})

describe("Calendrier — genererFichierICS", () => {
  beforeEach(() => vi.clearAllMocks())

  it("generates valid ICS content", async () => {
    const ics = await genererFichierICS(RDV_TEST)
    expect(ics).toContain("BEGIN:VCALENDAR")
    expect(ics).toContain("BEGIN:VEVENT")
    expect(ics).toContain("END:VCALENDAR")
    expect(ics).toContain("Hammam")
    expect(ics).toContain("rdv_1@")
  })

  it("uses fallback address when no adresse on rdv", async () => {
    const ics = await genererFichierICS(RDV_TEST)
    expect(ics).toContain("LOCATION:")
    expect(ics).toContain("Abidjan")
  })

  it("uses custom address when provided", async () => {
    const rdv = { ...RDV_TEST, adresse: "456 Rue Test" }
    const ics = await genererFichierICS(rdv)
    expect(ics).toContain("LOCATION:456 Rue Test")
  })
})

describe("Calendrier — genererLienOutlook", () => {
  beforeEach(() => vi.clearAllMocks())

  it("generates a valid Outlook calendar link", async () => {
    const url = await genererLienOutlook(RDV_TEST)
    expect(url).toContain("https://outlook.live.com/calendar/0/deeplink/compose")
    expect(url).toContain("Hammam")
  })

  it("uses custom address when provided", async () => {
    const rdv = { ...RDV_TEST, adresse: "789 Avenue Outlook" }
    const url = await genererLienOutlook(rdv)
    expect(url).toContain(encodeURIComponent("789 Avenue Outlook"))
  })
})

// ── Config ────────────────────────────────────────────────────────
const { getConfig } = await import("@/lib/config")

describe("Config — getConfig", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns defaults when DB has no rows", async () => {
    prismaMock.appConfig.findMany.mockResolvedValue([])
    const config = await getConfig()
    expect(config.nomCentre).toBe("Le Surnaturel de Dieu")
    expect(config.ville).toBe("Abidjan")
    expect(config.timezone).toBe("Africa/Abidjan")
  })

  it("merges DB values over defaults", async () => {
    prismaMock.appConfig.findMany.mockResolvedValue([
      { cle: "nom_centre", valeur: JSON.stringify("Mon Institut") },
      { cle: "ville_institut", valeur: JSON.stringify("Yamoussoukro") },
    ])
    const config = await getConfig()
    expect(config.nomCentre).toBe("Mon Institut")
    expect(config.ville).toBe("Yamoussoukro")
    // unset fields keep default
    expect(config.timezone).toBe("Africa/Abidjan")
  })

  it("ignores corrupted JSON values and keeps defaults", async () => {
    prismaMock.appConfig.findMany.mockResolvedValue([
      { cle: "nom_centre", valeur: "not valid json {{{" },
    ])
    const config = await getConfig()
    expect(config.nomCentre).toBe("Le Surnaturel de Dieu")
  })

  it("rebuilds derived fields (adresseFull, telephoneTel)", async () => {
    prismaMock.appConfig.findMany.mockResolvedValue([
      { cle: "adresse_institut", valeur: JSON.stringify("Cocody") },
      { cle: "ville_institut", valeur: JSON.stringify("Abidjan") },
      { cle: "pays_institut", valeur: JSON.stringify("CI") },
      { cle: "telephone_contact", valeur: JSON.stringify("+225 07 00 00 00") },
    ])
    const config = await getConfig()
    expect(config.adresseFull).toBe("Cocody — Abidjan, CI")
    expect(config.telephoneTel).toBe("+22507000000")
  })

  it("returns DEFAULTS when DB throws", async () => {
    prismaMock.appConfig.findMany.mockRejectedValue(new Error("DB down"))
    const config = await getConfig()
    expect(config.nomCentre).toBe("Le Surnaturel de Dieu")
  })

  it("ignores unknown keys from DB", async () => {
    prismaMock.appConfig.findMany.mockResolvedValue([
      { cle: "unknown_key_xyz", valeur: JSON.stringify("value") },
    ])
    const config = await getConfig()
    // Should not crash, returns defaults
    expect(config.nomCentre).toBe("Le Surnaturel de Dieu")
  })
})

// ── Rate Limit ────────────────────────────────────────────────────
// We test the memory limiter directly by importing the real module
// (setup.ts mocks createRateLimiter for route tests, but here we
// import the actual implementation).

describe("Rate Limit — createMemoryLimiter (in-memory fallback)", () => {
  it("allows requests under the limit", async () => {
    // Import the real module, bypassing the mock
    const mod = await vi.importActual<typeof import("@/lib/rate-limit")>("@/lib/rate-limit")
    const limiter = mod.createRateLimiter({ limit: 3, windowMs: 60_000 })

    const r1 = await Promise.resolve(limiter("test-key"))
    expect(r1.allowed).toBe(true)
    expect(r1.remaining).toBe(2)

    const r2 = await Promise.resolve(limiter("test-key"))
    expect(r2.allowed).toBe(true)
    expect(r2.remaining).toBe(1)

    const r3 = await Promise.resolve(limiter("test-key"))
    expect(r3.allowed).toBe(true)
    expect(r3.remaining).toBe(0)
  })

  it("blocks requests over the limit", async () => {
    const mod = await vi.importActual<typeof import("@/lib/rate-limit")>("@/lib/rate-limit")
    const limiter = mod.createRateLimiter({ limit: 1, windowMs: 60_000 })

    const r1 = await Promise.resolve(limiter("block-key"))
    expect(r1.allowed).toBe(true)

    const r2 = await Promise.resolve(limiter("block-key"))
    expect(r2.allowed).toBe(false)
    expect(r2.remaining).toBe(0)
    expect(r2.retryAfterSeconds).toBeGreaterThan(0)
  })

  it("tracks keys independently", async () => {
    const mod = await vi.importActual<typeof import("@/lib/rate-limit")>("@/lib/rate-limit")
    const limiter = mod.createRateLimiter({ limit: 1, windowMs: 60_000 })

    const r1 = await Promise.resolve(limiter("key-a"))
    expect(r1.allowed).toBe(true)

    const r2 = await Promise.resolve(limiter("key-b"))
    expect(r2.allowed).toBe(true) // different key, still allowed
  })

  it("runs periodic cleanup of expired entries", async () => {
    const mod = await vi.importActual<typeof import("@/lib/rate-limit")>("@/lib/rate-limit")
    const limiter = mod.createRateLimiter({ limit: 5, windowMs: 1_000 }) // 1s window

    // Add entries
    await Promise.resolve(limiter("cleanup-key"))
    await Promise.resolve(limiter("cleanup-key"))

    // Advance time past cleanup threshold (60s) and past window (1s)
    const realDateNow = Date.now
    let fakeNow = realDateNow()
    vi.spyOn(Date, "now").mockImplementation(() => fakeNow)

    fakeNow += 61_000 // 61 seconds later → triggers cleanup + all entries expired

    // Next call triggers cleanup
    const r = await Promise.resolve(limiter("cleanup-key"))
    expect(r.allowed).toBe(true)
    // Old entries should have been cleaned up, so remaining = limit - 1
    expect(r.remaining).toBe(4)

    vi.spyOn(Date, "now").mockRestore()
  })
})

// ── Rate Limit — Upstash Redis backend ─────────────────────────────
// To test the Upstash branch, we need to:
// 1. Set env vars before import
// 2. Use vi.doUnmock + vi.resetModules to force fresh evaluation
// 3. Mock global.fetch for the Redis REST API

describe("Rate Limit — createUpstashLimiter (Redis backend)", () => {
  const savedUrl = process.env.UPSTASH_REDIS_REST_URL
  const savedToken = process.env.UPSTASH_REDIS_REST_TOKEN
  const savedFetch = globalThis.fetch

  afterEach(() => {
    if (savedUrl) process.env.UPSTASH_REDIS_REST_URL = savedUrl
    else delete process.env.UPSTASH_REDIS_REST_URL
    if (savedToken) process.env.UPSTASH_REDIS_REST_TOKEN = savedToken
    else delete process.env.UPSTASH_REDIS_REST_TOKEN
    globalThis.fetch = savedFetch
    // Re-mock rate-limit for other tests
    vi.doMock("@/lib/rate-limit", () => ({
      createRateLimiter: () => (...args: unknown[]) => {
        const { mockRateLimitCheck } = require("./setup")
        return mockRateLimitCheck(...args)
      },
    }))
  })

  it("allows request when under limit via Upstash", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://mock-redis.upstash.io"
    process.env.UPSTASH_REDIS_REST_TOKEN = "mock-token"

    globalThis.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve([
        { result: 0 },  // ZREMRANGEBYSCORE
        { result: 1 },  // ZADD
        { result: 1 },  // ZCARD — count = 1 (under limit)
        { result: 1 },  // EXPIRE
      ]),
    }) as unknown as typeof fetch

    vi.doUnmock("@/lib/rate-limit")
    vi.resetModules()
    const mod = await import("@/lib/rate-limit")
    const limiter = mod.createRateLimiter({ limit: 10, windowMs: 60_000 })

    const result = await Promise.resolve(limiter("upstash-key"))
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(9)
    expect(result.retryAfterSeconds).toBe(0)
    expect(globalThis.fetch).toHaveBeenCalled()
  })

  it("blocks request when over limit via Upstash", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://mock-redis.upstash.io"
    process.env.UPSTASH_REDIS_REST_TOKEN = "mock-token"

    const now = Date.now()
    globalThis.fetch = vi.fn()
      // First call: pipeline
      .mockResolvedValueOnce({
        json: () => Promise.resolve([
          { result: 0 },
          { result: 1 },
          { result: 11 },  // ZCARD = 11 > limit of 10
          { result: 1 },
        ]),
      })
      // Second call: ZRANGE for oldest entry
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ result: [String(now - 30_000), String(now - 30_000)] }),
      }) as unknown as typeof fetch

    vi.doUnmock("@/lib/rate-limit")
    vi.resetModules()
    const mod = await import("@/lib/rate-limit")
    const limiter = mod.createRateLimiter({ limit: 10, windowMs: 60_000 })

    const result = await Promise.resolve(limiter("upstash-blocked"))
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.retryAfterSeconds).toBeGreaterThan(0)
  })
})
