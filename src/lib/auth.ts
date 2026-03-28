import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import type { Role } from "@/generated/prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      nom: string
      prenom: string
      role: Role
      photoUrl?: string | null
    }
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
  providers: [
    Credentials({
      name: "Identifiants",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
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

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )
        if (!isValid) {
          return null
        }

        // Bloquer la connexion si email non vérifié
        if (!user.emailVerifie) {
          throw new Error("EMAIL_NON_VERIFIE")
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.nom = user.nom
        token.prenom = user.prenom
        token.photoUrl = user.photoUrl
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
      }
      return session
    },
  },
  pages: {
    signIn: "/connexion",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
})
