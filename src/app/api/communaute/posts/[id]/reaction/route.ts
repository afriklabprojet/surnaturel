import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"
import { creerNotification } from "@/lib/notifications"

interface Params { params: Promise<{ id: string }> }

const reactionSchema = z.object({
  type: z.enum(["JAIME", "SOUTIEN", "ENCOURAGEMENT", "BRAVO", "INSPIRATION"]),
})

// POST — Ajouter ou changer une réaction (toggle si même type)
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id: postId } = await params
  const body = await req.json()
  const result = reactionSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: "Type de réaction invalide" }, { status: 400 })
  }

  const existing = await prisma.reaction.findUnique({
    where: { postId_userId: { postId, userId: session.user.id } },
  })

  if (existing) {
    if (existing.type === result.data.type) {
      // Toggle off
      await prisma.reaction.delete({ where: { id: existing.id } })
      return NextResponse.json({ reaction: null })
    }
    // Change reaction type
    const updated = await prisma.reaction.update({
      where: { id: existing.id },
      data: { type: result.data.type },
    })
    return NextResponse.json({ reaction: updated.type })
  }

  await prisma.reaction.create({
    data: { postId, userId: session.user.id, type: result.data.type },
  })

  // Notifier l'auteur du post
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { auteurId: true },
  })
  if (post && post.auteurId !== session.user.id) {
    const reacteur = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { prenom: true, nom: true },
    })
    const auteurPrefs = await prisma.user.findUnique({
      where: { id: post.auteurId },
      select: { notifLikes: true },
    })
    if (auteurPrefs?.notifLikes) {
      await creerNotification({
        userId: post.auteurId,
        type: "NOUVEAU_LIKE",
        titre: "Nouvelle réaction",
        message: `${reacteur?.prenom} ${reacteur?.nom} a réagi à votre publication`,
        lien: "/communaute",
      })
    }
  }

  return NextResponse.json({ reaction: result.data.type })
}
