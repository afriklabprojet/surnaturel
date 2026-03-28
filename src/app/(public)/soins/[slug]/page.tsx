import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Clock, Tag, Check, ArrowLeft, Gift, ChevronRight } from "lucide-react"
import { formatPrix } from "@/lib/utils"
import { prisma } from "@/lib/prisma"
import { getIcon } from "@/lib/icon-map"
import SectionTag from "@/components/ui/SectionTag"
import { BtnArrow, BtnTextLine } from "@/components/ui/buttons"
import StarRating from "@/components/soins/StarRating"
import SoinAvis from "@/components/soins/SoinAvis"
import type { Metadata } from "next"

// ─── Métadonnées dynamiques ──────────────────────────────────────

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const soin = await prisma.soin.findUnique({ where: { slug }, select: { nom: true, description: true } })
  if (!soin) return { title: "Soin introuvable" }

  return {
    title: `${soin.nom} — Le Surnaturel de Dieu`,
    description: soin.description,
  }
}

// ─── Page détail soin ────────────────────────────────────────────

export default async function PageDetailSoin({ params }: PageProps) {
  const { slug } = await params
  const soin = await prisma.soin.findUnique({ where: { slug } })

  if (!soin || !soin.actif) {
    notFound()
  }

  const etapes = (soin.etapes as Array<{ titre: string; description: string }>) || []
  const bienfaits = soin.bienfaits || []

  // Charger le bandeau promo
  const promoConfig = await prisma.appConfig.findUnique({ where: { cle: "bandeau_promo" } })
  const promo: { actif: boolean; texte: string; code: string; detail: string } | null =
    promoConfig ? JSON.parse(promoConfig.valeur) : null

  // Soins similaires
  const similaires = await prisma.soin.findMany({
    where: { categorie: soin.categorie, slug: { not: slug }, actif: true },
    take: 3,
    orderBy: { ordre: "asc" },
  })

  const soinsSimilaires = similaires.length >= 3
    ? similaires
    : [
        ...similaires,
        ...(await prisma.soin.findMany({
          where: { slug: { notIn: [slug, ...similaires.map(s => s.slug)] }, actif: true },
          take: 3 - similaires.length,
          orderBy: { ordre: "asc" },
        })),
      ]

  const SoinIcon = getIcon(soin.icon)

  return (
    <>
      {/* Hero Section — Design raffiné */}
      <section className="relative w-full overflow-hidden bg-primary-dark">
        {/* Fond — image ou gradient */}
        {soin.imageUrl ? (
          <>
            <Image
              src={soin.imageUrl}
              alt={soin.nom}
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-b from-primary-dark/70 via-primary-dark/50 to-primary-dark/90" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-linear-to-br from-primary-brand via-primary-brand/85 to-primary-dark" />
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(184,151,42,0.4) 1px, transparent 0)", backgroundSize: "48px 48px" }} />
          </>
        )}

        {/* Accents décoratifs */}
        <div className="absolute -right-40 top-1/2 h-125 w-125 -translate-y-1/2 rounded-full bg-gold/8 blur-[120px]" />
        <div className="absolute -left-20 bottom-0 h-60 w-60 rounded-full bg-white/5 blur-[80px]" />

        {/* Ligne dorée en haut */}
        <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-transparent via-gold/60 to-transparent" />

        {/* Overlay gradient bas */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-primary-dark/80 to-transparent" />

        {/* Contenu du hero */}
        <div className="relative mx-auto max-w-7xl px-6 pb-14 pt-10 lg:px-10 lg:pb-16 lg:pt-12">
          {/* Fil d'Ariane */}
          <nav className="mb-10 flex items-center gap-2 font-body text-[11px] text-white/50 lg:mb-14">
            <Link href="/" className="transition-colors hover:text-white/80">Accueil</Link>
            <ChevronRight size={10} className="text-gold/50" />
            <Link href="/soins" className="transition-colors hover:text-white/80">Soins &amp; Services</Link>
            <ChevronRight size={10} className="text-gold/50" />
            <span className="text-white/80">{soin.nom}</span>
          </nav>

          {/* Layout deux colonnes */}
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            {/* Colonne gauche — titre */}
            <div className="max-w-2xl">
              {/* Badges */}
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 border border-gold/40 bg-gold/10 backdrop-blur-sm px-4 py-1.5 font-body text-[10px] uppercase tracking-[0.18em] text-gold">
                  <Tag size={10} />
                  {soin.categorie.replace(/_/g, " ")}
                </span>
                {soin.badge && (
                  <span className="inline-flex items-center gap-2 border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-1.5 font-body text-[10px] uppercase tracking-[0.18em] text-white">
                    <Gift size={10} />
                    {soin.badge}
                  </span>
                )}
              </div>

              {/* Accent doré */}
              <div className="mb-4 flex items-center gap-3">
                <div className="h-px w-10 bg-gold/60" />
                <div className="h-1.5 w-1.5 bg-gold/60" />
              </div>

              <h1 className="font-display text-[32px] font-light leading-[1.1] text-white sm:text-[42px] lg:text-[52px]">
                {soin.nom}
              </h1>

              <p className="mt-4 max-w-lg font-body text-[14px] font-light leading-relaxed text-white/60">
                {soin.description}
              </p>
            </div>

            {/* Colonne droite — infos clés */}
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-3 border border-white/15 bg-white/5 backdrop-blur-sm px-5 py-3">
                <Clock size={16} className="text-gold" />
                <div>
                  <span className="block font-body text-[10px] uppercase tracking-widest text-white/40">Durée</span>
                  <span className="font-display text-[20px] font-light text-white">{soin.duree} <span className="text-[14px] text-white/60">min</span></span>
                </div>
              </div>
              <div className="h-10 w-px bg-gold/30" />
              <div className="flex items-center gap-3 border border-gold/30 bg-gold/10 backdrop-blur-sm px-5 py-3">
                <div>
                  <span className="block font-body text-[10px] uppercase tracking-widest text-gold/60">Prix</span>
                  <span className="font-display text-[20px] font-light text-gold">{formatPrix(soin.prix)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ligne dorée en bas */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent" />
      </section>

      {/* Corps — 2 colonnes */}
      <section className="bg-bg-page px-6 py-16 lg:px-10 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-16">
            {/* Description */}
            <div>
              <div className="flex items-center gap-3 font-body text-[11px] uppercase tracking-[0.15em] text-gold">
                <span className="h-px w-8 bg-gold" />Description<span className="h-px w-8 bg-gold" />
              </div>
              <p className="mt-6 font-body text-[15px] font-light leading-[1.9] text-text-mid">
                {soin.descriptionLongue}
              </p>
            </div>

            {/* Déroulement */}
            {etapes.length > 0 && (
              <div>
                <div className="flex items-center gap-3 font-body text-[11px] uppercase tracking-[0.15em] text-gold">
                  <span className="h-px w-8 bg-gold" />Déroulement du soin<span className="h-px w-8 bg-gold" />
                </div>
                <div className="mt-8 space-y-6">
                  {etapes.map((etape, index) => (
                    <div key={index} className="flex gap-6">
                      <div className="flex flex-col items-center">
                        <span className="font-display text-[28px] font-light text-gold">{String(index + 1).padStart(2, "0")}</span>
                        {index < etapes.length - 1 && <div className="mt-2 h-full w-px bg-gold/30" />}
                      </div>
                      <div className="pb-6">
                        <h3 className="font-display text-[18px] font-light text-text-main">{etape.titre}</h3>
                        <p className="mt-2 font-body text-[13px] leading-relaxed text-text-mid">{etape.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bienfaits */}
            {bienfaits.length > 0 && (
              <div>
                <div className="flex items-center gap-3 font-body text-[11px] uppercase tracking-[0.15em] text-gold">
                  <span className="h-px w-8 bg-gold" />Bienfaits<span className="h-px w-8 bg-gold" />
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {bienfaits.map((bienfait, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check size={18} className="mt-0.5 shrink-0 text-primary-brand" />
                      <span className="font-body text-[13px] text-text-mid">{bienfait}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Carte réservation */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 border border-gold border-t-[3px] bg-white p-6">
              <div className="text-center">
                <span className="font-body text-[10px] uppercase tracking-widest text-text-muted-brand">À partir de</span>
                <p className="mt-1 font-display text-[36px] font-light text-primary-brand">{formatPrix(soin.prix)}</p>
              </div>
              <div className="mt-6 space-y-3 border-t border-b border-border-brand py-6">
                <div className="flex items-center gap-3">
                  <Clock size={18} className="text-gold" />
                  <span className="font-body text-[13px] text-text-mid">{soin.duree} minutes</span>
                </div>
                <div className="flex items-center gap-3">
                  <Tag size={18} className="text-gold" />
                  <span className="font-body text-[13px] text-text-mid">{soin.categorie.replace(/_/g, " ")}</span>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <BtnArrow href={`/prise-rdv?soin=${soin.slug}`} className="w-full justify-center bg-primary-brand text-white border-primary-brand hover:bg-primary-dark hover:border-primary-dark hover:text-white">
                  Réserver ce soin
                </BtnArrow>

                {/* CTA Offrir - plus visible */}
                <Link
                  href={`/prise-rdv?soin=${soin.slug}&cadeau=true`}
                  className="flex w-full items-center justify-center gap-2 border-2 border-gold bg-gold/5 py-3 font-body text-[11px] uppercase tracking-widest text-gold transition-colors duration-300 hover:bg-gold hover:text-white"
                >
                  <Gift size={14} />
                  Offrir ce soin en cadeau
                </Link>
              </div>

              {/* Code promo rappel */}
              {promo?.actif && (
              <div className="mt-4 border border-dashed border-gold/40 bg-gold/5 p-3 text-center">
                <p className="font-body text-[11px] text-gold">
                  Code <span className="font-semibold tracking-widest">{promo.code}</span>
                </p>
                <p className="font-body text-[10px] text-text-muted-brand">{promo.texte}</p>
              </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Section avis - avec avis réels */}
      <section className="border-t border-border-brand bg-white px-6 py-16 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <SectionTag>Témoignages</SectionTag>
          <h2 className="mt-4 text-center font-display text-[28px] font-light text-text-main">
            Ce qu&apos;en disent nos <em className="text-primary-brand">clientes</em>
          </h2>
          <div className="mt-12">
            <SoinAvis soinSlug={slug} />
          </div>
        </div>
      </section>

      {/* Soins similaires */}
      <section className="border-t border-border-brand bg-bg-page px-6 py-16 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <SectionTag>Découvrez aussi</SectionTag>
          <h2 className="mt-4 text-center font-display text-[28px] font-light text-text-main">
            Vous aimerez <em className="text-primary-brand">aussi</em>
          </h2>
          <div className="mt-12 grid gap-px border border-border-brand bg-border-brand sm:grid-cols-2 lg:grid-cols-3">
            {soinsSimilaires.map((autre) => {
              const AutreIcon = getIcon(autre.icon)
              return (
              <div key={autre.slug} className="group flex flex-col bg-white transition-colors duration-300 hover:bg-bg-page">
                <div className="relative flex h-40 items-center justify-center overflow-hidden bg-linear-to-br from-primary-light to-bg-page">
                  <AutreIcon size={36} className="text-gold opacity-30 transition-transform duration-500 group-hover:scale-110" />
                  {autre.badge && (
                    <span className="absolute left-0 top-3 bg-gold px-2 py-0.5 font-body text-[9px] uppercase tracking-[0.12em] text-white">
                      {autre.badge}
                    </span>
                  )}
                </div>
                <div className="p-7">
                  <h3 className="font-display text-lg font-light text-text-main">{autre.nom}</h3>
                  <p className="mt-2 font-body text-[12px] leading-relaxed text-text-muted-brand line-clamp-2">{autre.description}</p>
                  <div className="mt-3 flex items-center gap-3 font-body text-[12px] text-text-muted-brand">
                    <span className="flex items-center gap-1"><Clock size={13} />{autre.duree} min</span>
                    <span className="font-medium text-gold">{formatPrix(autre.prix)}</span>
                  </div>
                  <div className="mt-4">
                    <BtnArrow href={`/soins/${autre.slug}`}>En savoir plus</BtnArrow>
                  </div>
                </div>
              </div>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
