import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const userId = session.user.id

  const matches = await prisma.rencontreMatch.findMany({
    where: {
      actif: true,
      OR: [{ userAId: userId }, { userBId: userId }],
    },
    include: {
      userA: {
        select: {
          id: true,
          prenom: true,
          nom: true,
          pseudo: true,
          photoUrl: true,
          bio: true,
          ville: true,
          verificationStatus: true,
          derniereVueAt: true,
        },
      },
      userB: {
        select: {
          id: true,
          prenom: true,
          nom: true,
          pseudo: true,
          photoUrl: true,
          bio: true,
          ville: true,
          verificationStatus: true,
          derniereVueAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Retourner l'interlocuteur (l'autre utilisateur) pour chaque match
  const formated = matches.map((m) => ({
    id: m.id,
    conversationId: m.conversationId,
    createdAt: m.createdAt,
    interlocuteur: m.userAId === userId ? m.userB : m.userA,
  }))

  return NextResponse.json({ matches: formated })
}
