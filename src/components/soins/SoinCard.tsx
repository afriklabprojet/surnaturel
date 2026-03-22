"use client"

import { Clock, Gift } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { formatPrix } from "@/lib/utils"
import type { SoinMock } from "@/lib/soins-data"
import { staggerItem, cardHover } from "@/lib/animations"

interface SoinCardProps {
  soin: SoinMock
}

export default function SoinCard({ soin }: SoinCardProps) {
  return (
    <motion.div
      variants={staggerItem}
      {...cardHover}
      className="group flex flex-col bg-white transition-colors duration-300 hover:bg-bg-page"
    >
      {/* Image / Gradient hero */}
      <div className="relative flex h-52 items-center justify-center overflow-hidden bg-gradient-to-br from-primary-light via-bg-page to-gold-light">
        <soin.icon size={44} className="text-gold opacity-30 transition-transform duration-500 group-hover:scale-110" />
        {soin.badge && (
          <span className="absolute left-0 top-4 bg-gold px-3 py-1 font-body text-[10px] uppercase tracking-[0.15em] text-white">
            {soin.badge}
          </span>
        )}
      </div>

      {/* Contenu */}
      <div className="flex flex-1 flex-col p-7">
        <h3 className="font-display text-xl font-light text-text-main">
          {soin.nom}
        </h3>

        <div className="mt-2 flex items-center gap-4 font-body text-[12px] text-text-muted-brand">
          <span className="flex items-center gap-1">
            <Clock size={13} />
            {soin.duree} min
          </span>
          <span className="font-medium text-gold">
            {formatPrix(soin.prix)}
          </span>
        </div>

        <p className="mt-3 flex-1 font-body text-[13px] leading-relaxed text-text-muted-brand line-clamp-3">
          {soin.description}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-border-brand pt-4">
          <Link
            href={`/soins/${soin.slug}`}
            className="group/btn inline-flex items-center gap-2 font-body text-[11px] uppercase tracking-[0.1em] text-text-main transition-colors duration-300 hover:text-primary-brand"
          >
            En savoir plus
            <span className="inline-block transition-transform duration-300 group-hover/btn:translate-x-1">→</span>
          </Link>
          <Link
            href={`/prise-rdv?soin=${soin.slug}`}
            className="inline-flex items-center gap-2 bg-primary-brand px-4 py-2 font-body text-[11px] uppercase tracking-[0.1em] text-white transition-colors duration-300 hover:bg-primary-dark"
          >
            Réserver
          </Link>
        </div>

        {/* CTA Offrir */}
        <Link
          href={`/prise-rdv?soin=${soin.slug}&cadeau=true`}
          className="mt-3 flex items-center justify-center gap-2 border border-gold/30 py-2 font-body text-[10px] uppercase tracking-[0.12em] text-gold transition-colors duration-300 hover:border-gold hover:bg-gold/5"
        >
          <Gift size={12} />
          Offrir ce soin
        </Link>
      </div>
    </motion.div>
  )
}
