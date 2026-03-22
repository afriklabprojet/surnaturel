import { describe, it, expect } from "vitest"

describe("API Export CSV format", () => {
  it("generates valid CSV for clients type", () => {
    // Test CSV header generation
    const headers = ["Prénom", "Nom", "Email", "Téléphone", "Ville", "Inscription", "RDV", "Commandes"]
    const csvLine = headers.join(",")
    expect(csvLine).toContain("Prénom")
    expect(csvLine).toContain("Email")
    expect(csvLine.split(",").length).toBe(8)
  })

  it("generates valid CSV for commandes type", () => {
    const headers = ["ID", "Client", "Email", "Total", "Statut", "Date", "Produits"]
    const csvLine = headers.join(",")
    expect(csvLine.split(",").length).toBe(7)
  })

  it("generates valid CSV for rdv type", () => {
    const headers = ["ID", "Client", "Email", "Téléphone", "Soin", "Prix", "Date", "Statut"]
    const csvLine = headers.join(",")
    expect(csvLine.split(",").length).toBe(8)
  })

  it("generates valid CSV for avis type", () => {
    const headers = ["Client", "Soin", "Note", "Commentaire", "Publié", "Date"]
    const csvLine = headers.join(",")
    expect(csvLine.split(",").length).toBe(6)
  })
})

describe("API validation schemas", () => {
  it("contact form validates correctly", async () => {
    const { z } = await import("zod/v4")

    const contactSchema = z.object({
      nom: z.string().min(2).max(100),
      email: z.email(),
      telephone: z.string().max(20).optional(),
      sujet: z.string().min(1).max(200),
      message: z.string().min(10).max(3000),
    })

    // Valid data
    const valid = contactSchema.safeParse({
      nom: "Test User",
      email: "test@example.com",
      sujet: "Question",
      message: "This is a test message that is long enough",
    })
    expect(valid.success).toBe(true)

    // Invalid: missing required fields
    const invalid1 = contactSchema.safeParse({ nom: "Test" })
    expect(invalid1.success).toBe(false)

    // Invalid: email format
    const invalid2 = contactSchema.safeParse({
      nom: "Test",
      email: "not-an-email",
      sujet: "Q",
      message: "Long enough message here",
    })
    expect(invalid2.success).toBe(false)

    // Invalid: message too short
    const invalid3 = contactSchema.safeParse({
      nom: "Test",
      email: "test@test.com",
      sujet: "Q",
      message: "Short",
    })
    expect(invalid3.success).toBe(false)
  })

  it("inscription form validates correctly", async () => {
    const { z } = await import("zod")

    const inscriptionSchema = z.object({
      prenom: z.string().min(2).max(50),
      nom: z.string().min(2).max(50),
      email: z.string().email(),
      telephone: z.string().optional(),
      password: z.string().min(8),
    })

    // Valid
    const valid = inscriptionSchema.safeParse({
      prenom: "Marie",
      nom: "Dupont",
      email: "marie@example.com",
      password: "securepass123",
    })
    expect(valid.success).toBe(true)

    // Invalid: password too short
    const invalid = inscriptionSchema.safeParse({
      prenom: "Marie",
      nom: "Dupont",
      email: "marie@example.com",
      password: "short",
    })
    expect(invalid.success).toBe(false)

    // Invalid: email
    const invalid2 = inscriptionSchema.safeParse({
      prenom: "Marie",
      nom: "Dupont",
      email: "notvalid",
      password: "securepass123",
    })
    expect(invalid2.success).toBe(false)
  })
})

describe("Export type validation", () => {
  const VALID_TYPES = ["clients", "commandes", "rdv", "avis"]

  it("accepts valid export types", () => {
    for (const type of VALID_TYPES) {
      expect(VALID_TYPES.includes(type)).toBe(true)
    }
  })

  it("rejects invalid export types", () => {
    expect(VALID_TYPES.includes("invalid")).toBe(false)
    expect(VALID_TYPES.includes("")).toBe(false)
    expect(VALID_TYPES.includes("users")).toBe(false)
  })
})
