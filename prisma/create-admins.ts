import { config } from "dotenv"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, "..", ".env.local") })

import ws from "ws"
import { neonConfig } from "@neondatabase/serverless"
neonConfig.webSocketConstructor = ws

import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"
import bcrypt from "bcryptjs"

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter } as never)

async function createAdmins() {
  console.log("🔐 Création des comptes admin...")

  const adminHash = await bcrypt.hash("Admin@2025", 12)
  const sageFemmeHash = await bcrypt.hash("SageFemme@2025", 12)
  const clientHash = await bcrypt.hash("Client@2025", 12)

  const admin = await prisma.user.upsert({
    where: { email: "admin@lesurnatureldedieu.com" },
    update: { passwordHash: adminHash },
    create: {
      email: "admin@lesurnatureldedieu.com",
      passwordHash: adminHash,
      nom: "Jeanne",
      prenom: "Marie",
      role: "ADMIN",
    },
  })
  console.log(`✅ Admin: ${admin.email} (${admin.prenom} ${admin.nom})`)

  const sageFemme = await prisma.user.upsert({
    where: { email: "sagefemme@lesurnatureldedieu.com" },
    update: { passwordHash: sageFemmeHash },
    create: {
      email: "sagefemme@lesurnatureldedieu.com",
      passwordHash: sageFemmeHash,
      nom: "Kouassi",
      prenom: "Ama",
      role: "SAGE_FEMME",
      telephone: "+225 07 00 00 01",
    },
  })
  console.log(`✅ Sage-femme: ${sageFemme.email} (${sageFemme.prenom} ${sageFemme.nom})`)

  const client = await prisma.user.upsert({
    where: { email: "client@test.com" },
    update: { passwordHash: clientHash },
    create: {
      email: "client@test.com",
      passwordHash: clientHash,
      nom: "Diallo",
      prenom: "Fatou",
      role: "CLIENT",
      telephone: "+225 05 00 00 01",
    },
  })
  console.log(`✅ Client: ${client.email} (${client.prenom} ${client.nom})`)

  console.log("\n🎉 Comptes créés avec succès !")
  console.log("─────────────────────────────────────")
  console.log("Admin:      admin@lesurnatureldedieu.com / Admin@2025")
  console.log("Sage-femme: sagefemme@lesurnatureldedieu.com / SageFemme@2025")
  console.log("Client:     client@test.com / Client@2025")

  await prisma.$disconnect()
}

createAdmins().catch((e) => {
  console.error(e)
  process.exit(1)
})
