import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { encrypt, decrypt } from "@/lib/crypto"
import { getPusherServeur, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher"
import { envoyerEmailMessageMedical } from "@/lib/email"
import { z } from "zod/v4"

const ALLOWED_ROLES = ["CLIENT", "ACCOMPAGNATEUR_MEDICAL"] as const

// ── POST : Envoyer un message médical confidentiel ────────────────
const messageSchema = z.object({
  destinataireId: z.string().min(1),
  contenu: z.string().min(1).max(2000),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  if (!(ALLOWED_ROLES as readonly string[]).includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 })
  }

  const result = messageSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: "Données invalides", details: z.prettifyError(result.error) },
      { status: 400 }
    )
  }

  const { destinataireId, contenu } = result.data

  if (destinataireId === session.user.id) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas vous envoyer un message" },
      { status: 400 }
    )
  }

  // Vérifier que le destinataire existe et a un rôle médical compatible
  const destinataire = await prisma.user.findUnique({
    where: { id: destinataireId },
    select: { id: true, role: true, email: true, prenom: true },
  })

  if (!destinataire) {
    return NextResponse.json({ error: "Destinataire introuvable" }, { status: 404 })
  }

  // CLIENT ne peut envoyer qu'à ACCOMPAGNATEUR_MEDICAL et vice versa
  if (
    session.user.role === "CLIENT" &&
    destinataire.role !== "ACCOMPAGNATEUR_MEDICAL"
  ) {
    return NextResponse.json(
      { error: "Vous ne pouvez envoyer des messages médicaux qu'à un accompagnateur" },
      { status: 403 }
    )
  }

  if (
    session.user.role === "ACCOMPAGNATEUR_MEDICAL" &&
    destinataire.role !== "CLIENT"
  ) {
    return NextResponse.json(
      { error: "Vous ne pouvez envoyer des messages médicaux qu'à un client" },
      { status: 403 }
    )
  }

  // Chiffrer le contenu AVANT de stocker en base
  const contenuChiffre = encrypt(contenu)

  const message = await prisma.messageMedical.create({
    data: {
      expediteurId: session.user.id,
      destinataireId,
      contenu: contenuChiffre,
    },
    include: {
      expediteur: {
        select: { id: true, nom: true, prenom: true, photoUrl: true },
      },
    },
  })

  // Log d'envoi — SANS le contenu
  console.log(
    `[MEDICAL] message:${message.id} from:${session.user.id} to:${destinataireId} at:${new Date().toISOString()}`
  )

  // Émettre via Pusher sur le channel médical du destinataire
  await getPusherServeur().trigger(
    PUSHER_CHANNELS.medical(destinataireId),
    PUSHER_EVENTS.NOUVEAU_MESSAGE,
    {
      ...message,
      contenu, // en clair pour le destinataire
    }
  )

  // Notification email (non-bloquante)
  if (destinataire.email) {
    envoyerEmailMessageMedical({
      destinataire: destinataire.email,
      prenomDestinataire: destinataire.prenom ?? "utilisateur",
      prenomExpediteur: session.user.prenom ?? "un intervenant",
    }).catch(() => null)
  }

  // Retourner le message avec le contenu en clair pour l'affichage immédiat
  return NextResponse.json(
    {
      message: {
        ...message,
        contenu, // en clair pour l'expéditeur
      },
    },
    { status: 201 }
  )
}

// ── GET : Historique des messages avec un interlocuteur ────────────
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  if (!(ALLOWED_ROLES as readonly string[]).includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const url = new URL(req.url)
  const interlocuteurId = url.searchParams.get("userId")
  if (!interlocuteurId) {
    return NextResponse.json({ error: "userId requis" }, { status: 400 })
  }

  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"))
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? "50")))
  const skip = (page - 1) * limit

  const currentUserId = session.user.id

  // Marquer comme lus les messages reçus non lus
  await prisma.messageMedical.updateMany({
    where: {
      expediteurId: interlocuteurId,
      destinataireId: currentUserId,
      lu: false,
    },
    data: { lu: true },
  })

  const [messagesRaw, total] = await Promise.all([
    prisma.messageMedical.findMany({
      where: {
        OR: [
          { expediteurId: currentUserId, destinataireId: interlocuteurId },
          { expediteurId: interlocuteurId, destinataireId: currentUserId },
        ],
      },
      include: {
        expediteur: {
          select: { id: true, nom: true, prenom: true, photoUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.messageMedical.count({
      where: {
        OR: [
          { expediteurId: currentUserId, destinataireId: interlocuteurId },
          { expediteurId: interlocuteurId, destinataireId: currentUserId },
        ],
      },
    }),
  ])

  // Déchiffrer chaque message côté serveur
  const messages = messagesRaw.reverse().map((msg) => {
    let contenu = ""
    try {
      contenu = decrypt(msg.contenu)
    } catch {
      contenu = "[Message indéchiffrable]"
    }
    return { ...msg, contenu }
  })

  return NextResponse.json({
    messages,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
}
