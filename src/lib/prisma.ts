import { PrismaClient } from "@/generated/prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"
import { neonConfig } from "@neondatabase/serverless"
import ws from "ws"
import { validateEnv } from "@/lib/env"

neonConfig.webSocketConstructor = ws

// Valider les env vars au premier import — échoue rapidement avec un message clair
if (process.env.NODE_ENV !== "test") {
  validateEnv()
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  (new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
  }) as unknown as PrismaClient)

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
