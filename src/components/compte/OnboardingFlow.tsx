"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { X, Clock, ChevronRight, Sparkles, Loader2, CheckCircle } from "lucide-react"
import { formatPrix } from "@/lib/utils"
import { getIcon } from "@/lib/icon-map"

interface Soin {
  id: string
  slug: string
  nom: string
  prix: number
  duree: number
  categorie: string
  icon?: string | null
  badge?: string | null
}

interface OnboardingFlowProps {
  prenom: string
  onDismiss: () => void
}

const CATEGORIES_LABEL: Record<string, string> = {
  HAMMAM: "Hammam",
  GOMMAGE: "Gommage",
  VISAGE: "Visage",
  AMINCISSANT: "Amincissant",
  POST_NAISSANCE: "Post-naissance",
  SAGE_FEMME: "Sage-femme",
  CORPS: "Corps",
  AUTRE: "Autre",
}

export default function OnboardingFlow({ prenom, onDismiss }: OnboardingFlowProps) {
  const router = useRouter()
  const [etape, setEtape] = useState<1 | 2>(1)
  const [soins, setSoins] = useState<Soin[]>([])
  const [loading, setLoading] = useState(true)
  const [soinChoisi, setSoinChoisi] = useState<Soin | null>(null)

  useEffect(() => {
    fetch("/api/soins")
      .then((r) => r.ok ? r.json() : { soins: [] })
      .then((d) => {
        // Limiter à 6 soins pour la lisibilité
        setSoins((d.soins || []).slice(0, 6))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function handleSelectSoin(soin: Soin) {
    setSoinChoisi(soin)
    setEtape(2)
  }

  function handleConfirmer() {
    if (!soinChoisi) return
    // Marquer le flow comme vu (ne plus le montrer)
    localStorage.setItem("onboarding_flow_done", "1")
    // Déposer l'utilisatrice sur la page de réservation, soin déjà sélectionné → étape 2
    router.push(`/prise-rdv?soin=${soinChoisi.slug}`)
    onDismiss()
  }

  function handleDismiss() {
    localStorage.setItem("onboarding_flow_done", "1")
    onDismiss()
  }

  return (
    // Overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={etape}
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.97 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative w-full max-w-lg bg-bg-card rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="relative bg-primary-brand px-6 pt-8 pb-6">
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
              aria-label="Passer"
            >
              <X size={14} />
            </button>

            {/* Indicateurs d'étape */}
            <div className="flex items-center gap-2 mb-4">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    n === etape ? "w-8 bg-white" : n < etape ? "w-4 bg-white/60" : "w-4 bg-white/30"
                  }`}
                />
              ))}
            </div>

            {etape === 1 ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={16} className="text-gold" />
                  <span className="font-body text-[11px] text-white/70 uppercase tracking-wider">Bienvenue</span>
                </div>
                <h2 className="font-display text-2xl text-white leading-snug">
                  Bonjour {prenom} !<br />
                  <span className="text-white/85">Quel soin vous attire&nbsp;?</span>
                </h2>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle size={16} className="text-white/80" />
                  <span className="font-body text-[11px] text-white/70 uppercase tracking-wider">Votre choix</span>
                </div>
                <h2 className="font-display text-2xl text-white leading-snug">
                  Prêt à réserver&nbsp;?
                </h2>
              </>
            )}
          </div>

          {/* Corps */}
          <div className="px-6 py-5">
            {etape === 1 && (
              <>
                {loading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 size={24} className="animate-spin text-text-muted-brand" />
                  </div>
                ) : soins.length === 0 ? (
                  <p className="text-center text-text-muted-brand font-body text-sm py-8">
                    Impossible de charger les soins. <br />
                    <button
                      onClick={() => router.push("/prise-rdv")}
                      className="text-primary-brand underline mt-2"
                    >
                      Voir tous les soins →
                    </button>
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {soins.map((soin) => {
                      const IconComp = getIcon(soin.icon)
                      return (
                        <button
                          key={soin.id}
                          onClick={() => handleSelectSoin(soin)}
                          className="group relative flex flex-col items-start gap-2 rounded-xl border border-border-brand bg-bg-page p-4 text-left transition-all duration-200 hover:border-primary-brand hover:bg-primary-light hover:shadow-sm"
                        >
                          {soin.badge && (
                            <span className="absolute top-2 right-2 rounded-full bg-gold px-1.5 py-0.5 font-body text-[9px] text-white">
                              {soin.badge}
                            </span>
                          )}
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-primary-brand group-hover:bg-white transition-colors">
                            {IconComp ? <IconComp size={16} /> : <Sparkles size={16} />}
                          </span>
                          <span className="font-body text-[13px] font-medium text-text-main leading-tight">
                            {soin.nom}
                          </span>
                          <div className="flex items-center gap-2 text-text-muted-brand">
                            <span className="font-body text-[11px]">{formatPrix(soin.prix)}</span>
                            <span className="text-[10px]">·</span>
                            <span className="flex items-center gap-0.5 font-body text-[11px]">
                              <Clock size={9} />
                              {soin.duree} min
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                <button
                  onClick={() => router.push("/soins")}
                  className="mt-4 w-full text-center font-body text-[12px] text-text-muted-brand hover:text-primary-brand transition-colors"
                >
                  Voir tous les soins →
                </button>
              </>
            )}

            {etape === 2 && soinChoisi && (
              <div className="flex flex-col gap-5">
                {/* Carte récap du soin */}
                <div className="flex items-center gap-4 rounded-xl border border-primary-brand/20 bg-primary-light p-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-brand text-white">
                    {(() => {
                      const IconComp = getIcon(soinChoisi.icon)
                      return IconComp ? <IconComp size={22} /> : <Sparkles size={22} />
                    })()}
                  </span>
                  <div>
                    <p className="font-body text-[11px] text-text-muted-brand">
                      {CATEGORIES_LABEL[soinChoisi.categorie] ?? soinChoisi.categorie}
                    </p>
                    <p className="font-display text-lg text-text-main leading-tight">{soinChoisi.nom}</p>
                    <p className="font-body text-[12px] text-primary-brand font-medium">
                      {formatPrix(soinChoisi.prix)} · {soinChoisi.duree} min
                    </p>
                  </div>
                </div>

                <p className="font-body text-[13px] text-text-mid text-center leading-relaxed">
                  Cliquez sur le bouton ci-dessous pour choisir votre date et heure.<br />
                  Un acompte confirme votre réservation.
                </p>

                <button
                  onClick={handleConfirmer}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-brand py-3.5 font-body text-[14px] font-medium text-white shadow-sm hover:bg-primary-dark transition-colors"
                >
                  Choisir ma date
                  <ChevronRight size={16} />
                </button>

                <button
                  onClick={() => setEtape(1)}
                  className="text-center font-body text-[12px] text-text-muted-brand hover:text-text-mid transition-colors"
                >
                  ← Changer de soin
                </button>
              </div>
            )}
          </div>

          {/* Pied — lien "passer" discret */}
          {etape === 1 && (
            <div className="px-6 pb-5 text-center">
              <button
                onClick={handleDismiss}
                className="font-body text-[11px] text-text-muted-brand hover:text-text-mid transition-colors"
              >
                Passer pour l&apos;instant
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
