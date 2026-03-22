import { PrismaClient } from "../src/generated/prisma/client.js"
import { PrismaNeon } from "@prisma/adapter-neon"
import { neonConfig } from "@neondatabase/serverless"
import ws from "ws"
import bcrypt from "bcryptjs"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })
dotenv.config({ path: ".env" })

neonConfig.webSocketConstructor = ws

async function main() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
  const p = new PrismaClient({ adapter })

  const hash = await bcrypt.hash("Test1234", 10)

  const user = await p.user.upsert({
    where: { email: "client.test@surnaturel.ci" },
    update: { passwordHash: hash },
    create: {
      email: "client.test@surnaturel.ci",
      nom: "Kouamé",
      prenom: "Aya",
      passwordHash: hash,
      role: "CLIENT",
      telephone: "+22501020304",
      profilPublic: true,
    },
    select: { id: true, email: true, nom: true, prenom: true, role: true },
  })

  console.log("Compte test créé :", JSON.stringify(user, null, 2))
  await p.$disconnect()
}

main()
