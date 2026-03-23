import { NextRequest, NextResponse } from "next/server"
import { z } from "zod/v4"
import crypto from "crypto"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { envoyerEmailResetMotDePasse } from "@/lib/email"
import { captureAuthError } from "@/lib/sentry"

// ─── POST : demander un reset (envoie un email) ─────────────────

const demandeSchema = z.object({
  email: z.string().email(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = demandeSchema.parse(body)

    const user = await prisma.user.findUnique({ where: { email } })

    // Toujours répondre 200 pour ne pas révéler si l'email existe
    if (!user) {
      return NextResponse.json({ message: "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé." })
    }

    const token = crypto.randomBytes(32).toString("hex")
    const expiry = new Date(Date.now() + 60 * 60 * 1000) // 1 heure

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiry: expiry },
    })

    const appUrl = process.env.NEXTAUTH_URL || "https://surnatureldedieu.com"
    const lienReset = `${appUrl}/mot-de-passe-oublie?token=${token}`

    await envoyerEmailResetMotDePasse({
      destinataire: user.email,
      prenom: user.prenom,
      lienReset,
    })

    return NextResponse.json({ message: "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé." })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 })
    }
    captureAuthError(error, undefined, { action: "request-reset" })
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// ─── PUT : réinitialiser le mot de passe avec le token ───────────

const resetSchema = z.object({
  token: z.string().min(1),
  motDePasse: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  confirmation: z.string(),
}).refine((d) => d.motDePasse === d.confirmation, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmation"],
})

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, motDePasse } = resetSchema.parse(body)

    const user = await prisma.user.findUnique({ where: { resetToken: token } })

    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return NextResponse.json({ error: "Lien expiré ou invalide. Veuillez refaire une demande." }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(motDePasse, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExpiry: null },
    })

    return NextResponse.json({ message: "Mot de passe réinitialisé avec succès." })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const msg = error.issues[0]?.message || "Données invalides"
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    captureAuthError(error, undefined, { action: "confirm-reset" })
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
