import { NextResponse } from "next/server"
import { z } from "zod/v4"
import bcrypt from "bcryptjs"
import crypto from "crypto"
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
      { error: "Les informations envoyées sont incorrectes. Veuillez réessayer." },
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
    select: { id: true, emailVerifie: true, createdAt: true },
  })

  if (existingUser) {
    const deuxMinutes = 2 * 60 * 1000
    const ageDuCompte = Date.now() - existingUser.createdAt.getTime()

    if (existingUser.emailVerifie) {
      // Compte actif → refus définitif
      return NextResponse.json(
        { error: "Cette adresse email est déjà utilisée." },
        { status: 409 }
      )
    }

    if (ageDuCompte <= deuxMinutes) {
      // Inscription récente non confirmée → renvoyer l'email, ne pas écraser
      return NextResponse.json(
        { error: "Un email de confirmation vient d'être envoyé. Vérifiez votre boîte (et vos spams) puis cliquez sur le lien." },
        { status: 409 }
      )
    }

    // Inscription expirée (> 2 min, non vérifiée) → supprimer et recommencer
    await prisma.user.delete({ where: { id: existingUser.id } })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const emailVerifToken = crypto.randomBytes(32).toString("hex")
  const emailVerifExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h

  await prisma.user.create({
    data: {
      prenom,
      nom,
      email,
      telephone: telephone ?? null,
      passwordHash,
      emailVerifToken,
      emailVerifExpiry,
    },
  })

  // Email de vérification
  let emailEnvoye = true
  try {
    console.log("[INSCRIPTION] Envoi email de vérification à:", email)
    console.log("[INSCRIPTION] RESEND_API_KEY définie:", !!process.env.RESEND_API_KEY)
    console.log("[INSCRIPTION] RESEND_FROM_EMAIL:", process.env.RESEND_FROM_EMAIL ?? "(non définie)")
    await envoyerEmailInscription({
      destinataire: email,
      prenom,
      tokenVerification: emailVerifToken,
    })
    console.log("[INSCRIPTION] Email envoyé avec succès à:", email)
  } catch (err) {
    emailEnvoye = false
    console.error("[INSCRIPTION] Erreur envoi email Resend:", {
      message: (err as Error)?.message ?? String(err),
      name: (err as Error)?.name,
      stack: (err as Error)?.stack?.split("\n").slice(0, 3).join("\n"),
    })
  }

  return NextResponse.json(
    {
      message: emailEnvoye
        ? "Compte créé. Vérifiez votre boîte email pour activer votre compte."
        : "Compte créé, mais l'email de vérification n'a pas pu être envoyé. Utilisez « Renvoyer l'email » sur la page de connexion.",
    },
    { status: 201 }
  )
}
