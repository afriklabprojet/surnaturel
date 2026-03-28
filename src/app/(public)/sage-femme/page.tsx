import { Metadata } from "next"
import Link from "next/link"
import {
  Heart,
  Baby,
  Calendar,
  Phone,
  Clock,
  Shield,
  Star,
  ArrowRight,
  ChevronDown,
  Stethoscope,
} from "lucide-react"
import { formatPrix } from "@/lib/utils"
import { prisma } from "@/lib/prisma"
import { getIcon } from "@/lib/icon-map"
import { MotionSection, MotionStagger, MotionItem } from "@/components/ui/MotionWrapper"
import { fadeInUp, fadeInLeft, fadeInRight } from "@/lib/animations"
import FaqAccordion from "./FaqAccordion"

export const metadata: Metadata = {
  title: "Sage-Femme Ama Kouassi | Le Surnaturel de Dieu — Abidjan",
  description:
    "Consultations avec Ama Kouassi, sage-femme diplômée d'État : suivi de grossesse, préparation à l'accouchement, rééducation post-natale et conseils personnalisés à Abidjan.",
}

export default async function PageSageFemme() {
  // Charger dynamiquement depuis la DB
  const [specialitesConfig, prestationsConfig, faqData, bioConfig, telConfig] = await Promise.all([
    prisma.appConfig.findUnique({ where: { cle: "specialites_sage_femme" } }),
    prisma.appConfig.findUnique({ where: { cle: "prestations_sage_femme" } }),
    prisma.faq.findMany({ where: { categorie: "sage-femme" }, orderBy: { ordre: "asc" } }),
    prisma.appConfig.findUnique({ where: { cle: "bio_sage_femme" } }),
    prisma.appConfig.findUnique({ where: { cle: "telephone_contact" } }),
  ])

  const SPECIALITES: string[] = specialitesConfig ? JSON.parse(specialitesConfig.valeur) : []
  const PRESTATIONS: Array<{ icon: string; titre: string; description: string; prix: number; duree: number }> =
    prestationsConfig ? JSON.parse(prestationsConfig.valeur) : []
  const FAQ = faqData.map(f => ({ question: f.question, reponse: f.reponse }))
  const bio: { nom: string; titre: string; paragraphes: string[] } = bioConfig
    ? JSON.parse(bioConfig.valeur)
    : { nom: "Ama Kouassi", titre: "Sage-femme dipl\u00f4m\u00e9e d'\u00c9tat", paragraphes: [] }
  const telephone: string = telConfig ? JSON.parse(telConfig.valeur) : "+225 07 09 00 00 00"
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-to-br from-primary-brand via-primary-brand/95 to-primary-dark px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        {/* Décorations */}
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-52 w-52 -translate-x-1/2 rounded-full bg-gold/8 blur-2xl" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "repeating-linear-gradient(-45deg, transparent, transparent 70px, rgba(255,255,255,0.1) 70px, rgba(255,255,255,0.1) 71px)" }} />

        <MotionSection variants={fadeInUp} trigger="animate" className="relative mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center border border-gold/30 bg-gold/10">
            <Heart size={28} className="text-gold" />
          </div>
          <span className="inline-block bg-gold/20 px-4 py-1.5 font-body text-[10px] uppercase tracking-[0.2em] text-gold border border-gold/30">
            Accompagnement maternel
          </span>
          <h1 className="mt-6 font-display text-[44px] font-light text-white md:text-[56px]">
            Notre <em className="italic text-gold">sage-femme</em>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl font-body text-[15px] font-light leading-relaxed text-white/75">
            Un accompagnement bienveillant et professionnel tout au long de votre
            parcours maternel, de la grossesse au post-partum.
          </p>
          <div className="mx-auto mt-8 flex items-center justify-center gap-4">
            <div className="h-px w-12 bg-gold/40" />
            <span className="font-body text-[10px] uppercase tracking-[0.15em] text-gold/60">{bio.nom} \u00b7 {bio.titre}</span>
            <div className="h-px w-12 bg-gold/40" />
          </div>
        </MotionSection>
      </section>

      {/* Présentation */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Photo placeholder */}
          <MotionSection
            variants={fadeInLeft}
            className="flex aspect-[4/5] items-center justify-center bg-gradient-to-br from-primary-light to-bg-page border border-border-brand"
          >
            <div className="text-center">
              <Stethoscope size={64} className="mx-auto text-primary-brand/30" />
              <p className="mt-3 font-body text-[12px] text-text-muted-brand">Photo {bio.nom}</p>
            </div>
          </MotionSection>

          {/* Bio */}
          <MotionSection variants={fadeInRight}>
            <span className="font-body text-[11px] uppercase tracking-[0.15em] text-gold">
              Votre accompagnante
            </span>
            <h2 className="mt-2 font-display text-[32px] font-light text-text-main">
              {bio.nom}
            </h2>
            <p className="mt-1 font-body text-[13px] font-medium text-primary-brand">
              {bio.titre}
            </p>
            <div className="mt-2 h-px w-12 bg-gold" />
            <div className="mt-6 space-y-4 font-body text-[14px] leading-relaxed text-text-mid">
              {bio.paragraphes.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {SPECIALITES.map((spec) => (
                <span
                  key={spec}
                  className="border border-border-brand bg-primary-light px-3 py-1.5 font-body text-[11px] uppercase tracking-[0.05em] text-primary-brand"
                >
                  {spec}
                </span>
              ))}
            </div>
          </MotionSection>
        </div>
      </section>

      {/* Prestations */}
      <section className="bg-bg-page px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="h-px w-12 bg-gold" />
              <span className="font-body text-[11px] uppercase tracking-[0.15em] text-gold">
                Nos prestations
              </span>
              <div className="h-px w-12 bg-gold" />
            </div>
            <h2 className="font-display text-[32px] font-light text-text-main">
              Des soins adaptés à chaque <em className="italic text-primary-brand">étape</em>
            </h2>
          </div>

          <MotionStagger className="grid gap-6 sm:grid-cols-2">
            {PRESTATIONS.map((p) => {
              const Icon = getIcon(p.icon)
              return (
                <MotionItem
                  key={p.titre}
                  className="border border-border-brand bg-white p-6 hover:border-gold transition-colors"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center bg-primary-light">
                    <Icon size={20} className="text-primary-brand" />
                  </div>
                  <h3 className="font-display text-[18px] text-text-main">
                    {p.titre}
                  </h3>
                  <p className="mt-2 font-body text-[13px] leading-relaxed text-text-mid">
                    {p.description}
                  </p>
                  <div className="mt-4 flex items-center gap-4 font-body text-[12px]">
                    <span className="flex items-center gap-1 text-text-muted-brand">
                      <Clock size={12} />
                      {p.duree} min
                    </span>
                    <span className="font-medium text-primary-brand">
                      {formatPrix(p.prix)}
                    </span>
                  </div>
                </MotionItem>
              )
            })}
          </MotionStagger>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-12 bg-gold" />
            <span className="font-body text-[11px] uppercase tracking-[0.15em] text-gold">
              Questions fréquentes
            </span>
            <div className="h-px w-12 bg-gold" />
          </div>
          <h2 className="font-display text-[32px] font-light text-text-main">
            Vos <em className="italic text-primary-brand">questions</em>
          </h2>
        </div>

        <FaqAccordion faq={FAQ} />
      </section>

      {/* Contact / CTA */}
      <section className="bg-primary-brand px-4 py-20 sm:px-6 lg:px-8">
        <MotionSection
          variants={fadeInUp}
          className="mx-auto max-w-3xl text-center"
        >
          <Calendar size={36} className="mx-auto mb-4 text-gold" />
          <h2 className="font-display text-[32px] font-light text-white">
            Prenez <em className="italic">rendez-vous</em>
          </h2>
          <p className="mx-auto mt-4 max-w-lg font-body text-[14px] text-white/80">
            Réservez votre consultation avec {bio.nom} directement en
            ligne ou contactez-nous par téléphone.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/prise-rdv?soin=programme-post-accouchement"
              className="flex items-center gap-2 bg-white px-6 py-3 font-body text-[11px] font-medium uppercase tracking-[0.15em] text-primary-brand transition-colors hover:bg-primary-light"
            >
              Réserver en ligne
              <ArrowRight size={14} />
            </Link>
            <a
              href={`tel:${telephone.replace(/\s/g, "")}`}
              className="flex items-center gap-2 border border-white/40 px-6 py-3 font-body text-[11px] font-medium uppercase tracking-[0.15em] text-white transition-colors hover:bg-white/10"
            >
              <Phone size={14} />
              Appeler
            </a>
          </div>
        </MotionSection>
      </section>
    </>
  )
}
