"use client"

import { useState } from "react"
import { Clock } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { formatPrix } from "@/lib/utils"
import { SOINS_DATA, CATEGORIES_FILTRE } from "@/lib/soins-data"
import SectionTag from "@/components/ui/SectionTag"
import { BtnArrow } from "@/components/ui/buttons"
import { fadeInUp, staggerContainer, staggerItem, cardHover } from "@/lib/animations"

export default function PageSoins() {
  const [categorieActive, setCategorieActive] = useState("TOUS")

  const soinsFiltres =
    categorieActive === "TOUS"
      ? SOINS_DATA
      : SOINS_DATA.filter((s) => s.categorie === categorieActive)

  return (
    <>
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
            bien-être et votre santé.
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
                className={`px-5 py-2.5 font-body text-[11px] font-medium uppercase tracking-[0.1em] transition-colors duration-300 ${
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
                <motion.div
                  key={soin.slug}
                  variants={staggerItem}
                  {...cardHover}
                  className="group flex flex-col bg-white transition-colors duration-300 hover:bg-bg-page"
                >
                  {/* Image placeholder */}
                  <div className="relative flex h-48 items-center justify-center bg-gradient-to-br from-primary-light to-bg-page">
                    <soin.icon
                      size={40}
                      className="text-gold opacity-40"
                    />
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

                    <p className="mt-3 flex-1 font-body text-[13px] leading-relaxed text-text-muted-brand">
                      {soin.description}
                    </p>

                    <div className="mt-5 flex items-center justify-between gap-3 pt-4 border-t border-border-brand">
                      <BtnArrow href={`/soins/${soin.slug}`}>
                        En savoir plus
                      </BtnArrow>
                      <BtnArrow href={`/prise-rdv?soin=${soin.slug}`}>
                        Réserver
                      </BtnArrow>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Message si aucun résultat */}
          {soinsFiltres.length === 0 && (
            <p className="mt-12 text-center font-body text-sm text-text-muted-brand">
              Aucun soin trouvé dans cette catégorie.
            </p>
          )}
        </div>
      </section>
    </>
  )
}
