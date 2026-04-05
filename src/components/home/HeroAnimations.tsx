"use client"

import { useRef, useState, useEffect } from "react"
import { motion, useInView } from "framer-motion"
import Image from "next/image"
import { Star, Users, Clock, Award, Play, X } from "lucide-react"
import { getIcon } from "@/lib/icon-map"
import { formatPrix } from "@/lib/utils"
import SectionTag from "@/components/ui/SectionTag"
import GoldAccent from "@/components/ui/GoldAccent"
import { BtnArrow } from "@/components/ui/buttons"
import EmptyState from "@/components/ui/empty-states"
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
  prix?: number | null
  duree?: number | null
  noteMoyenne?: number
  nombreAvis?: number
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
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return
    if (end === 0) { setCount(0); return }
    let current = 0
    const step = end / (duration / 16)
    const timer = setInterval(() => {
      current += step
      if (current >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [isInView, end, duration])

  return { count, ref }
}

// ─── Content prop types ─────────────────────────────────────────

export interface HeroContent {
  tag?: string
  titre?: string
  sousTitre?: string
  cta1?: string
  cta2?: string
  badge?: string
}

interface Stats {
  clientes: number
  soins: number
  annees: number
}

export interface ServicesContent {
  tag?: string
  titre?: string
  sousTitre?: string
}

export interface ChiffresContent {
  label1?: string
  label2?: string
  label3?: string
}

export interface TemoignagesContent {
  tag?: string
  titre?: string
}

export interface VideosContent {
  tag?: string
  titre?: string
  sousTitre?: string
}

export interface CTAContent {
  titre?: string
  sousTitre?: string
  bouton?: string
}

// ─── Données chiffres clés ───────────────────────────────────────

const CHIFFRES_DEFAUT: ChiffreCle[] = [
  { valeur: 500, suffix: "+", label: "Clientes satisfaites", icon: Users },
  { valeur: 8, suffix: "", label: "Soins disponibles", icon: Clock },
  { valeur: new Date().getFullYear() - 2015, suffix: " ans", label: "D'expérience", icon: Award },
]

// ─── Hero Section (animated) ─────────────────────────────────────

export function HeroSection({ content, stats }: { content?: HeroContent; stats?: Stats }) {
  const tag = content?.tag || "Institut de bien-être"
  const titre = content?.titre || "Votre bien-être est notre vocation"
  const sousTitre = content?.sousTitre || "Depuis 2015, Marie Jeanne accueille les femmes d'Abidjan dans un espace de sérénité unique, dédié à la beauté naturelle et au bien-être holistique."
  const cta1 = content?.cta1 || "Découvrir nos soins"
  const cta2 = content?.cta2 || "Prendre rendez-vous"
  const badge = content?.badge || "Depuis 2015 à Abidjan"
  const nombreClientes = stats?.clientes ?? 500
  return (
    <section className="bg-white px-6 py-20 sm:py-28 lg:px-10">
      <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
        <div>
          <motion.div variants={fadeInUp} initial="initial" animate="animate">
            <SectionTag>{tag}</SectionTag>
          </motion.div>
          <motion.h1
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.15 }}
            className="mt-6 font-display text-4xl font-light leading-tight text-text-main sm:text-5xl lg:text-6xl"
          >
            {titre.includes(" ") ? (
              <>
                {titre.split(" ").slice(0, -1).join(" ")}{" "}
                <em className="text-primary-brand">{titre.split(" ").at(-1)}</em>
              </>
            ) : (
              <em className="text-primary-brand">{titre}</em>
            )}
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.15 }}
            className="mt-6 max-w-lg font-body text-base leading-relaxed text-text-mid"
          >
            {sousTitre}
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
                {cta1}
              </BtnArrow>
            </motion.div>
            <motion.div {...buttonHover}>
              <BtnArrow href="/prise-rdv" className="px-7 py-3.5">
                {cta2}
              </BtnArrow>
            </motion.div>
          </motion.div>
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.45 }}
            className="mt-6 flex items-center gap-3"
          >
            <div className="flex gap-1" role="img" aria-label="5 étoiles sur 5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={13} className="fill-gold text-gold" aria-hidden="true" />
              ))}
            </div>
            <p className="font-body text-[12px] text-text-mid">
              <strong className="text-text-main">{nombreClientes}+ clientes</strong> nous font confiance
            </p>
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
            <p className="font-body text-xs font-medium uppercase tracking-[0.15em] text-white">
              {badge}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Services Grid (animated) ────────────────────────────────────

export function ServicesSection({ services, content }: { services: ServiceCard[]; content?: ServicesContent }) {
  const tag = content?.tag || "Nos soins"
  const titre = content?.titre || "Soins & Services"
  const sousTitre = content?.sousTitre || "Des soins sur mesure pour votre beauté, votre santé et votre sérénité"
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
          <SectionTag>{tag}</SectionTag>
          <h2 className="mt-4 font-display text-3xl font-light text-text-main sm:text-4xl">
            {titre}
          </h2>
          <p className="mx-auto mt-4 max-w-lg font-body text-sm text-text-mid">
            {sousTitre}
          </p>
        </motion.div>

        {services.length > 0 ? (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-50px" }}
            className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {services.map((service) => {
              const ServiceIcon = getIcon(service.icon)
              return (
                <motion.div
                  key={service.nom}
                  variants={staggerItem}
                  {...cardHover}
                  className="group relative flex flex-col border border-border-brand bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-primary-brand to-gold opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden="true" />
                  <ServiceIcon size={24} className="text-gold" />
                  <h3 className="mt-5 font-display text-xl font-light text-text-main">
                    {service.nom}
                  </h3>
                  <p className="mt-2 flex-1 font-body text-[13px] leading-relaxed text-text-muted-brand">
                    {service.description}
                  </p>
                  {(service.nombreAvis ?? 0) > 0 && (
                    <div className="mt-3 flex items-center gap-1.5">
                      <div className="flex gap-0.5" role="img" aria-label={`${(service.noteMoyenne ?? 0).toFixed(1)} étoiles sur 5`}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            size={12}
                            aria-hidden="true"
                            className={
                              i < Math.round(service.noteMoyenne ?? 0)
                                ? "fill-gold text-gold"
                                : "text-border-brand"
                            }
                          />
                        ))}
                      </div>
                      <span className="font-body text-[11px] text-text-muted-brand">
                        ({service.nombreAvis})
                      </span>
                    </div>
                  )}
                  {(service.prix != null || service.duree != null) && (
                    <div className="mt-3 flex items-center gap-3">
                      {service.prix != null && (
                        <span className="font-body text-sm font-semibold text-primary-brand">
                          {formatPrix(service.prix)}
                        </span>
                      )}
                      {service.duree != null && (
                        <span className="flex items-center gap-1 font-body text-[12px] text-text-muted-brand">
                          <Clock size={12} aria-hidden="true" />
                          {service.duree} min
                        </span>
                      )}
                    </div>
                  )}
                  <div className="mt-4 flex flex-col gap-2">
                    <BtnArrow href={`/soins/${service.slug}`}>En savoir plus</BtnArrow>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        ) : (
          <div className="mt-14 flex flex-col items-center gap-4 border border-border-brand bg-white py-16 text-center">
            <Star size={28} className="text-gold/40" />
            <p className="font-display text-2xl font-light text-text-muted-brand">
              Nos soins arrivent bientôt
            </p>
            <p className="font-body text-sm text-text-muted-brand">
              Revenez très vite pour découvrir nos prestations.
            </p>
            <BtnArrow href="/contact">Nous contacter</BtnArrow>
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Chiffres clés (animated countup) ────────────────────────────

function ChiffreAnime({ chiffre, index }: { chiffre: ChiffreCle; index: number }) {
  const { count, ref } = useCountUp(chiffre.valeur)
  const Icon = chiffre.icon
  return (
    <div ref={ref} className="flex flex-1 px-8 py-4">
      <motion.div
        variants={fadeInUp}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        transition={{ delay: index * 0.15 }}
        className="flex flex-1 flex-col items-center gap-2 text-center"
      >
        <Icon size={22} className="text-gold" />
        <p className="font-display text-4xl sm:text-6xl font-light text-white">
          {count}{chiffre.suffix}
        </p>
        <div className="h-px w-8 bg-gold/60" />
        <p className="font-body text-xs font-medium uppercase tracking-[0.15em] text-white/70">
          {chiffre.label}
        </p>
      </motion.div>
    </div>
  )
}

export function ChiffresSection({ stats, content }: { stats?: { clientes: number; soins: number; annees: number }; content?: ChiffresContent }) {
  const label1 = content?.label1 || "Clientes satisfaites"
  const label2 = content?.label2 || "Soins disponibles"
  const label3 = content?.label3 || "D'expérience"
  const chiffres: ChiffreCle[] = stats
    ? [
        { valeur: stats.clientes, suffix: "+", label: label1, icon: Users },
        { valeur: stats.soins, suffix: "", label: label2, icon: Clock },
        { valeur: stats.annees, suffix: " ans", label: label3, icon: Award },
      ]
    : [
        { valeur: 500, suffix: "+", label: label1, icon: Users },
        { valeur: 8, suffix: "", label: label2, icon: Clock },
        { valeur: 10, suffix: " ans", label: label3, icon: Award },
      ]

  return (
    <section className="relative bg-primary-brand px-6 py-24 lg:px-10">
      <div className="relative mx-auto max-w-5xl">
        <div className="flex flex-col items-center gap-12 sm:flex-row sm:divide-x sm:divide-white/20 sm:gap-0">
          {chiffres.map((chiffre, i) => (
            <ChiffreAnime key={chiffre.label} chiffre={chiffre} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Témoignages (animated) ──────────────────────────────────────

export function TemoignagesSection({ temoignages, content }: { temoignages: Temoignage[]; content?: TemoignagesContent }) {
  const tag = content?.tag || "Témoignages"
  const titre = content?.titre || "Ce que disent nos clientes"
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
          <SectionTag>{tag}</SectionTag>
          <h2 className="mt-4 font-display text-3xl font-light text-text-main sm:text-4xl">
            {titre}
          </h2>
        </motion.div>

        {temoignages.length === 0 ? (
          <EmptyState 
            type="temoignages" 
            className="mt-14 bg-white/50 rounded-xl"
          />
        ) : (
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
                className="relative border border-border-brand bg-white p-8 transition-shadow duration-300 hover:shadow-md"
              >
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gold" aria-hidden="true" />
                <span className="pointer-events-none absolute right-5 top-4 select-none font-display text-[72px] leading-none text-gold/10" aria-hidden="true">&ldquo;</span>
                <div className="flex gap-1" role="img" aria-label={`${temoignage.etoiles} étoiles sur 5`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      aria-hidden="true"
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
                  <p className="font-body text-xs text-gold">{temoignage.soin}</p>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  )
}

// ─── Témoignages Vidéo (animated) ────────────────────────────────

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : null
}

function isCloudinaryVideo(url: string): boolean {
  return url.includes("cloudinary.com") && url.includes("/video/")
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

export function VideoTemoignagesSection({ videos, content }: { videos: VideoTemoignage[]; content?: VideosContent }) {
  const [playingUrl, setPlayingUrl] = useState<string | null>(null)
  const tag = content?.tag || "Témoignages vidéo"
  const titre = content?.titre || "Elles partagent leur expérience"
  const sousTitre = content?.sousTitre || "Découvrez les témoignages authentiques de nos clientes satisfaites"

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
          <SectionTag>{tag}</SectionTag>
          <h2 className="mt-4 font-display text-3xl font-light text-text-main sm:text-4xl">
            {titre}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl font-body text-sm text-text-mid">
            {sousTitre}
          </p>
        </motion.div>

        {videos.length === 0 ? (
          <EmptyState 
            type="videos" 
            className="mt-14"
          />
        ) : (
          <>
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
                          loading="lazy"
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
                        <span className="absolute bottom-3 right-3 bg-black/70 px-2 py-1 font-body text-xs text-white">
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
          </>
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
            {isCloudinaryVideo(playingUrl) ? (
              <video
                src={playingUrl}
                controls
                autoPlay
                className="h-full w-full bg-black"
              />
            ) : (
              <iframe
                src={getYouTubeEmbed(playingUrl)}
                className="h-full w-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            )}
          </div>
        </div>
      )}
    </section>
  )
}

// ─── CTA finale (animated) ───────────────────────────────────────

export function CTASection({ content }: { content?: CTAContent }) {
  const titre = content?.titre || "Prête à prendre soin de vous ?"
  const sousTitre = content?.sousTitre || "Réservez votre créneau en quelques clics et offrez-vous un moment de bien-être sur mesure."
  const bouton = content?.bouton || "Réserver maintenant"
  return (
    <section className="relative bg-primary-brand px-6 py-24 lg:px-10">
      <motion.div
        variants={fadeInUp}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-50px" }}
        className="relative mx-auto max-w-2xl text-center"
      >
        <div className="mb-6 flex justify-center">
          <GoldAccent />
        </div>
        <h2 className="font-display text-3xl font-light text-white sm:text-4xl lg:text-5xl">
          {titre}
        </h2>
        <p className="mx-auto mt-5 max-w-xl font-body text-base leading-relaxed text-white/75">
          {sousTitre}
        </p>
        <div className="mt-10">
          <motion.div {...buttonHover} className="inline-block">
            <BtnArrow
              href="/prise-rdv"
              className="border-gold bg-gold text-white hover:bg-gold/90 hover:border-gold/90 px-8 py-4"
            >
              {bouton}
            </BtnArrow>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}

// ─── Newsletter Section ──────────────────────────────────────────

export function NewsletterSection() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()

      if (res.ok) {
        setMessage({ type: "success", text: data.message })
        setEmail("")
      } else {
        setMessage({ type: "error", text: data.error || "Une erreur est survenue" })
      }
    } catch {
      setMessage({ type: "error", text: "Erreur de connexion" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bg-cream-light px-6 py-16 lg:px-10">
      <motion.div
        variants={fadeInUp}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-50px" }}
        className="mx-auto max-w-xl text-center"
      >
        <GoldAccent className="mb-4" />
        <h2 className="font-display text-2xl font-light text-text-main sm:text-3xl">
          Restez informée
        </h2>
        <p className="mt-3 font-body text-sm text-text-mid">
          Recevez nos conseils beauté, offres exclusives et actualités directement dans votre boîte mail.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votreemail@exemple.com"
            required
            disabled={loading}
            className="flex-1 border border-border-brand bg-white px-4 py-3 font-body text-sm text-text-main placeholder:text-text-muted-brand/60 focus:border-gold focus:outline-none disabled:opacity-50"
          />
          <motion.button
            {...buttonHover}
            type="submit"
            disabled={loading || !email.trim()}
            className="bg-primary-brand px-6 py-3 font-body text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
          >
            {loading ? "..." : "S'inscrire"}
          </motion.button>
        </form>

        {message && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 font-body text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}
          >
            {message.text}
          </motion.p>
        )}

        <p className="mt-4 font-body text-xs text-text-muted-brand">
          Pas de spam, désinscription possible à tout moment.
        </p>
      </motion.div>
    </section>
  )
}
