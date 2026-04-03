import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !uploadPreset) {
    return NextResponse.json(
      { error: "Variables Cloudinary manquantes (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET)" },
      { status: 500 }
    )
  }

  const formData = await req.formData()
  const file = formData.get("file")

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 })
  }

  const cloudinaryForm = new FormData()
  cloudinaryForm.append("file", file)
  cloudinaryForm.append("upload_preset", uploadPreset)
  cloudinaryForm.append("folder", "surnaturel-de-dieu")

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: cloudinaryForm }
  )

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: `Erreur Cloudinary: ${err}` }, { status: 502 })
  }

  const data = await res.json()
  return NextResponse.json({ url: data.secure_url })
}
