/**
 * Script : Remplacer tous les soins par les vrais services pathologies
 * Usage  : npx tsx prisma/replace-soins.ts
 */
import { config } from "dotenv"
config({ path: ".env.local" })

import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"
import { neonConfig } from "@neondatabase/serverless"
import ws from "ws"

neonConfig.webSocketConstructor = ws

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter } as never)

const nouveauxSoins = [
  {
    nom: "Prise en charge du Diabète",
    slug: "diabete",
    description: "Accompagnement et suivi personnalisé pour les patients diabétiques. Conseils nutritionnels, suivi glycémique et éducation thérapeutique.",
    descriptionLongue: "Notre programme de prise en charge du diabète offre un accompagnement complet et personnalisé. Nous proposons un suivi glycémique régulier, des conseils nutritionnels adaptés, une éducation thérapeutique pour mieux vivre au quotidien avec le diabète, ainsi qu'un soutien psychologique. L'objectif est d'aider chaque patient à maintenir un équilibre glycémique optimal et prévenir les complications.",
    bienfaits: [
      "Suivi glycémique personnalisé",
      "Conseils nutritionnels adaptés",
      "Éducation thérapeutique",
      "Prévention des complications",
      "Amélioration de la qualité de vie",
      "Soutien psychologique",
    ],
    etapes: [
      { titre: "Bilan initial", description: "Évaluation complète de votre état de santé, antécédents et habitudes de vie." },
      { titre: "Plan de suivi personnalisé", description: "Élaboration d'un programme adapté à votre profil et vos objectifs de santé." },
      { titre: "Conseils nutritionnels", description: "Recommandations alimentaires spécifiques pour le contrôle glycémique." },
      { titre: "Suivi régulier", description: "Consultations de suivi pour ajuster le traitement et évaluer les progrès." },
    ],
    prix: 15000,
    duree: 60,
    categorie: "PATHOLOGIE" as const,
    icon: "Activity",
    badge: null,
    ordre: 1,
    actif: true,
  },
  {
    nom: "Prise en charge du Cholestérol",
    slug: "cholesterol",
    description: "Programme de suivi et de gestion du cholestérol. Bilan lipidique, conseils diététiques et accompagnement pour réduire les risques cardiovasculaires.",
    descriptionLongue: "Le cholestérol élevé est un facteur de risque majeur pour les maladies cardiovasculaires. Notre programme propose un bilan lipidique complet, des conseils diététiques personnalisés, un accompagnement pour adopter une hygiène de vie saine et un suivi régulier de vos marqueurs sanguins. Nous vous aidons à reprendre le contrôle de votre santé cardiovasculaire.",
    bienfaits: [
      "Bilan lipidique complet",
      "Conseils diététiques personnalisés",
      "Réduction des risques cardiovasculaires",
      "Suivi des marqueurs sanguins",
      "Accompagnement hygiène de vie",
      "Prévention des complications",
    ],
    etapes: [
      { titre: "Bilan lipidique", description: "Analyse complète de votre profil lipidique et identification des facteurs de risque." },
      { titre: "Conseils alimentaires", description: "Plan alimentaire adapté pour réduire le mauvais cholestérol." },
      { titre: "Programme d'activité", description: "Recommandations d'activité physique adaptée à votre condition." },
      { titre: "Suivi et ajustement", description: "Contrôles réguliers et ajustement du programme selon les résultats." },
    ],
    prix: 15000,
    duree: 60,
    categorie: "PATHOLOGIE" as const,
    icon: "Heart",
    badge: null,
    ordre: 2,
    actif: true,
  },
  {
    nom: "Prise en charge de la Drépanocytose",
    slug: "drepanocytose",
    description: "Accompagnement spécialisé pour les patients drépanocytaires. Gestion des crises, suivi médical et soutien au quotidien.",
    descriptionLongue: "La drépanocytose nécessite un suivi médical rigoureux et un accompagnement adapté. Notre programme propose une prise en charge globale : gestion et prévention des crises vaso-occlusives, suivi hématologique, conseils pour la vie quotidienne, soutien psychologique et éducation thérapeutique pour les patients et leurs familles.",
    bienfaits: [
      "Gestion des crises vaso-occlusives",
      "Suivi hématologique régulier",
      "Prévention des complications",
      "Éducation thérapeutique",
      "Soutien psychologique",
      "Accompagnement familial",
    ],
    etapes: [
      { titre: "Évaluation initiale", description: "Bilan complet de votre état de santé et historique des crises." },
      { titre: "Plan de prévention", description: "Mise en place de mesures préventives pour réduire la fréquence des crises." },
      { titre: "Éducation thérapeutique", description: "Apprentissage des signes d'alerte et des gestes à adopter au quotidien." },
      { titre: "Suivi régulier", description: "Consultations de suivi avec ajustement du programme de soins." },
    ],
    prix: 15000,
    duree: 60,
    categorie: "PATHOLOGIE" as const,
    icon: "Droplets",
    badge: null,
    ordre: 3,
    actif: true,
  },
  {
    nom: "Prise en charge de l'Obésité",
    slug: "obesite",
    description: "Programme complet de gestion du poids. Bilan nutritionnel, accompagnement diététique et suivi pour une perte de poids durable et saine.",
    descriptionLongue: "L'obésité est une pathologie complexe qui nécessite une approche globale. Notre programme combine un bilan nutritionnel approfondi, un accompagnement diététique personnalisé, des recommandations d'activité physique adaptée et un soutien psychologique. L'objectif est une perte de poids progressive, durable et respectueuse de votre santé.",
    bienfaits: [
      "Bilan nutritionnel complet",
      "Programme alimentaire personnalisé",
      "Activité physique adaptée",
      "Perte de poids durable",
      "Soutien psychologique",
      "Prévention des comorbidités",
    ],
    etapes: [
      { titre: "Bilan complet", description: "Évaluation de votre indice de masse corporelle, habitudes alimentaires et mode de vie." },
      { titre: "Programme nutritionnel", description: "Élaboration d'un plan alimentaire équilibré et adapté à vos goûts." },
      { titre: "Activité physique", description: "Programme d'exercices progressif et adapté à votre condition physique." },
      { titre: "Suivi et motivation", description: "Consultations régulières pour suivre les progrès et maintenir la motivation." },
    ],
    prix: 15000,
    duree: 60,
    categorie: "PATHOLOGIE" as const,
    icon: "Scale",
    badge: null,
    ordre: 4,
    actif: true,
  },
  {
    nom: "Prise en charge de l'Insuffisance",
    slug: "insuffisance",
    description: "Accompagnement et suivi pour les patients souffrant d'insuffisance (rénale, cardiaque, respiratoire). Suivi médical et conseils adaptés.",
    descriptionLongue: "L'insuffisance organique (rénale, cardiaque ou respiratoire) demande un suivi médical attentif et un mode de vie adapté. Notre programme propose un bilan fonctionnel complet, un suivi régulier des marqueurs de santé, des conseils nutritionnels et d'hygiène de vie spécifiques, ainsi qu'un accompagnement psychologique pour mieux vivre avec sa pathologie au quotidien.",
    bienfaits: [
      "Bilan fonctionnel complet",
      "Suivi des marqueurs de santé",
      "Conseils nutritionnels spécifiques",
      "Accompagnement quotidien",
      "Prévention de l'aggravation",
      "Soutien psychologique",
    ],
    etapes: [
      { titre: "Bilan fonctionnel", description: "Évaluation de la fonction organique et identification du stade de l'insuffisance." },
      { titre: "Plan thérapeutique", description: "Mise en place d'un programme de suivi adapté à votre type d'insuffisance." },
      { titre: "Conseils de vie", description: "Recommandations alimentaires, hydratation et activité physique adaptées." },
      { titre: "Suivi rapproché", description: "Consultations régulières pour surveiller l'évolution et ajuster la prise en charge." },
    ],
    prix: 15000,
    duree: 60,
    categorie: "PATHOLOGIE" as const,
    icon: "Stethoscope",
    badge: null,
    ordre: 5,
    actif: true,
  },
]

async function main() {
  console.log("🔄 Remplacement des soins...")

  // Désactiver les anciens soins (plutôt que supprimer pour préserver les RDV/avis existants)
  const anciens = await prisma.soin.updateMany({
    data: { actif: false },
  })
  console.log(`  ↳ ${anciens.count} ancien(s) soin(s) désactivé(s)`)

  // Créer les nouveaux soins
  for (const data of nouveauxSoins) {
    const existing = await prisma.soin.findUnique({ where: { slug: data.slug } })
    if (existing) {
      await prisma.soin.update({ where: { slug: data.slug }, data })
      console.log(`  ✏️  Mis à jour : ${data.nom}`)
    } else {
      await prisma.soin.create({ data })
      console.log(`  ✅ Créé : ${data.nom}`)
    }
  }

  console.log("\n✅ Terminé — 5 nouveaux services pathologies actifs")
}

main()
  .catch((e) => {
    console.error("❌ Erreur :", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
