import NextAuth, { CredentialsSignin } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import type { Role } from "@/generated/prisma/client"

/* ━━━━━━━━━━ Cookie Configuration ━━━━━━━━━━ */
// Déterminer une seule fois si on est en HTTPS (production)
const useSecureCookies =
  process.env.NEXTAUTH_URL?.startsWith("https://") ||
  process.env.AUTH_URL?.startsWith("https://") ||
  false

const cookiePrefix = useSecureCookies ? "__Secure-" : ""

/** Nom exact du cookie de session — exporté pour le middleware */
export const SESSION_COOKIE_NAME = `${cookiePrefix}authjs.session-token`

class EmailNonVerifieError extends CredentialsSignin {
  code = "EMAIL_NON_VERIFIE"
}

// Error for 2FA required - includes userId for verification flow
class TwoFARequiredError extends CredentialsSignin {
  code = "2FA_REQUIRED"
  userId: string
  constructor(userId: string) {
    super()
    this.userId = userId
    // Store userId in the message for parsing in the client
    this.message = `2FA_REQUIRED:${userId}`
  }
}

// Verify and consume 2FA bypass token
async function verifyBypassToken(userId: string, bypassToken: string): Promise<boolean> {
  const hashedToken = crypto.createHash("sha256").update(bypassToken).digest("hex")
  
  // Find and delete the bypass token
  const session = await prisma.authSession.findFirst({
    where: {
      userId,
      tokenHash: `2fa_bypass:${hashedToken}`,
      expiresAt: { gt: new Date() },
      revokedAt: null,
    },
  })

  if (session) {
    // Delete the token (one-time use)
    await prisma.authSession.delete({ where: { id: session.id } })
    return true
  }

  return false
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      nom: string
      prenom: string
      role: Role
      photoUrl?: string | null
      accesCommuaute: boolean
      accesCommuauteExpireAt?: string | null
      essaiCommuauteUtilise: boolean
    }
    jti?: string
  }

  interface User {
    id: string
    email: string
    nom: string
    prenom: string
    role: Role
    photoUrl?: string | null
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "Identifiants",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
        bypassToken: { label: "2FA Bypass Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user) {
          return null
        }

        if (!user.passwordHash) {
          return null
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )
        if (!isValid) {
          return null
        }

        // Bloquer la connexion si email non vérifié
        if (!user.emailVerifie) {
          throw new EmailNonVerifieError()
        }

        // Check if 2FA is enabled
        if (user.totpEnabled) {
          // Check if bypass token is provided and valid
          const bypassToken = credentials.bypassToken as string | undefined
          if (bypassToken) {
            const isValidBypass = await verifyBypassToken(user.id, bypassToken)
            if (!isValidBypass) {
              throw new TwoFARequiredError(user.id)
            }
            // Bypass token is valid, continue login
          } else {
            // No bypass token, redirect to 2FA verification
            throw new TwoFARequiredError(user.id)
          }
        }

        return {
          id: user.id,
          email: user.email,
          nom: user.nom,
          prenom: user.prenom,
          role: user.role,
          photoUrl: user.photoUrl,
        }
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // URLs relatives → préfixer avec baseUrl
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // URLs absolues sur le même domaine → autoriser
      try {
        const urlObj = new URL(url)
        if (urlObj.origin === baseUrl) return url
      } catch {
        // URL invalide → fallback
      }
      return `${baseUrl}/dashboard`
    },
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email
        if (!email) return false

        let dbUser = await prisma.user.findUnique({ where: { email } })

        if (!dbUser) {
          // Créer le compte automatiquement pour les utilisateurs Google
          dbUser = await prisma.user.create({
            data: {
              email,
              nom: user.name?.split(" ").slice(1).join(" ") || "",
              prenom: user.name?.split(" ")[0] || "",
              photoUrl: user.image || null,
              emailVerifie: true, // Google vérifie déjà l'email
            },
          })
        }

        // Bloquer la reconnexion des comptes supprimés
        if (dbUser.statutProfil === "EN_PAUSE" && dbUser.email.startsWith("supprime-")) {
          return false
        }

        // Mettre à jour la photo si elle a changé
        if (user.image && user.image !== dbUser.photoUrl) {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { photoUrl: user.image },
          })
        }

        // Injecter les données DB dans l'objet user pour le JWT
        user.id = dbUser.id
        user.nom = dbUser.nom
        user.prenom = dbUser.prenom
        user.role = dbUser.role
        user.photoUrl = dbUser.photoUrl
      }
      return true
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.nom = user.nom
        token.prenom = user.prenom
        token.photoUrl = user.photoUrl
        // Générer un jti unique à la connexion pour permettre la révocation
        token.jti = crypto.randomUUID()

        // Persister le jti (hashé) en DB pour vérification côté serveur
        const jtiHash = crypto.createHash("sha256").update(token.jti as string).digest("hex")
        await prisma.authSession.create({
          data: {
            userId: user.id as string,
            tokenHash: jtiHash,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
          },
        }).catch(() => {
          // Non-bloquant : si la DB est indisponible, la session reste valide côté JWT
        })

        // Charger l'accès communauté à la connexion
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id as string },
          select: { accesCommuaute: true, accesCommuauteExpireAt: true, essaiCommuauteUtilise: true },
        }).catch(() => null)
        token.accesCommuaute = dbUser?.accesCommuaute ?? false
        token.accesCommuauteExpireAt = dbUser?.accesCommuauteExpireAt?.toISOString() ?? null
        token.essaiCommuauteUtilise = dbUser?.essaiCommuauteUtilise ?? false
      }

      // Rafraîchissement explicite (appelé après activation essai ou abonnement)
      if (trigger === "update" && (session as Record<string, unknown>)?.refreshCommuaute) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { accesCommuaute: true, accesCommuauteExpireAt: true, essaiCommuauteUtilise: true },
        }).catch(() => null)
        if (dbUser) {
          token.accesCommuaute = dbUser.accesCommuaute
          token.accesCommuauteExpireAt = dbUser.accesCommuauteExpireAt?.toISOString() ?? null
          token.essaiCommuauteUtilise = dbUser.essaiCommuauteUtilise
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
        session.user.nom = token.nom as string
        session.user.prenom = token.prenom as string
        session.user.photoUrl = token.photoUrl as string | null
        session.user.accesCommuaute = (token.accesCommuaute as boolean) ?? false
        session.user.accesCommuauteExpireAt = (token.accesCommuauteExpireAt as string | null) ?? null
        session.user.essaiCommuauteUtilise = (token.essaiCommuauteUtilise as boolean) ?? false
        // Exposer le jti dans la session pour les vérifications de révocation
        if (token.jti) {
          session.jti = token.jti as string
        }
      }
      return session
    },
  },
  pages: {
    signIn: "/connexion",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  cookies: {
    sessionToken: {
      name: SESSION_COOKIE_NAME,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
})

/**
 * Vérifie que le jti (JWT ID) du token est actif (non révoqué) en DB.
 * À appeler sur les routes sensibles : paiement, données médicales.
 * Retourne `true` si le jti est valide ou si la table est vide (dégradé).
 */
export async function verifyActiveJti(jti: string): Promise<boolean> {
  const jtiHash = crypto.createHash("sha256").update(jti).digest("hex")
  const session = await prisma.authSession.findFirst({
    where: {
      tokenHash: jtiHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  })
  // Si aucune entrée trouvée (ancienne session sans jti en DB), on passe — mode dégradé
  return session !== null
}
