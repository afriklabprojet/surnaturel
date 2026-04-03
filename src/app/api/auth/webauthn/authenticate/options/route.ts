import { typedLogger as logger } from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateAuthenticationOptions } from "@simplewebauthn/server"
import { isoBase64URL } from "@simplewebauthn/server/helpers"

const RP_ID = process.env.WEBAUTHN_RP_ID || "localhost"

// POST /api/auth/webauthn/authenticate/options — Get authentication options
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = body.email as string | undefined

    let allowCredentials: { id: Uint8Array; type: "public-key"; transports?: AuthenticatorTransport[] }[] = []

    // If email is provided, only allow credentials for that user
    if (email) {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        include: {
          webAuthnCredentials: {
            select: {
              credentialId: true,
              transports: true,
            },
          },
        },
      })

      if (!user || user.webAuthnCredentials.length === 0) {
        return NextResponse.json(
          { error: "Aucun passkey enregistré pour ce compte" },
          { status: 404 }
        )
      }

      allowCredentials = user.webAuthnCredentials.map((cred) => ({
        id: isoBase64URL.toBuffer(cred.credentialId),
        type: "public-key" as const,
        transports: cred.transports as AuthenticatorTransport[],
      }))
    }

    // Generate authentication options
    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      userVerification: "required",
      // If no email provided, allow any credential (discoverable credentials)
      allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
    })

    // Store challenge in cookie for verification
    const response = NextResponse.json(options)
    response.cookies.set("webauthn_auth_challenge", options.challenge, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 5, // 5 minutes
      path: "/",
    })

    return response
  } catch (error) {
    logger.error("WebAuthn authenticate options error:", error)
    return NextResponse.json(
      { error: "Erreur lors de la génération des options" },
      { status: 500 }
    )
  }
}
