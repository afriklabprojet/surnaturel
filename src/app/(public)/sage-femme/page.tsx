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
  Award,
} from "lucide-react"
import { formatPrix } from "@/lib/utils"
import { prisma } from "@/lib/prisma"
import { getIcon } from "@/lib/icon-map"
import { getConfig } from "@/lib/config"
import { MotionSection, MotionStagger, MotionItem } from "@/components/ui/MotionWrapper"
import { fadeInUp, fadeInLeft, fadeInRight } from "@/lib/animations"
import { ImgAvecFallback } from "@/components/ui/ImgAvecFallback"
import FaqAccordion from "./FaqAccordion"

export const metadata: Metadata = {
  title: "Sage-Femme Ama Kouassi | Le Surnaturel de Dieu — Abidjan",
  description:
    "Consultations avec Ama Kouassi, sage-femme diplômée d'État : suivi de grossesse, préparation à l'accouchement, rééducation post-natale et conseils personnalisés à Abidjan.",
  alternates: { canonical: "/sage-femme" },
}

export default async function PageSageFemme() {
  const config = await getConfig()
  // Charger dynamiquement depuis la DB
  const [specialitesConfig, prestationsConfig, faqData, bioConfig, telConfig, diplomesConfig, avisData] = await Promise.all([
    prisma.appConfig.findUnique({ where: { cle: "specialites_sage_femme" } }),
    prisma.appConfig.findUnique({ where: { cle: "prestations_sage_femme" } }),
    prisma.faq.findMany({ where: { categorie: "sage-femme" }, orderBy: { ordre: "asc" } }),
    prisma.appConfig.findUnique({ where: { cle: "bio_sage_femme" } }),
    prisma.appConfig.findUnique({ where: { cle: "telephone_contact" } }),
    prisma.appConfig.findUnique({ where: { cle: "diplomes_sage_femme" } }),
    prisma.avis.findMany({
      where: {
        publie: true,
        note: { gte: 4 },
        soin: {
          OR: [
            { categorie: "SAGE_FEMME" },
            { slug: { contains: "sage", mode: "insensitive" } },
          ],
        },
      },
      take: 3,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { prenom: true, nom: true } },
        soin: { select: { nom: true } },
      },
    }),
  ])

  const SPECIALITES: string[] = specialitesConfig ? JSON.parse(specialitesConfig.valeur) : []
  const PRESTATIONS: Array<{ icon: string; titre: string; description: string; prix: number; duree: number }> =
    prestationsConfig ? JSON.parse(prestationsConfig.valeur) : []
  const FAQ = faqData.map(f => ({ question: f.question, reponse: f.reponse }))
  const bio: { nom: string; titre: string; paragraphes: string[] } = bioConfig
    ? JSON.parse(bioConfig.valeur)
    : { nom: "Ama Kouassi", titre: "Sage-femme dipl\u00f4m\u00e9e d'\u00c9tat", paragraphes: [] }
  const telephone: string = telConfig ? JSON.parse(telConfig.valeur) : config.telephone
  const DIPLOMES: string[] = diplomesConfig
    ? JSON.parse(diplomesConfig.valeur)
    : [
        "Diplôme d’État de Sage-Femme — INFAS Abidjan",
        "Formation en rééducation périnéale post-natale",
        "Certificat en préparation à l’accouchement",
      ]
  const AVIS_SF = avisData
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary-dark px-6 py-14 sm:py-16 lg:px-10">
        {/* Fond gradient sophistiqué */}
        <div className="absolute inset-0 bg-linear-to-br from-primary-brand via-primary-brand/85 to-primary-dark" />

        {/* Motif points subtil */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(184,151,42,0.4) 1px, transparent 0)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Accents lumineux */}
        <div className="absolute -right-40 top-0 h-100 w-100 rounded-full bg-gold/10 blur-[120px]" />
        <div className="absolute -left-20 bottom-0 h-60 w-60 rounded-full bg-white/5 blur-[100px]" />
        <div className="absolute left-1/2 top-1/3 h-40 w-40 -translate-x-1/2 rounded-full bg-gold/8 blur-[80px]" />

        {/* Lignes dorées */}
        <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-transparent via-gold/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-gold/30 to-transparent" />

        <MotionSection variants={fadeInUp} trigger="animate" className="relative mx-auto max-w-4xl">
          {/* Layout deux colonnes sur desktop */}
          <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-start lg:gap-16">
            {/* Colonne gauche — icône décorative */}
            <div className="flex shrink-0 flex-col items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center border border-gold/30 bg-gold/10">
                <Heart size={32} className="text-gold" />
              </div>
              <div className="hidden h-16 w-px bg-linear-to-b from-gold/40 to-transparent lg:block" />
            </div>

            {/* Colonne droite — contenu */}
            <div className="text-center lg:text-left">
              {/* Tag */}
              <span className="inline-flex items-center gap-3 font-body text-xs uppercase tracking-[0.25em] text-gold/80">
                <span className="h-px w-8 bg-gold/40" />
                Accompagnement maternel
                <span className="h-px w-8 bg-gold/40 lg:hidden" />
              </span>

              <h1 className="mt-5 font-display text-[40px] font-light leading-[1.1] text-white sm:text-[48px] lg:text-[56px]">
                Notre <em className="italic text-gold">sage-femme</em>
              </h1>

              <p className="mx-auto mt-5 max-w-xl font-body text-[14px] font-light leading-[1.8] text-white/60 lg:mx-0">
                Un accompagnement bienveillant et professionnel tout au long de votre
                parcours maternel, de la grossesse au post-partum.
              </p>

              {/* Praticienne */}
              <div className="mt-8 flex items-center justify-center gap-4 lg:justify-start">
                <div className="flex h-12 w-12 items-center justify-center border border-white/15 bg-white/5">
                  <Stethoscope size={20} className="text-gold" />
                </div>
                <div>
                  <p className="font-display text-[18px] font-light text-white">{bio.nom}</p>
                  <p className="font-body text-xs uppercase tracking-widest text-gold/60">{bio.titre}</p>
                </div>
              </div>

              {/* CTA rapides */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
                <Link
                  href="/prise-rdv?soin=consultation-sage-femme"
                  className="flex items-center gap-2 bg-gold px-6 py-3 font-body text-xs font-medium uppercase tracking-[0.15em] text-white transition-colors hover:bg-gold/90"
                >
                  <Calendar size={14} />
                  Prendre rendez-vous
                </Link>
                <a
                  href={`tel:${telephone.replace(/\s/g, "")}`}
                  className="flex items-center gap-2 border border-white/20 bg-white/5 backdrop-blur-sm px-5 py-3 font-body text-xs font-medium uppercase tracking-[0.15em] text-white/80 transition-colors hover:bg-white/10"
                >
                  <Phone size={14} />
                  Appeler
                </a>
              </div>
            </div>
          </div>
        </MotionSection>
      </section>

      {/* Pour qui — toutes les patientèles */}
      <section className="border-b border-border-brand bg-primary-light/30">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Heart,       label: "Femmes",           sub: "Gynécologie, grossesse, post-partum, suivi féminin" },
              { icon: Baby,        label: "Nourrissons",      sub: "0 – 12 mois : bilans, biométrie, conseils parents"  },
              { icon: Stethoscope, label: "Enfants",          sub: "1 – 18 ans : suivi pédiatrique de proximité"        },
              { icon: Shield,      label: "Hommes & familles",sub: "Consultations familiales, éducation à la santé"      },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-start gap-3 border border-border-brand bg-white p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-primary-light">
                  <Icon size={18} className="text-primary-brand" />
                </div>
                <div>
                  <p className="font-body text-[13px] font-medium text-text-main">{label}</p>
                  <p className="mt-0.5 font-body text-[12px] leading-relaxed text-text-muted-brand">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-12 bg-gold" />
            <span className="font-body text-xs uppercase tracking-[0.15em] text-gold">Votre parcours</span>
            <div className="h-px w-12 bg-gold" />
          </div>
          <h2 className="font-display text-[28px] font-light text-text-main">
            Comment ça <em className="italic text-primary-brand">marche</em>
          </h2>
        </div>
        <div className="relative grid gap-8 grid-cols-1 sm:grid-cols-3">
          {[
            { step: "01", titre: "Questionnaire pré-consultation", desc: "Remplissez rapidement votre questionnaire en ligne depuis votre espace santé. Votre sage-femme le consulte avant votre visite.", icon: ChevronDown },
            { step: "02", titre: "Consultation personnalisée",      desc: "Rendez-vous en cabinet. Bilan complet, biométrie, échanges et examens adaptés à votre situation.",               icon: Stethoscope },
            { step: "03", titre: "Suivi continu",                   desc: "Accédez à vos comptes-rendus et votre suivi spécialisé (grossesse, pédiatrie, etc.) depuis votre espace santé.", icon: Heart },
          ].map(({ step, titre, desc, icon: Icon }) => (
            <div key={step} className="relative flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center border border-gold/40 bg-primary-light">
                <span className="font-display text-[20px] text-gold">{step}</span>
              </div>
              <div className="mt-1 h-1 w-1 rounded-full bg-gold" />
              <h3 className="mt-4 font-display text-[16px] text-text-main">{titre}</h3>
              <p className="mt-2 font-body text-[13px] leading-relaxed text-text-mid">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Présentation */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Portrait */}
          <MotionSection
            variants={fadeInLeft}
            className="relative aspect-4/5 overflow-hidden border border-border-brand"
          >
            <ImgAvecFallback
              src="/images/sage-femme.jpg"
              alt={`${bio.nom} — ${bio.titre}`}
              className="h-full w-full object-cover"
              fallbackInitiales={bio.nom.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
              fallbackClassName="h-full w-full"
            />
            {/* Badge identité */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-border-brand bg-white/95 px-5 py-4 backdrop-blur-sm">
              <p className="font-display text-[16px] font-light text-text-main">{bio.nom}</p>
              <p className="font-body text-[11px] uppercase tracking-[0.12em] text-gold">{bio.titre}</p>
            </div>
          </MotionSection>

          {/* Bio */}
          <MotionSection variants={fadeInRight}>
            <span className="font-body text-xs uppercase tracking-[0.15em] text-gold">
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
                  className="border border-border-brand bg-primary-light px-3 py-1.5 font-body text-xs uppercase tracking-[0.05em] text-primary-brand"
                >
                  {spec}
                </span>
              ))}
            </div>

            {DIPLOMES.length > 0 && (
              <div className="mt-6 space-y-2 border-t border-border-brand pt-5">
                <p className="font-body text-[11px] uppercase tracking-[0.15em] text-text-muted-brand">
                  Formation &amp; Diplômes
                </p>
                {DIPLOMES.map((d, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Award size={13} className="mt-0.5 shrink-0 text-gold" />
                    <p className="font-body text-[13px] text-text-mid">{d}</p>
                  </div>
                ))}
              </div>
            )}
          </MotionSection>
        </div>
      </section>

      {/* Prestations */}
      <section className="bg-bg-page px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="h-px w-12 bg-gold" />
              <span className="font-body text-xs uppercase tracking-[0.15em] text-gold">
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

      {/* Témoignages patientes */}
      {AVIS_SF.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <div className="mb-4 flex items-center justify-center gap-4">
              <div className="h-px w-12 bg-gold" />
              <span className="font-body text-xs uppercase tracking-[0.15em] text-gold">
                Témoignages
              </span>
              <div className="h-px w-12 bg-gold" />
            </div>
            <h2 className="font-display text-[28px] font-light text-text-main">
              Ce que disent nos <em className="italic text-primary-brand">patientes</em>
            </h2>
          </div>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {AVIS_SF.map((a) => (
              <div key={a.id} className="border border-border-brand bg-white p-6">
                <div className="mb-3 flex gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      size={13}
                      aria-hidden="true"
                      className={i < a.note ? "fill-gold text-gold" : "text-border-brand"}
                    />
                  ))}
                </div>
                <p className="font-body text-[13px] leading-relaxed text-text-mid">
                  &ldquo;{a.commentaire}&rdquo;
                </p>
                <div className="mt-4 flex items-center gap-2 border-t border-border-brand pt-3">
                  <div className="flex h-7 w-7 items-center justify-center bg-primary-light font-display text-xs text-primary-brand">
                    {a.user.prenom[0]}{a.user.nom[0]}
                  </div>
                  <div>
                    <p className="font-body text-[12px] font-medium text-text-main">
                      {a.user.prenom} {a.user.nom.charAt(0)}.
                    </p>
                    {a.soin && (
                      <p className="font-body text-[10px] uppercase tracking-widest text-text-muted-brand">
                        {a.soin.nom}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FAQ Accordion */}
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-12 bg-gold" />
            <span className="font-body text-xs uppercase tracking-[0.15em] text-gold">
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

      {/* Remboursement CNAM */}
      <section className="border-y border-gold/20 bg-gold/5 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-10">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-gold/40 bg-gold/10">
              <Shield size={24} className="text-gold" />
            </div>
            <div>
              <h3 className="font-display text-[20px] text-text-main">Remboursement &amp; prise en charge</h3>
              <div className="mt-4 grid gap-3 text-[13px] sm:grid-cols-2">
                {[
                  "Consultations remboursables selon votre régime CNAM (AMU, CMU, assurance maladie)",
                  "Suivi de grossesse pris en charge à 100% dès le 6ème mois (secteur 1)",
                  "Nécessite une prescription médicale ou ordonnance du médecin traitant pour certains actes",
                  "Nous vous accompagnons dans vos démarches de remboursement",
                ].map((ligne, i) => (
                  <div key={i} className="flex items-start gap-2 text-text-mid">
                    <Star size={12} className="mt-0.5 shrink-0 text-gold" />
                    {ligne}
                  </div>
                ))}
              </div>
              <p className="mt-4 font-body text-[12px] text-text-muted-brand">
                * Les conditions de remboursement varient selon votre assurance. Renseignez-vous auprès de votre caisse.
              </p>
            </div>
          </div>
        </div>
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
          <p className="mt-3 flex items-center justify-center gap-1.5 font-body text-[11px] text-white/45">
            <Shield size={11} aria-hidden="true" />
            Annulation gratuite jusqu&apos;à 24h avant le rendez-vous
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/prise-rdv?soin=consultation-sage-femme"
              className="flex items-center gap-2 bg-white px-6 py-3 font-body text-xs font-medium uppercase tracking-[0.15em] text-primary-brand transition-colors hover:bg-primary-light"
            >
              Réserver en ligne
              <ArrowRight size={14} />
            </Link>
            <a
              href={`tel:${telephone.replace(/\s/g, "")}`}
              className="flex items-center gap-2 border border-white/40 px-6 py-3 font-body text-xs font-medium uppercase tracking-[0.15em] text-white transition-colors hover:bg-white/10"
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
