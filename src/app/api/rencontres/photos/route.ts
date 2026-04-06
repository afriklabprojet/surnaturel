import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

const MAX_PHOTOS = 6

const addPhotoSchema = z.object({
  url: z.string().url().startsWith("https://res.cloudinary.com/"),
})

const reorderSchema = z.object({
  photoIds: z.array(z.string()).min(1).max(MAX_PHOTOS),
})

// GET — Récupérer ses photos
export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const photos = await prisma.photoRencontre.findMany({
    where: { userId: session.user.id },
    orderBy: { ordre: "asc" },
    select: { id: true, url: true, ordre: true, createdAt: true },
  })

  return NextResponse.json({ photos, max: MAX_PHOTOS })
}

// POST — Ajouter une photo
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 })
  }

  const result = addPhotoSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: "URL invalide — seules les images Cloudinary sont acceptées" }, { status: 400 })
  }

  // Vérifier la limite
  const count = await prisma.photoRencontre.count({
    where: { userId: session.user.id },
  })
  if (count >= MAX_PHOTOS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_PHOTOS} photos autorisées` },
      { status: 400 }
    )
  }

  const photo = await prisma.photoRencontre.create({
    data: {
      userId: session.user.id,
      url: result.data.url,
      ordre: count, // Ajouter à la fin
    },
    select: { id: true, url: true, ordre: true, createdAt: true },
  })

  return NextResponse.json(photo, { status: 201 })
}

// PATCH — Réordonner les photos
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 })
  }

  const result = reorderSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 })
  }

  const { photoIds } = result.data

  // Vérifier que toutes les photos appartiennent à l'utilisateur
  const existing = await prisma.photoRencontre.findMany({
    where: { userId: session.user.id },
    select: { id: true },
  })
  const existingIds = new Set(existing.map((p) => p.id))
  if (!photoIds.every((id) => existingIds.has(id))) {
    return NextResponse.json({ error: "Photos invalides" }, { status: 403 })
  }

  // Mettre à jour l'ordre
  await prisma.$transaction(
    photoIds.map((id, index) =>
      prisma.photoRencontre.update({
        where: { id },
        data: { ordre: index },
      })
    )
  )

  return NextResponse.json({ success: true })
}
