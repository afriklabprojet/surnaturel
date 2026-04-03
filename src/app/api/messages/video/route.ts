import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getPusherServeur, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher"
import { creerNotification } from "@/lib/notifications"
import crypto from "crypto"

const MAX_SIZE = 100 * 1024 * 1024 // 100 Mo

// Validation par magic bytes pour les vidéos
function detectVideoType(bytes: Uint8Array): string | null {
  // WebM: 1A 45 DF A3
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return "video/webm"
  // OGG: 4F 67 67 53 (OggS)
  if (bytes[0] === 0x4f && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) return "video/ogg"
  // MP4/MOV: ftyp box at offset 4 (66 74 79 70)
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) return "video/mp4"
  // AVI: 52 49 46 46 (RIFF) ... 41 56 49 20 (AVI )
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) return "video/x-msvideo"
  return null
}

// POST /api/messages/video — Envoyer une vidéo
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

  const file = formData.get("video") as File | null
  const destinataireId = formData.get("destinataireId") as string | null
  const replyToId = formData.get("replyToId") as string | null
  const ephemereRaw = formData.get("ephemere") as string | null

  if (!file || !destinataireId) {
    return NextResponse.json({ error: "Vidéo et destinataireId requis" }, { status: 400 })
  }

  if (destinataireId === session.user.id) {
    return NextResponse.json({ error: "Impossible de s'envoyer un message" }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Vidéo trop volumineuse (max 100 Mo)" }, { status: 400 })
  }

  // Validation par magic bytes
  const rawBuffer = await file.arrayBuffer()
  const bytes = new Uint8Array(rawBuffer).slice(0, 12)
  const detectedType = detectVideoType(bytes)
  if (!detectedType) {
    return NextResponse.json({ error: "Format non supporté (MP4, WebM, OGG, MOV)" }, { status: 400 })
  }

  // Vérifier que le destinataire existe
  const dest = await prisma.user.findUnique({ where: { id: destinataireId }, select: { id: true } })
  if (!dest) {
    return NextResponse.json({ error: "Destinataire introuvable" }, { status: 404 })
  }

  // Upload signé vers Cloudinary (SHA-1)
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "Un souci technique est survenu. Réessayez dans quelques instants." }, { status: 500 })
  }

  const folder = "surnaturel-de-dieu/videos"
  const timestamp = Math.round(Date.now() / 1000)
  const signature = crypto
    .createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex")

  const buffer = Buffer.from(rawBuffer)
  const uploadForm = new FormData()
  uploadForm.append("file", new Blob([buffer], { type: detectedType }), file.name || "video.mp4")
  uploadForm.append("api_key", apiKey)
  uploadForm.append("timestamp", String(timestamp))
  uploadForm.append("signature", signature)
  uploadForm.append("folder", folder)

  const cloudRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
    { method: "POST", body: uploadForm }
  )

  if (!cloudRes.ok) {
    return NextResponse.json({ error: "L'envoi de la vidéo a échoué. Réessayez dans quelques instants." }, { status: 502 })
  }

  const cloudData = await cloudRes.json() as { secure_url: string }
  const videoUrl = cloudData.secure_url

  // Créer le message en base
  const message = await prisma.message.create({
    data: {
      expediteurId: session.user.id,
      destinataireId,
      contenu: videoUrl,
      type: "MEDIA",
      ...(replyToId ? { replyToId } : {}),
      ...(ephemereRaw === "true" ? { expiresAt: new Date(Date.now() + 24 * 3600 * 1000) } : {}),
    },
    include: {
      expediteur: { select: { id: true, nom: true, prenom: true, photoUrl: true } },
      replyTo: {
        select: {
          id: true, contenu: true, type: true,
          expediteur: { select: { id: true, prenom: true, nom: true } },
        },
      },
      reactions: { select: { type: true, userId: true } },
    },
  })

  // Notifier le destinataire via Pusher
  const pusher = getPusherServeur()
  const channelName = PUSHER_CHANNELS.conversation(session.user.id, destinataireId)
  await pusher.trigger(channelName, PUSHER_EVENTS.NOUVEAU_MESSAGE, message)

  // Notification push
  void (async () => {
    try {
      await creerNotification({
        userId: destinataireId,
        type: "NOUVEAU_MESSAGE",
        titre: "Nouvelle vidéo",
        message: `${message.expediteur.prenom} ${message.expediteur.nom} vous a envoyé une vidéo`,
        lien: "/communaute/messages",
      })
    } catch { /* optionnel */ }
  })()

  return NextResponse.json({ message })
}
