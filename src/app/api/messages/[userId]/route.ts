import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { userId } = await params
  const currentUserId = session.user.id

  const url = new URL(req.url)
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? "50")))
  // cursor = createdAt ISO du message le plus ancien déjà reçu
  // Absent pour le premier chargement, présent pour "charger plus"
  const cursorParam = url.searchParams.get("cursor")
  const cursor = cursorParam ? new Date(cursorParam) : null

  const now = new Date()

  const convWhere = {
    AND: [
      {
        OR: [
          { expediteurId: currentUserId, destinataireId: userId },
          { expediteurId: userId, destinataireId: currentUserId },
        ],
      },
      {
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      // Cursor-based : ne charger que les messages plus anciens que le cursor
      // Évite OFFSET N qui force Postgres à scanner et ignorer N lignes
      ...(cursor ? [{ createdAt: { lt: cursor } }] : []),
    ],
  }

  const messages = await prisma.message.findMany({
    where: convWhere,
    include: {
      expediteur: {
        select: { id: true, nom: true, prenom: true, photoUrl: true },
      },
      replyTo: {
        select: {
          id: true, contenu: true, type: true,
          expediteur: { select: { id: true, prenom: true, nom: true } },
        },
      },
      reactions: {
        select: { type: true, userId: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1, // +1 pour détecter s'il y a encore des messages plus anciens
  })

  // Si on a reçu limit+1 messages, il en reste
  const hasMore = messages.length > limit
  if (hasMore) messages.pop() // retirer le message fantôme

  // Renvoyer les messages dans l'ordre chronologique (du plus ancien au plus récent)
  const sorted = messages.reverse()

  return NextResponse.json({
    messages: sorted,
    hasMore,
    // nextCursor = createdAt du plus ancien message de ce batch
    nextCursor: sorted.length > 0 ? sorted[0].createdAt.toISOString() : null,
  })
}

