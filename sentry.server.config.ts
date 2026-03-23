import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,

  ignoreErrors: [
    "NEXT_NOT_FOUND",
    "NEXT_REDIRECT",
  ],

  beforeSend(event) {
    // Scrub les données sensibles des requêtes
    if (event.request?.data) {
      const data = event.request.data as Record<string, unknown>
      for (const key of ["password", "motDePasse", "confirmPassword", "resetToken"]) {
        if (key in data) data[key] = "[REDACTED]"
      }
    }
    return event
  },
})
