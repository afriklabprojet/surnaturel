import Link from "next/link"
import { notFound } from "next/navigation"
import { Clock, Tag, Check, Star, ArrowLeft } from "lucide-react"
import { formatPrix, formatDate } from "@/lib/utils"
import { SOINS_DATA, getSoinBySlug, BIENFAITS_SOINS, ETAPES_SOINS } from "@/lib/soins-data"
import SectionTag from "@/components/ui/SectionTag"
import { BtnArrow, BtnTextLine } from "@/components/ui/buttons"
import type { Metadata } from "next"

// ─── Génération des slugs statiques ──────────────────────────────

export function generateStaticParams(): { slug: string }[] {
  return SOINS_DATA.map((soin) => ({ slug: soin.slug }))
}

// ─── Métadonnées dynamiques ──────────────────────────────────────

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const soin = getSoinBySlug(slug)
  if (!soin) return { title: "Soin introuvable" }

  return {
    title: `${soin.nom} — Le Surnaturel de Dieu`,
    description: soin.description,
  }
}

// ─── Composant étoiles ───────────────────────────────────────────

function StarRating({ note, size = 16 }: { note: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= note ? "fill-gold text-gold" : "text-border-brand"}
        />
      ))}
    </div>
  )
}

// ─── Page détail soin ────────────────────────────────────────────

export default async function PageDetailSoin({ params }: PageProps) {
  const { slug } = await params
  const soin = getSoinBySlug(slug)

  if (!soin) {
    notFound()
  }

  const bienfaits = BIENFAITS_SOINS[slug] || []
  const etapes = ETAPES_SOINS[slug] || []
  const autresSoins = SOINS_DATA.filter(
    (s) => s.slug !== slug && s.categorie === soin.categorie
  ).slice(0, 3)
  
  const soinsSimilaires = autresSoins.length >= 3 
    ? autresSoins 
    : SOINS_DATA.filter((s) => s.slug !== slug).slice(0, 3)

  // Mock avis
  const mockAvis = [
    { id: "1", note: 5, commentaire: "Une expérience exceptionnelle ! L'équipe est aux petits soins.", nom: "Aminata K.", date: new Date("2024-02-15") },
    { id: "2", note: 5, commentaire: "Moment de détente absolue. Les produits sont de qualité.", nom: "Fatou D.", date: new Date("2024-01-28") },
    { id: "3", note: 4, commentaire: "Très satisfaite du résultat. Ma peau n'a jamais été aussi douce.", nom: "Marie L.", date: new Date("2024-01-10") },
  ]
  const noteMoyenne = mockAvis.reduce((acc, a) => acc + a.note, 0) / mockAvis.length

  return (
    <>
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-100 w-full overflow-hidden lg:h-[60vh]">
        <div className="absolute inset-0 bg-linear-to-br from-primary-light via-bg-page to-gold-light">
          <div className="absolute inset-0 flex items-center justify-center">
            <soin.icon size={200} className="text-gold opacity-10" />
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-primary-brand/80 to-transparent" />
        <div className="absolute left-6 top-6 lg:left-10 lg:top-10">
          <span className="inline-flex items-center bg-gold px-4 py-2 font-body text-[10px] uppercase tracking-[0.15em] text-white">
            {soin.categorie.replace(/_/g, " ")}
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 px-6 pb-12 lg:px-10 lg:pb-16">
          <div className="mx-auto max-w-7xl">
            <h1 className="font-display text-[36px] font-light text-white sm:text-[44px] lg:text-[52px]">
              {soin.nom}
            </h1>
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
              <div className="mt-4 flex items-center justify-center gap-2">
                <StarRating note={Math.round(noteMoyenne)} />
                <span className="font-body text-[13px] text-text-mid">{noteMoyenne.toFixed(1)} ({mockAvis.length} avis)</span>
              </div>
              <div className="mt-6 space-y-3">
                <BtnArrow href={`/prise-rdv?soin=${soin.slug}`} className="w-full justify-center bg-primary-brand text-white border-primary-brand hover:bg-primary-dark hover:border-primary-dark hover:text-white">
                  Réserver ce soin
                </BtnArrow>
                <BtnTextLine href={`/prise-rdv?soin=${soin.slug}&cadeau=true`} className="justify-center w-full">
                  Offrir ce soin
                </BtnTextLine>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section avis */}
      <section className="border-t border-border-brand bg-white px-6 py-16 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <SectionTag>Témoignages</SectionTag>
          <h2 className="mt-4 text-center font-display text-[28px] font-light text-text-main">
            Ce qu&apos;en disent nos <em className="text-primary-brand">clientes</em>
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {mockAvis.map((avis) => (
              <div key={avis.id} className="border border-border-brand bg-bg-page p-6 transition-colors duration-300 hover:border-gold">
                <StarRating note={avis.note} />
                <p className="mt-4 font-body text-[14px] italic leading-relaxed text-text-mid">&ldquo;{avis.commentaire}&rdquo;</p>
                <div className="mt-4 pt-4 border-t border-border-brand">
                  <p className="font-body text-[11px] uppercase tracking-widest text-text-main">{avis.nom}</p>
                  <p className="mt-1 font-body text-[11px] text-text-muted-brand">{formatDate(avis.date)}</p>
                </div>
              </div>
            ))}
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
            {soinsSimilaires.map((autre) => (
              <div key={autre.slug} className="group flex flex-col bg-white transition-colors duration-300 hover:bg-bg-page">
                <div className="flex h-40 items-center justify-center bg-linear-to-br from-primary-light to-bg-page">
                  <autre.icon size={36} className="text-gold opacity-30" />
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
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
