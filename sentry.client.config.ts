import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Échantillonnage : 100% des erreurs, 10% des transactions (free tier)
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,

  // Ne pas capturer les erreurs réseau banales
  ignoreErrors: [
    "ResizeObserver loop",
    "Network request failed",
    "Load failed",
    "AbortError",
    "ChunkLoadError",
  ],

  beforeSend(event) {
    // Ne jamais envoyer de mots de passe
    if (event.request?.data) {
      const data = event.request.data as Record<string, unknown>
      if ("password" in data) delete data.password
      if ("motDePasse" in data) delete data.motDePasse
      if ("confirmPassword" in data) delete data.confirmPassword
    }
    return event
  },
})
