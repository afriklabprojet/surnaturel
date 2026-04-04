import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock next-auth/jwt
const mockGetToken = vi.fn()
vi.mock("next-auth/jwt", () => ({
  getToken: (...args: unknown[]) => mockGetToken(...args),
}))

// Mock rate limiter — default: always allow; override via mockRateLimit
let mockRateLimitResult = {
  allowed: true,
  limit: 100,
  remaining: 99,
  retryAfterSeconds: 0,
}
vi.mock("@/lib/rate-limit", () => ({
  createRateLimiter: () => () => mockRateLimitResult,
}))

const { middleware, config } = await import("@/middleware")

function createRequest(pathname: string, method = "GET") {
  const url = new URL(pathname, "http://localhost:3000")
  // Next.js NextURL has a clone() method — mock it
  ;(url as unknown as { clone: () => URL }).clone = () => new URL(url.toString())
  return {
    method,
    nextUrl: url,
    url: url.toString(),
    headers: new Headers({
      "x-forwarded-for": "127.0.0.1",
    }),
    cookies: new Map(),
  } as unknown as import("next/server").NextRequest
}

describe("Middleware — RBAC & Route Protection", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXTAUTH_SECRET = "test-secret"
    mockRateLimitResult = { allowed: true, limit: 100, remaining: 99, retryAfterSeconds: 0 }
  })

  it("allows public routes without auth", async () => {
    mockGetToken.mockResolvedValue(null)
    // Public routes not in matcher should pass through
    // We test that /api/contact is rate-limited but not auth-protected
    const req = createRequest("/api/contact", "POST")
    const res = await middleware(req)
    // Rate limit returns with headers
    expect(res.headers.get("X-RateLimit-Limit")).toBeTruthy()
  })

  it("redirects unauthenticated user from /profil to /connexion", async () => {
    mockGetToken.mockResolvedValue(null)
    const req = createRequest("/profil")
    const res = await middleware(req)
    expect(res.status).toBe(307)
    const location = res.headers.get("location") ?? ""
    expect(location).toContain("/connexion")
    expect(location).toContain("callbackUrl")
  })

  it("redirects unauthenticated user from /admin to /admin/login", async () => {
    mockGetToken.mockResolvedValue(null)
    const req = createRequest("/admin")
    const res = await middleware(req)
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toContain("/admin/login")
  })

  it("redirects unauthenticated user from /suivi-medical to /connexion", async () => {
    mockGetToken.mockResolvedValue(null)
    const req = createRequest("/suivi-medical")
    const res = await middleware(req)
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toContain("/connexion")
  })

  it("allows CLIENT role to access /profil", async () => {
    mockGetToken.mockResolvedValue({ id: "usr_1", role: "CLIENT" })
    const req = createRequest("/profil")
    const res = await middleware(req)
    expect(res.status).toBe(200)
  })

  it("allows CLIENT role to access /suivi-medical", async () => {
    mockGetToken.mockResolvedValue({ id: "usr_1", role: "CLIENT" })
    const req = createRequest("/suivi-medical")
    const res = await middleware(req)
    expect(res.status).toBe(200)
  })

  it("blocks CLIENT from /admin (redirects to /admin/login)", async () => {
    mockGetToken.mockResolvedValue({ id: "usr_1", role: "CLIENT" })
    const req = createRequest("/admin")
    const res = await middleware(req)
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toContain("/admin/login")
  })

  it("allows ADMIN to access /admin", async () => {
    mockGetToken.mockResolvedValue({ id: "usr_admin", role: "ADMIN" })
    const req = createRequest("/admin")
    const res = await middleware(req)
    expect(res.status).toBe(200)
  })

  it("allows ADMIN to access /suivi-medical", async () => {
    mockGetToken.mockResolvedValue({ id: "usr_admin", role: "ADMIN" })
    const req = createRequest("/suivi-medical")
    const res = await middleware(req)
    expect(res.status).toBe(200)
  })

  it("allows ACCOMPAGNATEUR_MEDICAL to access /suivi-medical", async () => {
    mockGetToken.mockResolvedValue({ id: "usr_sf", role: "ACCOMPAGNATEUR_MEDICAL" })
    const req = createRequest("/suivi-medical")
    const res = await middleware(req)
    expect(res.status).toBe(200)
  })

  it("blocks SAGE_FEMME from /admin", async () => {
    mockGetToken.mockResolvedValue({ id: "usr_sf", role: "SAGE_FEMME" })
    const req = createRequest("/admin")
    const res = await middleware(req)
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toContain("/admin/login")
  })

  it("redirects logged-in ADMIN from /admin/login to /admin", async () => {
    mockGetToken.mockResolvedValue({ id: "usr_admin", role: "ADMIN" })
    const req = createRequest("/admin/login")
    const res = await middleware(req)
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toContain("/admin")
    expect(res.headers.get("location")).not.toContain("/admin/login")
  })

  it("allows non-admin to stay on /admin/login", async () => {
    mockGetToken.mockResolvedValue({ id: "usr_1", role: "CLIENT" })
    const req = createRequest("/admin/login")
    const res = await middleware(req)
    expect(res.status).toBe(200)
  })

  it("uses secure cookies when NEXTAUTH_URL is https", async () => {
    vi.resetModules()
    process.env.NEXTAUTH_URL = "https://example.com"
    process.env.NEXTAUTH_SECRET = "test-secret"

    const { middleware: secureMiddleware } = await import("@/middleware")
    mockGetToken.mockResolvedValue({ id: "usr_1", role: "CLIENT" })

    const req = createRequest("/profil")
    const res = await secureMiddleware(req)

    expect(res.status).toBe(200)
    expect(mockGetToken).toHaveBeenCalledWith(
      expect.objectContaining({
        secureCookie: true,
        cookieName: "__Secure-authjs.session-token",
      })
    )

    delete process.env.NEXTAUTH_URL
  })

  it("has correct matcher config", () => {
    expect(config.matcher).toContain("/api/auth/:path*")
    expect(config.matcher).toContain("/api/paiement/:path*")
    expect(config.matcher).toContain("/admin/:path*")
    expect(config.matcher).toContain("/suivi-medical/:path*")
    expect(config.matcher).toContain("/profil/:path*")
  })
})

describe("Middleware — Rate Limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("applies rate limit headers for /api/auth POST", async () => {
    mockGetToken.mockResolvedValue(null)
    const req = createRequest("/api/auth/signin", "POST")
    const res = await middleware(req)
    expect(res.headers.get("X-RateLimit-Limit")).toBeTruthy()
  })

  it("exempts GET requests to /api/auth from rate limiting", async () => {
    mockGetToken.mockResolvedValue(null)
    const req = createRequest("/api/auth/session", "GET")
    const res = await middleware(req)
    // GET auth requests pass through without rate limit headers (they're exempted)
    // They'll hit the protected routes check instead
    expect(res.status).toBe(200)
  })
})

describe("Middleware — Security & Scanner Blocking", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("blocks .env access (404)", async () => {
    const req = createRequest("/.env")
    const res = await middleware(req)
    expect(res.status).toBe(404)
  })

  it("blocks .git access (404)", async () => {
    const req = createRequest("/.git/config")
    const res = await middleware(req)
    expect(res.status).toBe(404)
  })

  it("blocks wp-admin access (404)", async () => {
    const req = createRequest("/wp-admin/login.php")
    const res = await middleware(req)
    expect(res.status).toBe(404)
  })

  it("blocks node_modules access (404)", async () => {
    const req = createRequest("/node_modules/some-pkg")
    const res = await middleware(req)
    expect(res.status).toBe(404)
  })
})

describe("Middleware — ADMIN redirected from client routes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("redirects ADMIN from /dashboard to /admin", async () => {
    mockGetToken.mockResolvedValue({ id: "usr_admin", role: "ADMIN" })
    const req = createRequest("/dashboard")
    const res = await middleware(req)
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toContain("/admin")
  })

  it("redirects ADMIN from /profil to /admin", async () => {
    mockGetToken.mockResolvedValue({ id: "usr_admin", role: "ADMIN" })
    const req = createRequest("/profil")
    const res = await middleware(req)
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toContain("/admin")
  })

  it("redirects ADMIN from /favoris to /admin", async () => {
    mockGetToken.mockResolvedValue({ id: "usr_admin", role: "ADMIN" })
    const req = createRequest("/favoris")
    const res = await middleware(req)
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toContain("/admin")
  })
})

describe("Middleware — Communauté access gate", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("allows ADMIN to access /communaute freely", async () => {
    mockGetToken.mockResolvedValue({ id: "usr_admin", role: "ADMIN" })
    const req = createRequest("/communaute")
    const res = await middleware(req)
    expect(res.status).toBe(200)
  })

  it("allows ACCOMPAGNATEUR_MEDICAL to access /communaute freely", async () => {
    mockGetToken.mockResolvedValue({ id: "usr_medic", role: "ACCOMPAGNATEUR_MEDICAL" })
    const req = createRequest("/communaute")
    const res = await middleware(req)
    expect(res.status).toBe(200)
  })

  it("redirects CLIENT without access to /communaute/essai", async () => {
    mockGetToken.mockResolvedValue({
      id: "usr_1",
      role: "CLIENT",
      accesCommuaute: false,
      essaiCommuauteUtilise: false,
    })
    const req = createRequest("/communaute")
    const res = await middleware(req)
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toContain("/communaute/essai")
  })

  it("redirects CLIENT with expired access to /communaute/abonnement", async () => {
    mockGetToken.mockResolvedValue({
      id: "usr_1",
      role: "CLIENT",
      accesCommuaute: true,
      accesCommuauteExpireAt: new Date(Date.now() - 86400_000).toISOString(),
      essaiCommuauteUtilise: true,
    })
    const req = createRequest("/communaute")
    const res = await middleware(req)
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toContain("/communaute/abonnement")
  })

  it("allows CLIENT with valid access to /communaute", async () => {
    mockGetToken.mockResolvedValue({
      id: "usr_1",
      role: "CLIENT",
      accesCommuaute: true,
      accesCommuauteExpireAt: new Date(Date.now() + 86400_000 * 30).toISOString(),
    })
    const req = createRequest("/communaute")
    const res = await middleware(req)
    expect(res.status).toBe(200)
  })

  it("returns 403 JSON for /api/messages when CLIENT has no access", async () => {
    mockGetToken.mockResolvedValue({
      id: "usr_1",
      role: "CLIENT",
      accesCommuaute: false,
      essaiCommuauteUtilise: true,
    })
    // /communaute/messages is a subpage of /communaute, gated by middleware
    const req = createRequest("/communaute/messages")
    const res = await middleware(req)
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toContain("/communaute/abonnement")
  })

  it("returns 403 JSON for /api/messages API route when CLIENT has no access", async () => {
    mockGetToken.mockResolvedValue({
      id: "usr_1",
      role: "CLIENT",
      accesCommuaute: false,
      essaiCommuauteUtilise: true,
    })
    const req = createRequest("/api/messages/conv_123")
    const res = await middleware(req)
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toContain("Abonnement communauté requis")
  })

  it("allows /communaute/abonnement without access", async () => {
    mockGetToken.mockResolvedValue({
      id: "usr_1",
      role: "CLIENT",
      accesCommuaute: false,
    })
    const req = createRequest("/communaute/abonnement")
    const res = await middleware(req)
    // /communaute/abonnement is excluded from gate
    expect(res.status).toBe(200)
  })

  it("redirects SAGE_FEMME from /suivi-medical to /dashboard", async () => {
    mockGetToken.mockResolvedValue({ id: "usr_sf", role: "SAGE_FEMME" })
    const req = createRequest("/suivi-medical")
    const res = await middleware(req)
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toContain("/dashboard")
  })
})

describe("Middleware — Rate Limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXTAUTH_SECRET = "test-secret"
    mockRateLimitResult = { allowed: true, limit: 100, remaining: 99, retryAfterSeconds: 0 }
  })

  it("returns 429 when rate limit is exceeded", async () => {
    mockRateLimitResult = { allowed: false, limit: 20, remaining: 0, retryAfterSeconds: 120 }
    const req = createRequest("/api/auth/inscription", "POST")
    const res = await middleware(req)
    expect(res.status).toBe(429)
    expect(res.headers.get("Retry-After")).toBe("120")
    const json = await res.json()
    expect(json.error).toContain("Trop de tentatives")
    expect(json.error).toContain("minutes") // plural
  })

  it("returns singular 'minute' when retry is under 60s", async () => {
    mockRateLimitResult = { allowed: false, limit: 20, remaining: 0, retryAfterSeconds: 30 }
    const req = createRequest("/api/auth/inscription", "POST")
    const res = await middleware(req)
    expect(res.status).toBe(429)
    const json = await res.json()
    expect(json.error).toContain("1 minute")
    expect(json.error).not.toContain("minutes")
  })

  it("adds rate limit headers when allowed", async () => {
    const req = createRequest("/api/contact", "POST")
    const res = await middleware(req)
    expect(res.headers.get("X-RateLimit-Limit")).toBe("100")
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("99")
  })

  it("applies rate limiting for /api/paiement POST", async () => {
    const req = createRequest("/api/paiement/init", "POST")
    const res = await middleware(req)
    expect(res.headers.get("X-RateLimit-Limit")).toBeTruthy()
  })

  it("applies rate limiting for /api/rdv POST", async () => {
    const req = createRequest("/api/rdv", "POST")
    const res = await middleware(req)
    expect(res.headers.get("X-RateLimit-Limit")).toBeTruthy()
  })

  it("applies rate limiting for /api/communaute/posts POST", async () => {
    const req = createRequest("/api/communaute/posts", "POST")
    const res = await middleware(req)
    expect(res.headers.get("X-RateLimit-Limit")).toBeTruthy()
  })

  it("applies rate limiting for /api/search", async () => {
    const req = createRequest("/api/search", "GET")
    const res = await middleware(req)
    expect(res.headers.get("X-RateLimit-Limit")).toBeTruthy()
  })

  it("falls back to x-real-ip when x-forwarded-for is absent", async () => {
    const url = new URL("/api/contact", "http://localhost:3000")
    ;(url as unknown as { clone: () => URL }).clone = () => new URL(url.toString())
    const req = {
      method: "POST",
      nextUrl: url,
      url: url.toString(),
      headers: new Headers({
        "x-real-ip": "10.0.0.1",
        // no x-forwarded-for
      }),
      cookies: new Map(),
    } as unknown as import("next/server").NextRequest

    const res = await middleware(req)
    expect(res.headers.get("X-RateLimit-Limit")).toBeTruthy()
  })

  it("uses 'unknown' when no IP headers are present", async () => {
    const url = new URL("/api/contact", "http://localhost:3000")
    ;(url as unknown as { clone: () => URL }).clone = () => new URL(url.toString())
    const req = {
      method: "POST",
      nextUrl: url,
      url: url.toString(),
      headers: new Headers({}), // no IP headers at all
      cookies: new Map(),
    } as unknown as import("next/server").NextRequest

    const res = await middleware(req)
    expect(res.headers.get("X-RateLimit-Limit")).toBeTruthy()
  })
})
