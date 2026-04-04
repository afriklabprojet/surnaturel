import { NextResponse, type NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { createRateLimiter } from "@/lib/rate-limit"

/* ━━━━━━━━━━ Rate Limiters ━━━━━━━━━━ */

const authLimiter = createRateLimiter({ limit: 20, windowMs: 15 * 60 * 1000 })   // 20 req / 15 min
const contactLimiter = createRateLimiter({ limit: 3, windowMs: 60 * 60 * 1000 }) // 3 req / 1 h
const paiementLimiter = createRateLimiter({ limit: 10, windowMs: 60 * 60 * 1000 }) // 10 req / 1 h
const rdvLimiter = createRateLimiter({ limit: 10, windowMs: 60 * 60 * 1000 })     // 10 req / 1 h
const inscriptionLimiter = createRateLimiter({ limit: 5, windowMs: 60 * 60 * 1000 }) // 5 req / 1 h
const postsLimiter = createRateLimiter({ limit: 20, windowMs: 60 * 60 * 1000 })    // 20 req / 1 h
const searchLimiter = createRateLimiter({ limit: 30, windowMs: 60 * 1000 })        // 30 req / min

type Limiter = ReturnType<typeof createRateLimiter>

const rateLimitRules: { test: (p: string, m: string) => boolean; limiter: Limiter }[] = [
  { test: (p, m) => p.startsWith("/api/auth/") && m !== "GET",           limiter: authLimiter },
  { test: (p) => p === "/api/contact",                                    limiter: contactLimiter },
  { test: (p) => p.startsWith("/api/paiement/"),                          limiter: paiementLimiter },
  { test: (p, m) => p.startsWith("/api/rdv") && m === "POST",             limiter: rdvLimiter },
  { test: (p) => p === "/api/auth/inscription",                           limiter: inscriptionLimiter },
  { test: (p, m) => p === "/api/communaute/posts" && m === "POST",        limiter: postsLimiter },
  { test: (p) => p === "/api/search",                                     limiter: searchLimiter },
]

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  )
}

/* ━━━━━━━━━━ Auth / Routes protégées ━━━━━━━━━━ */

const protectedRoutes = [
  "/profil",
  "/mes-rdv",
  "/commandes",
  "/communaute",
  "/suivi-medical",
  "/admin",
  "/dashboard",
  "/favoris",
]

// SÉCURITÉ : /suivi-medical accessible à CLIENT, ACCOMPAGNATEUR_MEDICAL et ADMIN
const roleRestrictedRoutes: Record<string, string[]> = {
  "/suivi-medical": ["CLIENT", "ACCOMPAGNATEUR_MEDICAL", "ADMIN"],
  "/admin": ["ADMIN"],
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  /* ── Rate limiting (avant toute logique auth) ── */
  // Exempter les GET auth (session, csrf, providers) — ne limiter que les POST (tentatives de login)
  const isAuthGet = pathname.startsWith("/api/auth/") && req.method === "GET"
  const rule = isAuthGet ? undefined : rateLimitRules.find((r) => r.test(pathname, req.method))
  if (rule) {
    const ip = getClientIp(req)
    const result = await Promise.resolve(rule.limiter(ip))

    const headers = new Headers()
    headers.set("X-RateLimit-Limit", String(result.limit))
    headers.set("X-RateLimit-Remaining", String(result.remaining))

    if (!result.allowed) {
      headers.set("Retry-After", String(result.retryAfterSeconds))
      const minutes = Math.ceil(result.retryAfterSeconds / 60)
      return NextResponse.json(
        { error: `Trop de tentatives. Réessayez dans ${minutes} minute${minutes > 1 ? "s" : ""}.` },
        { status: 429, headers }
      )
    }

    // Autorisé → ajouter les headers informatifs à la réponse
    const response = NextResponse.next()
    response.headers.set("X-RateLimit-Limit", String(result.limit))
    response.headers.set("X-RateLimit-Remaining", String(result.remaining))
    return response
  }

  /* ── /connexion : rediriger si déjà connecté (GET uniquement, pas les Server Actions POST) ── */
  if (pathname === "/connexion" && req.method === "GET") {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (token) {
      const raw = req.nextUrl.searchParams.get("callbackUrl") ?? ""
      // Sécurité : n'accepter que les chemins internes (pas d'open redirect)
      const safe =
        raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/\\")
          ? raw
          : "/dashboard"
      const url = req.nextUrl.clone()
      url.pathname = safe
      url.search = ""
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  /* ── /admin/login accessible sans session ── */
  if (pathname === "/admin/login") {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (token && (token.role as string) === "ADMIN") {
      const url = req.nextUrl.clone()
      url.pathname = "/admin"
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  )

  if (!isProtected) {
    return NextResponse.next()
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  if (!token) {
    if (pathname.startsWith("/admin")) {
      const url = req.nextUrl.clone()
      url.pathname = "/admin/login"
      return NextResponse.redirect(url)
    }
    const url = req.nextUrl.clone()
    url.pathname = "/connexion"
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  // Check role restrictions
  for (const [route, allowedRoles] of Object.entries(roleRestrictedRoutes)) {
    if (pathname === route || pathname.startsWith(route + "/")) {
      const userRole = token.role as string
      if (!allowedRoles.includes(userRole)) {
        if (route === "/admin") {
          const url = req.nextUrl.clone()
          url.pathname = "/admin/login"
          return NextResponse.redirect(url)
        }
        const url = req.nextUrl.clone()
        url.pathname = "/dashboard"
        return NextResponse.redirect(url)
      }
    }
  }

  // ── Gate communauté : accès payant (gratuit pour ADMIN/SAGE_FEMME/ACCOMPAGNATEUR_MEDICAL) ──
  // Couvre les pages /communaute/* ET les routes API /api/messages/* (messenger inclus)
  const communauteExclus = ["/communaute/abonnement", "/communaute/essai"]
  const estPageCommunaute =
    (pathname === "/communaute" || pathname.startsWith("/communaute/")) &&
    !communauteExclus.some((p) => pathname === p || pathname.startsWith(p + "/"))
  const estApiMessages = pathname.startsWith("/api/messages/") || pathname === "/api/messages"

  if (estPageCommunaute || estApiMessages) {
    const role = token.role as string
    const rolesLibres = ["ADMIN", "SAGE_FEMME", "ACCOMPAGNATEUR_MEDICAL"]

    if (!rolesLibres.includes(role)) {
      const accesCommuaute = token.accesCommuaute as boolean | undefined
      const expireAt = token.accesCommuauteExpireAt as string | null | undefined
      const essaiUtilise = token.essaiCommuauteUtilise as boolean | undefined

      const accesToujoursValide =
        accesCommuaute && (!expireAt || new Date(expireAt) > new Date())

      if (!accesToujoursValide) {
        // Les routes API reçoivent un 403 JSON (pas une redirection HTML)
        if (estApiMessages) {
          return NextResponse.json(
            { error: "Abonnement communauté requis" },
            { status: 403 }
          )
        }
        const url = req.nextUrl.clone()
        if (!essaiUtilise) {
          // Premier accès → activer l'essai gratuit
          url.pathname = "/communaute/essai"
          url.searchParams.set("redirect", pathname)
        } else {
          // Essai épuisé / abonnement expiré → paywall
          url.pathname = "/communaute/abonnement"
        }
        return NextResponse.redirect(url)
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/connexion",
    "/admin/login",
    "/api/auth/:path*",
    "/api/contact",
    "/api/paiement/:path*",
    "/api/rdv/:path*",
    "/api/communaute/posts",
    "/api/messages/:path*",
    "/profil/:path*",
    "/mes-rdv/:path*",
    "/commandes/:path*",
    "/communaute/:path*",
    "/suivi-medical/:path*",
    "/admin/:path*",
    "/dashboard/:path*",
    "/favoris/:path*",
    "/fidelite/:path*",
    "/parrainage/:path*",
    "/avis/:path*",
    "/notifications/:path*",
  ],
}
