import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface Params { params: Promise<{ id: string }> }

const EMOJIS_AUTORISES = ["❤️", "🔥", "😂", "😮", "😢", "👏"]

// POST — Toggle réaction sur une story
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id } = await params

  const story = await prisma.story.findUnique({
    where: { id },
    select: { id: true, expiresAt: true },
  })

  if (!story || story.expiresAt < new Date()) {
    return NextResponse.json({ error: "Story non trouvée ou expirée" }, { status: 404 })
  }

  let body: { type?: string }
  try {
    body = await req.json() as { type?: string }
  } catch {
    return NextResponse.json({ error: "Body invalide" }, { status: 400 })
  }

  const type = body.type ?? "❤️"
  if (!EMOJIS_AUTORISES.includes(type)) {
    return NextResponse.json({ error: "Réaction non autorisée" }, { status: 400 })
  }

  const userId = session.user.id

  // Toggle : supprime si déjà existant avec même type, sinon upsert
  const existing = await prisma.storyReaction.findUnique({
    where: { storyId_userId: { storyId: id, userId } },
  })

  if (existing?.type === type) {
    await prisma.storyReaction.delete({ where: { id: existing.id } })
    return NextResponse.json({ action: "removed", type })
  }

  await prisma.storyReaction.upsert({
    where: { storyId_userId: { storyId: id, userId } },
    update: { type },
    create: { storyId: id, userId, type },
  })

  return NextResponse.json({ action: "added", type })
}

// GET — Comptes des réactions pour une story
export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id } = await params

  const reactions = await prisma.storyReaction.findMany({
    where: { storyId: id },
    select: { type: true, userId: true },
  })

  // Compter par type
  const counts: Record<string, number> = {}
  let myReaction: string | null = null
  for (const r of reactions) {
    counts[r.type] = (counts[r.type] ?? 0) + 1
    if (r.userId === session.user.id) myReaction = r.type
  }

  return NextResponse.json({ counts, total: reactions.length, myReaction })
}
