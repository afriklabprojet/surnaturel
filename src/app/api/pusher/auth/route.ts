import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getPusherServeur } from "@/lib/pusher"

/**
 * POST /api/pusher/auth
 *
 * Endpoint d'authentification Pusher pour les canaux private-*.
 * Pusher-js appelle automatiquement cette route avant de s'abonner
 * à tout canal dont le nom commence par "private-".
 *
 * Le corps de la requête est envoyé en application/x-www-form-urlencoded
 * avec deux champs : socket_id et channel_name.
 *
 * Règles d'accès :
 *   private-conversation-{id1}-{id2}  → l'utilisateur doit être id1 ou id2
 *   private-notification-{userId}      → l'utilisateur doit être userId
 *   private-medical-{userId}           → l'utilisateur doit être userId
 *   private-groupe-{groupeId}          → l'utilisateur doit être membre du groupe
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  // Pusher envoie le body en application/x-www-form-urlencoded
  const body = await req.text()
  const params = new URLSearchParams(body)
  const socketId = params.get("socket_id")
  const channelName = params.get("channel_name")

  if (!socketId || !channelName) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
  }

  const userId = session.user.id
  const authorized = await checkChannelAccess(channelName, userId)

  if (!authorized) {
    return NextResponse.json({ error: "Accès refusé au canal" }, { status: 403 })
  }

  const authResponse = getPusherServeur().authorizeChannel(socketId, channelName)
  return NextResponse.json(authResponse)
}

async function checkChannelAccess(channelName: string, userId: string): Promise<boolean> {
  // ── Canal conversation privée ─────────────────────────────────
  // Format : private-conversation-{id1}-{id2}  (id1 < id2, triés, sans tiret interne)
  // Les IDs cuid2 sont alphanumériques purs (pas de tiret) : séparation fiable par "-"
  if (channelName.startsWith("private-conversation-")) {
    const segment = channelName.slice("private-conversation-".length)
    // Les IDs sont joints par "-" et triés — on divise par le tiret du milieu
    // Exemple : "clq8x5yb0000abc-clq8x5yb0000xyz"
    const dashIdx = segment.indexOf("-")
    if (dashIdx === -1) return false
    const id1 = segment.slice(0, dashIdx)
    const id2 = segment.slice(dashIdx + 1)
    return id1 === userId || id2 === userId
  }

  // ── Canal notification personnelle ───────────────────────────
  // Format : private-notification-{userId}
  if (channelName.startsWith("private-notification-")) {
    const targetId = channelName.slice("private-notification-".length)
    return targetId === userId
  }

  // ── Canal médical (messages chiffrés) ────────────────────────
  // Format : private-medical-{userId}
  if (channelName.startsWith("private-medical-")) {
    const targetId = channelName.slice("private-medical-".length)
    return targetId === userId
  }

  // ── Canal groupe ─────────────────────────────────────────────
  // Format : private-groupe-{groupeId}
  // L'utilisateur doit être membre actif du groupe
  if (channelName.startsWith("private-groupe-")) {
    const groupeId = channelName.slice("private-groupe-".length)
    const membre = await prisma.membreGroupe.findUnique({
      where: { groupeId_userId: { groupeId, userId } },
      select: { id: true },
    })
    return membre !== null
  }

  // Canaux publics (communaute-feed, creneaux-*)  → pas d'auth Pusher nécessaire
  // Pusher n'appelle pas cette route pour les canaux publics
  return false
}
