import { PrismaClient } from "../src/generated/prisma/client.js"
import { PrismaNeon } from '@prisma/adapter-neon'
import { neonConfig } from "@neondatabase/serverless"
import ws from "ws"
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

neonConfig.webSocketConstructor = ws

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Check if admin exists
  const user = await prisma.user.findUnique({
    where: { email: 'admin@lesurnatureldedieu.com' },
    select: { id: true, email: true, nom: true, prenom: true, role: true, passwordHash: true },
  })

  if (!user) {
    console.log('❌ Admin NOT FOUND — creating...')
    const hash = await bcrypt.hash('Admin@2025', 12)
    const created = await prisma.user.create({
      data: {
        email: 'admin@lesurnatureldedieu.com',
        nom: 'Jeanne',
        prenom: 'Marie',
        role: 'ADMIN',
        passwordHash: hash,
        emailVerifie: true,
      },
    })
    console.log('✅ Admin créé:', created.id)
  } else {
    console.log('Admin trouvé:', { id: user.id, email: user.email, role: user.role })
    // Verify password
    const match = user.passwordHash ? await bcrypt.compare('Admin@2025', user.passwordHash) : false
    console.log('Mot de passe "Admin@2025" valide ?', match)
    if (!match) {
      console.log('🔄 Reset du mot de passe...')
      const newHash = await bcrypt.hash('Admin@2025', 12)
      await prisma.user.update({
        where: { email: 'admin@lesurnatureldedieu.com' },
        data: { passwordHash: newHash, emailVerifie: true },
      })
      console.log('✅ Mot de passe réinitialisé à "Admin@2025"')
    } else {
      // S'assurer que emailVerifie est true même si le mot de passe est correct
      await prisma.user.update({
        where: { email: 'admin@lesurnatureldedieu.com' },
        data: { emailVerifie: true },
      })
      console.log('✅ emailVerifie forcé à true')
    }
  }

  await prisma.$disconnect()
}

main()
