"use client"

import Link from "next/link"

export default function AuthError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-md text-center">
        <div className="flex items-center justify-center gap-3">
          <span className="h-px w-6 bg-gold" />
          <span className="font-body text-xs font-medium uppercase tracking-[0.2em] text-gold">
            Erreur de chargement
          </span>
          <span className="h-px w-6 bg-gold" />
        </div>

        <h1 className="mt-5 font-display text-[28px] font-light text-text-main">
          Page temporairement indisponible
        </h1>

        <p className="mt-4 font-body text-sm text-text-muted-brand">
          Le formulaire n&apos;a pas pu se charger. Vérifiez votre connexion
          internet et réessayez.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="w-full max-w-xs bg-primary-brand py-3 font-body text-xs font-medium uppercase tracking-[0.2em] text-white transition-colors duration-300 hover:bg-primary-dark"
          >
            Réessayer
          </button>

          <Link
            href="/"
            className="font-body text-xs text-text-muted-brand transition-colors hover:text-text-mid"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </main>
  )
}
