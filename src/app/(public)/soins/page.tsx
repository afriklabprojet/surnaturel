"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { SOINS_DATA, CATEGORIES_FILTRE, FORFAITS_DATA, FAQ_SOINS, AVANTAGES } from "@/lib/soins-data"
import SectionTag from "@/components/ui/SectionTag"
import SoinCard from "@/components/soins/SoinCard"
import ForfaitCard from "@/components/soins/ForfaitCard"
import FaqSection from "@/components/soins/FaqSection"
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/animations"

export default function PageSoins() {
  const [categorieActive, setCategorieActive] = useState("TOUS")

  const soinsFiltres =
    categorieActive === "TOUS"
      ? SOINS_DATA
      : SOINS_DATA.filter((s) => s.categorie === categorieActive)

  return (
    <>
      {/* Bandeau promo */}
      <div className="bg-gold px-4 py-2.5 text-center">
        <p className="font-body text-[12px] tracking-wide text-white">
          <span className="font-medium">−10% sur votre 1er soin</span> avec le code{" "}
          <span className="font-semibold tracking-widest">BIENVENUE10</span>
          {" "}· Offre valable sur tous les soins
        </p>
      </div>

      {/* En-tête */}
      <section className="bg-white px-6 py-20 sm:py-24 lg:px-10">
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="mx-auto max-w-4xl text-center"
        >
          <SectionTag>Notre expertise</SectionTag>
          <h1 className="mt-4 font-display text-4xl font-light text-text-main sm:text-5xl">
            Nos Soins &amp; <em className="text-primary-brand">Services</em>
          </h1>
          <p className="mx-auto mt-4 max-w-lg font-body text-sm text-text-mid">
            Découvrez notre gamme complète de soins pour votre beauté, votre
            bien-être et votre santé. {SOINS_DATA.length} soins experts à votre service.
          </p>
        </motion.div>
      </section>

      {/* Filtres + Grille */}
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
            {CATEGORIES_FILTRE.map((cat) => (
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

      {/* Section Forfaits / Combos */}
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
            {FORFAITS_DATA.map((forfait) => (
              <ForfaitCard key={forfait.slug} forfait={forfait} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Section Pourquoi nous choisir */}
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
              Pourquoi choisir <em className="text-primary-brand">Le Surnaturel de Dieu</em>
            </h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="mt-12 grid gap-px border border-border-brand bg-border-brand sm:grid-cols-2 lg:grid-cols-3"
          >
            {AVANTAGES.map((avantage, index) => (
              <motion.div
                key={index}
                variants={staggerItem}
                className="flex gap-4 bg-white p-7 transition-colors duration-300 hover:bg-bg-page"
              >
                <avantage.icon size={24} className="mt-0.5 shrink-0 text-gold" />
                <div>
                  <h3 className="font-display text-[16px] font-light text-text-main">
                    {avantage.titre}
                  </h3>
                  <p className="mt-2 font-body text-[13px] leading-relaxed text-text-muted-brand">
                    {avantage.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Section FAQ */}
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
            <FaqSection faqs={FAQ_SOINS} />
          </div>
        </div>
      </section>
    </>
  )
}
