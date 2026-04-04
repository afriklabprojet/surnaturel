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

  it("rejects malformed JSON (400)", async () => {
    const req = new Request("http://localhost:3000/api/boutique/promo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "bad json",
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("rejects code not yet valid (debutValidite in future)", async () => {
    prismaMock.codePromo.findUnique.mockResolvedValue({
      ...fakeCodePromo,
      debutValidite: new Date(Date.now() + 86400_000 * 30),
    })
    const req = buildJsonRequest("/api/boutique/promo", { code: "BIENVENUE20" })
    const res = await POST(req)
    const json = await res.json()
    expect(json.valide).toBe(false)
    expect(json.error).toContain("pas encore valide")
  })

  it("rejects premiereCommande code when user has orders", async () => {
    prismaMock.codePromo.findUnique.mockResolvedValue({
      ...fakeCodePromo,
      premiereCommande: true,
      utilisations: [],
    })
    prismaMock.commande.findFirst.mockResolvedValue({ id: "cmd_existing" })

    const req = buildJsonRequest("/api/boutique/promo", { code: "BIENVENUE20" })
    const res = await POST(req)
    const json = await res.json()
    expect(json.valide).toBe(false)
    expect(json.error).toContain("première commande")
  })

  it("rejects nouveauxClients code for old accounts (>30 days)", async () => {
    prismaMock.codePromo.findUnique.mockResolvedValue({
      ...fakeCodePromo,
      nouveauxClients: true,
      utilisations: [],
    })
    prismaMock.user.findUnique.mockResolvedValue({
      createdAt: new Date(Date.now() - 86400_000 * 60), // 60 days ago
    })

    const req = buildJsonRequest("/api/boutique/promo", { code: "BIENVENUE20" })
    const res = await POST(req)
    const json = await res.json()
    expect(json.valide).toBe(false)
    expect(json.error).toContain("nouveaux clients")
  })

  it("requires login for premiereCommande code when not authenticated", async () => {
    mockAuth.mockResolvedValue(null)
    prismaMock.codePromo.findUnique.mockResolvedValue({
      ...fakeCodePromo,
      premiereCommande: true,
      utilisations: false,
    })

    const req = buildJsonRequest("/api/boutique/promo", { code: "BIENVENUE20" })
    const res = await POST(req)
    const json = await res.json()
    expect(json.valide).toBe(false)
    expect(json.error).toContain("Connectez-vous")
  })

  it("rejects code with wrong product categories", async () => {
    prismaMock.codePromo.findUnique.mockResolvedValue({
      ...fakeCodePromo,
      categoriesProduits: ["SOINS"],
      utilisations: [],
    })
    prismaMock.produit.findMany.mockResolvedValue([
      { id: "prod_1", categorie: "HUILES" },
    ])

    const req = buildJsonRequest("/api/boutique/promo", {
      code: "BIENVENUE20",
      produitIds: ["prod_1"],
    })
    const res = await POST(req)
    const json = await res.json()
    expect(json.valide).toBe(false)
    expect(json.error).toContain("pas valide pour ces produits")
  })

  it("rejects code when all products are excluded", async () => {
    prismaMock.codePromo.findUnique.mockResolvedValue({
      ...fakeCodePromo,
      produitsExclus: ["prod_1"],
      utilisations: [],
    })

    const req = buildJsonRequest("/api/boutique/promo", {
      code: "BIENVENUE20",
      produitIds: ["prod_1"],
    })
    const res = await POST(req)
    const json = await res.json()
    expect(json.valide).toBe(false)
    expect(json.error).toContain("pas valide pour ces produits")
  })

  it("validates MONTANT_FIXE type code", async () => {
    prismaMock.codePromo.findUnique.mockResolvedValue({
      ...fakeCodePromo,
      type: "MONTANT_FIXE",
      valeur: 5000,
      pourcentage: null,
      utilisations: [],
    })

    const req = buildJsonRequest("/api/boutique/promo", {
      code: "BIENVENUE20",
      montantPanier: 30000,
    })
    const res = await POST(req)
    const json = await res.json()
    expect(json.valide).toBe(true)
    expect(json.montantFixe).toBe(5000)
    expect(json.reduction).toBe(5000)
  })

  it("caps percentage reduction at montantMax", async () => {
    prismaMock.codePromo.findUnique.mockResolvedValue({
      ...fakeCodePromo,
      montantMax: 3000,
      utilisations: [],
    })

    const req = buildJsonRequest("/api/boutique/promo", {
      code: "BIENVENUE20",
      montantPanier: 50000,
    })
    const res = await POST(req)
    const json = await res.json()
    expect(json.valide).toBe(true)
    expect(json.reduction).toBe(3000) // capped at montantMax
  })

  it("falls back to AppConfig bandeau_promo when codePromo not found", async () => {
    prismaMock.codePromo.findUnique.mockResolvedValue(null)
    prismaMock.appConfig.findUnique.mockResolvedValue({
      cle: "bandeau_promo",
      valeur: JSON.stringify({
        actif: true,
        code: "WELCOME",
        texte: "−15% sur votre 1er soin",
        detail: "Bienvenue !",
      }),
    })

    const req = buildJsonRequest("/api/boutique/promo", { code: "WELCOME" })
    const res = await POST(req)
    const json = await res.json()
    expect(json.valide).toBe(true)
    expect(json.pourcentage).toBe(15)
  })

  it("returns invalid for unknown code with no AppConfig fallback", async () => {
    prismaMock.codePromo.findUnique.mockResolvedValue(null)
    prismaMock.appConfig.findUnique.mockResolvedValue(null)

    const req = buildJsonRequest("/api/boutique/promo", { code: "UNKNOWN" })
    const res = await POST(req)
    const json = await res.json()
    expect(json.valide).toBe(false)
    expect(json.error).toContain("invalide")
  })

  it("returns invalid for wrong AppConfig code", async () => {
    prismaMock.codePromo.findUnique.mockResolvedValue(null)
    prismaMock.appConfig.findUnique.mockResolvedValue({
      cle: "bandeau_promo",
      valeur: JSON.stringify({
        actif: true,
        code: "REALCODE",
        texte: "−10%",
        detail: "Promo",
      }),
    })

    const req = buildJsonRequest("/api/boutique/promo", { code: "WRONGCODE" })
    const res = await POST(req)
    const json = await res.json()
    expect(json.valide).toBe(false)
  })

  it("handles server error gracefully (500)", async () => {
    prismaMock.codePromo.findUnique.mockRejectedValue(new Error("DB down"))

    const req = buildJsonRequest("/api/boutique/promo", { code: "BIENVENUE20" })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
