import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

const planifieSchema = z.object({
  contenu: z.string().min(1).max(2000),
  images: z.array(z.string().url()).max(4).optional(),
  imageUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  lienUrl: z.string().url().optional(),
  lienTitre: z.string().max(200).optional(),
  lienDescription: z.string().max(500).optional(),
  lienImage: z.string().url().optional(),
  documentUrl: z.string().url().optional(),
  documentNom: z.string().max(200).optional(),
  format: z.enum(["TEXTE", "IMAGE", "VIDEO", "LIEN", "DOCUMENT"]).optional(),
  groupeId: z.string().optional(),
  scheduledAt: z.string(), // ISO date string
})

function extractHashtags(contenu: string): string[] {
  const matches = contenu.match(/#[a-zA-ZÀ-ÿ0-9_]+/g)
  return matches ? [...new Set(matches.map((h) => h.toLowerCase()))] : []
}

// GET — Mes publications planifiées
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const posts = await prisma.post.findMany({
    where: { auteurId: session.user.id, status: "PLANIFIE" },
    orderBy: { scheduledAt: "asc" },
    include: {
      groupe: { select: { nom: true, slug: true } },
    },
  })

  return NextResponse.json({ posts })
}

// POST — Créer une publication planifiée
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await req.json()
  const result = planifieSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
  }

  const scheduledDate = new Date(result.data.scheduledAt)
  if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
    return NextResponse.json({ error: "La date de publication doit être dans le futur" }, { status: 400 })
  }

  // Vérifier appartenance au groupe si spécifié
  if (result.data.groupeId) {
    const membre = await prisma.membreGroupe.findUnique({
      where: { groupeId_userId: { groupeId: result.data.groupeId, userId: session.user.id } },
    })
    if (!membre || !membre.approuve) {
      return NextResponse.json({ error: "Vous n'êtes pas membre de ce groupe" }, { status: 403 })
    }
  }

  const { contenu, groupeId, scheduledAt: _scheduledAt, ...rest } = result.data
  const hashtags = extractHashtags(contenu)
  const format = rest.format || (rest.videoUrl ? "VIDEO" : rest.images?.length || rest.imageUrl ? "IMAGE" : rest.lienUrl ? "LIEN" : rest.documentUrl ? "DOCUMENT" : "TEXTE")

  const post = await prisma.post.create({
    data: {
      contenu,
      hashtags,
      format,
      groupeId,
      auteurId: session.user.id,
      status: "PLANIFIE",
      scheduledAt: scheduledDate,
      imageUrl: rest.imageUrl,
      images: rest.images || [],
      videoUrl: rest.videoUrl,
      lienUrl: rest.lienUrl,
      lienTitre: rest.lienTitre,
      lienDescription: rest.lienDescription,
      lienImage: rest.lienImage,
      documentUrl: rest.documentUrl,
      documentNom: rest.documentNom,
    },
    include: {
      groupe: { select: { nom: true, slug: true } },
    },
  })

  return NextResponse.json({ post })
}
