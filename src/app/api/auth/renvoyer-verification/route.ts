import { NextResponse } from "next/server"
import { z } from "zod/v4"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { envoyerEmailInscription } from "@/lib/email"

const schema = z.object({
  email: z.string().email(),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 })
  }

  const result = schema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: "Email invalide." }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { email: result.data.email },
    select: { id: true, prenom: true, email: true, emailVerifie: true },
  })

  // Toujours répondre 200 pour ne pas révéler l'existence du compte
  if (!user || user.emailVerifie) {
    return NextResponse.json({ message: "Si ce compte existe, un email a été envoyé." })
  }

  const emailVerifToken = crypto.randomBytes(32).toString("hex")
  const emailVerifExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerifToken, emailVerifExpiry },
  })

  envoyerEmailInscription({
    destinataire: user.email,
    prenom: user.prenom,
    tokenVerification: emailVerifToken,
  }).catch(() => null)

  return NextResponse.json({ message: "Si ce compte existe, un email a été envoyé." })
}
