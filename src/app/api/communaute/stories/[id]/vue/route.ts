import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface Params { params: Promise<{ id: string }> }

// POST — Enregistrer un visionnage
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id } = await params
  const userId = session.user.id

  const story = await prisma.story.findUnique({
    where: { id },
    select: { viewers: true, expiresAt: true },
  })

  if (!story || story.expiresAt < new Date()) {
    return NextResponse.json({ error: "Story non trouvée ou expirée" }, { status: 404 })
  }

  // Ajouter si pas déjà vu
  if (!story.viewers.includes(userId)) {
    await prisma.story.update({
      where: { id },
      data: { viewers: { push: userId } },
    })
  }

  return NextResponse.json({ success: true })
}

// GET — Liste des vues (auteur uniquement)
export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id } = await params

  const story = await prisma.story.findUnique({
    where: { id },
    select: { auteurId: true, viewers: true },
  })

  if (!story) {
    return NextResponse.json({ error: "Story non trouvée" }, { status: 404 })
  }
  if (story.auteurId !== session.user.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  // Récupérer les infos des viewers
  const users = story.viewers.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: story.viewers } },
        select: { id: true, nom: true, prenom: true, pseudo: true, photoUrl: true },
      })
    : []

  return NextResponse.json({ viewers: users, total: users.length })
}
