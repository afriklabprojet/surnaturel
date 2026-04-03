"use server"

import { prisma } from "@/lib/prisma"
import { signIn } from "@/lib/auth"
import { AuthError } from "next-auth"

export type AdminLoginResult =
  | { ok: true }
  | { ok: false; code: "EMAIL_NON_VERIFIE" }
  | { ok: false; code: "2FA_REQUIRED" }
  | { ok: false; code: "CREDENTIALS_INVALID" }
  | { ok: false; code: "SERVER_ERROR"; detail: string }

export async function adminLoginAction(
  email: string,
  password: string,
): Promise<AdminLoginResult> {
  try {
    await signIn("credentials", { email, password, redirect: false })
    return { ok: true }
  } catch (error) {
    if (error instanceof AuthError) {
      const code = (error as { code?: string }).code ?? ""
      const msg = error.message ?? ""

      if (code === "EMAIL_NON_VERIFIE" || msg.includes("EMAIL_NON_VERIFIE")) {
        return { ok: false, code: "EMAIL_NON_VERIFIE" }
      }
      if (code === "2FA_REQUIRED" || msg.includes("2FA_REQUIRED")) {
        return { ok: false, code: "2FA_REQUIRED" }
      }
      return { ok: false, code: "CREDENTIALS_INVALID" }
    }
    // Re-throw Next.js redirect / not-found errors
    throw error
  }
}

export async function getLoginStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [rdvAujourdhui, clientsActifs, commandesEnAttente, articlesPublies] =
    await Promise.all([
      prisma.rendezVous.count({
        where: { dateHeure: { gte: today, lt: tomorrow } },
      }),
      prisma.user.count({ where: { role: "CLIENT" } }),
      prisma.commande.count({ where: { statut: "EN_ATTENTE" } }),
      prisma.article.count({ where: { publie: true } }),
    ])

  return { rdvAujourdhui, clientsActifs, commandesEnAttente, articlesPublies }
}
