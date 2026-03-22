import type { LucideIcon } from "lucide-react"
import {
  Flame,
  Sparkles,
  Zap,
  Smile,
  Baby,
  Wand2,
  Heart,
  Leaf,
  Stethoscope,
  Shield,
  Award,
  Clock,
  Users,
  Star,
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
  imageUrl: string
  badge?: string
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
    imageUrl: "/images/soins/hammam-royal.jpg",
    badge: "Populaire",
  },
  {
    slug: "hammam-duo",
    nom: "Hammam Duo",
    description:
      "Partagez un moment de bien-être à deux dans notre hammam privé. Idéal en couple ou entre amies.",
    descriptionLongue:
      "Partagez un moment de bien-être à deux dans notre hammam privé. Cette expérience exclusive vous invite à vivre ensemble un rituel de purification dans une atmosphère intime et luxueuse. Vapeur parfumée, gommage traditionnel et thé à la menthe : un moment de complicité inoubliable. Parfait pour les couples, les mères et filles, ou les meilleures amies.",
    prix: 14000,
    duree: 75,
    categorie: "HAMMAM",
    icon: Heart,
    imageUrl: "/images/soins/hammam-duo.jpg",
    badge: "Nouveau",
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
    imageUrl: "/images/soins/gommage-corps.jpg",
  },
  {
    slug: "gommage-visage-eclat",
    nom: "Gommage Visage Éclat",
    description:
      "Offrez à votre visage un éclat incomparable grâce à notre gommage doux aux actifs naturels.",
    descriptionLongue:
      "Offrez à votre visage un éclat incomparable grâce à notre gommage doux aux actifs naturels. Ce soin d'exfoliation faciale utilise des micro-grains naturels pour éliminer en douceur les cellules mortes, affiner le grain de peau et réveiller la luminosité de votre teint. Enrichi en vitamines et antioxydants, il laisse votre peau parfaitement lisse, fraîche et prête à recevoir vos soins quotidiens.",
    prix: 8000,
    duree: 30,
    categorie: "GOMMAGE",
    icon: Leaf,
    imageUrl: "/images/soins/gommage-visage.jpg",
    badge: "Nouveau",
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
    imageUrl: "/images/soins/amincissant.jpg",
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
    imageUrl: "/images/soins/visage-eclat.jpg",
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
    imageUrl: "/images/soins/post-accouchement.jpg",
  },
  {
    slug: "consultation-sage-femme",
    nom: "Consultation Sage-Femme",
    description:
      "Un accompagnement médical bienveillant pour chaque étape de votre maternité.",
    descriptionLongue:
      "Un accompagnement médical bienveillant pour chaque étape de votre maternité. Notre sage-femme diplômée vous accompagne dans le suivi de grossesse, la préparation à l'accouchement, et les soins post-partum. Un espace d'écoute et de conseils personnalisés pour vivre sereinement cette période unique. Consultations individuelles adaptées à vos besoins.",
    prix: 15000,
    duree: 60,
    categorie: "SAGE_FEMME",
    icon: Stethoscope,
    imageUrl: "/images/soins/sage-femme.jpg",
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
    imageUrl: "/images/soins/conseil-esthetique.jpg",
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
  "hammam-duo": [
    "Expérience à deux exclusive",
    "Purification de la peau",
    "Détente musculaire partagée",
    "Moment de complicité unique",
    "Élimination des toxines",
    "Bien-être émotionnel",
  ],
  "gommage-corps-luxe": [
    "Exfoliation en profondeur",
    "Peau satinée et lumineuse",
    "Stimulation de la régénération",
    "Hydratation intense",
    "Relaxation totale",
    "Unification du teint",
  ],
  "gommage-visage-eclat": [
    "Grain de peau affiné",
    "Teint lumineux et frais",
    "Élimination des cellules mortes",
    "Hydratation en profondeur",
    "Préparation aux soins quotidiens",
    "Anti-oxydant naturel",
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
  "consultation-sage-femme": [
    "Suivi de grossesse personnalisé",
    "Préparation à l'accouchement",
    "Accompagnement post-partum",
    "Conseils allaitement",
    "Écoute bienveillante",
    "Suivi médical de qualité",
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
  "hammam-duo": [
    { titre: "Accueil du duo", description: "Accueil chaleureux pour vous deux dans notre espace VIP. Présentation du déroulé et installation dans le hammam privé." },
    { titre: "Séance hammam privé", description: "Profitez ensemble de la vapeur parfumée dans notre hammam privé, un moment de détente et de complicité." },
    { titre: "Gommage mutuel ou assisté", description: "Gommage au gant kessa, réalisé par nos esthéticiennes ou en autonomie pour un moment ludique à deux." },
    { titre: "Thé à la menthe & détente", description: "Moment de pause avec thé à la menthe traditionnel et pâtisseries dans notre salon de repos privatif." },
  ],
  "gommage-corps-luxe": [
    { titre: "Préparation de la peau", description: "Votre peau est nettoyée et légèrement humidifiée pour préparer l'exfoliation." },
    { titre: "Application du gommage", description: "Application de notre mélange exclusif d'huiles précieuses et de sucres naturels, avec des mouvements circulaires doux." },
    { titre: "Massage exfoliant", description: "Massage progressif pour éliminer les cellules mortes et stimuler la microcirculation." },
    { titre: "Rinçage", description: "Rinçage abondant à l'eau tiède pour éliminer tous les résidus." },
    { titre: "Hydratation", description: "Application d'une huile ou crème hydratante pour protéger et nourrir votre nouvelle peau." },
  ],
  "gommage-visage-eclat": [
    { titre: "Nettoyage du visage", description: "Démaquillage doux et nettoyage du visage pour préparer la peau à l'exfoliation." },
    { titre: "Application du gommage", description: "Application délicate de micro-grains naturels enrichis en vitamines sur l'ensemble du visage." },
    { titre: "Massage circulaire", description: "Mouvements circulaires doux pour activer la microcirculation et éliminer les cellules mortes." },
    { titre: "Masque apaisant", description: "Application d'un masque hydratant et apaisant pour calmer la peau après l'exfoliation." },
    { titre: "Soin final", description: "Application d'un sérum et d'une crème hydratante adaptés à votre type de peau." },
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
  "consultation-sage-femme": [
    { titre: "Accueil et écoute", description: "Un moment d'échange bienveillant pour comprendre vos besoins et vos attentes." },
    { titre: "Examen et suivi", description: "Examen médical adapté à votre stade de grossesse ou post-partum." },
    { titre: "Conseils personnalisés", description: "Recommandations sur l'alimentation, l'activité physique et la préparation à la naissance." },
    { titre: "Planification du suivi", description: "Mise en place d'un calendrier de suivi adapté et réponse à toutes vos questions." },
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
  { label: "Sage-femme", value: "SAGE_FEMME" },
  { label: "Conseil", value: "CONSEIL_ESTHETIQUE" },
] as const

// ─── Forfaits / Combos ──────────────────────────────────────────

export interface Forfait {
  slug: string
  nom: string
  description: string
  soins: string[]
  prixTotal: number
  prixForfait: number
  economie: number
  badge?: string
}

export const FORFAITS_DATA: Forfait[] = [
  {
    slug: "rituel-purete",
    nom: "Rituel Pureté",
    description: "L'alliance parfaite du hammam et du gommage pour une peau entièrement renouvelée.",
    soins: ["hammam-royal", "gommage-corps-luxe"],
    prixTotal: 20000,
    prixForfait: 17000,
    economie: 3000,
    badge: "Le + populaire",
  },
  {
    slug: "parcours-eclat-total",
    nom: "Parcours Éclat Total",
    description: "Du visage au corps, retrouvez une peau éclatante et lumineuse de la tête aux pieds.",
    soins: ["gommage-visage-eclat", "soin-visage-eclat", "gommage-corps-luxe"],
    prixTotal: 35000,
    prixForfait: 29000,
    economie: 6000,
  },
  {
    slug: "renaissance-maman",
    nom: "Renaissance Maman",
    description: "Un programme complet pour les jeunes mamans : accompagnement sage-femme et programme post-accouchement.",
    soins: ["consultation-sage-femme", "programme-post-accouchement"],
    prixTotal: 40000,
    prixForfait: 34000,
    economie: 6000,
    badge: "Idéal mamans",
  },
]

// ─── FAQ ─────────────────────────────────────────────────────────

export interface FaqItem {
  question: string
  reponse: string
}

export const FAQ_SOINS: FaqItem[] = [
  {
    question: "Comment se déroule un premier rendez-vous ?",
    reponse: "Lors de votre premier rendez-vous, nous prenons le temps d'un échange approfondi pour comprendre vos besoins. Un diagnostic de peau est réalisé, puis nous vous proposons le soin le mieux adapté. Prévoyez 10 minutes supplémentaires pour cet accueil.",
  },
  {
    question: "Puis-je offrir un soin en cadeau ?",
    reponse: "Absolument ! Chaque soin peut être offert sous forme de carte cadeau. Cliquez sur « Offrir ce soin » sur la page du soin de votre choix. La carte cadeau est envoyée par email au destinataire avec un message personnalisé.",
  },
  {
    question: "Quels sont les modes de paiement acceptés ?",
    reponse: "Nous acceptons les paiements par mobile money (Orange Money, MTN Money) via Jeko Africa, ainsi que le paiement sur place. Le paiement en ligne est sécurisé et un reçu vous est envoyé par email.",
  },
  {
    question: "Est-ce que les soins conviennent aux femmes enceintes ?",
    reponse: "Certains soins sont adaptés aux femmes enceintes, comme la consultation sage-femme et le conseil esthétique. Pour les autres soins, nous adaptons nos protocoles selon le stade de la grossesse. Merci de le préciser lors de la prise de rendez-vous.",
  },
  {
    question: "Combien de séances faut-il pour voir des résultats ?",
    reponse: "Les résultats varient selon le type de soin. Un hammam ou gommage offre des résultats immédiats. Pour les soins amincissants, nous recommandons un programme de 5 à 8 séances. Votre esthéticienne vous proposera un plan personnalisé.",
  },
  {
    question: "Quelle est votre politique d'annulation ?",
    reponse: "Vous pouvez annuler ou reporter votre rendez-vous sans frais jusqu'à 24h avant. Au-delà, des frais d'annulation de 50% peuvent s'appliquer. Nous vous enverrons un rappel la veille de votre rendez-vous.",
  },
]

// ─── Pourquoi nous choisir ───────────────────────────────────────

export interface Avantage {
  icon: LucideIcon
  titre: string
  description: string
}

export const AVANTAGES: Avantage[] = [
  {
    icon: Shield,
    titre: "Produits naturels certifiés",
    description: "Nous utilisons exclusivement des produits naturels et certifiés, respectueux de votre peau et de l'environnement.",
  },
  {
    icon: Award,
    titre: "Expertise reconnue",
    description: "Marie Jeanne et son équipe cumulent plus de 10 ans d'expérience dans les soins esthétiques et le bien-être.",
  },
  {
    icon: Clock,
    titre: "Horaires flexibles",
    description: "Du lundi au samedi, avec des créneaux en soirée pour s'adapter à votre emploi du temps chargé.",
  },
  {
    icon: Users,
    titre: "Approche personnalisée",
    description: "Chaque soin est adapté à vos besoins spécifiques. Aucun protocole générique, que du sur-mesure.",
  },
  {
    icon: Star,
    titre: "Programme fidélité",
    description: "Cumulez des points à chaque visite et bénéficiez de soins gratuits grâce à notre programme de fidélité.",
  },
  {
    icon: Heart,
    titre: "Cadre luxueux & apaisant",
    description: "Un institut pensé comme un cocon de sérénité, où chaque détail est conçu pour votre confort.",
  },
]

// ─── Fonctions utilitaires ───────────────────────────────────────

export function getSoinBySlug(slug: string): SoinMock | undefined {
  return SOINS_DATA.find((s) => s.slug === slug)
}

export function getSoinsParCategorie(categorie: string): SoinMock[] {
  if (categorie === "TOUS") return SOINS_DATA
  return SOINS_DATA.filter((s) => s.categorie === categorie)
}

export function getForfaitBySlug(slug: string): Forfait | undefined {
  return FORFAITS_DATA.find((f) => f.slug === slug)
}
