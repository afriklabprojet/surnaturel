"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import {
  Check,
  Star,
  Sparkles,
  Calendar,
  CreditCard,
  Pause,
  Play,
  X,
  ChevronRight,
} from "lucide-react"
import { formatPrix } from "@/lib/utils"

interface Formule {
  id: string
  nom: string
  slug: string
  description: string
  prixMensuel: number
  nbSoinsParMois: number
  avantages: string[]
  populaire: boolean
}

interface MonAbonnement {
  id: string
  formule: {
    id: string
    nom: string
    description: string
    prixMensuel: number
    nbSoinsParMois: number
    avantages: string[]
  }
  statut: string
  frequence: string
  dateDebut: string
  dateProchainPaiement: string
  soinsRestantsMois: number
  moisEnCours: string
}

interface Props {
  formules: Formule[]
}

export default function AbonnementFormules({ formules }: Props) {
  const { data: session } = useSession()
  const [monAbonnement, setMonAbonnement] = useState<MonAbonnement | null>(null)
  const [loadingAbo, setLoadingAbo] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    if (!session) return
    setLoadingAbo(true)
    fetch("/api/abonnements/mon-abonnement")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setMonAbonnement(data.abonnement)
      })
      .finally(() => setLoadingAbo(false))
  }, [session])

  async function refreshAbonnement() {
    const res = await fetch("/api/abonnements/mon-abonnement")
    if (res.ok) {
      const data = await res.json()
      setMonAbonnement(data.abonnement ?? null)
    }
  }

  async function souscrire(formuleId: string) {
    if (!session) {
      window.location.href = "/connexion?callbackUrl=/abonnements"
      return
    }
    setActionLoading(true)
    try {
      const res = await fetch("/api/abonnements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formuleId }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: "success", text: "Abonnement souscrit avec succès !" })
        await refreshAbonnement()
      } else {
        setMessage({ type: "error", text: data.error || "Erreur de souscription" })
      }
    } finally {
      setActionLoading(false)
    }
  }

  async function gererAbonnement(action: "pause" | "reactiver") {
    setActionLoading(true)
    try {
      const res = await fetch("/api/abonnements/mon-abonnement", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({
          type: "success",
          text: action === "pause" ? "Abonnement mis en pause" : "Abonnement réactivé",
        })
        await refreshAbonnement()
      } else {
        setMessage({ type: "error", text: data.error })
      }
    } finally {
      setActionLoading(false)
    }
  }

  async function annulerAbonnement() {
    if (!confirm("Êtes-vous sûr de vouloir annuler votre abonnement ?")) return
    setActionLoading(true)
    try {
      const res = await fetch("/api/abonnements/mon-abonnement", { method: "DELETE" })
      if (res.ok) {
        setMessage({ type: "success", text: "Abonnement annulé" })
        setMonAbonnement(null)
      }
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <>
      {/* Message feedback */}
      {message && (
        <div
          className={`mt-8 rounded p-4 text-center ${
            message.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-4 underline">
            Fermer
          </button>
        </div>
      )}

      {/* Mon abonnement actuel */}
      {loadingAbo && (
        <div className="mt-12 flex justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary-brand border-t-transparent" />
        </div>
      )}

      {monAbonnement && (
        <div className="mx-auto mt-12 max-w-2xl border-2 border-primary-brand bg-primary-brand/5 p-6">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-primary-brand" />
            <h2 className="font-display text-[24px] text-primary-brand">Mon abonnement</h2>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[14px] text-text-muted-brand">Formule</p>
              <p className="font-medium text-text-main">{monAbonnement.formule.nom}</p>
            </div>
            <div>
              <p className="text-[14px] text-text-muted-brand">Statut</p>
              <p
                className={`font-medium ${
                  monAbonnement.statut === "ACTIF"
                    ? "text-green-600"
                    : monAbonnement.statut === "EN_PAUSE"
                      ? "text-amber-600"
                      : "text-red-600"
                }`}
              >
                {monAbonnement.statut === "ACTIF"
                  ? "Actif"
                  : monAbonnement.statut === "EN_PAUSE"
                    ? "En pause"
                    : "Annulé"}
              </p>
            </div>
            <div>
              <p className="text-[14px] text-text-muted-brand">Soins restants ce mois</p>
              <p className="font-display text-[28px] text-gold">
                {monAbonnement.soinsRestantsMois}
                <span className="text-[16px] text-text-muted-brand">
                  /{monAbonnement.formule.nbSoinsParMois}
                </span>
              </p>
            </div>
            <div>
              <p className="text-[14px] text-text-muted-brand">Prochain paiement</p>
              <p className="font-medium text-text-main">
                {new Date(monAbonnement.dateProchainPaiement).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/prise-rdv"
              className="flex items-center gap-2 bg-primary-brand px-6 py-2 text-[14px] text-white transition-colors hover:bg-primary-brand/90"
            >
              <Calendar size={16} />
              Utiliser un soin
              <ChevronRight size={16} />
            </Link>

            {monAbonnement.statut === "ACTIF" && (
              <button
                onClick={() => gererAbonnement("pause")}
                disabled={actionLoading}
                className="flex items-center gap-2 border border-amber-600 px-4 py-2 text-[14px] text-amber-600 transition-colors hover:bg-amber-50 disabled:opacity-50"
              >
                <Pause size={16} />
                Mettre en pause
              </button>
            )}

            {monAbonnement.statut === "EN_PAUSE" && (
              <button
                onClick={() => gererAbonnement("reactiver")}
                disabled={actionLoading}
                className="flex items-center gap-2 border border-green-600 px-4 py-2 text-[14px] text-green-600 transition-colors hover:bg-green-50 disabled:opacity-50"
              >
                <Play size={16} />
                Réactiver
              </button>
            )}

            <button
              onClick={annulerAbonnement}
              disabled={actionLoading}
              className="flex items-center gap-2 border border-red-600 px-4 py-2 text-[14px] text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              <X size={16} />
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Grille des formules */}
      <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {formules.map((formule) => (
          <div
            key={formule.id}
            className={`relative border bg-white p-6 transition-shadow hover:shadow-lg ${
              formule.populaire ? "border-2 border-gold" : "border-border-brand"
            }`}
          >
            {formule.populaire && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold px-4 py-1 text-[12px] font-medium text-white">
                <Star size={12} className="mr-1 inline" />
                Populaire
              </div>
            )}

            <h3 className="font-display text-[24px] text-primary-brand">{formule.nom}</h3>
            <p className="mt-2 text-[14px] text-text-mid">{formule.description}</p>

            <div className="mt-6">
              <p className="font-display text-[36px] text-gold">
                {formatPrix(formule.prixMensuel)}
                <span className="text-[16px] text-text-muted-brand">/mois</span>
              </p>
              <p className="mt-1 text-[14px] text-text-muted-brand">
                {formule.nbSoinsParMois} soin{formule.nbSoinsParMois > 1 ? "s" : ""} par mois
              </p>
            </div>

            <ul className="mt-6 space-y-3">
              {formule.avantages.map((avantage, i) => (
                <li key={i} className="flex items-start gap-2 text-[14px]">
                  <Check size={16} className="mt-0.5 shrink-0 text-primary-brand" />
                  <span>{avantage}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => souscrire(formule.id)}
              disabled={actionLoading || !!monAbonnement}
              className={`mt-8 flex w-full items-center justify-center gap-2 py-3 text-[14px] font-medium transition-colors ${
                monAbonnement
                  ? "cursor-not-allowed bg-gray-200 text-gray-500"
                  : "bg-primary-brand text-white hover:bg-primary-brand/90"
              }`}
            >
              <CreditCard size={18} />
              {monAbonnement
                ? "Déjà abonné(e)"
                : actionLoading
                  ? "Chargement..."
                  : "Souscrire"}
            </button>
          </div>
        ))}
      </div>
    </>
  )
}
