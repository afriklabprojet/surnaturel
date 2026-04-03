import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getPusherServeur, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher"
import { z } from "zod/v4"
import crypto from "crypto"
import sharp from "sharp"

const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

// Validation par magic bytes — pas par le Content-Type fourni par le client
function detectImageType(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg"
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png"
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "image/webp"
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return "image/gif"
  return null
}

const metaSchema = z.object({
  destinataireId: z.string().min(1),
  replyToId: z.string().optional(),
  ephemere: z.string().optional(), // "true" depuis FormData
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("image")
  const destinataireId = formData.get("destinataireId")
  const replyToId = formData.get("replyToId") ?? undefined
  const ephemereRaw = formData.get("ephemere")

  const parsed = metaSchema.safeParse({ destinataireId, replyToId: replyToId || undefined, ephemere: ephemereRaw || undefined })
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 })
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Image trop volumineuse (max 5 Mo)" }, { status: 400 })
  }

  // Validation par magic bytes
  const rawBuffer = await file.arrayBuffer()
  const bytes = new Uint8Array(rawBuffer).slice(0, 12)
  const detectedType = detectImageType(bytes)
  if (!detectedType) {
    return NextResponse.json({ error: "Format non supporté (JPEG, PNG, WebP, GIF)" }, { status: 400 })
  }

  // ── Compression Sharp (A15) ────────────────────────────────────────────
  // Redimensionne à max 1200px + convertit en WebP pour économiser la data
  // Les GIFs animés sont passés tels quels (Sharp ne supporte pas GIF animé)
  let buffer: Buffer
  if (detectedType === "image/gif") {
    buffer = Buffer.from(rawBuffer)
  } else {
    buffer = await sharp(Buffer.from(rawBuffer))
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer()
  }

  // Vérifier que le destinataire existe
  const destinataire = await prisma.user.findUnique({
    where: { id: parsed.data.destinataireId },
    select: { id: true },
  })
  if (!destinataire) {
    return NextResponse.json({ error: "Destinataire introuvable" }, { status: 404 })
  }

  // Upload signé vers Cloudinary (pas de preset public)
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "Un souci technique est survenu. Réessayez dans quelques instants." }, { status: 500 })
  }

  const folder = "surnaturel-de-dieu/messages"
  const timestamp = Math.round(Date.now() / 1000)
  const signature = crypto
    .createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex")

  const cloudForm = new FormData()
  cloudForm.append("file", new Blob([(buffer.buffer as ArrayBuffer).slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)], { type: detectedType === "image/gif" ? "image/gif" : "image/webp" }), file.name)
  cloudForm.append("api_key", apiKey)
  cloudForm.append("timestamp", String(timestamp))
  cloudForm.append("signature", signature)
  cloudForm.append("folder", folder)

  const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: cloudForm,
  })
  if (!cloudRes.ok) {
    return NextResponse.json({ error: "L'envoi de l'image a échoué. Réessayez dans quelques instants." }, { status: 502 })
  }
  const cloudData = (await cloudRes.json()) as { secure_url: string }
  const imageUrl = cloudData.secure_url

  // Créer le message en base
  const message = await prisma.message.create({
    data: {
      expediteurId: session.user.id,
      destinataireId: parsed.data.destinataireId,
      contenu: imageUrl,
      type: "MEDIA",
      ...(parsed.data.replyToId ? { replyToId: parsed.data.replyToId } : {}),
      ...(parsed.data.ephemere === "true" ? { expiresAt: new Date(Date.now() + 24 * 3600 * 1000) } : {}),
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
  const channelName = PUSHER_CHANNELS.conversation(session.user.id, parsed.data.destinataireId)
  await pusher.trigger(channelName, PUSHER_EVENTS.NOUVEAU_MESSAGE, message)

  return NextResponse.json({ message })
}
