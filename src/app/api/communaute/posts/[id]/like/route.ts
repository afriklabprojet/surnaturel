import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface Params { params: Promise<{ id: string }> }

// POST — Toggle like (stocké comme Reaction de type "👍" — Like unifié)
export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id: postId } = await params

  const existing = await prisma.reaction.findUnique({
    where: { postId_userId: { postId, userId: session.user.id } },
  })

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } })
    return NextResponse.json({ liked: false })
  }

  await prisma.reaction.create({
    data: { postId, userId: session.user.id, type: "👍" },
  })

  return NextResponse.json({ liked: true })
}
