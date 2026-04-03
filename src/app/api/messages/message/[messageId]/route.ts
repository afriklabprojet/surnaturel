import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getPusherServeur, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher"
import { z } from "zod/v4"

const MESSAGE_INCLUDE = {
  expediteur: {
    select: { id: true, nom: true, prenom: true, photoUrl: true },
  },
  replyTo: {
    select: {
      id: true,
      contenu: true,
      type: true,
      expediteur: { select: { id: true, prenom: true, nom: true } },
    },
  },
  reactions: {
    select: { type: true, userId: true },
  },
}

// GET — Récupérer un message spécifique par son ID (pour scroll vers citation)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { messageId } = await params

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: MESSAGE_INCLUDE,
  })

  if (!message) {
    return NextResponse.json({ error: "Message introuvable" }, { status: 404 })
  }

  if (message.expediteurId !== session.user.id && message.destinataireId !== session.user.id) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  return NextResponse.json({ message })
}

// PATCH — Modifier le contenu d'un message (expéditeur, dans les 15 min) ou épingler (les deux)
const patchSchema = z.object({
  action: z.enum(["edit", "pin", "unpin"]),
  contenu: z.string().min(1).max(2000).optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Les informations envoyées sont incorrectes. Veuillez réessayer." }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 })
  }

  const { messageId } = await params
  const { action, contenu } = parsed.data

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { id: true, expediteurId: true, destinataireId: true, createdAt: true },
  })

  if (!message) {
    return NextResponse.json({ error: "Message introuvable" }, { status: 404 })
  }

  const pusher = getPusherServeur()
  const channelName = PUSHER_CHANNELS.conversation(message.expediteurId, message.destinataireId)

  if (action === "edit") {
    // Seul l'expéditeur peut modifier
    if (message.expediteurId !== session.user.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }
    if (!contenu) {
      return NextResponse.json({ error: "Contenu requis" }, { status: 400 })
    }
    // Fenêtre de 15 minutes
    const age = Date.now() - new Date(message.createdAt).getTime()
    if (age > 15 * 60 * 1000) {
      return NextResponse.json({ error: "Délai de modification dépassé (15 min)" }, { status: 403 })
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { contenu, modifie: true, modifieLeAt: new Date() },
      include: MESSAGE_INCLUDE,
    })

    await pusher.trigger(channelName, PUSHER_EVENTS.MESSAGE_MODIFIE, {
      messageId,
      contenu,
      modifieLeAt: updated.modifieLeAt,
    })

    return NextResponse.json({ message: updated })
  }

  if (action === "pin" || action === "unpin") {
    // Les deux participants peuvent épingler
    if (message.expediteurId !== session.user.id && message.destinataireId !== session.user.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }
    const epingle = action === "pin"

    // Désépingler tous les messages de cette conversation d'abord
    if (epingle) {
      await prisma.message.updateMany({
        where: {
          OR: [
            { expediteurId: message.expediteurId, destinataireId: message.destinataireId },
            { expediteurId: message.destinataireId, destinataireId: message.expediteurId },
          ],
          epingle: true,
        },
        data: { epingle: false },
      })
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { epingle },
      include: MESSAGE_INCLUDE,
    })

    await pusher.trigger(channelName, PUSHER_EVENTS.MESSAGE_EPINGLE, {
      messageId,
      epingle,
      message: epingle ? updated : null,
    })

    return NextResponse.json({ message: updated })
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 })
}

// DELETE — Supprimer un message (expéditeur seulement)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { messageId } = await params

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { id: true, expediteurId: true, destinataireId: true },
  })

  if (!message) {
    return NextResponse.json({ error: "Message introuvable" }, { status: 404 })
  }

  if (message.expediteurId !== session.user.id) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  await prisma.message.delete({ where: { id: messageId } })

  const pusher = getPusherServeur()
  const channelName = PUSHER_CHANNELS.conversation(message.expediteurId, message.destinataireId)
  await pusher.trigger(channelName, PUSHER_EVENTS.MESSAGE_SUPPRIME, { messageId })

  return NextResponse.json({ success: true })
}
