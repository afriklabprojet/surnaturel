/**
 * Validation des variables d'environnement requises au démarrage.
 *
 * Appeler `validateEnv()` au plus tôt (ex: prisma.ts, lib/auth.ts)
 * pour échouer rapidement avec un message clair si une variable est manquante.
 * Cela évite des crashs cryptiques "undefined is not a string" au runtime.
 */
import { z } from "zod/v4"

const serverSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXTAUTH_SECRET: z
    .string()
    .min(16, "NEXTAUTH_SECRET must be at least 16 characters"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  PUSHER_APP_ID: z.string().min(1, "PUSHER_APP_ID is required"),
  PUSHER_KEY: z.string().min(1, "PUSHER_KEY is required"),
  PUSHER_SECRET: z.string().min(1, "PUSHER_SECRET is required"),
  PUSHER_CLUSTER: z.string().min(1, "PUSHER_CLUSTER is required"),
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),
  ENCRYPTION_KEY: z.string().min(1, "ENCRYPTION_KEY is required"),
})

let _validated = false

/**
 * Valide toutes les variables d'environnement critiques au démarrage.
 * Si une variable est manquante ou invalide, lance une erreur claire.
 * Idempotent : ne valide qu'une seule fois par processus.
 */
export function validateEnv(): void {
  if (_validated) return

  const result = serverSchema.safeParse(process.env)
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${String(i.path[0])}: ${i.message}`)
      .join("\n")
    throw new Error(
      `\n[env] Missing or invalid environment variables:\n${issues}\n\nCheck your .env.production file on the server.\n`
    )
  }

  _validated = true
}
