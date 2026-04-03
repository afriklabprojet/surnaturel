import { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import {
  HeroSoins,
  SoinsFiltres,
  ForfaitsSection,
  AvantagesSection,
  FaqSoinsSection,
  BandeauPromo,
} from "@/components/soins/SoinsClientSections"

export const metadata: Metadata = {
  title: "Soins & Services | Le Surnaturel de Dieu — Institut de bien-être à Abidjan",
  description:
    "Découvrez nos soins de bien-être à Abidjan : hammam, gommage, soin amincissant, soin du visage, post-accouchement, conseil esthétique et consultations sage-femme.",
  alternates: { canonical: "/soins" },
}

export default async function PageSoins() {
  // Un seul aller-retour DB — toutes les données en parallèle
  const [soinsData, forfaitsData, faqData, avantagesConfig, categoriesConfig, promoConfig, heroIconesConfig] =
    await Promise.all([
      prisma.soin.findMany({
        where: { actif: true },
        orderBy: { ordre: "asc" },
        select: {
          id: true,
          slug: true,
          nom: true,
          description: true,
          prix: true,
          duree: true,
          categorie: true,
          icon: true,
          badge: true,
          imageUrl: true,
        },
      }),
      prisma.forfait.findMany({
        orderBy: { ordre: "asc" },
        include: {
          soins: {
            include: {
              soin: { select: { slug: true, nom: true, duree: true, icon: true, prix: true } },
            },
          },
        },
      }),
      prisma.faq.findMany({
        where: { categorie: "soins", actif: true },
        orderBy: { ordre: "asc" },
      }),
      prisma.appConfig.findUnique({ where: { cle: "avantages" } }),
      prisma.appConfig.findUnique({ where: { cle: "categories_soins" } }),
      prisma.appConfig.findUnique({ where: { cle: "bandeau_promo" } }),
      prisma.appConfig.findUnique({ where: { cle: "hero_soins_icones" } }),
    ])

  const soins = soinsData.map((s) => ({
    slug: s.slug,
    nom: s.nom,
    description: s.description,
    prix: s.prix,
    duree: s.duree,
    categorie: s.categorie,
    icon: s.icon,
    badge: s.badge,
    imageUrl: s.imageUrl,
  }))

  const forfaits = forfaitsData.map((f) => ({
    slug: f.slug,
    nom: f.nom,
    description: f.description,
    prixTotal: f.prixTotal,
    prixForfait: f.prixForfait,
    economie: f.economie,
    badge: f.badge,
    soins: f.soins.map((fs) => fs.soin),
  }))

  const faqs = faqData.map((f) => ({ question: f.question, reponse: f.reponse }))
  const avantages: Array<{ icon: string; titre: string; description: string }> =
    avantagesConfig ? JSON.parse(avantagesConfig.valeur) : []
  const categories: Array<{ label: string; value: string }> =
    categoriesConfig
      ? JSON.parse(categoriesConfig.valeur)
      : [{ label: "Tous", value: "TOUS" }]
  const promo: { actif: boolean; texte: string; code: string; detail: string } | null =
    promoConfig ? JSON.parse(promoConfig.valeur) : null
  const heroIcones: Array<{ emoji: string; label: string }> =
    heroIconesConfig ? JSON.parse(heroIconesConfig.valeur) : []

  return (
    <>
      <BandeauPromo promo={promo} />
      <HeroSoins nombreSoins={soins.length} heroIcones={heroIcones} />
      <SoinsFiltres soins={soins} categories={categories} />
      {forfaits.length > 0 && <ForfaitsSection forfaits={forfaits} />}
      {avantages.length > 0 && <AvantagesSection avantages={avantages} />}
      {faqs.length > 0 && <FaqSoinsSection faqs={faqs} />}
    </>
  )
}
