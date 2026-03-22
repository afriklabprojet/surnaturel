import type { LucideIcon } from "lucide-react"
import {
  Flame,
  Sparkles,
  Zap,
  Smile,
  Baby,
  Wand2,
} from "lucide-react"

export interface SoinMock {
  slug: string
  nom: string
  description: string
  descriptionLongue: string
  prix: number
  duree: number
  categorie: string
  icon: LucideIcon
}

export const SOINS_DATA: SoinMock[] = [
  {
    slug: "hammam-royal",
    nom: "Hammam Royal",
    description:
      "Plongez dans une expérience de purification ancestrale. Notre hammam vous enveloppe dans une vapeur douce et parfumée.",
    descriptionLongue:
      "Plongez dans une expérience de purification ancestrale. Notre hammam vous enveloppe dans une vapeur douce et parfumée, ouvrant les pores pour éliminer les impuretés en profondeur. La chaleur progressive détend vos muscles, libère les tensions accumulées et prépare votre peau à recevoir les soins suivants. Un rituel millénaire revisité dans un cadre de sérénité absolue, idéal pour se ressourcer et retrouver un bien-être total.",
    prix: 8000,
    duree: 60,
    categorie: "HAMMAM",
    icon: Flame,
  },
  {
    slug: "gommage-corps-luxe",
    nom: "Gommage Corps Luxe",
    description:
      "Un rituel d'exfoliation luxueux qui révèle la peau douce et lumineuse qui sommeille en vous.",
    descriptionLongue:
      "Un rituel d'exfoliation luxueux qui révèle la peau douce et lumineuse qui sommeille en vous. Notre mélange exclusif d'huiles précieuses et de sucres naturels transforme votre peau en soie. L'exfoliation élimine les cellules mortes, stimule le renouvellement cellulaire et laisse la peau incroyablement satinée. Ce soin peut être combiné avec le hammam pour une expérience complète de purification et de régénération cutanée.",
    prix: 12000,
    duree: 45,
    categorie: "GOMMAGE",
    icon: Sparkles,
  },
  {
    slug: "soin-amincissant-expert",
    nom: "Soin Amincissant Expert",
    description:
      "Notre protocole amincissant combine des techniques de pointe pour sculpter votre silhouette.",
    descriptionLongue:
      "Notre protocole amincissant combine des techniques de pointe pour sculpter votre silhouette et retrouver confiance en votre corps. Ce soin tonifie, draine et raffermit la peau, tout en améliorant la circulation sanguine et lymphatique. Des résultats visibles dès les premières séances, amplifiés par un programme personnalisé en fonction de vos objectifs.",
    prix: 20000,
    duree: 90,
    categorie: "AMINCISSANT",
    icon: Zap,
  },
  {
    slug: "soin-visage-eclat",
    nom: "Soin Visage Éclat",
    description:
      "Révélez l'éclat naturel de votre peau grâce à notre soin visage personnalisé.",
    descriptionLongue:
      "Révélez l'éclat naturel de votre peau grâce à notre soin visage personnalisé. Adapté à tous les types de peau, ce soin combine nettoyage profond, hydratation et luminosité. Que votre peau soit sèche, mixte, grasse ou sensible, chaque étape est adaptée à vos besoins spécifiques. Un véritable moment de bien-être pour retrouver un teint lumineux et une peau revitalisée.",
    prix: 15000,
    duree: 60,
    categorie: "VISAGE",
    icon: Smile,
  },
  {
    slug: "programme-post-accouchement",
    nom: "Programme Post-Accouchement",
    description:
      "Retrouvez votre vitalité après l'accouchement grâce à notre programme complet.",
    descriptionLongue:
      "Retrouvez votre vitalité après l'accouchement grâce à notre programme complet. Conçu par Marie Jeanne, ce programme accompagne les jeunes mamans dans leur renaissance physique et émotionnelle. Il combine des soins du corps relaxants, des techniques de raffermissement abdominal et des moments de détente profonde. Un parcours de soin bienveillant pour se retrouver et reprendre confiance dans son corps.",
    prix: 25000,
    duree: 90,
    categorie: "POST_ACCOUCHEMENT",
    icon: Baby,
  },
  {
    slug: "conseil-esthetique",
    nom: "Conseil Esthétique Personnalisé",
    description:
      "Un accompagnement sur-mesure pour révéler votre beauté naturelle au quotidien.",
    descriptionLongue:
      "Un accompagnement sur-mesure pour révéler votre beauté naturelle au quotidien. Marie Jeanne partage son expertise pour créer votre routine beauté idéale. Nous analysons votre type de peau, vos habitudes et vos objectifs pour vous proposer des recommandations personnalisées de produits et de soins adaptés à vos besoins.",
    prix: 10000,
    duree: 45,
    categorie: "CONSEIL_ESTHETIQUE",
    icon: Wand2,
  },
]

// ─── Bienfaits par soin ──────────────────────────────────────────

export const BIENFAITS_SOINS: Record<string, string[]> = {
  "hammam-royal": [
    "Élimination des toxines",
    "Peau purifiée et éclatante",
    "Détente musculaire profonde",
    "Amélioration de la circulation",
    "Préparation idéale aux soins",
    "Réduction du stress",
  ],
  "gommage-corps-luxe": [
    "Exfoliation en profondeur",
    "Peau satinée et lumineuse",
    "Stimulation de la régénération",
    "Hydratation intense",
    "Relaxation totale",
    "Unification du teint",
  ],
  "soin-amincissant-expert": [
    "Réduction des zones rebelles",
    "Drainage lymphatique",
    "Raffermissement de la peau",
    "Réduction de la cellulite",
    "Tonification des tissus",
    "Silhouette affinée",
  ],
  "soin-visage-eclat": [
    "Nettoyage en profondeur",
    "Hydratation intense",
    "Éclat du teint retrouvé",
    "Réduction des imperfections",
    "Anti-âge naturel",
    "Peau revitalisée",
  ],
  "programme-post-accouchement": [
    "Récupération post-partum",
    "Raffermissement abdominal",
    "Réduction des tensions",
    "Moment de détente pour les mamans",
    "Amélioration de l'énergie",
    "Reconnexion avec son corps",
  ],
  "conseil-esthetique": [
    "Diagnostic personnalisé",
    "Routine sur mesure",
    "Conseils d'experts",
    "Recommandations produits adaptées",
    "Suivi personnalisé",
    "Économies sur les achats inutiles",
  ],
}

// ─── Étapes par soin ──────────────────────────────────────────────

export interface EtapeSoin {
  titre: string
  description: string
}

export const ETAPES_SOINS: Record<string, EtapeSoin[]> = {
  "hammam-royal": [
    { titre: "Accueil & préparation", description: "Vous êtes accueillie dans notre espace de détente. Nous vous remettons votre tenue et vous présentons le déroulement du soin." },
    { titre: "Séance hammam vapeur", description: "Installation dans notre hammam traditionnel. La chaleur douce et humide ouvre progressivement vos pores et détend vos muscles." },
    { titre: "Gommage doux au gant kessa", description: "Exfoliation délicate avec le gant traditionnel kessa pour éliminer les cellules mortes et purifier la peau." },
    { titre: "Rinçage et relaxation", description: "Rinçage à l'eau tiède suivi d'un moment de repos dans notre espace détente, enveloppée dans un peignoir douillet." },
  ],
  "gommage-corps-luxe": [
    { titre: "Préparation de la peau", description: "Votre peau est nettoyée et légèrement humidifiée pour préparer l'exfoliation." },
    { titre: "Application du gommage", description: "Application de notre mélange exclusif d'huiles précieuses et de sucres naturels, avec des mouvements circulaires doux." },
    { titre: "Massage exfoliant", description: "Massage progressif pour éliminer les cellules mortes et stimuler la microcirculation." },
    { titre: "Rinçage", description: "Rinçage abondant à l'eau tiède pour éliminer tous les résidus." },
    { titre: "Hydratation", description: "Application d'une huile ou crème hydratante pour protéger et nourrir votre nouvelle peau." },
  ],
  "soin-amincissant-expert": [
    { titre: "Diagnostic corporel", description: "Évaluation des zones à traiter et détermination du protocole personnalisé." },
    { titre: "Application des actifs", description: "Pose de produits amincissants ciblés sur les zones identifiées." },
    { titre: "Modelage drainant", description: "Techniques de massage spécifiques pour activer la circulation et le drainage lymphatique." },
    { titre: "Enveloppement", description: "Enveloppement dans un film technique pour optimiser l'action des actifs." },
    { titre: "Finalisation", description: "Application d'une crème raffermissante et conseils pour prolonger les effets à domicile." },
  ],
  "soin-visage-eclat": [
    { titre: "Démaquillage", description: "Nettoyage doux et complet du visage pour éliminer maquillage et impuretés." },
    { titre: "Diagnostic peau", description: "Analyse de votre type de peau pour adapter les produits et techniques utilisés." },
    { titre: "Exfoliation", description: "Gommage doux adapté pour préparer la peau à recevoir les soins actifs." },
    { titre: "Soin ciblé", description: "Application de sérums et masques adaptés à vos besoins spécifiques." },
    { titre: "Massage facial", description: "Massage relaxant et liftant pour stimuler la circulation et détendre les traits." },
    { titre: "Hydratation finale", description: "Application d'une crème de jour ou de nuit selon l'heure du soin." },
  ],
  "programme-post-accouchement": [
    { titre: "Entretien personnalisé", description: "Discussion sur vos besoins spécifiques et les zones à privilégier après l'accouchement." },
    { titre: "Relaxation", description: "Moment de détente pour libérer les tensions accumulées pendant la grossesse et l'accouchement." },
    { titre: "Soin du corps", description: "Massage doux de l'ensemble du corps, particulièrement adapté aux jeunes mamans." },
    { titre: "Soin ciblé abdominal", description: "Techniques douces pour accompagner le retour de l'élasticité de la zone abdominale." },
    { titre: "Moment de pause", description: "Temps de repos et d'échange de conseils pour prendre soin de vous au quotidien." },
  ],
  "conseil-esthetique": [
    { titre: "Accueil et questionnaire", description: "Discussion sur vos habitudes actuelles, vos préoccupations et vos objectifs beauté." },
    { titre: "Analyse de peau", description: "Diagnostic complet de votre type de peau à l'aide de techniques d'observation professionnelles." },
    { titre: "Recommandations", description: "Présentation de la routine adaptée et des produits conseillés pour votre profil." },
    { titre: "Démonstration", description: "Application des produits recommandés pour vous montrer les bons gestes." },
    { titre: "Synthèse écrite", description: "Remise d'un document récapitulatif de votre routine personnalisée à suivre chez vous." },
  ],
}

export const CATEGORIES_FILTRE = [
  { label: "Tous", value: "TOUS" },
  { label: "Hammam", value: "HAMMAM" },
  { label: "Gommage", value: "GOMMAGE" },
  { label: "Amincissant", value: "AMINCISSANT" },
  { label: "Visage", value: "VISAGE" },
  { label: "Post-accouchement", value: "POST_ACCOUCHEMENT" },
  { label: "Conseil", value: "CONSEIL_ESTHETIQUE" },
] as const

export function getSoinBySlug(slug: string): SoinMock | undefined {
  return SOINS_DATA.find((s) => s.slug === slug)
}

export function getSoinsParCategorie(categorie: string): SoinMock[] {
  if (categorie === "TOUS") return SOINS_DATA
  return SOINS_DATA.filter((s) => s.categorie === categorie)
}
