import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface Params { params: Promise<{ id: string }> }

// POST — Toggle sauvegarde
export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id: postId } = await params

  const existing = await prisma.postSauvegarde.findUnique({
    where: { postId_userId: { postId, userId: session.user.id } },
  })

  if (existing) {
    await prisma.postSauvegarde.delete({ where: { id: existing.id } })
    return NextResponse.json({ saved: false })
  }

  await prisma.postSauvegarde.create({
    data: { postId, userId: session.user.id },
  })

  return NextResponse.json({ saved: true })
}
