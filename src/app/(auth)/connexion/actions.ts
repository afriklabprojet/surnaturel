"use server"

import { signIn } from "@/lib/auth"
import { AuthError } from "next-auth"
import { isRedirectError } from "next/dist/client/components/redirect-error"

export type PublicLoginResult =
  | { ok: true }
  | { ok: false; code: "EMAIL_NON_VERIFIE" }
  | { ok: false; code: "2FA_REQUIRED"; userId: string }
  | { ok: false; code: "CREDENTIALS_INVALID" }
  | { ok: false; code: "SERVER_ERROR"; detail: string }

export async function publicLoginAction(
  email: string,
  password: string,
): Promise<PublicLoginResult> {
  try {
    await signIn("credentials", { email, password, redirect: false })
    return { ok: true }
  } catch (error) {
    // NextAuth v5 beta peut lancer un NEXT_REDIRECT même avec redirect: false
    // dans les Server Actions — laisser Next.js le gérer
    if (isRedirectError(error)) throw error

    if (error instanceof AuthError) {
      const code = (error as { code?: string }).code ?? ""
      const msg = error.message ?? ""

      if (code === "EMAIL_NON_VERIFIE" || msg.includes("EMAIL_NON_VERIFIE")) {
        return { ok: false, code: "EMAIL_NON_VERIFIE" }
      }
      const m = msg.match(/2FA_REQUIRED:(\w+)/)
      if (code === "2FA_REQUIRED" || m) {
        return { ok: false, code: "2FA_REQUIRED", userId: m?.[1] ?? "" }
      }
      return { ok: false, code: "CREDENTIALS_INVALID" }
    }

    // Erreur inattendue — log et retourner une erreur exploitable côté client
    const detail = error instanceof Error ? error.message : "Erreur interne"
    console.error("[publicLoginAction] Erreur inattendue:", detail)
    return { ok: false, code: "SERVER_ERROR", detail }
  }
}
