"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import posthog from "posthog-js"

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.posthog.com"

/**
 * Initialise PostHog et capture les page views à chaque navigation.
 * Ne s'initialise que si NEXT_PUBLIC_POSTHOG_KEY est défini.
 */
export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!POSTHOG_KEY) return

    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: "identified_only",
      capture_pageview: false,   // On gère manuellement ci-dessous
      capture_pageleave: true,
      // Respecter le consentement cookie : ne pas capturer avant opt-in
      opt_out_capturing_by_default: false,
    })
  }, [])

  // Page views manuels (compatible Next.js App Router)
  useEffect(() => {
    if (!POSTHOG_KEY) return
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "")
    posthog.capture("$pageview", { $current_url: url })
  }, [pathname, searchParams])

  return <>{children}</>
}
