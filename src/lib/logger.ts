import pino from "pino"

/**
 * Logger structuré Pino — remplace console.* dans les routes API.
 *
 * En production (NODE_ENV=production) : logs JSON bruts → stdout (PM2 capture).
 * En développement : logs colorisés via pino-pretty.
 *
 * Redaction des champs sensibles : pas de fuite de mots de passe,
 * tokens ou clés API dans les logs Hostinger.
 */
const logger = pino(
  {
    level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "warn" : "debug"),
    // Redacter les champs sensibles où qu'ils apparaissent dans les objets loggués
    redact: {
      paths: [
        "password",
        "passwordHash",
        "token",
        "secret",
        "apiKey",
        "api_key",
        "authorization",
        "*.password",
        "*.passwordHash",
        "*.token",
        "*.secret",
        "*.apiKey",
        "req.headers.authorization",
        "req.headers.cookie",
      ],
      censor: "[REDACTED]",
    },
    serializers: {
      err: pino.stdSerializers.err,
    },
  },
  process.env.NODE_ENV !== "production"
    ? pino.transport({ target: "pino-pretty", options: { colorize: true } })
    : undefined
)

export default logger

/**
 * Proxy typé du logger pino compatible avec le pattern `logger.error("msg", error)`
 * utilisé dans toutes les routes API.
 *
 * Pino attend `logger.error({ err }, "msg")` mais tout le code utilise
 * `logger.error("msg", error)`. Ce proxy normalise les deux formes sans
 * modifier les 64 fichiers appelants.
 *
 * Usage accepté :
 *   logger.error("Un problème :", error)    ← (msg: string, err?: unknown)
 *   logger.error({ err: e }, "Un problème") ← pino natif, toujours valide
 */

type LogMethod = {
  (msg: string, err?: unknown): void
  (obj: Record<string, unknown>, msg?: string): void
}

function makeMethod(level: "trace" | "debug" | "info" | "warn" | "error" | "fatal"): LogMethod {
  return function (msgOrObj: string | Record<string, unknown>, errOrMsg?: unknown) {
    if (typeof msgOrObj === "string") {
      // logger.error("msg:", error) → logger.error({ err: error }, "msg:")
      if (errOrMsg !== undefined) {
        const pinoMethod = logger[level].bind(logger) as (obj: object, msg: string) => void
        pinoMethod({ err: errOrMsg }, msgOrObj)
      } else {
        const pinoMethod = logger[level].bind(logger) as (msg: string) => void
        pinoMethod(msgOrObj)
      }
    } else {
      // logger.error({ err: e }, "msg") — pino natif
      const pinoMethod = logger[level].bind(logger) as (obj: object, msg?: string) => void
      pinoMethod(msgOrObj, errOrMsg as string | undefined)
    }
  } as LogMethod
}

export const typedLogger = {
  trace: makeMethod("trace"),
  debug: makeMethod("debug"),
  info:  makeMethod("info"),
  warn:  makeMethod("warn"),
  error: makeMethod("error"),
  fatal: makeMethod("fatal"),
  child: logger.child.bind(logger),
}

