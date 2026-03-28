import { prisma } from "@/lib/prisma"
import {
  HeroSection,
  ServicesSection,
  ChiffresSection,
  TemoignagesSection,
  VideoTemoignagesSection,
  CTASection,
} from "@/components/home/HeroAnimations"

// ─── Fallback témoignages (si < 3 avis en base) ─────────────────

const TEMOIGNAGES_FALLBACK = [
  {
    nom: "Adjoua K. — Cocody",
    texte:
      "Depuis que je fais le hammam royal chez Le Surnaturel de Dieu, ma peau a complètement changé. L'accueil est chaleureux, le cadre est apaisant, et Marie Jeanne prend le temps de comprendre vos besoins. C'est mon rituel mensuel !",
    etoiles: 5,
  },
  {
    nom: "Fatou D. — Plateau",
    texte:
      "J'ai découvert l'institut après mon deuxième accouchement, sur les conseils d'une amie. Le programme post-accouchement m'a vraiment aidée à retrouver confiance en moi. L'équipe est bienveillante et très professionnelle.",
    etoiles: 5,
  },
  {
    nom: "Mariam T. — Yopougon",
    texte:
      "Le soin visage éclat est tout simplement extraordinaire ! Ma peau n'a jamais été aussi lumineuse. Je recommande vivement cet institut à toutes les femmes d'Abidjan qui veulent prendre soin d'elles.",
    etoiles: 5,
  },
]

// ─── Server-side data fetching ───────────────────────────────────

async function getServices() {
  const soins = await prisma.soin.findMany({
    where: { actif: true },
    orderBy: { ordre: "asc" },
    take: 6,
    select: {
      slug: true,
      nom: true,
      description: true,
      icon: true,
    },
  })
  return soins
}

async function getTemoignages() {
  const reviews = await prisma.avis.findMany({
    where: { publie: true, note: { gte: 4 }, commentaire: { not: "" } },
    orderBy: { createdAt: "desc" },
    take: 6,
    include: {
      user: { select: { prenom: true, nom: true } },
      soin: { select: { nom: true } },
    },
  })

  if (reviews.length >= 3) {
    return reviews.map((r) => ({
      nom: `${r.user.prenom} ${r.user.nom.charAt(0)}.`,
      texte: r.commentaire ?? "",
      etoiles: r.note,
      soin: r.soin?.nom,
    }))
  }

  return TEMOIGNAGES_FALLBACK
}

async function getVideoTemoignages() {
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
}

// ─── Page Accueil (Server Component) ─────────────────────────────

export default async function PageAccueil() {
  const [services, temoignages, videoTemoignages] = await Promise.all([
    getServices(),
    getTemoignages(),
    getVideoTemoignages(),
  ])

  return (
    <>
      <HeroSection />
      <ServicesSection services={services} />
      <ChiffresSection />
      <TemoignagesSection temoignages={temoignages} />
      <VideoTemoignagesSection videos={videoTemoignages} />
      <CTASection />
    </>
  )
}
