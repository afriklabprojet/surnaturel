import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"
import { getPusherServeur, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher"

const auteurSelect = {
  id: true,
  nom: true,
  prenom: true,
  pseudo: true,
  photoUrl: true,
  role: true,
  statutProfil: true,
  verificationStatus: true,
}

const storySchema = z.object({
  type: z.enum(["TEXTE", "IMAGE", "VIDEO"]),
  contenu: z.string().max(500).optional(),
  mediaUrl: z.string().url().optional(),
  couleurFond: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  visibilite: z.enum(["PUBLIC", "CONNEXIONS"]).optional(),
})

// GET — Récupérer les stories actives (groupées par auteur)
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const now = new Date()
  const userId = session.user.id

  // Récupérer les IDs des utilisateurs bloqués
  const blocages = await prisma.blocage.findMany({
    where: { OR: [{ bloqueurId: userId }, { bloqueId: userId }] },
    select: { bloqueurId: true, bloqueId: true },
  })
  const blockedIds = new Set(
    blocages.flatMap((b) => [b.bloqueurId, b.bloqueId]).filter((id) => id !== userId)
  )

  // Récupérer les connexions acceptées (pour le filtre CONNEXIONS)
  const connexions = await prisma.connexion.findMany({
    where: {
      statut: "ACCEPTEE",
      OR: [{ demandeurId: userId }, { destinataireId: userId }],
    },
    select: { demandeurId: true, destinataireId: true },
  })
  const connexionIds = new Set(
    connexions.map((c) => (c.demandeurId === userId ? c.destinataireId : c.demandeurId))
  )

  // Stories non expirées
  const stories = await prisma.story.findMany({
    where: {
      expiresAt: { gt: now },
      auteurId: { notIn: [...blockedIds] },
    },
    include: { auteur: { select: auteurSelect } },
    orderBy: { createdAt: "desc" },
  })

  // Filtrer par visibilité
  const filtrees = stories.filter((s) => {
    if (s.auteurId === userId) return true
    if (s.visibilite === "PUBLIC") return true
    if (s.visibilite === "CONNEXIONS") return connexionIds.has(s.auteurId)
    return false
  })

  // Grouper par auteur
  const parAuteur = new Map<string, { auteur: typeof filtrees[0]["auteur"]; stories: typeof filtrees; hasUnseen: boolean }>()

  for (const story of filtrees) {
    const existing = parAuteur.get(story.auteurId)
    if (existing) {
      existing.stories.push(story)
      if (!story.viewers.includes(userId)) existing.hasUnseen = true
    } else {
      parAuteur.set(story.auteurId, {
        auteur: story.auteur,
        stories: [story],
        hasUnseen: !story.viewers.includes(userId),
      })
    }
  }

  // Trier : utilisateur courant d'abord, puis non vues, puis vues
  const groupes = [...parAuteur.values()].sort((a, b) => {
    if (a.auteur.id === userId) return -1
    if (b.auteur.id === userId) return 1
    if (a.hasUnseen && !b.hasUnseen) return -1
    if (!a.hasUnseen && b.hasUnseen) return 1
    return 0
  })

  return NextResponse.json({ groupes })
}

// POST — Créer une story
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await req.json()
  const result = storySchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
  }

  const { type, contenu, mediaUrl, couleurFond, visibilite } = result.data

  // Validation par type
  if (type === "TEXTE" && !contenu?.trim()) {
    return NextResponse.json({ error: "Le contenu est requis pour une story textuelle" }, { status: 400 })
  }
  if ((type === "IMAGE" || type === "VIDEO") && !mediaUrl) {
    return NextResponse.json({ error: "Une URL média est requise" }, { status: 400 })
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  const story = await prisma.story.create({
    data: {
      auteurId: session.user.id,
      type,
      contenu: contenu?.trim() || null,
      mediaUrl: mediaUrl || null,
      couleurFond: type === "TEXTE" ? (couleurFond || "#2D7A1F") : null,
      visibilite: visibilite || "PUBLIC",
      viewers: [],
      expiresAt,
    },
    include: { auteur: { select: auteurSelect } },
  })

  // Notifier en temps réel
  try {
    await getPusherServeur().trigger(
      PUSHER_CHANNELS.communaute,
      PUSHER_EVENTS.NOUVELLE_STORY,
      { story, auteurId: session.user.id }
    )
  } catch { /* Pusher optionnel */ }

  return NextResponse.json(story, { status: 201 })
}
