import { Metadata } from "next"
import { BtnSerif, BtnTextLine } from "@/components/ui/buttons"
import { MotionSection, MotionStagger, MotionItem } from "@/components/ui/MotionWrapper"
import { fadeInUp, fadeInLeft, fadeInRight, staggerContainer, staggerItem, cardHover } from "@/lib/animations"
import { prisma } from "@/lib/prisma"
import { getIcon } from "@/lib/icon-map"
import { ImgAvecFallback } from "@/components/ui/ImgAvecFallback"

export const metadata: Metadata = {
  title: "À propos | Le Surnaturel de Dieu — Institut de bien-être à Abidjan",
  description:
    "Fondé en 2015 par Marie Jeanne, Le Surnaturel de Dieu est un institut de bien-être dédié aux femmes d'Abidjan. Découvrez notre histoire, notre équipe et nos valeurs.",
  alternates: { canonical: "/a-propos" },
}

export default async function PageAPropos() {
  const [equipe, valeursConfig, fondatriceConfig] = await Promise.all([
    prisma.membreEquipe.findMany({ orderBy: { ordre: "asc" } }),
    prisma.appConfig.findUnique({ where: { cle: "valeurs" } }),
    prisma.appConfig.findUnique({ where: { cle: "bio_fondatrice" } }),
  ])

  const VALEURS_DEFAUT: Array<{ icon: string; titre: string; description: string }> = [
    { icon: "Heart", titre: "Bienveillance", description: "Chaque cliente est accueillie avec chaleur, respect et sans jugement." },
    { icon: "Shield", titre: "Confidentialité", description: "Vos données personnelles et médicales restent strictement privées." },
    { icon: "Award", titre: "Excellence", description: "Nos praticiens sont formés et sélectionnés pour leur savoir-faire." },
    { icon: "Leaf", titre: "Naturalité", description: "Nous privilégions des ingrédients naturels adaptés à la peau africaine." },
  ]
  const VALEURS: Array<{ icon: string; titre: string; description: string }> =
    (valeursConfig ? (JSON.parse(valeursConfig.valeur) as Array<{ icon: string; titre: string; description: string }>) : null) ?? VALEURS_DEFAUT

  const fondatrice = fondatriceConfig ? JSON.parse(fondatriceConfig.valeur) as {
    nom?: string; tag?: string; paragraphes?: string[]
  } : {}
  const fondNom = fondatrice.nom || "Marie Jeanne"
  const fondTag = fondatrice.tag || "Fondatrice"
  const fondParas = fondatrice.paragraphes?.length
    ? fondatrice.paragraphes
    : [
        "C'est en 2015 que Marie Jeanne a donné vie au Surnaturel de Dieu, au cœur d'Abidjan. Formée entre la France et la Côte d'Ivoire, elle a acquis une double expertise en esthétique et en bien-être holistique, qu'elle met aujourd'hui au service des femmes ivoiriennes.",
        "Sa conviction : chaque femme mérite un espace où elle peut se ressourcer, prendre soin de sa santé et révéler sa beauté naturelle, dans un cadre bienveillant et professionnel. De la cabine de hammam traditionnel à la consultation sage-femme, en passant par les soins esthétiques et la boutique de produits naturels, l'institut propose une approche complète du bien-être féminin.",
        "Entourée d'une équipe de professionnelles passionnées, Marie Jeanne continue de faire évoluer l'institut pour offrir des soins d'exception accessibles à toutes les femmes d'Abidjan, parce que prendre soin de soi n'est pas un luxe, c'est une nécessité.",
      ]
  return (
    <div className="bg-bg-page">
      {/* Hero */}
      <section className="bg-primary-brand px-4 py-20 sm:px-6 lg:px-8">
        <MotionSection variants={fadeInUp} trigger="animate" className="mx-auto max-w-4xl text-center">
          <span className="font-body text-xs uppercase tracking-[0.2em] text-gold">
            Notre histoire
          </span>
          <h1 className="mt-4 font-display text-[32px] sm:text-[44px] font-light text-white md:text-[52px]">
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
          <MotionSection variants={fadeInLeft} className="relative h-80 overflow-hidden border border-border-brand">
            <ImgAvecFallback
              src="/images/fondatrice.jpg"
              alt="Marie Jeanne — Fondatrice du Surnaturel de Dieu"
              className="h-full w-full object-cover"
              fallbackInitiales="MJ"
              fallbackClassName="h-full w-full"
            />
          </MotionSection>
          <MotionSection variants={fadeInRight}>
            <span className="font-body text-xs uppercase tracking-[0.15em] text-gold">
              {fondTag}
            </span>
            <h2 className="mt-2 font-display text-[32px] font-light text-text-main">
              {fondNom}
            </h2>
            <div className="mt-1 h-px w-12 bg-gold" />
            <div className="mt-6 space-y-4 font-body text-[14px] leading-relaxed text-text-mid">
              {fondParas.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
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
              <span className="font-body text-xs uppercase tracking-[0.15em] text-gold">
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
              const Icon = getIcon(valeur.icon)
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

      {/* Photo d'équipe */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-12 bg-gold" />
            <span className="font-body text-xs uppercase tracking-[0.15em] text-gold">
              Les expertes
            </span>
            <div className="h-px w-12 bg-gold" />
          </div>
          <h2 className="font-display text-[32px] font-light text-text-main">
            Notre <em className="italic text-primary-brand">équipe</em>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl font-body text-[14px] leading-relaxed text-text-mid">
            Des professionnelles passionnées, formées et dévouées à votre bien-être.
          </p>
        </div>

        <MotionSection variants={fadeInUp} className="mb-16 overflow-hidden border border-border-brand">
          <ImgAvecFallback
            src="/images/equipe.jpg"
            alt="L'équipe de l'Institut de Bien-Être Le Surnaturel de Dieu à Abidjan"
            className="h-auto w-full object-cover"
            fallbackInitiales="✦"
            fallbackClassName="h-64 w-full"
          />
        </MotionSection>

        <MotionStagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {equipe.map((membre) => {
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
                {membre.photoUrl ? (
                  <div className="mx-auto h-20 w-20 overflow-hidden rounded-full border border-border-brand">
                    <img
                      src={membre.photoUrl}
                      alt={`${membre.nom} — ${membre.role} au Surnaturel de Dieu`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="mx-auto flex h-20 w-20 items-center justify-center bg-primary-brand">
                    <span className="font-display text-[22px] font-light text-white">
                      {initiales}
                    </span>
                  </div>
                )}
                <h3 className="mt-4 font-display text-[18px] text-text-main">
                  {membre.nom}
                </h3>
                <p className="mt-1 font-body text-xs uppercase tracking-widest text-gold">
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
