import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET — appelé par node-cron (PM2) toutes les heures
// Supprime les stories expirées + leurs médias Cloudinary
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const now = new Date()

  // Récupérer les stories expirées avec médias
  const expirees = await prisma.story.findMany({
    where: { expiresAt: { lte: now } },
    select: { id: true, mediaUrl: true, type: true },
  })

  if (expirees.length === 0) {
    return NextResponse.json({ supprimees: 0 })
  }

  // Supprimer les médias Cloudinary
  const mediasASupprimer = expirees.filter((s) => s.mediaUrl && (s.type === "IMAGE" || s.type === "VIDEO"))
  for (const story of mediasASupprimer) {
    try {
      // Extraire le public_id depuis l'URL Cloudinary
      const url = story.mediaUrl!
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/)
      if (match?.[1]) {
        const publicId = match[1]
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
        const apiKey = process.env.CLOUDINARY_API_KEY
        const apiSecret = process.env.CLOUDINARY_API_SECRET
        if (cloudName && apiKey && apiSecret) {
          const timestamp = Math.floor(Date.now() / 1000)
          const { createHash } = await import("crypto")
          const signature = createHash("sha1")
            .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
            .digest("hex")
          await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${story.type === "VIDEO" ? "video" : "image"}/destroy`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ public_id: publicId, timestamp, api_key: apiKey, signature }),
          })
        }
      }
    } catch {
      // Suppression média optionnelle, on continue
    }
  }

  // Supprimer les entrées en base
  const { count } = await prisma.story.deleteMany({
    where: { expiresAt: { lte: now } },
  })

  return NextResponse.json({ supprimees: count })
}
