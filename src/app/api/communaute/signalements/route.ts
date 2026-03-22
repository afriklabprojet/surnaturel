import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

const signalementSchema = z.object({
  type: z.enum(["POST", "COMMENTAIRE", "MEMBRE", "GROUPE"]),
  raison: z.string().min(5).max(500),
  description: z.string().max(1000).optional(),
  postId: z.string().optional(),
  commentaireId: z.string().optional(),
  signaleUserId: z.string().optional(),
})

// POST — Signaler un contenu ou un membre
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await req.json()
  const result = signalementSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
  }

  const signalement = await prisma.signalement.create({
    data: {
      signaleurId: session.user.id,
      type: result.data.type,
      raison: result.data.raison,
      description: result.data.description,
      postId: result.data.postId,
      commentaireId: result.data.commentaireId,
      signaleUserId: result.data.signaleUserId,
    },
  })

  return NextResponse.json(signalement, { status: 201 })
}

// GET — Liste des signalements (admin uniquement)
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const statut = searchParams.get("statut") || "EN_ATTENTE"

  const signalements = await prisma.signalement.findMany({
    where: { statut: statut as "EN_ATTENTE" | "EN_COURS" | "RESOLU" | "REJETE" },
    include: {
      signaleur: { select: { id: true, nom: true, prenom: true, photoUrl: true } },
      signaleUser: { select: { id: true, nom: true, prenom: true, photoUrl: true } },
      post: { select: { id: true, contenu: true, auteurId: true } },
      commentaire: { select: { id: true, contenu: true, auteurId: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json({ signalements })
}

// PATCH — Traiter un signalement (admin)
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const { signalementId, statut, noteAdmin, action } = await req.json()

  if (!signalementId || !["EN_COURS", "RESOLU", "REJETE"].includes(statut)) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 })
  }

  const signalement = await prisma.signalement.update({
    where: { id: signalementId },
    data: { statut, noteAdmin },
  })

  // Actions supplémentaires
  if (action === "supprimer_post" && signalement.postId) {
    await prisma.post.delete({ where: { id: signalement.postId } }).catch(() => {})
  }
  if (action === "supprimer_commentaire" && signalement.commentaireId) {
    await prisma.commentaire.delete({ where: { id: signalement.commentaireId } }).catch(() => {})
  }

  return NextResponse.json(signalement)
}
