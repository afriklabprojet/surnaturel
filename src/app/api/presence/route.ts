import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createRateLimiter } from "@/lib/rate-limit"
import { redis, setPresence } from "@/lib/redis"

// 3 heartbeats/min max par utilisateur
// Réponse silencieuse sur 429 : le client n'a pas besoin de savoir
const presenceLimiter = createRateLimiter({ limit: 3, windowMs: 60_000, prefix: "presence" })

// POST — Mettre à jour la présence de l'utilisateur courant (heartbeat)
export async function POST() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const rl = await Promise.resolve(presenceLimiter(session.user.id))
  if (!rl.allowed) {
    // Silencieux côté client : inutile d'afficher une erreur pour un heartbeat
    return NextResponse.json({ success: true })
  }

  if (redis) {
    // Redis disponible : SET avec TTL 65s — 0 écriture DB permanente
    await setPresence(session.user.id)
  } else {
    // Fallback dégradé : écriture DB (comportement avant A12)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { derniereVueAt: new Date() },
    })
  }

  return NextResponse.json({ success: true })
}
