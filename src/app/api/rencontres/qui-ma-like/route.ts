import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const userId = session.user.id

  // Utilisateurs qui ont liké (pas PASS) l'utilisateur courant, sans match existant
  const likes = await prisma.rencontreLike.findMany({
    where: {
      toUserId: userId,
      type: { not: "PASS" },
    },
    select: {
      fromUserId: true,
      type: true,
      createdAt: true,
      fromUser: {
        select: {
          id: true,
          prenom: true,
          photoUrl: true,
          ville: true,
          dateNaissance: true,
          verificationStatus: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Exclure ceux avec qui il y a déjà un match actif
  const matchIds = await prisma.rencontreMatch.findMany({
    where: {
      actif: true,
      OR: [{ userAId: userId }, { userBId: userId }],
    },
    select: { userAId: true, userBId: true },
  })
  const matchedUserIds = new Set(
    matchIds.map((m) => (m.userAId === userId ? m.userBId : m.userAId))
  )

  const pending = likes.filter((l) => !matchedUserIds.has(l.fromUserId))

  return NextResponse.json({
    count: pending.length,
    likes: pending.map((l) => ({
      id: l.fromUserId,
      prenom: l.fromUser.prenom,
      photoUrl: l.fromUser.photoUrl,
      ville: l.fromUser.ville,
      dateNaissance: l.fromUser.dateNaissance?.toISOString() ?? null,
      verificationStatus: l.fromUser.verificationStatus,
      type: l.type,
      likedAt: l.createdAt.toISOString(),
    })),
  })
}
