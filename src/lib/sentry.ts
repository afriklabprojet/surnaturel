import * as Sentry from "@sentry/nextjs"

/**
 * Capture une erreur API avec contexte enrichi.
 */
export function captureApiError(
  error: unknown,
  context: { route: string; method?: string; userId?: string; ip?: string }
) {
  Sentry.withScope((scope) => {
    scope.setTag("type", "api")
    scope.setTag("route", context.route)
    if (context.method) scope.setTag("method", context.method)
    if (context.userId) scope.setUser({ id: context.userId })
    if (context.ip) scope.setContext("request", { ip: context.ip })
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)))
  })
}

/**
 * Capture une erreur de paiement — niveau CRITICAL.
 * Taguée "payment" pour déclencher une alerte email immédiate.
 */
export function capturePaymentError(
  error: unknown,
  transactionRef: string,
  extra?: { commandeId?: string; montant?: number; methode?: string }
) {
  Sentry.withScope((scope) => {
    scope.setLevel("fatal")
    scope.setTag("type", "payment")
    scope.setTag("transaction_ref", transactionRef)
    if (extra) scope.setContext("payment", extra)
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)))
  })
}

/**
 * Capture une erreur d'authentification — SANS mot de passe.
 */
export function captureAuthError(
  error: unknown,
  userId?: string,
  extra?: { action?: string; email?: string }
) {
  Sentry.withScope((scope) => {
    scope.setTag("type", "auth")
    if (extra?.action) scope.setTag("action", extra.action)
    if (userId) scope.setUser({ id: userId })
    if (extra?.email) scope.setContext("auth", { email: extra.email })
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)))
  })
}
