"use client"

import { motion } from "framer-motion"
import { progressBar } from "@/lib/animations"
import { calculerCompletion, getMessageCompletion, getCouleurProgression, ProfilCompletion as ProfilCompletionResult } from "@/lib/profil-completion"
import { CheckCircle2, AlertCircle, ChevronRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

// Interface matching the User model from Prisma schema
interface UserData {
  prenom: string | null
  nom: string | null
  email: string | null
  telephone: string | null
  photoUrl: string | null
  ville: string | null
}

interface ProfilCompletionProps {
  user: UserData
  className?: string
  variant?: "full" | "compact"
}

export default function ProfilCompletionComponent({
  user,
  className,
  variant = "full",
}: ProfilCompletionProps) {
  const completion = calculerCompletion(user)
  const pourcentage = completion.pourcentage
  const message = getMessageCompletion(pourcentage)
  const couleur = getCouleurProgression(pourcentage)

  // Champs manquants
  const champManquants = completion.manquants.map(m => m.label)

  if (variant === "compact") {
    return (
      <div className={cn("border border-border-brand bg-white p-4", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {pourcentage === 100 ? (
              <CheckCircle2 size={18} className="text-primary-brand" />
            ) : (
              <AlertCircle size={18} className="text-gold" />
            )}
            <div>
              <p className="font-body text-[12px] font-medium text-text-main">
                Profil {pourcentage}%
              </p>
              <p className="font-body text-xs text-text-muted-brand">
                {message}
              </p>
            </div>
          </div>
          {pourcentage < 100 && (
            <Link
              href="/compte/profil"
              className="flex items-center gap-1 text-gold transition-colors hover:text-gold/80"
            >
              <span className="font-body text-xs font-medium">Compléter</span>
              <ChevronRight size={14} />
            </Link>
          )}
        </div>

        {/* Progress bar */}
        <div className="relative mt-3 h-1.5 w-full overflow-hidden bg-border-brand">
          <motion.div
            className={cn("absolute left-0 top-0 h-full", couleur)}
            custom={pourcentage}
            variants={progressBar}
            initial="initial"
            animate="animate"
          />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "border border-border-brand border-l-4 bg-white p-6",
        pourcentage === 100 ? "border-l-primary-brand" : "border-l-gold",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {pourcentage === 100 ? (
            <div className="flex h-10 w-10 items-center justify-center bg-primary-light">
              <CheckCircle2 size={20} className="text-primary-brand" />
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center bg-gold/10">
              <AlertCircle size={20} className="text-gold" />
            </div>
          )}
          <div>
            <p className="font-display text-[18px] font-light text-text-main">
              Complétion du profil
            </p>
            <p className="font-body text-[12px] text-text-muted-brand">
              {message}
            </p>
          </div>
        </div>

        <span
          className={cn(
            "font-display text-[28px] font-light",
            pourcentage === 100 ? "text-primary-brand" : "text-gold"
          )}
        >
          {pourcentage}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative mt-4 h-2 w-full overflow-hidden bg-border-brand">
        <motion.div
          className={cn("absolute left-0 top-0 h-full", couleur)}
          custom={pourcentage}
          variants={progressBar}
          initial="initial"
          animate="animate"
        />
      </div>

      {/* Champs manquants */}
      {champManquants.length > 0 && (
        <div className="mt-4">
          <p className="font-body text-xs font-medium uppercase tracking-widest text-text-muted-brand">
            À compléter
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {champManquants.map((champ) => (
              <span
                key={champ}
                className="border border-border-brand bg-bg-page px-3 py-1 font-body text-xs text-text-muted-brand"
              >
                {champ}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action */}
      {pourcentage < 100 && (
        <Link
          href="/compte/profil"
          className="mt-4 inline-flex items-center gap-2 border border-gold px-4 py-2 font-body text-[12px] font-medium text-gold transition-colors hover:bg-gold hover:text-white"
        >
          Compléter mon profil
          <ChevronRight size={14} />
        </Link>
      )}
    </div>
  )
}
