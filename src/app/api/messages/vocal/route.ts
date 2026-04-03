import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getPusherServeur, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher"
import { creerNotification } from "@/lib/notifications"
import crypto from "crypto"

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

  // Upload signé vers Cloudinary (SHA-256)
  // Configurer dans Cloudinary : Settings → Security → Signature algorithm → SHA-256
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "Un souci technique est survenu. Réessayez dans quelques instants." }, { status: 500 })
  }

  const folder = "surnaturel-de-dieu/vocal"
  const timestamp = Math.round(Date.now() / 1000)
  const signature = crypto
    .createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex")

  const buffer = await file.arrayBuffer()
  const uploadForm = new FormData()
  uploadForm.append("file", new Blob([buffer], { type: file.type || "audio/webm" }), file.name || "audio.webm")
  uploadForm.append("api_key", apiKey)
  uploadForm.append("timestamp", String(timestamp))
  uploadForm.append("signature", signature)
  uploadForm.append("folder", folder)

  const cloudRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
    { method: "POST", body: uploadForm }
  )

  if (!cloudRes.ok) {
    return NextResponse.json({ error: "L'envoi de l'audio a échoué. Réessayez dans quelques instants." }, { status: 502 })
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
