"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { motion, useInView } from "framer-motion"
import {
  Flame,
  Sparkles,
  Zap,
  Smile,
  Baby,
  Wand2,
  Star,
  Users,
  Clock,
  Award,
} from "lucide-react"
import SectionTag from "@/components/ui/SectionTag"
import GoldAccent from "@/components/ui/GoldAccent"
import { BtnArrow } from "@/components/ui/buttons"
import {
  fadeInUp,
  fadeInRight,
  staggerContainer,
  staggerItem,
  cardHover,
  buttonHover,
} from "@/lib/animations"

// ─── Données services ────────────────────────────────────────────

interface ServiceCard {
  titre: string
  description: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  href: string
}

const SERVICES: ServiceCard[] = [
  {
    titre: "Hammam Royal",
    description:
      "Bain de vapeur purifiant inspiré des traditions orientales, pour éliminer les toxines et ouvrir les pores en profondeur.",
    icon: Flame,
    href: "/soins/hammam-royal",
  },
  {
    titre: "Gommage Corps Luxe",
    description:
      "Exfoliation douce aux huiles précieuses et sucres naturels pour une peau soyeuse et lumineuse.",
    icon: Sparkles,
    href: "/soins/gommage-corps-luxe",
  },
  {
    titre: "Soin Amincissant Expert",
    description:
      "Modelage drainant ciblé pour affiner la silhouette et tonifier les zones rebelles.",
    icon: Zap,
    href: "/soins/soin-amincissant-expert",
  },
  {
    titre: "Soin Visage Éclat",
    description:
      "Soin complet du visage pour un teint éclatant, adapté à chaque type de peau.",
    icon: Smile,
    href: "/soins/soin-visage-eclat",
  },
  {
    titre: "Programme Post-Accouchement",
    description:
      "Accompagnement bienveillant pour retrouver confort, tonicité et sérénité après bébé.",
    icon: Baby,
    href: "/soins/programme-post-accouchement",
  },
  {
    titre: "Conseil Esthétique",
    description:
      "Consultation experte pour définir votre routine beauté idéale et entièrement sur mesure.",
    icon: Wand2,
    href: "/soins/conseil-esthetique",
  },
]

// ─── useCountUp hook ─────────────────────────────────────────────

function useCountUp(end: number, duration = 2000) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  useEffect(() => {
    if (!isInView || started) return
    setStarted(true)
    let start = 0
    const step = end / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [isInView, end, duration, started])

  return { count, ref }
}

// ─── Données chiffres clés ───────────────────────────────────────

interface ChiffreCle {
  valeur: number
  suffix: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}

const CHIFFRES: ChiffreCle[] = [
  { valeur: 500, suffix: "+", label: "Clientes satisfaites", icon: Users },
  { valeur: 8, suffix: "", label: "Soins disponibles", icon: Clock },
  { valeur: 10, suffix: " ans", label: "D'expérience", icon: Award },
]

// ─── Données témoignages ─────────────────────────────────────────

interface Temoignage {
  nom: string
  texte: string
  etoiles: number
  soin?: string
}

const TEMOIGNAGES_FALLBACK: Temoignage[] = [
  {
    nom: "Adjoua K. — Cocody",
    texte:
      "Depuis que je fais le hammam royal chez Le Surnaturel de Dieu, ma peau a complètement changé. L'accueil est chaleureux, le cadre est apaisant, et Marie Jeanne prend le temps de comprendre vos besoins. C'est mon rituel mensuel !",
    etoiles: 5,
  },
  {
    nom: "Fatou D. — Plateau",
    texte:
      "J'ai découvert l'institut après mon deuxième accouchement, sur les conseils d'une amie. Le programme post-accouchement m'a vraiment aidée à retrouver confiance en moi. L'équipe est bienveillante et très professionnelle.",
    etoiles: 5,
  },
  {
    nom: "Mariam T. — Yopougon",
    texte:
      "Le soin visage éclat est tout simplement extraordinaire ! Ma peau n'a jamais été aussi lumineuse. Je recommande vivement cet institut à toutes les femmes d'Abidjan qui veulent prendre soin d'elles.",
    etoiles: 5,
  },
]

// ─── Page Accueil ────────────────────────────────────────────────

export default function PageAccueil() {
  const [temoignages, setTemoignages] = useState<Temoignage[]>(TEMOIGNAGES_FALLBACK)

  useEffect(() => {
    fetch("/api/avis/aggregate")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.reviews?.length >= 3) {
          const top = data.reviews
            .filter((r: { note: number; commentaire: string }) => r.note >= 4 && r.commentaire)
            .slice(0, 6)
            .map((r: { user: { prenom: string; nom: string }; commentaire: string; note: number; soin: { nom: string } }) => ({
              nom: `${r.user.prenom} ${r.user.nom.charAt(0)}.`,
              texte: r.commentaire,
              etoiles: r.note,
              soin: r.soin?.nom,
            }))
          if (top.length >= 3) setTemoignages(top)
        }
      })
      .catch(() => {})
  }, [])

  return (
    <>
      {/* ── 1. Hero Section — 2 colonnes ────────────────────────── */}
      <section className="bg-white px-6 py-20 sm:py-28 lg:px-10">
        <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
          {/* Left column */}
          <div>
            <motion.div variants={fadeInUp} initial="initial" animate="animate">
              <SectionTag>Institut de bien-être</SectionTag>
            </motion.div>
            <motion.h1
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.15 }}
              className="mt-6 font-display text-4xl font-light leading-tight text-text-main sm:text-5xl lg:text-6xl"
            >
              Votre bien-être est notre <em className="text-primary-brand">vocation</em>
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.15 }}
              className="mt-6 max-w-lg font-body text-base leading-relaxed text-text-mid"
            >
              Depuis 2015, Marie Jeanne accueille les femmes d&apos;Abidjan dans un espace de sérénité unique, dédié à la beauté naturelle et au bien-être holistique.
            </motion.p>
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.3 }}
              className="mt-10 flex flex-col gap-4 sm:flex-row"
            >
              <motion.div {...buttonHover}>
                <BtnArrow 
                  href="/soins"
                  className="bg-primary-brand text-white border-primary-brand hover:bg-primary-dark hover:border-primary-dark hover:text-white px-7 py-3.5"
                >
                  Découvrir nos soins
                </BtnArrow>
              </motion.div>
              <motion.div {...buttonHover}>
                <BtnArrow href="/prise-rdv" className="px-7 py-3.5">
                  Prendre rendez-vous
                </BtnArrow>
              </motion.div>
            </motion.div>
          </div>

          {/* Right column — image area */}
          <motion.div
            variants={fadeInRight}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <div className="aspect-[4/5] w-full bg-gradient-to-br from-primary-light to-bg-page" />
            <div className="absolute -bottom-4 -left-4 bg-gold px-5 py-3">
              <p className="font-body text-[10px] font-medium uppercase tracking-[0.15em] text-white">
                Depuis 2015 à Abidjan
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 2. Section soins — grille 3×2 ───────────────────────── */}
      <section className="bg-bg-page px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <motion.div
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-50px" }}
            className="text-center"
          >
            <SectionTag>Nos soins</SectionTag>
            <h2 className="mt-4 font-display text-3xl font-light text-text-main sm:text-4xl">
              Soins &amp; <em className="text-primary-brand">Services</em>
            </h2>
            <p className="mx-auto mt-4 max-w-lg font-body text-sm text-text-mid">
              Des soins sur mesure pour votre beauté, votre santé et votre sérénité
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-50px" }}
            className="mt-14 grid gap-px border border-border-brand bg-border-brand sm:grid-cols-2 lg:grid-cols-3"
          >
            {SERVICES.map((service) => (
              <motion.div
                key={service.titre}
                variants={staggerItem}
                {...cardHover}
                className="group flex flex-col bg-white p-8 transition-colors duration-300 hover:bg-bg-page"
              >
                <service.icon
                  size={24}
                  className="text-gold"
                />
                <h3 className="mt-5 font-display text-xl font-light text-text-main">
                  {service.titre}
                </h3>
                <p className="mt-2 flex-1 font-body text-[13px] leading-relaxed text-text-muted-brand">
                  {service.description}
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <BtnArrow href={service.href}>
                    En savoir plus
                  </BtnArrow>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── 3. Section chiffres clés — fond vert ────────────────── */}
      <section className="bg-primary-brand px-6 py-20 lg:px-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-12 sm:flex-row sm:gap-0">
          {CHIFFRES.map((chiffre, i) => (
            <ChiffreAnimé key={chiffre.label} chiffre={chiffre} index={i} />
          ))}
        </div>
      </section>

      {/* ── 4. Section témoignages — fond doré ──────────────────── */}
      <section className="bg-gold-light px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <motion.div
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-50px" }}
            className="text-center"
          >
            <SectionTag>Témoignages</SectionTag>
            <h2 className="mt-4 font-display text-3xl font-light text-text-main sm:text-4xl">
              Ce que disent nos <em className="text-primary-brand">clientes</em>
            </h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-50px" }}
            className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
          >
            {temoignages.map((temoignage, idx) => (
              <motion.div
                key={temoignage.nom + idx}
                variants={staggerItem}
                {...cardHover}
                className="border-t-2 border-gold bg-white p-8"
              >
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={
                        i < temoignage.etoiles
                          ? "fill-gold text-gold"
                          : "text-border-brand"
                      }
                    />
                  ))}
                </div>
                <p className="mt-4 font-body text-[13px] leading-relaxed text-text-mid">
                  &ldquo;{temoignage.texte}&rdquo;
                </p>
                <p className="mt-5 font-display text-sm font-medium text-text-main">
                  {temoignage.nom}
                </p>
                {temoignage.soin && (
                  <p className="font-body text-[11px] text-gold">{temoignage.soin}</p>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── 5. Section CTA finale ───────────────────────────────── */}
      <section className="bg-white px-6 py-20 lg:px-10">
        <motion.div
          variants={fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-50px" }}
          className="mx-auto max-w-2xl text-center"
        >
          <GoldAccent className="mb-6" />
          <h2 className="font-display text-3xl font-light text-text-main sm:text-4xl">
            Prête à prendre soin de <em className="text-primary-brand">vous</em> ?
          </h2>
          <p className="mt-4 font-body text-sm text-text-mid">
            Réservez votre créneau en quelques clics et offrez-vous un moment de
            bien-être sur mesure.
          </p>
          <div className="mt-8">
            <motion.div {...buttonHover} className="inline-block">
              <BtnArrow 
                href="/prise-rdv"
                className="bg-primary-brand text-white border-primary-brand hover:bg-primary-dark hover:border-primary-dark hover:text-white px-8 py-4"
              >
                Réserver maintenant
              </BtnArrow>
            </motion.div>
          </div>
        </motion.div>
      </section>
    </>
  )
}

// ─── Composant chiffre animé ────────────────────────────────────

function ChiffreAnimé({ chiffre, index }: { chiffre: ChiffreCle; index: number }) {
  const { count, ref } = useCountUp(chiffre.valeur)
  return (
    <motion.div
      ref={ref}
      variants={fadeInUp}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      transition={{ delay: index * 0.15 }}
      className="flex flex-1 flex-col items-center text-center"
    >
      <p className="font-display text-5xl font-light text-white">
        {count}{chiffre.suffix}
      </p>
      <p className="mt-2 font-body text-[11px] font-medium uppercase tracking-[0.15em] text-white/70">
        {chiffre.label}
      </p>
    </motion.div>
  )
}
