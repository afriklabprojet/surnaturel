import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { userId } = await params
  const currentUserId = session.user.id

  // Marquer comme lus tous les messages reçus de cet interlocuteur
  const result = await prisma.message.updateMany({
    where: {
      expediteurId: userId,
      destinataireId: currentUserId,
      lu: false,
    },
    data: { lu: true },
  })

  return NextResponse.json({
    success: true,
    count: result.count,
  })
}
