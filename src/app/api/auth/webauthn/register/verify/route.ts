import { typedLogger as logger } from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { verifyRegistrationResponse } from "@simplewebauthn/server"
import type { RegistrationResponseJSON } from "@simplewebauthn/types"

const RP_ID = process.env.WEBAUTHN_RP_ID || "localhost"
const ORIGIN = process.env.NEXTAUTH_URL || "http://localhost:3000"

// POST /api/auth/webauthn/register/verify — Verify and save credential
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const credential = body.credential as RegistrationResponseJSON
    const deviceName = body.deviceName as string | undefined

    // Get stored challenge from cookie
    const challenge = req.cookies.get("webauthn_challenge")?.value
    const storedDeviceName = req.cookies.get("webauthn_device_name")?.value

    if (!challenge) {
      return NextResponse.json({ error: "La vérification a expiré. Veuillez réessayer." }, { status: 400 })
    }

    // Verify the registration response
    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: true,
    })

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: "Vérification échouée" }, { status: 400 })
    }

    const { credentialID, credentialPublicKey, counter, credentialDeviceType, credentialBackedUp } = verification.registrationInfo

    // Determine device name
    let finalDeviceName = deviceName || storedDeviceName || "Appareil"
    
    // Add device type hint
    if (credentialDeviceType === "singleDevice") {
      finalDeviceName = `${finalDeviceName} (non-synchronisé)`
    } else if (credentialBackedUp) {
      finalDeviceName = `${finalDeviceName} (iCloud/Google)`
    }

    // credentialID is a Uint8Array in v9, convert to base64url string
    const credIdBase64 = Buffer.from(credentialID).toString("base64url")

    // Save credential to database
    await prisma.webAuthnCredential.create({
      data: {
        userId: session.user.id,
        credentialId: credIdBase64,
        credentialPublicKey: Buffer.from(credentialPublicKey),
        counter: BigInt(counter),
        transports: credential.response.transports ?? [],
        deviceName: finalDeviceName,
      },
    })

    // Clear cookies
    const response = NextResponse.json({ success: true })
    response.cookies.delete("webauthn_challenge")
    response.cookies.delete("webauthn_device_name")

    return response
  } catch (error) {
    logger.error("WebAuthn register verify error:", error)
    return NextResponse.json(
      { error: "Erreur lors de la vérification" },
      { status: 500 }
    )
  }
}
