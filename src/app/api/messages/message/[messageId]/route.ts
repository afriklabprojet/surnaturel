import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
    include: {
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
    },
  })

  if (!message) {
    return NextResponse.json({ error: "Message introuvable" }, { status: 404 })
  }

  // Vérifier que l'utilisateur est participant à cette conversation
  if (message.expediteurId !== session.user.id && message.destinataireId !== session.user.id) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  return NextResponse.json({ message })
}
