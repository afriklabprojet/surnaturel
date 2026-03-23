import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getPusherServeur, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher"
import { creerNotification } from "@/lib/notifications"

// POST — Envoyer un message vocal (multipart: file audio + metadata)
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 })
  }

  const file = formData.get("audio") as File | null
  const destinataireId = formData.get("destinataireId") as string | null
  const replyToId = formData.get("replyToId") as string | null
  const dureeStr = formData.get("dureeSecondes") as string | null

  if (!file || !destinataireId) {
    return NextResponse.json({ error: "Audio et destinataireId requis" }, { status: 400 })
  }

  if (destinataireId === session.user.id) {
    return NextResponse.json({ error: "Impossible de s'envoyer un message" }, { status: 400 })
  }

  // Vérifier destinataire
  const dest = await prisma.user.findUnique({ where: { id: destinataireId }, select: { id: true } })
  if (!dest) {
    return NextResponse.json({ error: "Destinataire introuvable" }, { status: 404 })
  }

  // Vérifier taille (max 10 Mo) et type
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 10 Mo)" }, { status: 400 })
  }

  // Upload vers Cloudinary (server-side via unsigned upload)
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !uploadPreset) {
    return NextResponse.json({ error: "Configuration Cloudinary manquante" }, { status: 500 })
  }

  const uploadForm = new FormData()
  uploadForm.append("file", file)
  uploadForm.append("upload_preset", uploadPreset)
  uploadForm.append("resource_type", "video") // Cloudinary uses "video" for audio

  const cloudRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
    { method: "POST", body: uploadForm }
  )

  if (!cloudRes.ok) {
    return NextResponse.json({ error: "Erreur d'upload audio" }, { status: 500 })
  }

  const cloudData = await cloudRes.json()
  const audioUrl: string = cloudData.secure_url
  const dureeSecondes = dureeStr ? Math.min(Math.max(1, parseInt(dureeStr, 10)), 120) : Math.round(cloudData.duration || 0)

  // Créer le message
  const message = await prisma.message.create({
    data: {
      expediteurId: session.user.id,
      destinataireId,
      contenu: audioUrl,
      type: "VOCAL",
      dureeSecondes: dureeSecondes || null,
      ...(replyToId ? { replyToId } : {}),
    },
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
    },
  })

  // Pusher temps réel + notification en arrière-plan (ne bloque pas la réponse)
  const channelName = PUSHER_CHANNELS.conversation(session.user.id, destinataireId)
  getPusherServeur().trigger(channelName, PUSHER_EVENTS.NOUVEAU_MESSAGE, message).catch(() => {})

  void (async () => {
    try {
      await creerNotification({
        userId: destinataireId,
        type: "NOUVEAU_MESSAGE",
        titre: "Nouveau message vocal",
        message: `${message.expediteur.prenom} ${message.expediteur.nom} vous a envoyé un message vocal`,
        lien: "/communaute/messages",
      })
    } catch { /* optionnel */ }
  })()

  return NextResponse.json({ message }, { status: 201 })
}
