import { typedLogger as logger } from "@/lib/logger"
/**
 * Sessions API Routes
 * 
 * GET /api/sessions - List active sessions
 * DELETE /api/sessions - Revoke a session
 * DELETE /api/sessions?all=true - Revoke all sessions except current
 */

import { NextRequest, NextResponse } from "next/server"
import { auth, SESSION_COOKIE_NAME } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { hashSessionToken } from "@/lib/totp"

// ─── GET /api/sessions - List active sessions ────────────────────

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Get current session token to mark it as current
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value
    const currentTokenHash = sessionToken ? hashSessionToken(sessionToken) : null

    const sessions = await prisma.authSession.findMany({
      where: {
        userId: session.user.id,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActiveAt: "desc" },
      select: {
        id: true,
        deviceName: true,
        deviceType: true,
        ipAddress: true,
        location: true,
        lastActiveAt: true,
        createdAt: true,
        tokenHash: true,
      },
    })

    // Mark current session
    const sessionsWithCurrent = sessions.map((s) => ({
      ...s,
      isCurrent: s.tokenHash === currentTokenHash,
      tokenHash: undefined, // Don't expose hash
    }))

    return NextResponse.json({ sessions: sessionsWithCurrent })
  } catch (error) {
    logger.error("[Sessions] GET Error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// ─── DELETE /api/sessions - Revoke session(s) ────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get("id")
    const revokeAll = searchParams.get("all") === "true"

    // Get current session token
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value
    const currentTokenHash = sessionToken ? hashSessionToken(sessionToken) : null

    if (revokeAll) {
      // Revoke all sessions except current
      const result = await prisma.authSession.updateMany({
        where: {
          userId: session.user.id,
          revokedAt: null,
          ...(currentTokenHash ? { tokenHash: { not: currentTokenHash } } : {}),
        },
        data: { revokedAt: new Date() },
      })

      return NextResponse.json({
        success: true,
        message: `${result.count} session(s) révoquée(s)`,
      })
    }

    if (!sessionId) {
      return NextResponse.json({ error: "ID de session requis" }, { status: 400 })
    }

    // Check if trying to revoke current session
    const sessionToRevoke = await prisma.authSession.findFirst({
      where: {
        id: sessionId,
        userId: session.user.id,
      },
    })

    if (!sessionToRevoke) {
      return NextResponse.json({ error: "Session non trouvée" }, { status: 404 })
    }

    if (sessionToRevoke.tokenHash === currentTokenHash) {
      return NextResponse.json({ error: "Impossible de révoquer la session actuelle" }, { status: 400 })
    }

    // Revoke the session
    await prisma.authSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    })

    return NextResponse.json({
      success: true,
      message: "Session révoquée",
    })
  } catch (error) {
    logger.error("[Sessions] DELETE Error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// ─── POST /api/sessions - Create/track new session ───────────────

export async function POST(req: NextRequest) {
  try {
    const { userId, tokenHash, ipAddress, userAgent, deviceName, deviceType } = await req.json()

    if (!userId || !tokenHash) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
    }

    // Create session record
    const authSession = await prisma.authSession.create({
      data: {
        userId,
        tokenHash,
        ipAddress,
        userAgent,
        deviceName,
        deviceType,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    })

    // Update user's last login info
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
        lastLoginDevice: deviceName,
      },
    })

    // Clean up old expired sessions
    await prisma.authSession.deleteMany({
      where: {
        userId,
        OR: [
          { expiresAt: { lt: new Date() } },
          { revokedAt: { not: null }, createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        ],
      },
    })

    return NextResponse.json({ success: true, sessionId: authSession.id })
  } catch (error) {
    logger.error("[Sessions] POST Error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
