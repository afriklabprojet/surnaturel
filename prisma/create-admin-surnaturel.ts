import { config } from "dotenv"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, "..", ".env.local") })
config({ path: resolve(__dirname, "..", ".env.production") })
config({ path: resolve(__dirname, "..", ".env") })

import ws from "ws"
import { neonConfig } from "@neondatabase/serverless"
neonConfig.webSocketConstructor = ws

import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"
import bcrypt from "bcryptjs"

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter } as never)

async function main() {
  console.log("🔐 Création / mise à jour du compte admin principal…")

  const email = "admin@surnatureldedieu.com"
  const password = "ParisAbidjan@@2025"

  const hash = await bcrypt.hash(password, 12)

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash: hash,
      role: "ADMIN",
      emailVerifie: true,
    },
    create: {
      email,
      passwordHash: hash,
      nom: "Admin",
      prenom: "Surnaturel",
      role: "ADMIN",
      emailVerifie: true,
    },
  })

  console.log(`✅ Compte admin créé / mis à jour : ${user.email} (id: ${user.id})`)
  console.log("   Email    :", email)
  console.log("   Mot de passe : (défini avec succès)")
  console.log("   Rôle     :", user.role)

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
