import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import crypto from "crypto"
import sharp from "sharp"

const ALLOWED_RESOURCE_TYPES = ["image", "video", "auto"] as const
type ResourceType = (typeof ALLOWED_RESOURCE_TYPES)[number]

const ALLOWED_FOLDERS = [
  "surnaturel-de-dieu/communaute",
  "surnaturel-de-dieu/stories",
  "surnaturel-de-dieu/medical",
  "surnaturel-de-dieu/profils",
] as const
type AllowedFolder = (typeof ALLOWED_FOLDERS)[number]

const MAX_SIZE = 10 * 1024 * 1024 // 10 Mo

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "Configuration Cloudinary manquante." }, { status: 500 })
  }

  const contentType = req.headers.get("content-type") ?? ""

  // ── Mode A : FormData avec fichier → compression Sharp + upload serveur ──
  // Utilisé pour les images (profils, communauté, médical)
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData()
    const file = form.get("file")
    const folder = form.get("folder")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Fichier manquant" }, { status: 400 })
    }
    if (!folder || !ALLOWED_FOLDERS.includes(folder as AllowedFolder)) {
      return NextResponse.json({ error: "Dossier non autorisé." }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Fichier trop lourd (max 10 Mo)" }, { status: 400 })
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer())

    // Compression Sharp → WebP 1200px max
    const compressed = await sharp(rawBuffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer()

    const timestamp = Math.round(Date.now() / 1000)
    const signature = crypto
      .createHash("sha1")
      .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
      .digest("hex")

    const cloudForm = new FormData()
    cloudForm.append("file", new Blob([(compressed.buffer as ArrayBuffer).slice(compressed.byteOffset, compressed.byteOffset + compressed.byteLength)], { type: "image/webp" }), "upload.webp")
    cloudForm.append("api_key", apiKey)
    cloudForm.append("timestamp", String(timestamp))
    cloudForm.append("signature", signature)
    cloudForm.append("folder", String(folder))

    const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: cloudForm,
    })
    if (!cloudRes.ok) {
      return NextResponse.json({ error: "Upload Cloudinary échoué" }, { status: 502 })
    }
    const data = (await cloudRes.json()) as { secure_url: string }
    return NextResponse.json({ secureUrl: data.secure_url })
  }

  // ── Mode B : JSON → retourne signature (vidéos, assets non-image) ─────────
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 })
  }

  const { folder, resourceType = "image" } = body as { folder?: string; resourceType?: string }

  if (!folder || !ALLOWED_FOLDERS.includes(folder as AllowedFolder)) {
    return NextResponse.json({ error: "Dossier non autorisé." }, { status: 400 })
  }

  if (!ALLOWED_RESOURCE_TYPES.includes(resourceType as ResourceType)) {
    return NextResponse.json({ error: "Type de ressource non autorisé." }, { status: 400 })
  }

  const timestamp = Math.round(Date.now() / 1000)
  const paramsToSign = `folder=${folder}&resource_type=${resourceType}&timestamp=${timestamp}`
  const signature = crypto
    .createHash("sha1")
    .update(paramsToSign + apiSecret)
    .digest("hex")

  return NextResponse.json({ signature, timestamp, apiKey, cloudName, folder, resourceType })
}
