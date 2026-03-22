import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 })
  }

  const { photoUrl } = body as { photoUrl?: string }

  if (!photoUrl || typeof photoUrl !== "string") {
    return NextResponse.json({ error: "URL photo manquante" }, { status: 400 })
  }

  // Valider que c'est une URL Cloudinary
  try {
    const url = new URL(photoUrl)
    if (!url.hostname.includes("cloudinary.com") && !url.hostname.includes("res.cloudinary.com")) {
      return NextResponse.json({ error: "URL non autorisée" }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: "URL invalide" }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { photoUrl },
    select: { id: true, photoUrl: true },
  })

  return NextResponse.json({ photoUrl: user.photoUrl })
}
