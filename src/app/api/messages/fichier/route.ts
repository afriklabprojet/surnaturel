import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getPusherServeur, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher"
import { z } from "zod/v4"
import crypto from "crypto"

const MAX_SIZE = 20 * 1024 * 1024 // 20 Mo

// Validation par magic bytes des types de fichiers autorisés
function detectFileType(bytes: Uint8Array, sample64: Uint8Array): string | null {
  // PDF: 25 50 44 46 (%PDF)
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return "application/pdf"
  // ZIP / DOCX / XLSX / PPTX: 50 4B 03 04 (PK\x03\x04)
  if (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) return "application/zip"
  // DOC / XLS / PPT (ancien format binaire): D0 CF 11 E0
  if (bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0) return "application/msword"
  // TXT / CSV : pas de magic bytes — vérifier l'absence d'octets nuls (pas de binaire)
  if (!sample64.includes(0x00)) return "text/plain"
  return null
}

const metaSchema = z.object({
  destinataireId: z.string().min(1),
  replyToId: z.string().optional(),
  ephemere: z.string().optional(),
})

// POST /api/messages/fichier — Envoyer une pièce jointe
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("fichier")
  const destinataireId = formData.get("destinataireId")
  const replyToId = formData.get("replyToId") ?? undefined
  const ephemereRaw = formData.get("ephemere")

  const parsed = metaSchema.safeParse({
    destinataireId,
    replyToId: replyToId || undefined,
    ephemere: ephemereRaw || undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 })
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 20 Mo)" }, { status: 400 })
  }

  // Validation par magic bytes
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer).slice(0, 8)
  const sample64 = new Uint8Array(buffer).slice(0, 64)
  const detectedType = detectFileType(bytes, sample64)
  if (!detectedType) {
    return NextResponse.json({ error: "Format non supporté" }, { status: 400 })
  }

  // Vérifier que le destinataire existe
  const destinataire = await prisma.user.findUnique({
    where: { id: parsed.data.destinataireId },
    select: { id: true },
  })
  if (!destinataire) {
    return NextResponse.json({ error: "Destinataire introuvable" }, { status: 404 })
  }

  // Upload signé vers Cloudinary (resource_type: raw pour fichiers non-image)
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "Un souci technique est survenu. Réessayez dans quelques instants." }, { status: 500 })
  }

  const folder = "surnaturel-de-dieu/fichiers"
  const timestamp = Math.round(Date.now() / 1000)
  const stringToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`
  const signature = crypto.createHash("sha1").update(stringToSign).digest("hex")

  const cloudForm = new FormData()
  cloudForm.append("file", new Blob([buffer], { type: detectedType }), file.name)
  cloudForm.append("api_key", apiKey)
  cloudForm.append("timestamp", String(timestamp))
  cloudForm.append("signature", signature)
  cloudForm.append("folder", folder)

  const cloudRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
    { method: "POST", body: cloudForm }
  )
  if (!cloudRes.ok) {
    return NextResponse.json({ error: "L'envoi du fichier a échoué. Réessayez dans quelques instants." }, { status: 502 })
  }
  const cloudData = (await cloudRes.json()) as { secure_url: string }
  const fileUrl = cloudData.secure_url

  // Stocker dans contenu : "[fichier] nom|taille|url"
  const contenu = `[fichier] ${file.name}|${file.size}|${fileUrl}`

  const message = await prisma.message.create({
    data: {
      expediteurId: session.user.id,
      destinataireId: parsed.data.destinataireId,
      contenu,
      type: "FICHIER",
      ...(parsed.data.replyToId ? { replyToId: parsed.data.replyToId } : {}),
      ...(parsed.data.ephemere === "true"
        ? { expiresAt: new Date(Date.now() + 24 * 3600 * 1000) }
        : {}),
    },
    include: {
      expediteur: { select: { id: true, nom: true, prenom: true, photoUrl: true } },
      replyTo: {
        select: {
          id: true,
          contenu: true,
          type: true,
          expediteur: { select: { id: true, prenom: true, nom: true } },
        },
      },
      reactions: { select: { type: true, userId: true } },
    },
  })

  // Notifier via Pusher
  const pusher = getPusherServeur()
  const channelName = PUSHER_CHANNELS.conversation(
    session.user.id,
    parsed.data.destinataireId
  )
  await pusher.trigger(channelName, PUSHER_EVENTS.NOUVEAU_MESSAGE, message)

  return NextResponse.json({ message })
}
