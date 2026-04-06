import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface Params { params: Promise<{ id: string }> }

// GET — Liste les commentaires d'une story
export async function GET(req: NextRequest, { params }: Params) {
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

  const commentaires = await prisma.storyComment.findMany({
    where: { storyId: id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      contenu: true,
      createdAt: true,
      auteur: {
        select: { id: true, nom: true, prenom: true, pseudo: true, photoUrl: true },
      },
    },
    take: 50,
  })

  return NextResponse.json({ commentaires })
}

// POST — Ajouter un commentaire
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id } = await params

  const story = await prisma.story.findUnique({
    where: { id },
    select: { id: true, expiresAt: true, auteurId: true },
  })

  if (!story || story.expiresAt < new Date()) {
    return NextResponse.json({ error: "Story non trouvée ou expirée" }, { status: 404 })
  }

  let body: { contenu?: string }
  try {
    body = await req.json() as { contenu?: string }
  } catch {
    return NextResponse.json({ error: "Body invalide" }, { status: 400 })
  }

  const contenu = body.contenu?.trim()
  if (!contenu || contenu.length < 1 || contenu.length > 500) {
    return NextResponse.json({ error: "Le commentaire doit faire entre 1 et 500 caractères" }, { status: 400 })
  }

  const commentaire = await prisma.storyComment.create({
    data: {
      storyId: id,
      auteurId: session.user.id,
      contenu,
    },
    select: {
      id: true,
      contenu: true,
      createdAt: true,
      auteur: {
        select: { id: true, nom: true, prenom: true, pseudo: true, photoUrl: true },
      },
    },
  })

  return NextResponse.json({ commentaire }, { status: 201 })
}
