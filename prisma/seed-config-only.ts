import { config } from "dotenv"
config({ path: ".env.local" })

import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"
import { neonConfig } from "@neondatabase/serverless"
import ws from "ws"

neonConfig.webSocketConstructor = ws
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter } as never)

const configEntries = [
  { cle: "nom_centre", valeur: JSON.stringify("Le Surnaturel de Dieu") },
  { cle: "fondatrice", valeur: JSON.stringify("Marie Jeanne") },
  { cle: "annee_fondation", valeur: JSON.stringify(2015) },
  { cle: "adresse_institut", valeur: JSON.stringify("Cocody, Riviera Palmeraie") },
  { cle: "telephone_contact", valeur: JSON.stringify("+225 05 75 97 51 22") },
  { cle: "whatsapp_contact", valeur: JSON.stringify("+225 07 79 19 04 61") },
  { cle: "whatsapp_number", valeur: JSON.stringify("2250779190461") },
  { cle: "whatsapp_message", valeur: JSON.stringify("Bonjour, j'aimerais avoir des informations sur vos soins et services.") },
  { cle: "email_contact", valeur: JSON.stringify("infos@lesurnatureldedieu.com") },
  { cle: "email_rdv", valeur: JSON.stringify("infos@lesurnatureldedieu.com") },
  { cle: "horaires", valeur: JSON.stringify("Lun — Ven : 08h00 — 18h00\nSam : 09h00 — 16h00\nDim : Fermé") },
  { cle: "facebook_url", valeur: JSON.stringify("https://www.facebook.com/surnatureldedieu") },
  { cle: "instagram_url", valeur: JSON.stringify("https://www.instagram.com/surnatureldedieu") },
]

async function main() {
  console.log("🔧 Seeding AppConfig keys...")
  for (const entry of configEntries) {
    await prisma.appConfig.upsert({
      where: { cle: entry.cle },
      update: { valeur: entry.valeur },
      create: entry,
    })
    console.log(`  ✓ ${entry.cle}`)
  }

  // ── Formule abonnement communauté ─────────────────────────────────────
  console.log("🔧 Seeding FormuleAbonnement communauté...")
  await prisma.formuleAbonnement.upsert({
    where: { slug: "communaute" },
    update: {
      nom: "Accès Communauté",
      description: "Rejoignez la communauté Surnaturel de Dieu et échangez avec d'autres membres.",
      prixMensuel: 10000,
      nbSoinsParMois: 0,
      avantages: [
        "Publications et partages illimités",
        "Accès à tous les groupes et cercles",
        "Messagerie privée entre membres",
        "Stories quotidiennes",
        "Badge membre communauté",
        "Événements exclusifs",
      ],
      actif: true,
      ordre: 10,
    },
    create: {
      slug: "communaute",
      nom: "Accès Communauté",
      description: "Rejoignez la communauté Surnaturel de Dieu et échangez avec d'autres membres.",
      prixMensuel: 10000,
      nbSoinsParMois: 0,
      avantages: [
        "Publications et partages illimités",
        "Accès à tous les groupes et cercles",
        "Messagerie privée entre membres",
        "Stories quotidiennes",
        "Badge membre communauté",
        "Événements exclusifs",
      ],
      actif: true,
      ordre: 10,
    },
  })
  console.log("  ✓ formule communaute")

  console.log("✅ Done!")
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
