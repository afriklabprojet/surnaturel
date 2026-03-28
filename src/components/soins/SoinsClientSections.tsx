"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import SoinCard, { type SoinDB } from "@/components/soins/SoinCard"
import ForfaitCard, { type ForfaitDB } from "@/components/soins/ForfaitCard"
import FaqSection from "@/components/soins/FaqSection"
import { getIcon } from "@/lib/icon-map"
import SectionTag from "@/components/ui/SectionTag"
import {
  fadeInUp,
  staggerContainer,
  staggerItem,
} from "@/lib/animations"

// ─── Filtre par catégorie (client interactif) ────────────────────

interface Categorie {
  label: string
  value: string
}

interface SoinsFiltresProps {
  soins: SoinDB[]
  categories: Categorie[]
}

export function SoinsFiltres({ soins, categories }: SoinsFiltresProps) {
  const [categorieActive, setCategorieActive] = useState("TOUS")

  const soinsFiltres =
    categorieActive === "TOUS"
      ? soins
      : soins.filter((s) => s.categorie === categorieActive)

  return (
    <section className="bg-bg-page px-6 py-20 lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Filtres par catégorie */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-2"
        >
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategorieActive(cat.value)}
              className={`px-5 py-2.5 font-body text-[11px] font-medium uppercase tracking-widest transition-colors duration-300 ${
                categorieActive === cat.value
                  ? "bg-primary-brand text-white"
                  : "border border-border-brand bg-white text-text-mid hover:border-primary-brand hover:text-primary-brand"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </motion.div>

        {/* Grille des soins */}
        <AnimatePresence mode="wait">
          <motion.div
            key={categorieActive}
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="mt-12 grid gap-px border border-border-brand bg-border-brand sm:grid-cols-2 lg:grid-cols-3"
          >
            {soinsFiltres.map((soin) => (
              <SoinCard key={soin.slug} soin={soin} />
            ))}
          </motion.div>
        </AnimatePresence>

        {soinsFiltres.length === 0 && (
          <p className="mt-12 text-center font-body text-sm text-text-muted-brand">
            Aucun soin trouvé dans cette catégorie.
          </p>
        )}
      </div>
    </section>
  )
}

// ─── Hero section (animée) ───────────────────────────────────────

interface HeroSoinsProps {
  nombreSoins: number
  heroIcones: Array<{ emoji: string; label: string }>
}

export function HeroSoins({ nombreSoins, heroIcones }: HeroSoinsProps) {
  return (
    <section className="relative overflow-hidden bg-linear-to-br from-primary-brand via-primary-brand/95 to-primary-dark px-6 py-24 sm:py-32 lg:px-10">
      {/* Décorations de fond */}
      <div className="absolute inset-0 opacity-[0.07]">
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-gold blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-white blur-3xl" />
        <div className="absolute right-1/4 top-1/2 h-64 w-64 rounded-full bg-gold blur-2xl" />
      </div>
      {/* Motif lignes */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, transparent, transparent 60px, rgba(255,255,255,0.1) 60px, rgba(255,255,255,0.1) 61px)",
        }}
      />

      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="relative mx-auto max-w-4xl text-center"
      >
        <span className="inline-block bg-gold/20 px-4 py-1.5 font-body text-[10px] uppercase tracking-[0.2em] text-gold border border-gold/30">
          Notre expertise
        </span>
        <h1 className="mt-6 font-display text-4xl font-light text-white sm:text-5xl lg:text-6xl">
          Nos Soins &amp; <em className="text-gold italic">Services</em>
        </h1>
        <p className="mx-auto mt-5 max-w-xl font-body text-[15px] font-light leading-relaxed text-white/75">
          Découvrez notre gamme complète de soins pour votre beauté, votre
          bien-être et votre santé. {nombreSoins} soins experts à votre service.
        </p>
        <div className="mt-8 flex items-center justify-center gap-6">
          {heroIcones.map((ic, idx) => (
            <div key={ic.label} className="flex items-center gap-2">
              {idx > 0 && <div className="h-6 w-px bg-white/15 mr-4" />}
              <div className="flex h-10 w-10 items-center justify-center border border-gold/40 bg-gold/10">
                <span className="text-[18px]">{ic.emoji}</span>
              </div>
              <span className="font-body text-[11px] text-white/60 uppercase tracking-wider">
                {ic.label}
              </span>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-8 h-px w-20 bg-gold/40" />
      </motion.div>
    </section>
  )
}

// ─── Section Forfaits (animée) ───────────────────────────────────

export function ForfaitsSection({ forfaits }: { forfaits: ForfaitDB[] }) {
  return (
    <section className="border-t border-border-brand bg-white px-6 py-20 lg:px-10 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <motion.div
          variants={fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="text-center"
        >
          <SectionTag>Économisez</SectionTag>
          <h2 className="mt-4 font-display text-[28px] font-light text-text-main sm:text-[34px]">
            Nos Forfaits <em className="text-primary-brand">Combinés</em>
          </h2>
          <p className="mx-auto mt-3 max-w-lg font-body text-[13px] text-text-mid">
            Combinez plusieurs soins et bénéficiez de tarifs préférentiels.
            Chaque forfait est conçu pour une expérience complète.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {forfaits.map((forfait) => (
            <ForfaitCard key={forfait.slug} forfait={forfait} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ─── Section Avantages (animée) ──────────────────────────────────

interface Avantage {
  icon: string
  titre: string
  description: string
}

export function AvantagesSection({ avantages }: { avantages: Avantage[] }) {
  return (
    <section className="border-t border-border-brand bg-bg-page px-6 py-20 lg:px-10 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <motion.div
          variants={fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="text-center"
        >
          <SectionTag>Notre différence</SectionTag>
          <h2 className="mt-4 font-display text-[28px] font-light text-text-main sm:text-[34px]">
            Pourquoi choisir{" "}
            <em className="text-primary-brand">Le Surnaturel de Dieu</em>
          </h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="mt-12 grid gap-px border border-border-brand bg-border-brand sm:grid-cols-2 lg:grid-cols-3"
        >
          {avantages.map((avantage, index) => {
            const Icon = getIcon(avantage.icon)
            return (
              <motion.div
                key={index}
                variants={staggerItem}
                className="flex gap-4 bg-white p-7 transition-colors duration-300 hover:bg-bg-page"
              >
                <Icon
                  size={24}
                  className="mt-0.5 shrink-0 text-gold"
                />
                <div>
                  <h3 className="font-display text-[16px] font-light text-text-main">
                    {avantage.titre}
                  </h3>
                  <p className="mt-2 font-body text-[13px] leading-relaxed text-text-muted-brand">
                    {avantage.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

// ─── Section FAQ (animée) ────────────────────────────────────────

interface FaqSoinsProps {
  faqs: Array<{ question: string; reponse: string }>
}

export function FaqSoinsSection({ faqs }: FaqSoinsProps) {
  return (
    <section className="border-t border-border-brand bg-white px-6 py-20 lg:px-10 lg:py-24">
      <div className="mx-auto max-w-3xl">
        <motion.div
          variants={fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="text-center"
        >
          <SectionTag>Questions fréquentes</SectionTag>
          <h2 className="mt-4 font-display text-[28px] font-light text-text-main sm:text-[34px]">
            Tout savoir sur <em className="text-primary-brand">nos soins</em>
          </h2>
          <p className="mx-auto mt-3 max-w-lg font-body text-[13px] text-text-mid">
            Retrouvez les réponses aux questions les plus fréquemment posées.
          </p>
        </motion.div>

        <div className="mt-12">
          <FaqSection faqs={faqs} />
        </div>
      </div>
    </section>
  )
}

// ─── Bandeau Promo ───────────────────────────────────────────────

interface PromoData {
  actif: boolean
  texte: string
  code: string
  detail: string
}

export function BandeauPromo({ promo }: { promo: PromoData | null }) {
  if (!promo?.actif) return null
  return (
    <div className="bg-gold px-4 py-2.5 text-center">
      <p className="font-body text-[12px] tracking-wide text-white">
        <span className="font-medium">{promo.texte}</span> avec le code{" "}
        <span className="font-semibold tracking-widest">{promo.code}</span>{" "}
        · {promo.detail}
      </p>
    </div>
  )
}
