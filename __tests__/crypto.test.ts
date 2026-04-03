import { describe, it, expect } from "vitest"
import { encrypt, decrypt } from "@/lib/crypto"

describe("Crypto — AES-256-GCM encryption", () => {
  it("encrypts and decrypts text correctly", () => {
    const texte = "Données médicales sensibles — groupe sanguin O+"
    const chiffre = encrypt(texte)
    const dechiffre = decrypt(chiffre)

    expect(dechiffre).toBe(texte)
  })

  it("produces different ciphertext for same input (random IV)", () => {
    const texte = "Test de chiffrement"
    const chiffre1 = encrypt(texte)
    const chiffre2 = encrypt(texte)

    expect(chiffre1).not.toBe(chiffre2) // Different IVs
    expect(decrypt(chiffre1)).toBe(texte)
    expect(decrypt(chiffre2)).toBe(texte)
  })

  it("ciphertext has correct format (iv:tag:data)", () => {
    const chiffre = encrypt("Hello")
    const parts = chiffre.split(":")

    expect(parts).toHaveLength(3)
    // IV = 16 bytes = 32 hex chars
    expect(parts[0]).toMatch(/^[0-9a-f]{32}$/)
    // Auth tag = 16 bytes = 32 hex chars
    expect(parts[1]).toMatch(/^[0-9a-f]{32}$/)
    // Cipher data = hex encoded
    expect(parts[2]).toMatch(/^[0-9a-f]+$/)
  })

  it("handles empty string", () => {
    const chiffre = encrypt("")
    const dechiffre = decrypt(chiffre)
    expect(dechiffre).toBe("")
  })

  it("handles unicode and special characters", () => {
    const texte = "Température: 37.5°C — Poids: 65kg 🩺"
    const dechiffre = decrypt(encrypt(texte))
    expect(dechiffre).toBe(texte)
  })

  it("rejects tampered ciphertext", () => {
    const chiffre = encrypt("Données protégées")
    const parts = chiffre.split(":")
    // Tamper with the cipher data — flip last char to guarantee change
    const lastChar = parts[2].slice(-1)
    const flipped = lastChar === "0" ? "1" : "0"
    const tampered = `${parts[0]}:${parts[1]}:${parts[2].slice(0, -1)}${flipped}`

    expect(() => decrypt(tampered)).toThrow()
  })

  it("handles long text", () => {
    const texte = "A".repeat(10_000)
    const dechiffre = decrypt(encrypt(texte))
    expect(dechiffre).toBe(texte)
  })
})
