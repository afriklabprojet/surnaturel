"use client"

import { useState } from "react"
import { ShieldCheck, BadgeCheck } from "lucide-react"

type VerifStatus = "AUCUNE" | "MEMBRE_VERIFIE" | "PROFESSIONNEL_SANTE"

interface BadgeVerificationProps {
  status: VerifStatus | string | null | undefined
  size?: number
  className?: string
}

const CONFIG: Record<string, { icon: typeof ShieldCheck; color: string; tooltip: string }> = {
  PROFESSIONNEL_SANTE: {
    icon: ShieldCheck,
    color: "text-primary-brand",
    tooltip: "Professionnel de santé vérifié — Identité et qualifications contrôlées",
  },
  MEMBRE_VERIFIE: {
    icon: BadgeCheck,
    color: "text-gold",
    tooltip: "Membre vérifié — Identité confirmée",
  },
}

export default function BadgeVerification({ status, size = 14, className = "" }: BadgeVerificationProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  if (!status || status === "AUCUNE") return null

  const cfg = CONFIG[status]
  if (!cfg) return null

  const Icon = cfg.icon

  return (
    <span
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <Icon size={size} className={cfg.color} />
      {showTooltip && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded bg-text-main px-2.5 py-1 font-body text-[10px] text-white shadow-lg z-50 pointer-events-none">
          {cfg.tooltip}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-text-main" />
        </span>
      )}
    </span>
  )
}
