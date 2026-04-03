"use server"

import { signIn } from "@/lib/auth"
import { AuthError } from "next-auth"

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
    // Re-throw Next.js redirect / not-found errors
    throw error
  }
}
