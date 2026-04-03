import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import crypto from "crypto"

const MAX_SIZE = 5 * 1024 * 1024 // 5 Mo

// Magic bytes des formats image autorisés
function detectImageType(bytes: Uint8Array): string | null {
  // JPEG : FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg"
  // PNG : 89 50 4E 47 0D 0A 1A 0A
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png"
  // WebP : 52 49 46 46 ?? ?? ?? ?? 57 45 42 50
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "image/webp"
  // GIF : 47 49 46 38
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return "image/gif"
  return null
}

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

  const formData = await req.formData()
  const file = formData.get("file")
  const folder = (formData.get("folder") as string) || "surnaturel-de-dieu/profils"

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant." }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Image trop volumineuse (max 5 Mo)." }, { status: 400 })
  }

  // Validation par magic bytes — pas par le Content-Type fourni par le client
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer).slice(0, 12)
  const detectedType = detectImageType(bytes)

  if (!detectedType) {
    return NextResponse.json(
      { error: "Format non supporté. Utilisez JPEG, PNG, WebP ou GIF." },
      { status: 400 }
    )
  }

  // Signature Cloudinary côté serveur (upload signé — pas de preset public)
  const timestamp = Math.round(Date.now() / 1000)
  const stringToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`
  const signature = crypto.createHash("sha1").update(stringToSign).digest("hex")

  const cloudForm = new FormData()
  cloudForm.append("file", new Blob([buffer], { type: detectedType }), file.name)
  cloudForm.append("api_key", apiKey)
  cloudForm.append("timestamp", String(timestamp))
  cloudForm.append("signature", signature)
  cloudForm.append("folder", folder)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: cloudForm }
  )

  if (!res.ok) {
    return NextResponse.json({ error: "Erreur lors de l'upload. Réessayez." }, { status: 502 })
  }

  const data: { secure_url: string } = await res.json()
  return NextResponse.json({ url: data.secure_url })
}
