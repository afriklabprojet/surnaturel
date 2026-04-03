import { typedLogger as logger } from "@/lib/logger"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/auth/webauthn/credentials — List user's passkeys
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const credentials = await prisma.webAuthnCredential.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        deviceName: true,
        createdAt: true,
        lastUsedAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(
      credentials.map((cred) => ({
        id: cred.id,
        name: cred.deviceName || "Appareil",
        createdAt: cred.createdAt,
        lastUsed: cred.lastUsedAt,
      }))
    )
  } catch (error) {
    logger.error("WebAuthn credentials list error:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération" },
      { status: 500 }
    )
  }
}
