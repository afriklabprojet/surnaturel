import Link from "next/link"
import { notFound } from "next/navigation"
import { Clock, Tag, Check, ArrowLeft, Gift } from "lucide-react"
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
      {/* Hero Section */}
      <section className="relative h-[35vh] min-h-64 w-full overflow-hidden lg:h-[40vh]">
        {/* Fond gradient multicouche */}
        <div className="absolute inset-0 bg-linear-to-br from-primary-brand via-primary-brand/90 to-primary-dark" />
        {/* Orbes décoratives */}
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-gold/15 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        {/* Icône centrée */}
        <div className="absolute inset-0 flex items-center justify-center">
          <SoinIcon size={140} className="text-white opacity-[0.06]" />
        </div>
        {/* Overlay gradient bas */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/50 via-black/20 to-transparent" />
        {/* Motif lignes */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 80px, rgba(255,255,255,0.1) 80px, rgba(255,255,255,0.1) 81px)" }} />

        {/* Badge catégorie */}
        <div className="absolute left-6 top-6 lg:left-10 lg:top-10">
          <span className="inline-flex items-center gap-2 bg-gold/90 backdrop-blur-sm px-4 py-2 font-body text-[10px] uppercase tracking-[0.15em] text-white shadow-lg">
            <Tag size={11} />
            {soin.categorie.replace(/_/g, " ")}
          </span>
        </div>

        {/* Badge soin si présent */}
        {soin.badge && (
          <div className="absolute right-6 top-6 lg:right-10 lg:top-10">
            <span className="inline-flex items-center gap-2 bg-white/95 backdrop-blur-sm px-4 py-2 font-body text-[10px] uppercase tracking-[0.15em] text-primary-brand shadow-lg">
              <Gift size={11} />
              {soin.badge}
            </span>
          </div>
        )}

        {/* Titre + infos */}
        <div className="absolute inset-x-0 bottom-0 px-6 pb-12 lg:px-10 lg:pb-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-3 h-px w-16 bg-gold" />
            <h1 className="font-display text-[36px] font-light text-white sm:text-[44px] lg:text-[56px] drop-shadow-lg">
              {soin.nom}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 font-body text-[12px] text-white">
                <Clock size={13} className="text-gold" />
                {soin.duree} min
              </span>
              <span className="flex items-center gap-2 bg-gold/20 backdrop-blur-sm px-3 py-1.5 font-body text-[13px] font-medium text-white">
                {formatPrix(soin.prix)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Fil d'Ariane */}
      <div className="border-b border-border-brand bg-white px-6 py-3 lg:px-10">
        <div className="mx-auto flex max-w-7xl items-center gap-2 font-body text-[12px] text-text-muted-brand">
          <Link href="/soins" className="flex items-center gap-1 transition-colors duration-300 hover:text-primary-brand">
            <ArrowLeft size={13} />
            Soins &amp; Services
          </Link>
          <span>/</span>
          <span className="font-medium text-text-main">{soin.nom}</span>
        </div>
      </div>

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
