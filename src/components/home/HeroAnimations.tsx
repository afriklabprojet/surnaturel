"use client"

import { useRef, useState, useEffect } from "react"
import { motion, useInView } from "framer-motion"
import Image from "next/image"
import { Star, Users, Clock, Award, Play, X } from "lucide-react"
import { getIcon } from "@/lib/icon-map"
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

// ─── Types ───────────────────────────────────────────────────────

interface ServiceCard {
  slug: string
  nom: string
  description: string
  icon?: string | null
}

interface Temoignage {
  nom: string
  texte: string
  etoiles: number
  soin?: string
}

interface VideoTemoignage {
  id: string
  titre: string
  clientNom: string
  soinNom?: string | null
  videoUrl: string
  thumbnailUrl?: string | null
  duree?: number | null
  description?: string | null
  vedette: boolean
}

interface ChiffreCle {
  valeur: number
  suffix: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}

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

const CHIFFRES: ChiffreCle[] = [
  { valeur: 500, suffix: "+", label: "Clientes satisfaites", icon: Users },
  { valeur: 8, suffix: "", label: "Soins disponibles", icon: Clock },
  { valeur: 10, suffix: " ans", label: "D'expérience", icon: Award },
]

// ─── Hero Section (animated) ─────────────────────────────────────

export function HeroSection() {
  return (
    <section className="bg-white px-6 py-20 sm:py-28 lg:px-10">
      <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
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

        <motion.div
          variants={fadeInRight}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.2 }}
          className="relative"
        >
          <div className="aspect-4/5 w-full overflow-hidden bg-linear-to-br from-primary-light to-bg-page relative">
            <Image
              src="/images/hero.jpg"
              alt="Institut Le Surnaturel de Dieu — Espace de bien-être à Abidjan"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          <div className="absolute -bottom-4 -left-4 bg-gold px-5 py-3">
            <p className="font-body text-[10px] font-medium uppercase tracking-[0.15em] text-white">
              Depuis 2015 à Abidjan
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Services Grid (animated) ────────────────────────────────────

export function ServicesSection({ services }: { services: ServiceCard[] }) {
  return (
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
          {services.map((service) => {
            const ServiceIcon = getIcon(service.icon)
            return (
              <motion.div
                key={service.nom}
                variants={staggerItem}
                {...cardHover}
                className="group flex flex-col bg-white p-8 transition-colors duration-300 hover:bg-bg-page"
              >
                <ServiceIcon size={24} className="text-gold" />
                <h3 className="mt-5 font-display text-xl font-light text-text-main">
                  {service.nom}
                </h3>
                <p className="mt-2 flex-1 font-body text-[13px] leading-relaxed text-text-muted-brand">
                  {service.description}
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <BtnArrow href={`/soins/${service.slug}`}>En savoir plus</BtnArrow>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

// ─── Chiffres clés (animated countup) ────────────────────────────

function ChiffreAnime({ chiffre, index }: { chiffre: ChiffreCle; index: number }) {
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

export function ChiffresSection() {
  return (
    <section className="bg-primary-brand px-6 py-20 lg:px-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-12 sm:flex-row sm:gap-0">
        {CHIFFRES.map((chiffre, i) => (
          <ChiffreAnime key={chiffre.label} chiffre={chiffre} index={i} />
        ))}
      </div>
    </section>
  )
}

// ─── Témoignages (animated) ──────────────────────────────────────

export function TemoignagesSection({ temoignages }: { temoignages: Temoignage[] }) {
  return (
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
  )
}

// ─── Témoignages Vidéo (animated) ────────────────────────────────

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : null
}

function getYouTubeThumbnail(url: string): string | null {
  const id = getYouTubeId(url)
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null
}

function getYouTubeEmbed(url: string): string {
  const id = getYouTubeId(url)
  return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : url
}

function formatDuration(seconds?: number | null): string {
  if (!seconds) return ""
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  return `${min}:${sec.toString().padStart(2, "0")}`
}

export function VideoTemoignagesSection({ videos }: { videos: VideoTemoignage[] }) {
  const [playingUrl, setPlayingUrl] = useState<string | null>(null)

  if (videos.length === 0) return null

  // Prendre les 3 premières vidéos vedettes ou les premières disponibles
  const displayVideos = videos.slice(0, 3)

  return (
    <section className="bg-white px-6 py-20 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <motion.div
          variants={fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-50px" }}
          className="text-center"
        >
          <SectionTag>Témoignages vidéo</SectionTag>
          <h2 className="mt-4 font-display text-3xl font-light text-text-main sm:text-4xl">
            Elles partagent leur <em className="text-primary-brand">expérience</em>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl font-body text-sm text-text-mid">
            Découvrez les témoignages authentiques de nos clientes satisfaites
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-50px" }}
          className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
        >
          {displayVideos.map((video) => {
            const thumbnail = video.thumbnailUrl || getYouTubeThumbnail(video.videoUrl)
            return (
              <motion.div
                key={video.id}
                variants={staggerItem}
                {...cardHover}
                className="group cursor-pointer border border-border-brand bg-white transition-shadow hover:shadow-lg"
                onClick={() => setPlayingUrl(video.videoUrl)}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video overflow-hidden bg-gray-100">
                  {thumbnail && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumbnail}
                      alt={video.titre}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                  {/* Play button */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/40">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform group-hover:scale-110">
                      <Play className="ml-1 h-7 w-7 text-primary-brand" fill="currentColor" />
                    </div>
                  </div>
                  {/* Duration */}
                  {video.duree && (
                    <span className="absolute bottom-3 right-3 bg-black/70 px-2 py-1 font-body text-[11px] text-white">
                      {formatDuration(video.duree)}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-5">
                  <h3 className="font-display text-lg font-medium text-text-main line-clamp-1">
                    {video.titre}
                  </h3>
                  <p className="mt-1 font-body text-[12px] text-primary-brand">
                    {video.clientNom}
                    {video.soinNom && ` — ${video.soinNom}`}
                  </p>
                  {video.description && (
                    <p className="mt-2 line-clamp-2 font-body text-[13px] text-text-mid">
                      {video.description}
                    </p>
                  )}
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {videos.length > 3 && (
          <motion.div
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="mt-10 text-center"
          >
            <BtnArrow href="/temoignages">Voir tous les témoignages</BtnArrow>
          </motion.div>
        )}
      </div>

      {/* Video modal */}
      {playingUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setPlayingUrl(null)}
        >
          <button
            onClick={() => setPlayingUrl(null)}
            className="absolute right-4 top-4 text-white/80 hover:text-white"
          >
            <X size={32} />
          </button>
          <div
            className="aspect-video w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={getYouTubeEmbed(playingUrl)}
              className="h-full w-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </section>
  )
}

// ─── CTA finale (animated) ───────────────────────────────────────

export function CTASection() {
  return (
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
  )
}
