/**
 * Processus PM2 dédié aux crons — Hostinger Node.js
 *
 * Tâches node-cron appelant les routes API existantes via HTTP interne.
 *
 * Démarrage : pm2 start ecosystem.config.js --only crons
 * Logs       : pm2 logs crons
 *
 * Chaque tâche utilise CRON_SECRET pour s'authentifier auprès des routes.
 */

import cron from "node-cron"
import { config } from "dotenv"

config({ path: ".env.local" })
config({ path: ".env" })

const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
const CRON_SECRET = process.env.CRON_SECRET ?? ""

if (!CRON_SECRET) {
  console.error("[cron] CRON_SECRET manquant — les crons ne s'authentifieront pas.")
  process.exit(1)
}

async function callCron(path: string): Promise<void> {
  const url = `${BASE_URL}${path}`
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    })
    if (!res.ok) {
      const text = await res.text()
      console.error(`[cron] ${path} → HTTP ${res.status}: ${text.slice(0, 200)}`)
    } else {
      const data = await res.json().catch(() => ({}))
      console.log(`[cron] ${path} → OK`, JSON.stringify(data).slice(0, 200))
    }
  } catch (err) {
    console.error(`[cron] ${path} → Erreur réseau:`, err)
  }
}

// ── Planification des tâches cron ────────────────────────

// Rappels RDV J-1 — chaque jour à 8h
cron.schedule("0 8 * * *", () => callCron("/api/cron/rappel-rdv"), {
  timezone: "Africa/Abidjan",
})

// Rappels SMS — chaque jour à 9h
cron.schedule("0 9 * * *", () => callCron("/api/cron/rappels-sms"), {
  timezone: "Africa/Abidjan",
})

// Rappels WhatsApp — chaque jour à 18h
cron.schedule("0 18 * * *", () => callCron("/api/cron/rappels-whatsapp"), {
  timezone: "Africa/Abidjan",
})

// Invitations avis — chaque jour à 10h
cron.schedule("0 10 * * *", () => callCron("/api/cron/invitations-avis"), {
  timezone: "Africa/Abidjan",
})

// Emails onboarding — chaque jour à 10h
cron.schedule("0 10 * * *", () => callCron("/api/cron/onboarding-emails"), {
  timezone: "Africa/Abidjan",
})

// Publication planifiée — chaque jour à 6h
cron.schedule("0 6 * * *", () => callCron("/api/cron/publication-planifiee"), {
  timezone: "Africa/Abidjan",
})

// Nettoyage stories — chaque jour à 3h
cron.schedule("0 3 * * *", () => callCron("/api/cron/nettoyage-stories"), {
  timezone: "Africa/Abidjan",
})

// Messages programmés — chaque minute
cron.schedule("* * * * *", () => callCron("/api/cron/messages-programmes"), {
  timezone: "Africa/Abidjan",
})

// Relance paiement — toutes les 30 min
cron.schedule("*/30 * * * *", () => callCron("/api/cron/relance-paiement"), {
  timezone: "Africa/Abidjan",
})

// Relance panier abandonné — toutes les 2h
cron.schedule("0 */2 * * *", () => callCron("/api/cron/relance-panier"), {
  timezone: "Africa/Abidjan",
})

// Newsletter hebdo — dimanche à 10h
cron.schedule("0 10 * * 0", () => callCron("/api/cron/newsletter"), {
  timezone: "Africa/Abidjan",
})

// Renouvellement abonnements — 1er du mois à minuit
cron.schedule("0 0 1 * *", () => callCron("/api/cron/renouvellement-abonnements"), {
  timezone: "Africa/Abidjan",
})

// Réactivation clients inactifs — lundi à 10h
cron.schedule("0 10 * * 1", () => callCron("/api/cron/reactivation"), {
  timezone: "Africa/Abidjan",
})

// Expiration accès communauté — chaque jour à 2h
cron.schedule("0 2 * * *", () => callCron("/api/cron/expiration-communaute"), {
  timezone: "Africa/Abidjan",
})

console.log(`[cron] Processus démarré — ${new Date().toISOString()} — base: ${BASE_URL}`)
