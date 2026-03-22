export interface ProduitMock {
  id: string
  nom: string
  description: string
  descriptionLongue: string
  prix: number
  stock: number
  imageUrl: string
  categorie: "Corps" | "Visage" | "Bien-être & Santé"
  actif: boolean
}

export const CATEGORIES_PRODUIT = [
  { value: "all", label: "Tous les produits" },
  { value: "Corps", label: "Corps" },
  { value: "Visage", label: "Visage" },
  { value: "Bien-être & Santé", label: "Bien-être & Santé" },
] as const

export type TriOption = "nouveautes" | "prix-asc" | "prix-desc"

export const TRIS: { value: TriOption; label: string }[] = [
  { value: "nouveautes", label: "Nouveautés" },
  { value: "prix-asc", label: "Prix croissant" },
  { value: "prix-desc", label: "Prix décroissant" },
]

export const PRODUITS_DATA: ProduitMock[] = [
  {
    id: "prod-001",
    nom: "Beurre de karité pur",
    description:
      "Beurre de karité 100% naturel, récolté artisanalement. Hydrate, nourrit et protège la peau en profondeur.",
    descriptionLongue:
      "Notre beurre de karité pur est issu d'une récolte artisanale en Côte d'Ivoire. Riche en vitamines A, D, E et F, il nourrit intensément la peau, répare les zones sèches et protège contre les agressions extérieures. Convient à toutes les peaux, y compris les plus sensibles. Utilisez-le sur le corps, les mains, les pieds ou les cheveux pour une hydratation longue durée. Texture onctueuse qui pénètre rapidement sans effet gras.",
    prix: 5000,
    stock: 25,
    imageUrl: "/images/produits/beurre-karite.jpg",
    categorie: "Corps",
    actif: true,
  },
  {
    id: "prod-002",
    nom: "Huile de coco vierge",
    description:
      "Huile de coco pressée à froid, multi-usage pour le corps et les cheveux. Parfum délicat.",
    descriptionLongue:
      "Huile de coco vierge pressée à froid, préservant toutes ses propriétés nutritives. Idéale comme soin capillaire, huile corporelle ou démaquillant naturel. Ses acides gras nourrissent la peau et les cheveux en profondeur. Peut aussi être utilisée pour les massages. Texture légère qui fond au contact de la peau. Format 250ml.",
    prix: 8000,
    stock: 18,
    imageUrl: "/images/produits/huile-coco.jpg",
    categorie: "Corps",
    actif: true,
  },
  {
    id: "prod-003",
    nom: "Savon noir africain",
    description:
      "Savon noir traditionnel à base de cendres végétales et de beurre de karité. Purifiant et exfoliant.",
    descriptionLongue:
      "Le savon noir africain est fabriqué selon une recette ancestrale à base de cendres de plantes locales et de beurre de karité. Il nettoie en profondeur, exfolie délicatement et aide à unifier le teint. Recommandé pour les peaux mixtes à grasses, il régule l'excès de sébum tout en préservant l'hydratation naturelle. Peut être utilisé sur le visage et le corps. Format 200g.",
    prix: 3500,
    stock: 40,
    imageUrl: "/images/produits/savon-noir.jpg",
    categorie: "Corps",
    actif: true,
  },
  {
    id: "prod-004",
    nom: "Sérum éclat au curcuma",
    description:
      "Sérum visage à base de curcuma et vitamine C. Illumine le teint et réduit les taches pigmentaires.",
    descriptionLongue:
      "Ce sérum éclat combine les propriétés anti-oxydantes du curcuma et de la vitamine C pour un teint lumineux et unifié. Il aide à atténuer les taches pigmentaires, stimule le renouvellement cellulaire et protège la peau contre le stress oxydatif. Texture légère et non grasse, à appliquer matin et soir sur une peau propre avant la crème hydratante. Format 30ml.",
    prix: 12000,
    stock: 3,
    imageUrl: "/images/produits/serum-curcuma.jpg",
    categorie: "Visage",
    actif: true,
  },
  {
    id: "prod-005",
    nom: "Crème hydratante à l'aloe vera",
    description:
      "Crème visage à l'aloe vera bio. Hydrate, apaise et régénère la peau au quotidien.",
    descriptionLongue:
      "Notre crème hydratante combine le pouvoir apaisant de l'aloe vera bio avec des huiles végétales nourrissantes. Elle hydrate en profondeur, calme les irritations et aide à la régénération cutanée. Texture fondante qui ne laisse pas de film gras. Convient à tous les types de peau, même les plus sensibles. Utilisation quotidienne recommandée. Format 50ml.",
    prix: 9500,
    stock: 12,
    imageUrl: "/images/produits/creme-aloe.jpg",
    categorie: "Visage",
    actif: true,
  },
  {
    id: "prod-006",
    nom: "Masque purifiant à l'argile",
    description:
      "Masque à l'argile verte et au charbon actif. Purifie les pores et matifie la peau.",
    descriptionLongue:
      "Ce masque purifiant associe l'argile verte, connue pour ses propriétés absorbantes, au charbon actif qui capte les impuretés en profondeur. Appliqué 1 à 2 fois par semaine, il purifie les pores, matifie le teint et lisse le grain de peau. Enrichi en huile de tea tree pour un effet antibactérien naturel. Laisser poser 10 à 15 minutes puis rincer à l'eau tiède. Format 100ml.",
    prix: 7000,
    stock: 2,
    imageUrl: "/images/produits/masque-argile.jpg",
    categorie: "Visage",
    actif: true,
  },
  {
    id: "prod-007",
    nom: "Infusion détox bien-être",
    description:
      "Mélange de plantes africaines : kinkeliba, bissap et gingembre. Favorise la digestion et l'élimination.",
    descriptionLongue:
      "Notre infusion détox est composée d'un mélange savamment dosé de kinkeliba, de fleurs de bissap (hibiscus) et de gingembre frais séché. Ces plantes, utilisées depuis des générations en Afrique de l'Ouest, favorisent la digestion, stimulent l'élimination des toxines et apportent une sensation de légèreté. Goût naturellement agréable, sans sucre ajouté. 20 sachets par boîte.",
    prix: 6500,
    stock: 30,
    imageUrl: "/images/produits/infusion-detox.jpg",
    categorie: "Bien-être & Santé",
    actif: true,
  },
  {
    id: "prod-008",
    nom: "Huile essentielle de citronnelle",
    description:
      "Huile essentielle de citronnelle bio. Assainit l'air, repousse les insectes et favorise la relaxation.",
    descriptionLongue:
      "Huile essentielle de citronnelle 100% pure et bio, obtenue par distillation à la vapeur d'eau. Multi-usage : en diffusion pour purifier l'air ambiant et éloigner les moustiques, en application locale (diluée) pour apaiser les tensions musculaires, ou ajoutée au bain pour un moment de détente. Format flacon 15ml.",
    prix: 4500,
    stock: 22,
    imageUrl: "/images/produits/he-citronnelle.jpg",
    categorie: "Bien-être & Santé",
    actif: true,
  },
  {
    id: "prod-009",
    nom: "Kit post-accouchement naturel",
    description:
      "Coffret de soins naturels pour les jeunes mamans : beurre de karité, huile de massage et infusion.",
    descriptionLongue:
      "Ce kit a été spécialement conçu pour les jeunes mamans en période de post-partum. Il comprend un beurre de karité pur (50g) pour nourrir la peau et les vergetures, une huile de massage relaxante aux plantes, et une boîte d'infusion bien-être pour favoriser la récupération. Tous les produits sont 100% naturels et sans danger pour l'allaitement. Idéal en cadeau de naissance.",
    prix: 18000,
    stock: 8,
    imageUrl: "/images/produits/kit-post-accouchement.jpg",
    categorie: "Bien-être & Santé",
    actif: true,
  },
]

export function getProduitById(id: string): ProduitMock | undefined {
  return PRODUITS_DATA.find((p) => p.id === id)
}

export function getProduitsSimilaires(
  produit: ProduitMock,
  limite: number = 3
): ProduitMock[] {
  return PRODUITS_DATA.filter(
    (p) => p.id !== produit.id && p.categorie === produit.categorie && p.actif
  ).slice(0, limite)
}

export function getProduitsParCategorie(
  categorie: string
): ProduitMock[] {
  if (categorie === "all") return PRODUITS_DATA.filter((p) => p.actif)
  return PRODUITS_DATA.filter((p) => p.categorie === categorie && p.actif)
}

export function trierProduits(
  produits: ProduitMock[],
  tri: TriOption
): ProduitMock[] {
  const sorted = [...produits]
  switch (tri) {
    case "prix-asc":
      return sorted.sort((a, b) => a.prix - b.prix)
    case "prix-desc":
      return sorted.sort((a, b) => b.prix - a.prix)
    case "nouveautes":
    default:
      return sorted
  }
}
