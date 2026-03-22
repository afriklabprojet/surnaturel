import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod/v4"

const profilSchema = z.object({
  nom: z.string().min(1).max(100).optional(),
  prenom: z.string().min(1).max(100).optional(),
  telephone: z.string().max(20).optional(),
  photoUrl: z.string().url().optional(),
})

const passwordSchema = z
  .object({
    motDePasseActuel: z.string().min(1),
    nouveauMotDePasse: z.string().min(8).max(128),
    confirmation: z.string().min(1),
  })
  .refine((d) => d.nouveauMotDePasse === d.confirmation, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmation"],
  })

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, nom: true, prenom: true, email: true,
      telephone: true, photoUrl: true, createdAt: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
  }

  return NextResponse.json(user)
}

export async function PATCH(req: NextRequest) {
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

  const result = profilSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: "Données invalides", details: z.prettifyError(result.error) },
      { status: 400 }
    )
  }

  const data = result.data

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(data.nom && { nom: data.nom }),
      ...(data.prenom && { prenom: data.prenom }),
      ...(data.telephone !== undefined && { telephone: data.telephone }),
      ...(data.photoUrl && { photoUrl: data.photoUrl }),
    },
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      telephone: true,
      photoUrl: true,
      role: true,
    },
  })

  return NextResponse.json({ user })
}

// Changer le mot de passe
export async function PUT(req: NextRequest) {
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

  const result = passwordSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: "Données invalides", details: z.prettifyError(result.error) },
      { status: 400 }
    )
  }

  const { motDePasseActuel, nouveauMotDePasse } = result.data

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  })

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
  }

  const isValid = await bcrypt.compare(motDePasseActuel, user.passwordHash)
  if (!isValid) {
    return NextResponse.json(
      { error: "Mot de passe actuel incorrect" },
      { status: 400 }
    )
  }

  const hash = await bcrypt.hash(nouveauMotDePasse, 12)

  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: hash },
  })

  return NextResponse.json({ success: true, message: "Mot de passe modifié avec succès" })
}
