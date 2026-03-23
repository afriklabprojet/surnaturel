import { describe, it, expect, beforeEach, vi } from "vitest"
import { prismaMock, mockAuth, buildJsonRequest } from "./setup"

const { POST } = await import("@/app/api/boutique/commandes/route")

const fakeSession = {
  user: {
    id: "usr_buyer",
    email: "buyer@example.com",
    prenom: "Fatou",
    nom: "Diallo",
    role: "CLIENT",
  },
}

const fakeProduit = {
  id: "prod_1",
  nom: "Crème hydratante",
  prix: 5000,
  prixPromo: null as number | null,
  stock: 10,
  actif: true,
}

describe("E-commerce — Commandes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(fakeSession)
  })

  it("creates an order with valid items (201)", async () => {
    prismaMock.produit.findMany.mockResolvedValue([fakeProduit])
    prismaMock.produit.update.mockResolvedValue({})
    prismaMock.commande.create.mockResolvedValue({
      id: "cmd_1",
      total: 10000,
      lignes: [
        { produit: { nom: "Crème hydratante" }, quantite: 2, prixUnitaire: 5000 },
      ],
      user: { email: "buyer@example.com", prenom: "Fatou" },
    })

    const req = buildJsonRequest("/api/boutique/commandes", {
      items: [{ produitId: "prod_1", quantite: 2 }],
    })

    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.commandeId).toBe("cmd_1")
  })

  it("rejects order for out-of-stock product (409)", async () => {
    prismaMock.produit.findMany.mockResolvedValue([
      { ...fakeProduit, stock: 1 },
    ])

    const req = buildJsonRequest("/api/boutique/commandes", {
      items: [{ produitId: "prod_1", quantite: 5 }],
    })

    const res = await POST(req)
    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.error).toContain("Stock insuffisant")
  })

  it("rejects order for non-existent product (409)", async () => {
    prismaMock.produit.findMany.mockResolvedValue([]) // no matching product

    const req = buildJsonRequest("/api/boutique/commandes", {
      items: [{ produitId: "prod_ghost", quantite: 1 }],
    })

    const res = await POST(req)
    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.error).toContain("introuvable")
  })

  it("uses promo price when available", async () => {
    const promo = { ...fakeProduit, prixPromo: 3500 }
    prismaMock.produit.findMany.mockResolvedValue([promo])
    prismaMock.produit.update.mockResolvedValue({})
    prismaMock.commande.create.mockResolvedValue({
      id: "cmd_promo",
      total: 3500,
      lignes: [
        { produit: { nom: "Crème hydratante" }, quantite: 1, prixUnitaire: 3500 },
      ],
      user: { email: "buyer@example.com", prenom: "Fatou" },
    })

    const req = buildJsonRequest("/api/boutique/commandes", {
      items: [{ produitId: "prod_1", quantite: 1 }],
    })

    const res = await POST(req)
    expect(res.status).toBe(201)
  })

  it("rejects unauthenticated request (401)", async () => {
    mockAuth.mockResolvedValue(null)

    const req = buildJsonRequest("/api/boutique/commandes", {
      items: [{ produitId: "prod_1", quantite: 1 }],
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it("rejects empty items array (400)", async () => {
    const req = buildJsonRequest("/api/boutique/commandes", {
      items: [],
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("rejects invalid body (400)", async () => {
    const req = new Request("http://localhost:3000/api/boutique/commandes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "broken",
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
