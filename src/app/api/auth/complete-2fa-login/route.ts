import { typedLogger as logger } from "@/lib/logger"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import crypto from "crypto"

// This route is called after 2FA verification to issue a one-time bypass token
// that allows skipping 2FA on the next login attempt
export async function POST(request: Request) {
  try {
    const { userId, email, password } = await request.json()

    if (!userId || !email || !password) {
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 }
      )
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        totpEnabled: true,
      },
    })

    if (!user || user.email !== email) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      )
    }

    // Verify password
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "Compte OAuth - utilisez Google pour vous connecter" },
        { status: 400 }
      )
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Mot de passe incorrect" },
        { status: 401 }
      )
    }

    // Generate a one-time bypass token (valid for 1 minute)
    const bypassToken = crypto.randomBytes(32).toString("hex")
    const hashedToken = crypto.createHash("sha256").update(bypassToken).digest("hex")
    const expiresAt = new Date(Date.now() + 60 * 1000) // 1 minute

    // Store the bypass token for the user (we'll use AuthSession with a special marker)
    await prisma.authSession.create({
      data: {
        userId: user.id,
        tokenHash: `2fa_bypass:${hashedToken}`,
        ipAddress: "bypass",
        userAgent: "bypass",
        deviceName: "2FA Bypass",
        deviceType: "bypass",
        expiresAt,
      },
    })

    return NextResponse.json({ 
      success: true, 
      bypassToken,
    })
  } catch (error) {
    logger.error("Complete 2FA login error:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}
