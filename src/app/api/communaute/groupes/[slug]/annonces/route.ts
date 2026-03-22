import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"
import { getPusherServeur, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher"
import { creerNotification } from "@/lib/notifications"

interface Params { params: Promise<{ slug: string }> }

const annonceSchema = z.object({
  contenu: z.string().min(1).max(2000),
  images: z.array(z.string().url()).max(4).optional(),
  imageUrl: z.string().url().optional(),
})

const auteurSelect = {
  id: true, nom: true, prenom: true, pseudo: true, photoUrl: true, statutProfil: true, verificationStatus: true,
}

// GET — Récupérer les annonces actives d'un groupe
export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { slug } = await params
  const groupe = await prisma.groupe.findUnique({ where: { slug }, select: { id: true } })
  if (!groupe) {
    return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 })
  }

  // Vérifier que l'utilisateur est membre
  const membre = await prisma.membreGroupe.findUnique({
    where: { groupeId_userId: { groupeId: groupe.id, userId: session.user.id } },
  })
  if (!membre || !membre.approuve) {
    return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 })
  }

  const annonces = await prisma.post.findMany({
    where: { groupeId: groupe.id, isAnnonce: true, status: "PUBLIE" },
    orderBy: { createdAt: "desc" },
    include: {
      auteur: { select: auteurSelect },
      _count: { select: { commentaires: true, reactions: true } },
    },
  })

  return NextResponse.json({ annonces })
}

// POST — Créer une annonce (admin/modérateur uniquement)
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { slug } = await params
  const groupe = await prisma.groupe.findUnique({
    where: { slug },
    select: { id: true, nom: true, slug: true },
  })
  if (!groupe) {
    return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 })
  }

  // Vérifier admin ou moderateur
  const membre = await prisma.membreGroupe.findUnique({
    where: { groupeId_userId: { groupeId: groupe.id, userId: session.user.id } },
  })
  if (!membre || !["ADMIN", "MODERATEUR"].includes(membre.role)) {
    return NextResponse.json({ error: "Réservé aux administrateurs et modérateurs" }, { status: 403 })
  }

  const body = await req.json()
  const result = annonceSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
  }

  const format = result.data.images?.length || result.data.imageUrl ? "IMAGE" : "TEXTE"
  const annonce = await prisma.post.create({
    data: {
      contenu: result.data.contenu,
      images: result.data.images || [],
      imageUrl: result.data.imageUrl,
      format,
      isAnnonce: true,
      epingle: true,
      groupeId: groupe.id,
      auteurId: session.user.id,
    },
    include: {
      auteur: { select: auteurSelect },
      _count: { select: { commentaires: true, reactions: true, partages: true } },
    },
  })

  // Pusher : notifier le groupe en temps réel
  try {
    await getPusherServeur().trigger(
      PUSHER_CHANNELS.groupe(groupe.id),
      PUSHER_EVENTS.NOUVEAU_POST,
      { ...annonce, isAnnonce: true }
    )
  } catch { /* pusher optionnel */ }

  // Notifier TOUS les membres du groupe (non désactivable pour les annonces)
  try {
    const membres = await prisma.membreGroupe.findMany({
      where: { groupeId: groupe.id, approuve: true, userId: { not: session.user.id } },
      select: { userId: true },
    })
    const auteur = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { prenom: true, nom: true },
    })
    for (const m of membres) {
      // Annonces : notification forcée, pas de vérification de préférence
      const notif = await prisma.notification.create({
        data: {
          userId: m.userId,
          type: "ANNONCE_GROUPE",
          titre: `Annonce — ${groupe.nom}`,
          message: `${auteur?.prenom} ${auteur?.nom} a publié une annonce dans "${groupe.nom}"`,
          lien: `/communaute/groupes/${groupe.slug}`,
          sourceId: annonce.id,
        },
      })
      try {
        await getPusherServeur().trigger(
          PUSHER_CHANNELS.notification(m.userId),
          PUSHER_EVENTS.NOUVELLE_NOTIFICATION,
          notif
        )
      } catch { /* pusher optionnel */ }
    }
  } catch { /* notifications optionnelles */ }

  return NextResponse.json({ annonce })
}

// PATCH — Archiver une annonce (admin uniquement)
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { slug } = await params
  const { postId } = await req.json()
  if (!postId) {
    return NextResponse.json({ error: "postId requis" }, { status: 400 })
  }

  const groupe = await prisma.groupe.findUnique({ where: { slug }, select: { id: true } })
  if (!groupe) {
    return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 })
  }

  const membre = await prisma.membreGroupe.findUnique({
    where: { groupeId_userId: { groupeId: groupe.id, userId: session.user.id } },
  })
  if (!membre || membre.role !== "ADMIN") {
    return NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 })
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, groupeId: true, isAnnonce: true },
  })
  if (!post || post.groupeId !== groupe.id || !post.isAnnonce) {
    return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 })
  }

  // Archiver : retirer l'épingle et le statut d'annonce
  await prisma.post.update({
    where: { id: postId },
    data: { isAnnonce: false, epingle: false },
  })

  return NextResponse.json({ success: true })
}
