"use client"

import { useState, useEffect } from "react"
import posthog from "posthog-js"

const CONSENT_KEY = "sdn_cookie_consent"

type ConsentStatus = "pending" | "accepted" | "refused"

function getConsentStatus(): ConsentStatus {
  try {
    const val = localStorage.getItem(CONSENT_KEY)
    if (val === "accepted" || val === "refused") return val
  } catch {}
  return "pending"
}

/**
 * Bandeau de consentement cookies — conforme loi ivoirienne n°2013-450.
 * N'affiche Analytics/SpeedInsights qu'après acceptation explicite.
 */
export default function CookieConsent() {
  const [status, setStatus] = useState<ConsentStatus>("pending")
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const s = getConsentStatus()
    setStatus(s)
    if (s === "pending") {
      // Afficher après un court délai pour ne pas bloquer le FCP
      const t = setTimeout(() => setVisible(true), 1500)
      return () => clearTimeout(t)
    }
  }, [])

  function accept() {
    try { localStorage.setItem(CONSENT_KEY, "accepted") } catch {}
    setStatus("accepted")
    setVisible(false)
  }

  function refuse() {
    try { localStorage.setItem(CONSENT_KEY, "refused") } catch {}
    setStatus("refused")
    setVisible(false)
  }

  // Activer PostHog uniquement si l'utilisateur a accepté les cookies
  useEffect(() => {
    if (status === "accepted") {
      posthog.opt_in_capturing()
    } else if (status === "refused") {
      posthog.opt_out_capturing()
    }
  }, [status])

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-60 border-t border-border bg-bg-card px-4 py-4 shadow-lg sm:px-6 lg:bottom-4 lg:left-4 lg:right-auto lg:max-w-md lg:border lg:px-6 lg:py-5">
      <p className="font-body text-[13px] leading-relaxed text-text-main">
        Nous utilisons des cookies d&apos;analyse pour améliorer votre expérience.
        Aucune donnée personnelle n&apos;est partagée avec des tiers.
      </p>
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={accept}
          className="bg-primary-brand px-4 py-2 font-body text-[12px] font-medium text-white transition-colors hover:bg-primary-dark"
        >
          Accepter
        </button>
        <button
          onClick={refuse}
          className="border border-border px-4 py-2 font-body text-[12px] text-text-mid transition-colors hover:border-gold hover:text-gold"
        >
          Refuser
        </button>
        <a
          href="/mentions-legales"
          className="ml-auto font-body text-[11px] text-text-muted underline underline-offset-2 hover:text-gold"
        >
          En savoir plus
        </a>
      </div>
    </div>
  )
}

/**
 * Hook pour savoir si l'utilisateur a donné son consentement.
 * Utilisé pour conditionner le chargement d'Analytics.
 */
export function useAnalyticsConsent(): boolean {
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    setAccepted(getConsentStatus() === "accepted")

    // Écouter les changements (même onglet)
    function onStorage(e: StorageEvent) {
      if (e.key === CONSENT_KEY) {
        setAccepted(e.newValue === "accepted")
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  return accepted
}
