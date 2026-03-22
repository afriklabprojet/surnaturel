import { Metadata } from "next"
import { Heart, Lock, Award, Users } from "lucide-react"
import { BtnSerif, BtnTextLine } from "@/components/ui/buttons"
import { MotionSection, MotionStagger, MotionItem } from "@/components/ui/MotionWrapper"
import { fadeInUp, fadeInLeft, fadeInRight, staggerContainer, staggerItem, cardHover } from "@/lib/animations"

export const metadata: Metadata = {
  title: "À propos | Le Surnaturel de Dieu — Institut de bien-être à Abidjan",
  description:
    "Fondé en 2015 par Marie Jeanne, Le Surnaturel de Dieu est un institut de bien-être dédié aux femmes d'Abidjan. Découvrez notre histoire, notre équipe et nos valeurs.",
}

const EQUIPE = [
  {
    nom: "Marie Jeanne",
    role: "Fondatrice & Directrice",
    description:
      "Passionnée par le bien-être holistique, Marie Jeanne a fondé Le Surnaturel de Dieu avec la vision d'offrir des soins d'exception accessibles à toutes.",
  },
  {
    nom: "Ama Kouassi",
    role: "Sage-femme diplômée d'État",
    description:
      "Forte de plus de 10 ans d'expérience, Ama accompagne les femmes à chaque étape de leur vie avec professionnalisme et bienveillance.",
  },
  {
    nom: "Awa Diallo",
    role: "Esthéticienne spécialisée",
    description:
      "Experte en soins du corps et du visage, Awa maîtrise les techniques traditionnelles et modernes pour sublimer chaque cliente.",
  },
  {
    nom: "Fatou Bamba",
    role: "Accompagnatrice médicale",
    description:
      "Formée en accompagnement médical, elle apporte un suivi personnalisé et confidentiel aux clientes ayant des besoins spécifiques.",
  },
]

const VALEURS = [
  {
    icon: Heart,
    titre: "Bienveillance",
    description:
      "Chaque cliente est accueillie avec chaleur et respect. Nous croyons que le bien-être commence par une écoute attentive.",
  },
  {
    icon: Lock,
    titre: "Confidentialité",
    description:
      "Vos données personnelles et médicales sont protégées par un chiffrement de niveau bancaire. Votre intimité est notre priorité.",
  },
  {
    icon: Award,
    titre: "Excellence",
    description:
      "Nous utilisons des produits naturels de qualité et des techniques éprouvées. Nos professionnelles sont formées aux standards les plus exigeants.",
  },
  {
    icon: Users,
    titre: "Inclusivité",
    description:
      "Notre centre est ouvert à toutes, sans distinction. Nous adaptons nos soins aux besoins spécifiques de chaque femme.",
  },
]

export default function PageAPropos() {
  return (
    <div className="bg-bg-page">
      {/* Hero */}
      <section className="bg-primary-brand px-4 py-20 sm:px-6 lg:px-8">
        <MotionSection variants={fadeInUp} trigger="animate" className="mx-auto max-w-4xl text-center">
          <span className="font-body text-[11px] uppercase tracking-[0.2em] text-gold">
            Notre histoire
          </span>
          <h1 className="mt-4 font-display text-[44px] font-light text-white md:text-[52px]">
            Le Surnaturel <em className="italic">de Dieu</em>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-body text-[15px] font-light leading-relaxed text-white/80">
            Né de la conviction qu&apos;une femme épanouie est une femme qui prend soin
            d&apos;elle — corps, âme et esprit.
          </p>
          <div className="mx-auto mt-6 h-px w-16 bg-gold" />
        </MotionSection>
      </section>

      {/* Fondatrice */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <MotionSection variants={fadeInLeft} className="flex h-80 items-center justify-center bg-gradient-to-br from-primary-light to-bg-page border border-border-brand">
            <span className="font-display text-[24px] font-light text-primary-brand/30">
              Photo Marie Jeanne
            </span>
          </MotionSection>
          <MotionSection variants={fadeInRight}>
            <span className="font-body text-[11px] uppercase tracking-[0.15em] text-gold">
              Fondatrice
            </span>
            <h2 className="mt-2 font-display text-[32px] font-light text-text-main">
              Marie Jeanne
            </h2>
            <div className="mt-1 h-px w-12 bg-gold" />
            <div className="mt-6 space-y-4 font-body text-[14px] leading-relaxed text-text-mid">
              <p>
                C&apos;est en 2015 que Marie Jeanne a donné vie au Surnaturel de Dieu, au cœur d&apos;Abidjan.
                Formée entre la France et la Côte d&apos;Ivoire, elle a acquis une double expertise en esthétique
                et en bien-être holistique, qu&apos;elle met aujourd&apos;hui au service des femmes ivoiriennes.
              </p>
              <p>
                Sa conviction : chaque femme mérite un espace où elle peut se ressourcer, prendre soin de
                sa santé et révéler sa beauté naturelle, dans un cadre bienveillant et professionnel.
                De la cabine de hammam traditionnel à la consultation sage-femme, en passant par les soins
                esthétiques et la boutique de produits naturels, l&apos;institut propose une approche complète
                du bien-être féminin.
              </p>
              <p>
                Entourée d&apos;une équipe de professionnelles passionnées, Marie Jeanne continue de faire
                évoluer l&apos;institut pour offrir des soins d&apos;exception accessibles à toutes les femmes
                d&apos;Abidjan, parce que prendre soin de soi n&apos;est pas un luxe, c&apos;est une nécessité.
              </p>
            </div>
            <div className="mt-6">
              <BtnSerif href="/prise-rdv">
                Prendre rendez-vous
              </BtnSerif>
            </div>
          </MotionSection>
        </div>
      </section>

      {/* Vision / Mission / Valeurs */}
      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="h-px w-12 bg-gold" />
              <span className="font-body text-[11px] uppercase tracking-[0.15em] text-gold">
                Ce qui nous guide
              </span>
              <div className="h-px w-12 bg-gold" />
            </div>
            <h2 className="font-display text-[32px] font-light text-text-main">
              Nos <em className="italic text-primary-brand">valeurs</em>
            </h2>
          </div>

          <MotionStagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALEURS.map((valeur) => {
              const Icon = valeur.icon
              return (
                <MotionItem
                  key={valeur.titre}
                  className="border border-border-brand bg-white p-6 hover:border-gold transition-colors"
                >
                  <div className="flex h-12 w-12 items-center justify-center bg-primary-light">
                    <Icon size={22} className="text-primary-brand" />
                  </div>
                  <h3 className="mt-4 font-display text-[18px] text-text-main">
                    {valeur.titre}
                  </h3>
                  <p className="mt-2 font-body text-[13px] leading-relaxed text-text-mid">
                    {valeur.description}
                  </p>
                </MotionItem>
              )
            })}
          </MotionStagger>

          <div className="mt-10 text-center">
            <BtnSerif href="/soins">
              Découvrir nos soins
            </BtnSerif>
          </div>
        </div>
      </section>

      {/* Équipe */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-12 bg-gold" />
            <span className="font-body text-[11px] uppercase tracking-[0.15em] text-gold">
              Les expertes
            </span>
            <div className="h-px w-12 bg-gold" />
          </div>
          <h2 className="font-display text-[32px] font-light text-text-main">
            Notre <em className="italic text-primary-brand">équipe</em>
          </h2>
        </div>

        <MotionStagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {EQUIPE.map((membre) => {
            const initiales = membre.nom
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()
            return (
              <MotionItem
                key={membre.nom}
                className="border border-border-brand bg-white p-6 text-center hover:border-gold transition-colors"
              >
                <div className="mx-auto flex h-20 w-20 items-center justify-center bg-primary-brand">
                  <span className="font-display text-[22px] font-light text-white">
                    {initiales}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-[18px] text-text-main">
                  {membre.nom}
                </h3>
                <p className="mt-1 font-body text-[11px] uppercase tracking-[0.1em] text-gold">
                  {membre.role}
                </p>
                <p className="mt-3 font-body text-[13px] leading-relaxed text-text-mid">
                  {membre.description}
                </p>
                <div className="mt-4">
                  <BtnTextLine>
                    En savoir plus
                  </BtnTextLine>
                </div>
              </MotionItem>
            )
          })}
        </MotionStagger>
      </section>
    </div>
  )
}
