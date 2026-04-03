"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { X, Calendar, ShoppingBag, UserPlus } from "lucide-react"

const STORAGE_KEY = "sdn_visite_v1"

const ETAPES = [
  {
    icone: Calendar,
    label: "Prenez un rendez-vous",
    texte: "Réservez en 3 étapes simples",
    href: "/prise-rdv",
  },
  {
    icone: ShoppingBag,
    label: "Explorez la boutique",
    texte: "Produits naturels & bien-être",
    href: "/boutique",
  },
  {
    icone: UserPlus,
    label: "Créez votre espace",
    texte: "Gratuit — programme fidélité inclus",
    href: "/inscription",
  },
]

export default function PremiereVisite() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
    } catch {}
  }, [])

  function fermer() {
    try {
      localStorage.setItem(STORAGE_KEY, "1")
    } catch {}
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="border-b border-gold/20 bg-primary-light/40">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px w-6 bg-gold" />
              <span className="font-body text-xs uppercase tracking-[0.2em] text-gold">
                Bienvenue
              </span>
            </div>
            <p className="mb-5 font-display text-[20px] font-light text-text-main">
              Première visite ?{" "}
              <em className="italic text-primary-brand">Voici comment débuter.</em>
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {ETAPES.map((etape, i) => {
                const Icone = etape.icone
                return (
                  <Link
                    key={etape.href}
                    href={etape.href}
                    onClick={fermer}
                    className="group flex items-center gap-3 border border-border-brand bg-white px-4 py-3.5 transition-colors hover:border-gold"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-primary-light transition-colors group-hover:bg-gold/10">
                      <Icone size={17} className="text-primary-brand" />
                    </div>
                    <div>
                      <p className="font-body text-[12px] font-medium text-text-main">
                        {i + 1}. {etape.label}
                      </p>
                      <p className="font-body text-xs text-text-muted-brand">
                        {etape.texte}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
          <button
            onClick={fermer}
            aria-label="Fermer le guide de bienvenue"
            className="flex h-8 w-8 shrink-0 items-center justify-center text-text-muted-brand transition-colors hover:text-text-main"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
