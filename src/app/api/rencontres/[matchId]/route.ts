import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { matchId } = await params
  const userId = session.user.id

  const match = await prisma.rencontreMatch.findUnique({
    where: { id: matchId },
  })

  if (!match) {
    return NextResponse.json({ error: "Match introuvable" }, { status: 404 })
  }

  if (match.userAId !== userId && match.userBId !== userId) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  await prisma.rencontreMatch.update({
    where: { id: matchId },
    data: { actif: false },
  })

  return NextResponse.json({ success: true })
}
