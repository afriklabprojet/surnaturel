import { typedLogger as logger } from "@/lib/logger"
/**
 * 2FA API Routes
 * 
 * POST /api/2fa/setup - Generate TOTP secret and QR code
 * POST /api/2fa/enable - Verify code and enable 2FA
 * POST /api/2fa/disable - Disable 2FA (requires password)
 * POST /api/2fa/verify - Verify TOTP during login
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import type { Session } from "next-auth"
import {
  generateTOTPSecret,
  generateQRCode,
  verifyTOTP,
  generateBackupCodes,
  hashBackupCodes,
  verifyBackupCode,
  encryptSecret,
  decryptSecret,
} from "@/lib/totp"

// Type for session from auth()
type AuthSession = Session | null

// ─── Rate Limiting for 2FA verification ───────────────────────────
// 5 attempts per 15 minutes per userId
const RATE_LIMIT_ATTEMPTS = 5
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

interface RateLimitEntry {
  attempts: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

function checkRateLimit(userId: string): { allowed: boolean; remaining: number; retryAfter?: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(userId)

  // Cleanup old entries periodically
  if (rateLimitStore.size > 10000) {
    for (const [key, val] of rateLimitStore) {
      if (val.resetAt < now) rateLimitStore.delete(key)
    }
  }

  if (!entry || entry.resetAt < now) {
    // New window
    rateLimitStore.set(userId, { attempts: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return { allowed: true, remaining: RATE_LIMIT_ATTEMPTS - 1 }
  }

  if (entry.attempts >= RATE_LIMIT_ATTEMPTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return { allowed: false, remaining: 0, retryAfter }
  }

  entry.attempts++
  return { allowed: true, remaining: RATE_LIMIT_ATTEMPTS - entry.attempts }
}

function resetRateLimit(userId: string) {
  rateLimitStore.delete(userId)
}

// ─── POST /api/2fa - Route handler ────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session: AuthSession = await auth()
    const body = await req.json()
    const { action } = body

    switch (action) {
      case "setup":
        return handleSetup(session)
      case "enable":
        return handleEnable(session, body)
      case "disable":
        return handleDisable(session, body)
      case "verify":
        return handleVerify(body)
      case "backup":
        return handleBackupVerify(body)
      default:
        return NextResponse.json({ error: "Action invalide" }, { status: 400 })
    }
  } catch (error) {
    logger.error("[2FA] Error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// ─── GET /api/2fa - Check 2FA status ──────────────────────────────

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        totpEnabled: true,
        totpVerifiedAt: true,
        totpBackupCodes: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    return NextResponse.json({
      enabled: user.totpEnabled,
      enabledAt: user.totpVerifiedAt,
      backupCodesRemaining: user.totpBackupCodes.length,
    })
  } catch (error) {
    logger.error("[2FA] GET Error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// ─── Setup: Generate TOTP secret and QR code ──────────────────────

async function handleSetup(session: AuthSession) {
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, totpEnabled: true },
  })

  if (!user) {
    return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
  }

  if (user.totpEnabled) {
    return NextResponse.json({ error: "2FA déjà activée" }, { status: 400 })
  }

  // Generate new TOTP secret
  const secret = generateTOTPSecret()
  const qrCode = await generateQRCode(secret, user.email)

  // Store encrypted secret temporarily (not enabled yet)
  const encryptedSecret = encryptSecret(secret)
  await prisma.user.update({
    where: { id: session.user.id },
    data: { totpSecret: encryptedSecret },
  })

  // Return secret and QR code (secret shown only during setup)
  return NextResponse.json({
    secret,
    qrCode,
    message: "Scannez le QR code avec votre application d'authentification",
  })
}

// ─── Enable: Verify code and activate 2FA ─────────────────────────

async function handleEnable(session: AuthSession, body: { code: string }) {
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const { code } = body
  if (!code || code.length !== 6) {
    return NextResponse.json({ error: "Code invalide" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, totpSecret: true, totpEnabled: true },
  })

  if (!user || !user.totpSecret) {
    return NextResponse.json({ error: "Configuration 2FA non trouvée" }, { status: 400 })
  }

  if (user.totpEnabled) {
    return NextResponse.json({ error: "2FA déjà activée" }, { status: 400 })
  }

  // Decrypt and verify code
  const secret = decryptSecret(user.totpSecret)
  const isValid = verifyTOTP(secret, code, user.email)

  if (!isValid) {
    return NextResponse.json({ error: "Code incorrect" }, { status: 400 })
  }

  // Generate backup codes
  const backupCodes = generateBackupCodes(8)
  const hashedBackupCodes = await hashBackupCodes(backupCodes)

  // Enable 2FA
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      totpEnabled: true,
      totpVerifiedAt: new Date(),
      totpBackupCodes: hashedBackupCodes,
    },
  })

  return NextResponse.json({
    success: true,
    backupCodes, // Show backup codes ONLY once
    message: "2FA activée avec succès. Conservez vos codes de secours !",
  })
}

// ─── Disable: Turn off 2FA (requires password) ────────────────────

async function handleDisable(session: AuthSession, body: { password: string }) {
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const { password } = body
  if (!password) {
    return NextResponse.json({ error: "Mot de passe requis" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true, totpEnabled: true },
  })

  if (!user) {
    return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
  }

  if (!user.totpEnabled) {
    return NextResponse.json({ error: "2FA non activée" }, { status: 400 })
  }

  if (!user.passwordHash) {
    return NextResponse.json({ error: "Compte OAuth - pas de mot de passe" }, { status: 400 })
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.passwordHash)
  if (!isValid) {
    return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 400 })
  }

  // Disable 2FA
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      totpEnabled: false,
      totpSecret: null,
      totpBackupCodes: [],
      totpVerifiedAt: null,
    },
  })

  return NextResponse.json({
    success: true,
    message: "2FA désactivée",
  })
}

// ─── Verify: Check TOTP code during login ─────────────────────────

async function handleVerify(body: { userId: string; code: string; tempToken?: string }) {
  const { userId, code, tempToken } = body

  if (!userId || !code) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
  }

  // Rate limit check
  const rateLimit = checkRateLimit(userId)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { 
        error: `Trop de tentatives. Réessayez dans ${Math.ceil(rateLimit.retryAfter! / 60)} minute(s).`,
        retryAfter: rateLimit.retryAfter 
      },
      { status: 429 }
    )
  }

  // Optional: Verify temp token if using intermediate auth flow
  // This would be a short-lived token issued after password verification

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, totpSecret: true, totpEnabled: true },
  })

  if (!user || !user.totpSecret || !user.totpEnabled) {
    return NextResponse.json({ error: "2FA non configurée" }, { status: 400 })
  }

  // Decrypt and verify code
  const secret = decryptSecret(user.totpSecret)
  const isValid = verifyTOTP(secret, code, user.email)

  if (!isValid) {
    return NextResponse.json(
      { error: "Code incorrect", valid: false, remaining: rateLimit.remaining },
      { status: 400 }
    )
  }

  // Success - reset rate limit
  resetRateLimit(userId)
  return NextResponse.json({ valid: true })
}

// ─── Backup code verification ─────────────────────────────────────

async function handleBackupVerify(body: { userId: string; code: string }) {
  const { userId, code } = body

  if (!userId || !code) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
  }

  // Rate limit check (shared with TOTP verification)
  const rateLimit = checkRateLimit(userId)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { 
        error: `Trop de tentatives. Réessayez dans ${Math.ceil(rateLimit.retryAfter! / 60)} minute(s).`,
        retryAfter: rateLimit.retryAfter 
      },
      { status: 429 }
    )
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totpBackupCodes: true, totpEnabled: true },
  })

  if (!user || !user.totpEnabled) {
    return NextResponse.json({ error: "2FA non configurée" }, { status: 400 })
  }

  const { valid, usedIndex } = await verifyBackupCode(code, user.totpBackupCodes)

  if (!valid) {
    return NextResponse.json(
      { error: "Code de secours invalide", valid: false, remaining: rateLimit.remaining },
      { status: 400 }
    )
  }

  // Remove used backup code
  const remainingCodes = [...user.totpBackupCodes]
  remainingCodes.splice(usedIndex, 1)

  await prisma.user.update({
    where: { id: userId },
    data: { totpBackupCodes: remainingCodes },
  })

  // Success - reset rate limit
  resetRateLimit(userId)

  return NextResponse.json({
    valid: true,
    remainingCodes: remainingCodes.length,
    message: `Code utilisé. Il vous reste ${remainingCodes.length} code(s) de secours.`,
  })
}
