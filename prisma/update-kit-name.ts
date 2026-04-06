import { config } from 'dotenv'
config({ path: '.env.local' })
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

neonConfig.webSocketConstructor = ws
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  // First, try to update
  const updated = await prisma.produit.updateMany({
    where: { nom: 'Kit Bien-être - Soutien immunitaire' },
    data: { 
      nom: 'Kit contre les cancers',
      imageUrl: '/images/produits/kit-contre-les-cancers.jpg'
    }
  })
  
  // Check result
  const kits = await prisma.produit.findMany({
    where: { nom: { contains: 'Kit' } },
    select: { nom: true }
  })
  
  console.log('Updated:', updated.count)
  console.log('Kits found:', JSON.stringify(kits))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
