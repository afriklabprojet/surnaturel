"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react"

function EssaiPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { update } = useSession()

  const [statut, setStatut] = useState<"activation" | "ok" | "erreur">("activation")
  const [message, setMessage] = useState("")

  // Destination après activation (par défaut /communaute)
  const redirect = searchParams.get("redirect") ?? "/communaute"

  useEffect(() => {
    let annule = false

    async function activer() {
      try {
        const res = await fetch("/api/communaute/essai", { method: "POST" })
        const data = (await res.json()) as { ok?: boolean; error?: string; expireAt?: string }

        if (annule) return

        if (!res.ok) {
          // Essai déjà utilisé → rediriger vers le paywall
          if (res.status === 403) {
            router.replace("/communaute/abonnement")
            return
          }
          setStatut("erreur")
          setMessage(data.error ?? "Erreur lors de l'activation.")
          return
        }

        // Rafraîchir le JWT pour que le middleware laisse passer
        await update({ refreshCommuaute: true })

        setStatut("ok")

        // Laisser le message de bienvenue affiché 1,5s puis rediriger
        setTimeout(() => {
          if (!annule) router.replace(redirect)
        }, 1500)
      } catch {
        if (!annule) {
          setStatut("erreur")
          setMessage("Erreur réseau. Veuillez réessayer.")
        }
      }
    }

    void activer()

    return () => {
      annule = true
    }
  }, [redirect, router, update])

  if (statut === "activation") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-lg font-medium">Activation de votre essai gratuit…</p>
        <p className="text-sm text-muted-foreground">Juste un instant !</p>
      </div>
    )
  }

  if (statut === "ok") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Bienvenue dans la Communauté !</h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          Votre essai gratuit de 7 jours vient d&apos;être activé. Profitez de toutes
          les fonctionnalités !
        </p>
        <div className="flex items-center gap-2 text-sm text-primary">
          <CheckCircle2 className="w-4 h-4" />
          <span>Redirection en cours…</span>
        </div>
      </div>
    )
  }

  // erreur
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <p className="text-destructive font-medium">{message}</p>
      <button
        onClick={() => router.replace("/communaute/abonnement")}
        className="text-sm underline text-muted-foreground"
      >
        Voir les offres d&apos;abonnement
      </button>
    </div>
  )
}

export default function CommunauteEssaiPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <EssaiPageContent />
    </Suspense>
  )
}
