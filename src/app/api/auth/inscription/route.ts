import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { envoyerEmailInscription } from "@/lib/email"

const inscriptionSchema = z.object({
  prenom: z.string().min(2).max(50),
  nom: z.string().min(2).max(50),
  email: z.string().email(),
  telephone: z.string().optional(),
  password: z.string().min(8),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide." },
      { status: 400 }
    )
  }

  const result = inscriptionSchema.safeParse(body)
  if (!result.success) {
    const firstError = result.error.issues[0]?.message ?? "Données invalides."
    return NextResponse.json({ error: firstError }, { status: 400 })
  }

  const { prenom, nom, email, telephone, password } = result.data

  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    return NextResponse.json(
      { error: "Cette adresse email est déjà utilisée." },
      { status: 409 }
    )
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: {
      prenom,
      nom,
      email,
      telephone: telephone ?? null,
      passwordHash,
    },
  })

  // Email de bienvenue (non bloquant)
  envoyerEmailInscription({ destinataire: email, prenom }).catch(() => null)

  return NextResponse.json(
    { message: "Compte créé avec succès." },
    { status: 201 }
  )
}
