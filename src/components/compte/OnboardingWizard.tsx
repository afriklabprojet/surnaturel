"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  CheckCircle,
  Circle,
  Calendar,
  ShoppingBag,
  User,
  Users,
  ArrowRight,
  Sparkles,
  Heart,
  Gift,
  ChevronRight,
  Loader2,
} from "lucide-react"
import { fadeInUp } from "@/lib/animations"

interface SoinRecommande {
  slug: string
  nom: string
  categorie: string
  prix: number
  duree: number
}

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  actionLabel: string
  actionHref: string
  completed: boolean
}

interface OnboardingWizardProps {
  prenom: string
  profilComplet: boolean
  hasRdv: boolean
  hasCommande: boolean
  onDismiss: () => void
}

export default function OnboardingWizard({
  prenom,
  profilComplet,
  hasRdv,
  hasCommande,
  onDismiss,
}: OnboardingWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [soinsRecommandes, setSoinsRecommandes] = useState<SoinRecommande[]>([])
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const steps: OnboardingStep[] = [
    {
      id: "profile",
      title: "Complétez votre profil",
      description: "Un profil complet nous permet de mieux vous accompagner",
      icon: <User size={20} />,
      actionLabel: "Compléter mon profil",
      actionHref: "/profil",
      completed: profilComplet,
    },
    {
      id: "rdv",
      title: "Réservez votre premier soin",
      description: "Choisissez parmi nos soins relaxants et bien-être",
      icon: <Calendar size={20} />,
      actionLabel: "Réserver un soin",
      actionHref: "/prise-rdv",
      completed: hasRdv,
    },
    {
      id: "boutique",
      title: "Découvrez nos produits naturels",
      description: "Des produits pour prolonger les bienfaits chez vous",
      icon: <ShoppingBag size={20} />,
      actionLabel: "Voir la boutique",
      actionHref: "/boutique",
      completed: hasCommande,
    },
  ]

  const completedCount = steps.filter(s => s.completed).length
  const progressPercent = Math.round((completedCount / steps.length) * 100)

  // Auto-advance to first incomplete step
  useEffect(() => {
    const firstIncomplete = steps.findIndex(s => !s.completed)
    if (firstIncomplete > 0) {
      setCurrentStep(firstIncomplete)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch recommended services
  useEffect(() => {
    async function fetchRecommendations() {
      setLoading(true)
      try {
        const res = await fetch("/api/soins/recommandes")
        if (res.ok) {
          const data = await res.json()
          setSoinsRecommandes(data.soins?.slice(0, 3) || [])
        }
      } catch {
        // Use fallback
      }
      setLoading(false)
    }
    fetchRecommendations()
  }, [])

  function handleDismiss() {
    setDismissed(true)
    localStorage.setItem("onboarding_dismissed", "true")
    // Track dismissal
    fetch("/api/user/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: completedCount, dismissed: true }),
    }).catch(() => {})
    onDismiss()
  }

  function handleStepAction(step: OnboardingStep) {
    if (!step.completed) {
      // Track step start
      fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: steps.indexOf(step), action: step.id }),
      }).catch(() => {})
      router.push(step.actionHref)
    }
  }

  if (dismissed) return null

  // All steps completed - show celebration
  if (completedCount === steps.length) {
    return (
      <motion.section
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="border border-primary-brand bg-primary-light p-6 sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center bg-primary-brand">
              <Sparkles size={24} className="text-white" />
            </div>
            <div>
              <h2 className="font-display text-[22px] font-light text-text-main">
                Félicitations {prenom} ! 🎉
              </h2>
              <p className="mt-1 font-body text-[14px] text-text-mid">
                Vous avez terminé votre parcours de bienvenue. Profitez pleinement de votre espace !
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="font-body text-xs text-text-muted-brand hover:text-text-main transition-colors"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/fidelite"
            className="inline-flex items-center gap-2 bg-primary-brand px-5 py-2.5 font-body text-xs uppercase tracking-[0.12em] text-white hover:bg-primary-dark transition-colors"
          >
            <Gift size={14} />
            Découvrir mes avantages fidélité
          </Link>
          <Link
            href="/communaute"
            className="inline-flex items-center gap-2 border border-primary-brand px-5 py-2.5 font-body text-xs uppercase tracking-[0.12em] text-primary-brand hover:bg-primary-light transition-colors"
          >
            <Users size={14} />
            Rejoindre la communauté
          </Link>
        </div>
      </motion.section>
    )
  }

  return (
    <motion.section
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      className="border border-gold bg-gold-light p-6 sm:p-8"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={20} className="text-gold" />
            <h2 className="font-display text-[22px] font-light text-text-main">
              Bienvenue {prenom} !
            </h2>
          </div>
          <p className="font-body text-[14px] text-text-mid">
            Complétez ces 3 étapes pour profiter pleinement de votre espace
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="font-body text-xs text-text-muted-brand hover:text-text-main transition-colors"
          aria-label="Fermer le guide de bienvenue"
        >
          <X size={18} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="font-body text-[12px] text-text-mid">
            {completedCount}/{steps.length} étapes terminées
          </span>
          <span className="font-body text-[12px] font-medium text-gold">
            {progressPercent}%
          </span>
        </div>
        <div className="h-1.5 bg-white rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gold"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const isActive = index === currentStep && !step.completed
          return (
            <button
              key={step.id}
              onClick={() => handleStepAction(step)}
              className={`w-full flex items-start gap-4 p-4 text-left transition-all ${
                step.completed
                  ? "bg-white border border-primary-light"
                  : isActive
                  ? "bg-white border-2 border-gold shadow-sm"
                  : "bg-white/50 border border-gold/30 hover:bg-white hover:border-gold/50"
              }`}
            >
              {/* Step icon */}
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center ${
                  step.completed
                    ? "bg-primary-brand text-white"
                    : isActive
                    ? "bg-gold text-white"
                    : "bg-border-brand text-text-muted-brand"
                }`}
              >
                {step.completed ? <CheckCircle size={20} /> : step.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`font-body text-[13px] font-medium ${
                      step.completed ? "text-primary-brand" : "text-text-main"
                    }`}
                  >
                    {step.title}
                  </p>
                  {step.completed ? (
                    <span className="shrink-0 px-2 py-0.5 bg-primary-light text-primary-brand font-body text-[10px] uppercase tracking-wider">
                      Fait
                    </span>
                  ) : (
                    <ChevronRight size={16} className="shrink-0 text-gold" />
                  )}
                </div>
                <p className="mt-0.5 font-body text-[12px] text-text-muted-brand">
                  {step.completed ? "Merci !" : step.description}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Recommendations section */}
      {soinsRecommandes.length > 0 && !showRecommendations && (
        <button
          onClick={() => setShowRecommendations(true)}
          className="mt-6 w-full flex items-center justify-center gap-2 border border-gold/50 bg-white/50 px-4 py-3 font-body text-[13px] text-gold hover:bg-white transition-colors"
        >
          <Heart size={16} />
          Voir les soins recommandés pour vous
          <ArrowRight size={14} />
        </button>
      )}

      <AnimatePresence>
        {showRecommendations && soinsRecommandes.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-6 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="font-body text-[13px] font-medium text-text-main">
                Soins recommandés pour vous
              </p>
              <button
                onClick={() => setShowRecommendations(false)}
                className="font-body text-xs text-text-muted-brand hover:text-text-main"
              >
                Masquer
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {loading ? (
                <div className="col-span-3 flex justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-gold" />
                </div>
              ) : (
                soinsRecommandes.map((soin) => (
                  <Link
                    key={soin.slug}
                    href={`/soins/${soin.slug}`}
                    className="flex flex-col bg-white border border-gold/30 p-4 hover:border-gold transition-colors group"
                  >
                    <span className="font-body text-[10px] uppercase tracking-wider text-gold mb-1">
                      {soin.categorie}
                    </span>
                    <span className="font-display text-[14px] text-text-main group-hover:text-gold transition-colors">
                      {soin.nom}
                    </span>
                    <div className="mt-2 flex items-center justify-between text-[12px]">
                      <span className="font-body text-text-muted-brand">
                        {soin.duree} min
                      </span>
                      <span className="font-body font-medium text-gold">
                        {soin.prix.toLocaleString()} F
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}
