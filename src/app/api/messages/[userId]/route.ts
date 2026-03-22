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
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"))
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? "50")))
  const skip = (page - 1) * limit

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: {
        OR: [
          { expediteurId: currentUserId, destinataireId: userId },
          { expediteurId: userId, destinataireId: currentUserId },
        ],
      },
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
      skip,
      take: limit,
    }),
    prisma.message.count({
      where: {
        OR: [
          { expediteurId: currentUserId, destinataireId: userId },
          { expediteurId: userId, destinataireId: currentUserId },
        ],
      },
    }),
  ])

  return NextResponse.json({
    messages: messages.reverse(),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  })
}
