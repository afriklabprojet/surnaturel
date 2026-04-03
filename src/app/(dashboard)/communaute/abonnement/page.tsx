"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { CheckCircle2, Sparkles, Users, MessageSquare, BookOpen, BadgeCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { METHODES_PAIEMENT } from "@/lib/jeko"
import type { JekoPaymentMethod } from "@/lib/jeko"

const AVANTAGES = [
  { icone: CheckCircle2, texte: "Publications et partages illimités" },
  { icone: Users, texte: "Accès à tous les groupes et cercles" },
  { icone: MessageSquare, texte: "Messagerie privée entre membres" },
  { icone: BookOpen, texte: "Stories quotidiennes" },
  { icone: BadgeCheck, texte: "Badge membre communauté" },
  { icone: Sparkles, texte: "Événements exclusifs" },
]

export default function CommunauteAbonnementPage() {
  const router = useRouter()
  const { update } = useSession()
  const [methode, setMethode] = useState<JekoPaymentMethod | null>(null)
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null
  const erreurParam = searchParams?.get("erreur")

  async function handlePayer() {
    if (!methode) return
    setLoading(true)
    setErreur(null)

    try {
      const res = await fetch("/api/communaute/abonnement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ methode }),
      })
      const data = (await res.json()) as { redirectUrl?: string; error?: string }

      if (!res.ok || !data.redirectUrl) {
        setErreur(data.error ?? "Erreur lors du démarrage du paiement")
        return
      }

      // Rafraîchir le JWT après retour (fait par la page /communaute?abonnement=ok)
      window.location.href = data.redirectUrl
    } catch {
      setErreur("Erreur réseau. Veuillez réessayer.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto py-10 px-4 space-y-6">
      {/* En-tête */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-2">
          <Users className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Rejoignez la Communauté</h1>
        <p className="text-muted-foreground text-sm">
          Connectez-vous avec d&apos;autres membres, partagez votre parcours et
          accédez à du contenu exclusif.
        </p>
      </div>

      {/* Prix */}
      <div className="text-center p-6 rounded-xl border border-primary/30 bg-primary/5">
        <p className="text-4xl font-extrabold text-primary">10 000 F CFA</p>
        <p className="text-sm text-muted-foreground mt-1">par mois · sans engagement</p>
      </div>

      {/* Avantages */}
      <div className="p-5 rounded-xl border border-border space-y-3">
        {AVANTAGES.map(({ icone: Icone, texte }) => (
          <div key={texte} className="flex items-center gap-3 text-sm">
            <Icone className="w-4 h-4 text-primary shrink-0" />
            <span>{texte}</span>
          </div>
        ))}
      </div>

      {/* Erreurs */}
      {(erreur ?? erreurParam) && (
        <p className="text-sm text-destructive text-center">
          {erreur ?? "Le paiement a échoué. Veuillez réessayer."}
        </p>
      )}

      {/* Sélection méthode */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Choisissez votre méthode de paiement</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {METHODES_PAIEMENT.map((m) => (
            <button
              key={m.id}
              onClick={() => setMethode(m.id)}
              className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${
                methode === m.id
                  ? "border-primary bg-primary/5 font-medium"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Image
                src={m.logo}
                alt={m.label}
                width={24}
                height={24}
                className="object-contain"
              />
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      <Button
        onClick={handlePayer}
        disabled={!methode || loading}
        className="w-full"
        size="lg"
      >
        {loading ? "Redirection vers le paiement…" : "Payer 10 000 F CFA"}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Paiement sécurisé via Jeko · Vous pouvez annuler à tout moment depuis votre profil.
      </p>
    </div>
  )
}
