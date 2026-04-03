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
  // Update bio_sage_femme with 18 ans
  await prisma.appConfig.upsert({
    where: { cle: "bio_sage_femme" },
    update: {
      valeur: JSON.stringify({
        nom: "Ama Kouassi",
        titre: "Sage-femme diplômée d'État",
        experience: "18 ans",
        paragraphes: [
          "Avec plus de 18 ans d'expérience dans l'accompagnement des femmes, Ama Kouassi est la sage-femme de confiance du Surnaturel de Dieu. Diplômée d'État, elle met son expertise au service du bien-être maternel avec douceur et professionnalisme.",
          "Spécialisée dans le suivi physiologique de la grossesse, la préparation à l'accouchement et la rééducation post-natale, elle accompagne chaque femme avec une écoute attentive et des conseils adaptés à sa situation unique.",
          "Chaque consultation est un moment d'échange privilégié pour répondre à toutes vos questions et vous accompagner en toute confiance vers la maternité.",
        ],
      }),
    },
    create: {
      cle: "bio_sage_femme",
      valeur: JSON.stringify({
        nom: "Ama Kouassi",
        titre: "Sage-femme diplômée d'État",
        experience: "18 ans",
        paragraphes: [
          "Avec plus de 18 ans d'expérience dans l'accompagnement des femmes, Ama Kouassi est la sage-femme de confiance du Surnaturel de Dieu. Diplômée d'État, elle met son expertise au service du bien-être maternel avec douceur et professionnalisme.",
          "Spécialisée dans le suivi physiologique de la grossesse, la préparation à l'accouchement et la rééducation post-natale, elle accompagne chaque femme avec une écoute attentive et des conseils adaptés à sa situation unique.",
          "Chaque consultation est un moment d'échange privilégié pour répondre à toutes vos questions et vous accompagner en toute confiance vers la maternité.",
        ],
      }),
    },
  })
  console.log("✓ bio_sage_femme updated to 18 ans")

  // Update equipe member Ama Kouassi in DB
  await prisma.membreEquipe.updateMany({
    where: { nom: "Ama Kouassi" },
    data: {
      description: "Forte de plus de 18 ans d'expérience, Ama accompagne les femmes à chaque étape de leur vie avec professionnalisme et bienveillance.",
    },
  })
  console.log("✓ Membre équipe Ama Kouassi updated")

  await prisma.$disconnect()
  console.log("✅ Done!")
}

main().catch((e) => { console.error(e); process.exit(1) })
