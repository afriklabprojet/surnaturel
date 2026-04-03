import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const MAX_SIZE = 100 * 1024 * 1024 // 100 Mo
const ALLOWED_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
  "video/x-matroska",
]

// POST /api/temoignages/video-upload — Cliente envoie un témoignage vidéo
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("video")
  const titre = formData.get("titre") as string | null
  const soinNom = formData.get("soinNom") as string | null
  const description = formData.get("description") as string | null
  const consentement = formData.get("consentement") as string | null

  if (consentement !== "true") {
    return NextResponse.json(
      { error: "Vous devez donner votre consentement pour publier la vidéo." },
      { status: 400 }
    )
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Vidéo manquante." }, { status: 400 })
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Format non supporté. Envoyez un fichier MP4, MOV ou WebM." },
      { status: 400 }
    )
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Vidéo trop volumineuse (max 100 Mo)." },
      { status: 400 }
    )
  }

  // Upload vers Cloudinary (resource_type: video)
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
  if (!cloudName || !uploadPreset) {
    return NextResponse.json(
      { error: "Un souci technique est survenu. Réessayez dans quelques instants." },
      { status: 500 }
    )
  }

  const cloudForm = new FormData()
  cloudForm.append("file", file)
  cloudForm.append("upload_preset", uploadPreset)
  cloudForm.append("folder", "surnaturel-de-dieu/temoignages")
  cloudForm.append("resource_type", "video")

  const cloudRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
    { method: "POST", body: cloudForm }
  )
  if (!cloudRes.ok) {
    return NextResponse.json(
      { error: "L'envoi de la vidéo a échoué. Réessayez dans quelques instants." },
      { status: 502 }
    )
  }

  const cloudData = (await cloudRes.json()) as {
    secure_url: string
    duration?: number
    public_id?: string
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { prenom: true, nom: true },
  })

  const clientNom = user ? `${user.prenom} ${user.nom.charAt(0)}.` : "Cliente"
  const duree = cloudData.duration ? Math.round(cloudData.duration) : null

  // Générer automatiquement la thumbnail Cloudinary
  const thumbnailUrl = cloudData.public_id
    ? `https://res.cloudinary.com/${cloudName}/video/upload/so_0,w_640,h_360,c_fill,f_jpg/${cloudData.public_id}.jpg`
    : null

  const video = await prisma.temoignageVideo.create({
    data: {
      titre: titre?.trim() || "Mon expérience",
      clientNom,
      soinNom: soinNom?.trim() || null,
      videoUrl: cloudData.secure_url,
      thumbnailUrl,
      duree,
      description: description?.trim()?.slice(0, 500) || null,
      consentementClient: true,
      approuve: false, // L'admin doit valider avant publication
      vedette: false,
      ordre: 0,
    },
  })

  return NextResponse.json({ video })
}
