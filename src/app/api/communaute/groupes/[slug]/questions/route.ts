import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

interface Params { params: Promise<{ slug: string }> }

const questionsSchema = z.object({
  questions: z.array(
    z.object({
      texte: z.string().min(5).max(300),
      ordre: z.number().int().min(0),
    })
  ).max(3),
})

// GET — Récupérer les questions d'adhésion d'un groupe
export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { slug } = await params
  const groupe = await prisma.groupe.findUnique({
    where: { slug },
    select: {
      id: true,
      visibilite: true,
      questions: { orderBy: { ordre: "asc" }, select: { id: true, texte: true, ordre: true } },
    },
  })
  if (!groupe) {
    return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 })
  }

  return NextResponse.json({ questions: groupe.questions })
}

// PUT — Créer/mettre à jour les questions (admin uniquement)
export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { slug } = await params
  const groupe = await prisma.groupe.findUnique({ where: { slug }, select: { id: true } })
  if (!groupe) {
    return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 })
  }

  // Vérifier admin
  const membre = await prisma.membreGroupe.findUnique({
    where: { groupeId_userId: { groupeId: groupe.id, userId: session.user.id } },
  })
  if (!membre || membre.role !== "ADMIN") {
    return NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 })
  }

  const body = await req.json()
  const result = questionsSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
  }

  // Supprimer les anciennes questions et recréer
  await prisma.questionAdhesion.deleteMany({ where: { groupeId: groupe.id } })

  if (result.data.questions.length > 0) {
    await prisma.questionAdhesion.createMany({
      data: result.data.questions.map((q) => ({
        groupeId: groupe.id,
        texte: q.texte,
        ordre: q.ordre,
      })),
    })
  }

  const questions = await prisma.questionAdhesion.findMany({
    where: { groupeId: groupe.id },
    orderBy: { ordre: "asc" },
    select: { id: true, texte: true, ordre: true },
  })

  return NextResponse.json({ questions })
}
