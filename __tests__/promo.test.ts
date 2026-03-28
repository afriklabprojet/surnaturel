import { describe, it, expect, beforeEach, vi } from "vitest"
import { prismaMock, mockAuth, buildJsonRequest } from "./setup"

const { POST } = await import("@/app/api/boutique/promo/route")

const fakeSession = {
  user: {
    id: "usr_promo",
    email: "promo@example.com",
    prenom: "Fatou",
    nom: "Diallo",
    role: "CLIENT",
  },
}

const fakeCodePromo = {
  id: "cp_1",
  code: "BIENVENUE20",
  type: "POURCENTAGE",
  valeur: 20,
  actif: true,
  debutValidite: new Date(Date.now() - 86400_000), // yesterday
  finValidite: new Date(Date.now() + 86400_000 * 30), // +30 days
  usageMax: 100,
  usageActuel: 5,
  usageParUser: 1,
  montantMin: null as number | null,
  montantMax: null as number | null,
  premiereCommande: false,
  nouveauxClients: false,
  utilisations: [] as unknown[],
  categoriesProduits: [] as string[],
  produitsExclus: [] as string[],
  pourcentage: 20,
  description: null as string | null,
  cumulable: false,
}

describe("Promo codes — Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(fakeSession)
  })

  it("validates a valid promo code", async () => {
    prismaMock.codePromo.findUnique.mockResolvedValue(fakeCodePromo)

    const req = buildJsonRequest("/api/boutique/promo", {
      code: "BIENVENUE20",
      montantPanier: 50000,
    })

    const res = await POST(req)
    const json = await res.json()

    expect(json.valide).toBe(true)
    expect(json.code).toBe("BIENVENUE20")
    expect(json.type).toBe("POURCENTAGE")
    expect(json.reduction).toBe(10000) // 20% of 50000
  })

  it("rejects expired promo code", async () => {
    prismaMock.codePromo.findUnique.mockResolvedValue({
      ...fakeCodePromo,
      finValidite: new Date(Date.now() - 86400_000), // expired yesterday
    })

    const req = buildJsonRequest("/api/boutique/promo", {
      code: "BIENVENUE20",
    })

    const res = await POST(req)
    const json = await res.json()

    expect(json.valide).toBe(false)
    expect(json.error).toContain("expiré")
  })

  it("rejects inactive promo code", async () => {
    prismaMock.codePromo.findUnique.mockResolvedValue({
      ...fakeCodePromo,
      actif: false,
    })

    const req = buildJsonRequest("/api/boutique/promo", {
      code: "BIENVENUE20",
    })

    const res = await POST(req)
    const json = await res.json()

    expect(json.valide).toBe(false)
    expect(json.error).toContain("plus actif")
  })

  it("rejects code that exceeded max usage", async () => {
    prismaMock.codePromo.findUnique.mockResolvedValue({
      ...fakeCodePromo,
      usageMax: 5,
      usageActuel: 5,
    })

    const req = buildJsonRequest("/api/boutique/promo", {
      code: "BIENVENUE20",
    })

    const res = await POST(req)
    const json = await res.json()

    expect(json.valide).toBe(false)
    expect(json.error).toContain("limite")
  })

  it("rejects already-used code per user", async () => {
    prismaMock.codePromo.findUnique.mockResolvedValue({
      ...fakeCodePromo,
      usageParUser: 1,
      utilisations: [{ id: "util_1", userId: "usr_promo" }],
    })

    const req = buildJsonRequest("/api/boutique/promo", {
      code: "BIENVENUE20",
    })

    const res = await POST(req)
    const json = await res.json()

    expect(json.valide).toBe(false)
    expect(json.error).toContain("déjà utilisé")
  })

  it("rejects code below minimum cart amount", async () => {
    prismaMock.codePromo.findUnique.mockResolvedValue({
      ...fakeCodePromo,
      montantMin: 50000,
    })

    const req = buildJsonRequest("/api/boutique/promo", {
      code: "BIENVENUE20",
      montantPanier: 10000,
    })

    const res = await POST(req)
    const json = await res.json()

    expect(json.valide).toBe(false)
    expect(json.error).toContain("minimum")
  })

  it("rejects empty code (400)", async () => {
    const req = buildJsonRequest("/api/boutique/promo", {
      code: "",
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
