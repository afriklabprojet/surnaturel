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
import { MotionSection, MotionStagger, MotionItem } from "@/components/ui/MotionWrapper"
import { fadeInUp, fadeInLeft, fadeInRight } from "@/lib/animations"
import FaqAccordion from "./FaqAccordion"

export const metadata: Metadata = {
  title: "Sage-Femme Ama Kouassi | Le Surnaturel de Dieu — Abidjan",
  description:
    "Consultations avec Ama Kouassi, sage-femme diplômée d'État : suivi de grossesse, préparation à l'accouchement, rééducation post-natale et conseils personnalisés à Abidjan.",
}

const SPECIALITES = [
  "Suivi de grossesse",
  "Préparation à l'accouchement",
  "Rééducation post-natale",
  "Consultations gynécologiques",
  "Planification familiale",
]

const PRESTATIONS = [
  {
    icon: Heart,
    titre: "Suivi de grossesse",
    description:
      "Accompagnement personnalisé tout au long de votre grossesse avec des consultations régulières et un suivi attentif.",
    prix: 20000,
    duree: 60,
  },
  {
    icon: Baby,
    titre: "Préparation à l'accouchement",
    description:
      "Séances individuelles ou en couple pour vous préparer physiquement et émotionnellement à l'arrivée de bébé.",
    prix: 15000,
    duree: 90,
  },
  {
    icon: Shield,
    titre: "Rééducation post-natale",
    description:
      "Programme de récupération après l'accouchement : rééducation périnéale, soins du corps et soutien psychologique.",
    prix: 25000,
    duree: 75,
  },
  {
    icon: Star,
    titre: "Conseil allaitement",
    description:
      "Accompagnement et conseils pratiques pour un allaitement serein, confortable et adapté à votre rythme.",
    prix: 10000,
    duree: 45,
  },
]

const FAQ = [
  {
    question: "À partir de quand dois-je consulter une sage-femme ?",
    reponse:
      "Idéalement dès le début de votre grossesse, à partir de la 6ᵉ semaine. Mais il n'est jamais trop tard pour bénéficier d'un accompagnement professionnel. Nos consultations s'adaptent à chaque trimestre.",
  },
  {
    question: "Les consultations sont-elles confidentielles ?",
    reponse:
      "Absolument. Toutes les informations partagées lors des consultations sont strictement confidentielles. Ama Kouassi respecte le secret professionnel médical et vos données sont protégées.",
  },
  {
    question: "Proposez-vous un suivi après l'accouchement ?",
    reponse:
      "Oui, nous proposons un programme complet de rééducation post-natale qui inclut la rééducation périnéale, un accompagnement à l'allaitement et un suivi du bien-être émotionnel de la jeune maman.",
  },
  {
    question: "Peut-on venir en couple pour les séances de préparation ?",
    reponse:
      "Bien sûr ! La préparation à l'accouchement en couple est vivement encouragée. Cela permet au partenaire de comprendre les étapes de l'accouchement et de savoir comment accompagner la future maman.",
  },
  {
    question: "Comment prendre rendez-vous avec la sage-femme ?",
    reponse:
      "Vous pouvez réserver directement en ligne via notre page de prise de rendez-vous, ou nous contacter par téléphone au +225 07 09 00 00 00. Nous vous répondrons dans les meilleurs délais.",
  },
]

export default function PageSageFemme() {
  return (
    <>
      {/* Hero */}
      <section className="bg-primary-brand px-4 py-20 sm:px-6 lg:px-8">
        <MotionSection variants={fadeInUp} trigger="animate" className="mx-auto max-w-4xl text-center">
          <span className="font-body text-[11px] uppercase tracking-[0.2em] text-gold">
            Accompagnement maternel
          </span>
          <h1 className="mt-4 font-display text-[44px] font-light text-white md:text-[52px]">
            Notre <em className="italic">sage-femme</em>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-body text-[15px] font-light leading-relaxed text-white/80">
            Un accompagnement bienveillant et professionnel tout au long de votre
            parcours maternel, de la grossesse au post-partum.
          </p>
          <div className="mx-auto mt-6 h-px w-16 bg-gold" />
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
              <p className="mt-3 font-body text-[12px] text-text-muted-brand">Photo Ama Kouassi</p>
            </div>
          </MotionSection>

          {/* Bio */}
          <MotionSection variants={fadeInRight}>
            <span className="font-body text-[11px] uppercase tracking-[0.15em] text-gold">
              Votre accompagnante
            </span>
            <h2 className="mt-2 font-display text-[32px] font-light text-text-main">
              Ama Kouassi
            </h2>
            <p className="mt-1 font-body text-[13px] font-medium text-primary-brand">
              Sage-femme diplômée d&apos;État
            </p>
            <div className="mt-2 h-px w-12 bg-gold" />
            <div className="mt-6 space-y-4 font-body text-[14px] leading-relaxed text-text-mid">
              <p>
                Avec plus de 10 ans d&apos;expérience dans l&apos;accompagnement des
                femmes, Ama Kouassi est la sage-femme de confiance du Surnaturel de
                Dieu. Diplômée d&apos;État, elle met son expertise au service du
                bien-être maternel avec douceur et professionnalisme.
              </p>
              <p>
                Spécialisée dans le suivi physiologique de la grossesse, la
                préparation à l&apos;accouchement et la rééducation post-natale,
                elle accompagne chaque femme avec une écoute attentive et des
                conseils adaptés à sa situation unique.
              </p>
              <p>
                Chaque consultation est un moment d&apos;échange privilégié pour
                répondre à toutes vos questions et vous accompagner en toute
                confiance vers la maternité.
              </p>
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
              const Icon = p.icon
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
            Réservez votre consultation avec Ama Kouassi directement en
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
              href="tel:+2250709000000"
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
