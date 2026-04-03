import { typedLogger as logger } from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateRegistrationOptions } from "@simplewebauthn/server"

const RP_NAME = "Le Surnaturel de Dieu"
const RP_ID = process.env.WEBAUTHN_RP_ID || "localhost"

// POST /api/auth/webauthn/register/options — Get registration options
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const deviceName = body.deviceName as string | undefined

    // Get user's existing credentials
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        webAuthnCredentials: {
          select: { credentialId: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
    }

    // Generate registration options
    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: user.id,
      userName: user.email,
      userDisplayName: `${user.prenom} ${user.nom}`,
      authenticatorSelection: {
        // Prefer platform authenticator (Face ID, Touch ID)
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred",
      },
      attestationType: "none",
    })

    // Store challenge in session/cookie for verification
    const response = NextResponse.json(options)
    response.cookies.set("webauthn_challenge", options.challenge, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 5, // 5 minutes
      path: "/",
    })
    if (deviceName) {
      response.cookies.set("webauthn_device_name", deviceName, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 5,
        path: "/",
      })
    }

    return response
  } catch (error) {
    logger.error("WebAuthn register options error:", error)
    return NextResponse.json(
      { error: "Erreur lors de la génération des options" },
      { status: 500 }
    )
  }
}
