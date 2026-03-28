"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { formatPrix } from "@/lib/utils"
import { getIcon } from "@/lib/icon-map"
import { staggerItem, cardHover } from "@/lib/animations"

export interface ForfaitDB {
  slug: string
  nom: string
  description: string
  prixTotal: number
  prixForfait: number
  economie: number
  badge?: string | null
  soins: Array<{ slug: string; nom: string; duree: number; icon?: string | null; prix: number }>
}

interface ForfaitCardProps {
  forfait: ForfaitDB
}

export default function ForfaitCard({ forfait }: ForfaitCardProps) {
  return (
    <motion.div
      variants={staggerItem}
      {...cardHover}
      className="group flex flex-col border border-gold/30 bg-white transition-colors duration-300 hover:border-gold"
    >
      {/* Header */}
      <div className="relative border-b border-gold/20 bg-gradient-to-r from-gold/5 to-transparent p-6">
        {forfait.badge && (
          <span className="absolute right-4 top-4 bg-gold px-3 py-1 font-body text-[10px] uppercase tracking-[0.15em] text-white">
            {forfait.badge}
          </span>
        )}
        <h3 className="font-display text-[22px] font-light text-text-main">
          {forfait.nom}
        </h3>
        <p className="mt-2 font-body text-[13px] leading-relaxed text-text-mid">
          {forfait.description}
        </p>
      </div>

      {/* Soins inclus */}
      <div className="flex-1 p-6">
        <p className="font-body text-[10px] uppercase tracking-[0.15em] text-gold">
          Soins inclus
        </p>
        <ul className="mt-3 space-y-2">
          {forfait.soins.map((soin) => {
            const Icon = getIcon(soin.icon)
            return (
              <li key={soin.slug} className="flex items-center gap-2 font-body text-[13px] text-text-mid">
                <Icon size={14} className="shrink-0 text-primary-brand" />
                <span>{soin.nom}</span>
                <span className="ml-auto text-[11px] text-text-muted-brand">{soin.duree} min</span>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Prix + CTA */}
      <div className="border-t border-gold/20 p-6">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="font-body text-[12px] text-text-muted-brand line-through">
              {formatPrix(forfait.prixTotal)}
            </span>
            <p className="font-display text-[28px] font-light text-primary-brand">
              {formatPrix(forfait.prixForfait)}
            </p>
          </div>
          <span className="bg-primary-light px-3 py-1 font-body text-[11px] font-medium text-primary-brand">
            −{formatPrix(forfait.economie)}
          </span>
        </div>
        <Link
          href={`/prise-rdv?forfait=${forfait.slug}`}
          className="mt-4 flex w-full items-center justify-center bg-primary-brand py-3 font-body text-[11px] uppercase tracking-widest text-white transition-colors duration-300 hover:bg-primary-dark"
        >
          Réserver ce forfait
        </Link>
      </div>
    </motion.div>
  )
}
