import { typedLogger as logger } from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAuthenticationResponse } from "@simplewebauthn/server"
import { isoBase64URL } from "@simplewebauthn/server/helpers"
import type { AuthenticationResponseJSON } from "@simplewebauthn/types"
import { encode } from "next-auth/jwt"
import { cookies } from "next/headers"
import { SESSION_COOKIE_NAME } from "@/lib/auth"

const RP_ID = process.env.WEBAUTHN_RP_ID || "localhost"
const ORIGIN = process.env.NEXTAUTH_URL || "http://localhost:3000"

// POST /api/auth/webauthn/authenticate/verify — Verify credential and sign in
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const credential = body.credential as AuthenticationResponseJSON

    // Get stored challenge from cookie
    const challenge = req.cookies.get("webauthn_auth_challenge")?.value

    if (!challenge) {
      return NextResponse.json({ error: "La vérification a expiré. Veuillez réessayer." }, { status: 400 })
    }

    // Find the credential in database
    const webAuthnCred = await prisma.webAuthnCredential.findUnique({
      where: { credentialId: credential.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nom: true,
            prenom: true,
            role: true,
            photoUrl: true,
            emailVerifie: true,
          },
        },
      },
    })

    if (!webAuthnCred) {
      return NextResponse.json({ error: "Appareil non reconnu. Utilisez une autre méthode de connexion." }, { status: 404 })
    }

    // Check if email is verified
    if (!webAuthnCred.user.emailVerifie) {
      return NextResponse.json(
        { error: "Email non vérifié. Veuillez d'abord vérifier votre email." },
        { status: 403 }
      )
    }

    // Verify the authentication response
    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      authenticator: {
        credentialID: isoBase64URL.toBuffer(webAuthnCred.credentialId),
        credentialPublicKey: new Uint8Array(webAuthnCred.credentialPublicKey),
        counter: Number(webAuthnCred.counter),
        transports: webAuthnCred.transports as AuthenticatorTransport[],
      },
      requireUserVerification: true,
    })

    if (!verification.verified) {
      return NextResponse.json({ error: "Vérification échouée" }, { status: 400 })
    }

    // Update counter and last used timestamp
    await prisma.webAuthnCredential.update({
      where: { id: webAuthnCred.id },
      data: {
        counter: BigInt(verification.authenticationInfo.newCounter),
        lastUsedAt: new Date(),
      },
    })

    // Create NextAuth session token — utiliser le même nom de cookie que auth.ts
    const useSecure = SESSION_COOKIE_NAME.startsWith("__Secure-")

    const token = await encode({
      token: {
        sub: webAuthnCred.user.id,
        email: webAuthnCred.user.email,
        nom: webAuthnCred.user.nom,
        prenom: webAuthnCred.user.prenom,
        role: webAuthnCred.user.role,
        photoUrl: webAuthnCred.user.photoUrl,
      },
      secret: process.env.AUTH_SECRET!,
      salt: SESSION_COOKIE_NAME,
    })

    // Set session cookie
    const cookieStore = await cookies()

    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: useSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    })

    // Clear challenge cookie
    const response = NextResponse.json({ success: true })
    response.cookies.delete("webauthn_auth_challenge")

    return response
  } catch (error) {
    logger.error("WebAuthn authenticate verify error:", error)
    return NextResponse.json(
      { error: "Erreur lors de la vérification" },
      { status: 500 }
    )
  }
}
