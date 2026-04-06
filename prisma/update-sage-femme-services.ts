/**
 * Met à jour les services sage-femme dans AppConfig
 * Usage : npx tsx prisma/update-sage-femme-services.ts
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

async function main() {
  const specialites = [
    "Consultations prénatales",
    "Consultations postnatales",
    "Suivi de grossesse",
    "Conseils en allaitement",
    "Planification familiale",
    "Éducation à la santé féminine",
    "Consultations personnalisées",
  ]

  const prestations = [
    { icon: "Baby", titre: "Consultations prénatales", description: "Suivi de la grossesse, conseils et accompagnement avant l'accouchement.", prix: 15000, duree: 45 },
    { icon: "Heart", titre: "Consultations postnatales", description: "Suivi après l'accouchement pour la maman et le bébé.", prix: 15000, duree: 45 },
    { icon: "Stethoscope", titre: "Suivi de grossesse", description: "Contrôle de l'évolution de la grossesse et surveillance de la santé de la mère et de l'enfant.", prix: 15000, duree: 45 },
    { icon: "Shield", titre: "Conseils en allaitement", description: "Accompagnement et aide pour un allaitement réussi.", prix: 10000, duree: 30 },
    { icon: "Users", titre: "Planification familiale", description: "Conseils sur les méthodes de contraception et le bien-être reproductif.", prix: 10000, duree: 30 },
    { icon: "BookOpen", titre: "Éducation à la santé féminine", description: "Informations et sensibilisation sur la santé de la femme.", prix: 10000, duree: 30 },
    { icon: "HeartHandshake", titre: "Consultations personnalisées", description: "Écoute, orientation et accompagnement selon les besoins spécifiques de chaque patiente.", prix: 10000, duree: 30 },
  ]

  // Bio mise à jour pour refléter les vrais services
  const bio = {
    nom: "Ama Kouassi",
    titre: "Sage-femme diplômée d'État",
    experience: "18 ans",
    paragraphes: [
      "Avec plus de 18 ans d'expérience dans l'accompagnement des femmes, Ama Kouassi est la sage-femme de confiance du Surnaturel de Dieu. Diplômée d'État, elle met son expertise au service du bien-être maternel avec douceur et professionnalisme.",
      "Nous proposons un accompagnement complet pour les femmes à chaque étape de leur vie : consultations prénatales et postnatales, suivi de grossesse, conseils en allaitement, planification familiale et éducation à la santé féminine.",
      "Notre objectif est d'offrir un suivi de qualité, rassurant et adapté à chaque femme, dans un cadre humain et bienveillant.",
    ],
  }

  const updates = [
    { cle: "specialites_sage_femme", valeur: JSON.stringify(specialites) },
    { cle: "prestations_sage_femme", valeur: JSON.stringify(prestations) },
    { cle: "bio_sage_femme", valeur: JSON.stringify(bio) },
  ]

  for (const { cle, valeur } of updates) {
    await prisma.appConfig.upsert({
      where: { cle },
      update: { valeur },
      create: { cle, valeur },
    })
    console.log(`✓ ${cle} mis à jour`)
  }

  console.log("\n✅ Services sage-femme mis à jour avec succès !")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
