/**
 * TOTP (Time-based One-Time Password) utilities for 2FA
 */

import * as OTPAuth from "otpauth"
import QRCode from "qrcode"
import crypto from "crypto"
import bcrypt from "bcryptjs"

const ISSUER = "Surnaturel de Dieu"
const ALGORITHM = "SHA1"
const DIGITS = 6
const PERIOD = 30

// ─── Generate a new TOTP secret ───────────────────────────────────

export function generateTOTPSecret(): string {
  // Generate a random 20-byte secret (160 bits)
  const buffer = crypto.randomBytes(20)
  // Encode as base32
  return base32Encode(buffer)
}

// ─── Create TOTP instance ─────────────────────────────────────────

export function createTOTP(secret: string, email: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: ISSUER,
    label: email,
    algorithm: ALGORITHM,
    digits: DIGITS,
    period: PERIOD,
    secret: OTPAuth.Secret.fromBase32(secret),
  })
}

// ─── Verify TOTP code ─────────────────────────────────────────────

export function verifyTOTP(secret: string, token: string, email: string): boolean {
  const totp = createTOTP(secret, email)
  // Allow 1 step tolerance (30 seconds before/after)
  const delta = totp.validate({ token, window: 1 })
  return delta !== null
}

// ─── Generate QR code data URL ────────────────────────────────────

export async function generateQRCode(secret: string, email: string): Promise<string> {
  const totp = createTOTP(secret, email)
  const uri = totp.toString()
  return QRCode.toDataURL(uri, {
    width: 200,
    margin: 2,
    color: { dark: "#2D7A1F", light: "#FFFFFF" },
  })
}

// ─── Generate backup codes ────────────────────────────────────────

export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = crypto.randomBytes(4).toString("hex").toUpperCase()
    // Format as XXXX-XXXX
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`)
  }
  return codes
}

// ─── Hash backup codes for storage ────────────────────────────────

export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  const hashedCodes: string[] = []
  for (const code of codes) {
    // Remove dashes and lowercase for comparison
    const normalizedCode = code.replace(/-/g, "").toLowerCase()
    const hash = await bcrypt.hash(normalizedCode, 10)
    hashedCodes.push(hash)
  }
  return hashedCodes
}

// ─── Verify backup code ───────────────────────────────────────────

export async function verifyBackupCode(code: string, hashedCodes: string[]): Promise<{ valid: boolean; usedIndex: number }> {
  const normalizedCode = code.replace(/-/g, "").toLowerCase()
  
  for (let i = 0; i < hashedCodes.length; i++) {
    const isValid = await bcrypt.compare(normalizedCode, hashedCodes[i])
    if (isValid) {
      return { valid: true, usedIndex: i }
    }
  }
  return { valid: false, usedIndex: -1 }
}

// ─── Encrypt TOTP secret for database storage ─────────────────────

export function encryptSecret(secret: string): string {
  const key = process.env.TOTP_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY
  if (!key || key.length !== 32) {
    throw new Error("TOTP_ENCRYPTION_KEY must be 32 characters")
  }
  
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key), iv)
  let encrypted = cipher.update(secret, "utf8", "hex")
  encrypted += cipher.final("hex")
  
  return iv.toString("hex") + ":" + encrypted
}

// ─── Decrypt TOTP secret from database ────────────────────────────

export function decryptSecret(encryptedSecret: string): string {
  const key = process.env.TOTP_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY
  if (!key || key.length !== 32) {
    throw new Error("TOTP_ENCRYPTION_KEY must be 32 characters")
  }
  
  const [ivHex, encrypted] = encryptedSecret.split(":")
  const iv = Buffer.from(ivHex, "hex")
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(key), iv)
  let decrypted = decipher.update(encrypted, "hex", "utf8")
  decrypted += decipher.final("utf8")
  
  return decrypted
}

// ─── Base32 encoding ──────────────────────────────────────────────

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

function base32Encode(buffer: Buffer): string {
  let result = ""
  let bits = 0
  let value = 0

  for (const byte of buffer) {
    value = (value << 8) | byte
    bits += 8

    while (bits >= 5) {
      result += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }

  if (bits > 0) {
    result += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  }

  return result
}

// ─── Session helpers ──────────────────────────────────────────────

export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

export function parseUserAgent(userAgent: string | null): { deviceName: string; deviceType: "mobile" | "desktop" | "tablet" } {
  if (!userAgent) {
    return { deviceName: "Appareil inconnu", deviceType: "desktop" }
  }

  const ua = userAgent.toLowerCase()

  // Device type detection
  let deviceType: "mobile" | "desktop" | "tablet" = "desktop"
  if (/ipad|tablet|playbook|silk/.test(ua)) {
    deviceType = "tablet"
  } else if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/.test(ua)) {
    deviceType = "mobile"
  }

  // Device name detection
  let deviceName = "Navigateur"

  // iPhone/iPad
  if (/iphone/.test(ua)) {
    deviceName = "iPhone"
    const match = ua.match(/iphone os (\d+)/)
    if (match) deviceName += ` (iOS ${match[1]})`
  } else if (/ipad/.test(ua)) {
    deviceName = "iPad"
  } else if (/mac os/.test(ua)) {
    deviceName = "Mac"
  } else if (/android/.test(ua)) {
    deviceName = "Android"
    // Try to extract device model
    const match = ua.match(/android \d+[^;]*;\s*([^)]+)\)/)
    if (match) {
      const model = match[1].split("build")[0].trim()
      if (model && model.length < 30) deviceName = model
    }
  } else if (/windows/.test(ua)) {
    deviceName = "Windows"
  } else if (/linux/.test(ua)) {
    deviceName = "Linux"
  }

  // Add browser
  if (/chrome/.test(ua) && !/edge|edg/.test(ua)) {
    deviceName += " Chrome"
  } else if (/safari/.test(ua) && !/chrome/.test(ua)) {
    deviceName += " Safari"
  } else if (/firefox/.test(ua)) {
    deviceName += " Firefox"
  } else if (/edge|edg/.test(ua)) {
    deviceName += " Edge"
  }

  return { deviceName, deviceType }
}
