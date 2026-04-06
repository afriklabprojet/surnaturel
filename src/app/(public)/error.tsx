"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RotateCcw, Home } from "lucide-react"
import * as Sentry from "@sentry/nextjs"

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center border border-border-brand bg-white mb-6">
        <AlertTriangle size={28} className="text-gold" />
      </div>
      <h1 className="font-display text-[28px] font-light text-text-main">Une erreur est survenue</h1>
      <p className="mt-3 max-w-md font-body text-[14px] text-text-muted-brand">
        Nous sommes désolés, quelque chose s&apos;est mal passé.
      </p>
      <div className="mt-8 flex items-center gap-4">
        <button onClick={reset} className="inline-flex items-center gap-2 border border-border-brand bg-white px-5 py-2.5 font-body text-xs uppercase tracking-[0.12em] text-text-main hover:border-gold transition-colors">
          <RotateCcw size={14} /> Réessayer
        </button>
        <Link href="/" className="inline-flex items-center gap-2 bg-primary-brand px-5 py-2.5 font-body text-xs uppercase tracking-[0.12em] text-white hover:bg-primary-dark transition-colors">
          <Home size={14} /> Accueil
        </Link>
      </div>
    </div>
  )
}
