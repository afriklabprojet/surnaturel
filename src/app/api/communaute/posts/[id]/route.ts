import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getPusherServeur, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher"

interface Params { params: Promise<{ id: string }> }

const auteurSelect = {
  id: true, nom: true, prenom: true, pseudo: true, photoUrl: true, statutProfil: true, verificationStatus: true,
}

// PATCH — Épingler / Désépingler un post
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()

  const post = await prisma.post.findUnique({
    where: { id },
    select: { auteurId: true, groupeId: true },
  })

  if (!post) {
    return NextResponse.json({ error: "Post introuvable" }, { status: 404 })
  }

  // Épinglage : auteur propre profil, admin groupe, ou admin site
  const isAuteur = post.auteurId === session.user.id
  const isAdmin = session.user.role === "ADMIN"

  let isGroupeAdmin = false
  if (post.groupeId) {
    const membre = await prisma.membreGroupe.findUnique({
      where: { groupeId_userId: { groupeId: post.groupeId, userId: session.user.id } },
    })
    isGroupeAdmin = membre?.role === "ADMIN" || membre?.role === "MODERATEUR"
  }

  if (!isAuteur && !isAdmin && !isGroupeAdmin) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  if (body.epingle !== undefined) {
    const updated = await prisma.post.update({
      where: { id },
      data: { epingle: Boolean(body.epingle) },
      include: { auteur: { select: auteurSelect } },
    })
    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: "Action non reconnue" }, { status: 400 })
}

// DELETE — Supprimer son propre post
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id } = await params

  const post = await prisma.post.findUnique({
    where: { id },
    select: { auteurId: true, groupeId: true },
  })

  if (!post) {
    return NextResponse.json({ error: "Post introuvable" }, { status: 404 })
  }

  // Seul l'auteur ou un admin peut supprimer
  if (post.auteurId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  await prisma.post.delete({ where: { id } })

  // Émettre en temps réel
  try {
    const pusher = getPusherServeur()
    const channel = post.groupeId ? PUSHER_CHANNELS.groupe(post.groupeId) : PUSHER_CHANNELS.communaute
    await pusher.trigger(channel, PUSHER_EVENTS.POST_SUPPRIME, { postId: id })
  } catch { /* Pusher optionnel */ }

  return NextResponse.json({ success: true })
}
