import { NextResponse, type NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

const protectedRoutes = [
  "/profil",
  "/mes-rdv",
  "/commandes",
  "/communaute",
  "/suivi-medical",
  "/admin",
]

// SÉCURITÉ : /suivi-medical accessible uniquement à CLIENT et ACCOMPAGNATEUR_MEDICAL
// ADMIN explicitement exclu — données médicales confidentielles
const roleRestrictedRoutes: Record<string, string[]> = {
  "/suivi-medical": ["CLIENT", "ACCOMPAGNATEUR_MEDICAL"],
  "/admin": ["ADMIN"],
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // /admin/login accessible sans session
  if (pathname === "/admin/login") {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    // Si déjà connecté en ADMIN, rediriger vers le dashboard
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
    // Routes admin → rediriger vers /admin/login
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
        // Non-ADMIN tentant d'accéder à /admin → rediriger vers /admin/login
        if (route === "/admin") {
          const url = req.nextUrl.clone()
          url.pathname = "/admin/login"
          return NextResponse.redirect(url)
        }
        const url = req.nextUrl.clone()
        url.pathname = "/connexion"
        return NextResponse.redirect(url)
      }

      // Logger chaque accès à l'espace médical — SANS données médicales
      if (route === "/suivi-medical") {
        console.log(
          `[MEDICAL] userId:${token.id} route:${pathname} at:${new Date().toISOString()}`
        )
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/profil/:path*",
    "/mes-rdv/:path*",
    "/commandes/:path*",
    "/communaute/:path*",
    "/suivi-medical/:path*",
    "/admin/:path*",
  ],
}
