import { prisma } from "@/lib/prisma"
import { unstable_cache } from "next/cache"
import PremiereVisite from "@/components/home/premiere-visite"
import WhatsAppButton from "@/components/layout/WhatsAppButtonLazy"
import {
  HeroSection,
  AvantagesSection,
  ServicesSection,
  ChiffresSection,
  TemoignagesSection,
  VideoTemoignagesSection,
  CTASection,
  NewsletterSection,
  type HeroContent,
  type ServicesContent,
  type ChiffresContent,
  type TemoignagesContent,
  type VideosContent,
  type CTAContent,
} from "@/components/home/HeroAnimations"

// ─── Server-side data fetching (mis en cache 5 min) ─────────────

const getServices = unstable_cache(
  async function () {
  const soins = await prisma.soin.findMany({
    where: { actif: true },
    orderBy: { ordre: "asc" },
    take: 6,
    select: {
      slug: true,
      nom: true,
      description: true,
      icon: true,
      prix: true,
      duree: true,
      avis: {
        where: { publie: true },
        select: { note: true },
      },
    },
  })
  return soins.map((s) => {
    const notes = s.avis.map((a) => a.note)
    const noteMoyenne = notes.length > 0 ? Math.round((notes.reduce((a, b) => a + b, 0) / notes.length) * 10) / 10 : 0
    return {
      slug: s.slug,
      nom: s.nom,
      description: s.description,
      icon: s.icon,
      prix: s.prix,
      duree: s.duree,
      noteMoyenne,
      nombreAvis: notes.length,
    }
  })
  },
  ["homepage-services"],
  { revalidate: 300 }
)

const getTemoignages = unstable_cache(
  async function () {
  const reviews = await prisma.avis.findMany({
    where: { publie: true, note: { gte: 4 }, commentaire: { not: "" } },
    orderBy: { createdAt: "desc" },
    take: 6,
    include: {
      user: { select: { prenom: true, nom: true } },
      soin: { select: { nom: true } },
    },
  })

  return reviews.map((r) => ({
    nom: `${r.user.prenom} ${r.user.nom.charAt(0)}.`,
    texte: r.commentaire ?? "",
    etoiles: r.note,
    soin: r.soin?.nom,
  }))
  },
  ["homepage-temoignages"],
  { revalidate: 300 }
)

const getVideoTemoignages = unstable_cache(
  async function () {
  const videos = await prisma.temoignageVideo.findMany({
    where: {
      approuve: true,
      consentementClient: true,
    },
    orderBy: [{ vedette: "desc" }, { ordre: "asc" }, { createdAt: "desc" }],
    take: 6,
    select: {
      id: true,
      titre: true,
      clientNom: true,
      soinNom: true,
      videoUrl: true,
      thumbnailUrl: true,
      duree: true,
      description: true,
      vedette: true,
    },
  })
  return videos
  },
  ["homepage-videos"],
  { revalidate: 300 }
)

const getStats = unstable_cache(
  async function () {
  const [clientes, soins, chiffresConfig] = await Promise.all([
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.soin.count({ where: { actif: true } }),
    prisma.appConfig.findUnique({ where: { cle: "homepage_chiffres" } }),
  ])
  let anneeDebut = 2015
  if (chiffresConfig) {
    try {
      const parsed = JSON.parse(chiffresConfig.valeur) as Record<string, string>
      const stored = parseInt(parsed.anneeDebut ?? "", 10)
      if (!isNaN(stored) && stored > 1900) anneeDebut = stored
    } catch { /* keep default */ }
  }
  const annees = new Date().getFullYear() - anneeDebut
  return { clientes, soins, annees }
  },
  ["homepage-stats"],
  { revalidate: 300 }
)

const getHomepageContent = unstable_cache(
  async function () {
  const keys = ["homepage_hero", "homepage_services", "homepage_chiffres", "homepage_temoignages", "homepage_videos", "homepage_cta"]
  const rows = await prisma.appConfig.findMany({ where: { cle: { in: keys } } })
  const byKey: Record<string, Record<string, string>> = {}
  for (const row of rows) {
    try { byKey[row.cle] = JSON.parse(row.valeur) } catch { byKey[row.cle] = {} }
  }
  const hero = byKey.homepage_hero ?? {}
  const services = byKey.homepage_services ?? {}
  const chiffres = byKey.homepage_chiffres ?? {}
  const temoignages = byKey.homepage_temoignages ?? {}
  const videos = byKey.homepage_videos ?? {}
  const cta = byKey.homepage_cta ?? {}
  return {
    hero: { tag: hero.tag, titre: hero.titre, sousTitre: hero.sousTitre, cta1: hero.cta1, cta2: hero.cta2, badge: hero.badge } as HeroContent,
    services: { tag: services.tag, titre: services.titre, sousTitre: services.sousTitre } as ServicesContent,
    chiffres: { label1: chiffres.label1, label2: chiffres.label2, label3: chiffres.label3 } as ChiffresContent,
    temoignages: { tag: temoignages.tag, titre: temoignages.titre } as TemoignagesContent,
    videos: { tag: videos.tag, titre: videos.titre, sousTitre: videos.sousTitre } as VideosContent,
    cta: { titre: cta.titre, sousTitre: cta.sousTitre, bouton: cta.bouton } as CTAContent,
  }
  },
  ["homepage-content"],
  { revalidate: 300 }
)

// ─── Page Accueil (Server Component) ─────────────────────────────

export default async function PageAccueil() {
  const [services, temoignages, videoTemoignages, stats, content] = await Promise.all([
    getServices(),
    getTemoignages(),
    getVideoTemoignages(),
    getStats(),
    getHomepageContent(),
  ])

  return (
    <>
      <HeroSection content={content.hero} />
      <PremiereVisite />
      <AvantagesSection />
      <ServicesSection services={services} content={content.services} />
      <ChiffresSection stats={stats} content={content.chiffres} />
      <TemoignagesSection temoignages={temoignages} content={content.temoignages} />
      <VideoTemoignagesSection videos={videoTemoignages} content={content.videos} />
      <CTASection content={content.cta} />
      <NewsletterSection />
      <WhatsAppButton />
    </>
  )
}
