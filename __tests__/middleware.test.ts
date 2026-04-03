import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock next-auth/jwt
const mockGetToken = vi.fn()
vi.mock("next-auth/jwt", () => ({
  getToken: (...args: unknown[]) => mockGetToken(...args),
}))

// Mock rate limiter to always allow
vi.mock("@/lib/rate-limit", () => ({
  createRateLimiter: () => () => ({
    allowed: true,
    limit: 100,
    remaining: 99,
    retryAfterSeconds: 0,
  }),
}))

const { middleware, config } = await import("@/middleware")

function createRequest(pathname: string, method = "GET") {
  const url = new URL(pathname, "http://localhost:3000")
  // Next.js NextURL has a clone() method — mock it
  ;(url as any).clone = () => new URL(url.toString())
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
