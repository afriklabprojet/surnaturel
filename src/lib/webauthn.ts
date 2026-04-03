/**
 * WebAuthn utilities for biometric authentication (Face ID / Touch ID / Windows Hello)
 * Provides Passkey support for mobile-first authentication experience
 */

import { startRegistration, startAuthentication } from "@simplewebauthn/browser"
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/types"

// ─── Types ───────────────────────────────────────────────────────

export interface WebAuthnCredential {
  id: string
  name: string
  createdAt: Date
  lastUsed: Date | null
}

// ─── Feature Detection ───────────────────────────────────────────

/**
 * Check if WebAuthn is supported by the browser
 */
export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    window.PublicKeyCredential !== undefined &&
    typeof window.PublicKeyCredential === "function"
  )
}

/**
 * Check if platform authenticator (Face ID, Touch ID, Windows Hello) is available
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

/**
 * Check if conditional mediation (autofill passkeys) is available
 */
export async function isConditionalMediationAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false
  try {
    const pk = PublicKeyCredential as unknown as { isConditionalMediationAvailable?: () => Promise<boolean> }
    return await pk.isConditionalMediationAvailable?.() ?? false
  } catch {
    return false
  }
}

// ─── Registration ────────────────────────────────────────────────

/**
 * Start WebAuthn registration flow
 */
export async function registerPasskey(
  deviceName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Get registration options from server
    const optionsRes = await fetch("/api/auth/webauthn/register/options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceName }),
    })

    if (!optionsRes.ok) {
      const data = await optionsRes.json()
      return { success: false, error: data.error || "Erreur serveur" }
    }

    const options: PublicKeyCredentialCreationOptionsJSON = await optionsRes.json()

    // 2. Trigger browser WebAuthn UI
    const credential = await startRegistration(options)

    // 3. Verify with server
    const verifyRes = await fetch("/api/auth/webauthn/register/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential, deviceName }),
    })

    if (!verifyRes.ok) {
      const data = await verifyRes.json()
      return { success: false, error: data.error || "Vérification échouée" }
    }

    return { success: true }
  } catch (err) {
    // User cancelled or error
    if (err instanceof Error) {
      if (err.name === "NotAllowedError") {
        return { success: false, error: "Opération annulée" }
      }
      return { success: false, error: err.message }
    }
    return { success: false, error: "Erreur inattendue" }
  }
}

// ─── Authentication ──────────────────────────────────────────────

/**
 * Start WebAuthn authentication flow
 */
export async function authenticateWithPasskey(
  email?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Get authentication options from server
    const optionsRes = await fetch("/api/auth/webauthn/authenticate/options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })

    if (!optionsRes.ok) {
      const data = await optionsRes.json()
      return { success: false, error: data.error || "Erreur serveur" }
    }

    const options: PublicKeyCredentialRequestOptionsJSON = await optionsRes.json()

    // 2. Trigger browser WebAuthn UI
    const credential = await startAuthentication(options)

    // 3. Verify with server & sign in
    const verifyRes = await fetch("/api/auth/webauthn/authenticate/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential }),
    })

    if (!verifyRes.ok) {
      const data = await verifyRes.json()
      return { success: false, error: data.error || "Authentification échouée" }
    }

    return { success: true }
  } catch (err) {
    // User cancelled or error
    if (err instanceof Error) {
      if (err.name === "NotAllowedError") {
        return { success: false, error: "Opération annulée" }
      }
      return { success: false, error: err.message }
    }
    return { success: false, error: "Erreur inattendue" }
  }
}

// ─── Credential Management ───────────────────────────────────────

/**
 * Get list of registered passkeys for the current user
 */
export async function getRegisteredPasskeys(): Promise<WebAuthnCredential[]> {
  try {
    const res = await fetch("/api/auth/webauthn/credentials")
    if (!res.ok) return []
    return (await res.json()) as WebAuthnCredential[]
  } catch {
    return []
  }
}

/**
 * Remove a registered passkey
 */
export async function removePasskey(
  credentialId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/auth/webauthn/credentials/${credentialId}`, {
      method: "DELETE",
    })
    if (!res.ok) {
      const data = await res.json()
      return { success: false, error: data.error || "Erreur suppression" }
    }
    return { success: true }
  } catch {
    return { success: false, error: "Erreur réseau" }
  }
}
