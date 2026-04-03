import { describe, it, expect, beforeEach, vi } from "vitest"
import { prismaMock, mockAuth, buildJsonRequest, buildRequest } from "./setup"

const { GET, POST, DELETE } = await import("@/app/api/panier/route")

const SESSION = { user: { id: "usr_1" } }
const CART_KEY = "panier_usr_1"

const ITEM = {
  id: "prod_1",
  nom: "Huile d'argan",
  prix: 5000,
  quantite: 2,
  imageUrl: "https://example.com/img.jpg",
  stock: 10,
}

// ────────────────────────────────────────────────────────────────────────────
describe("Panier — GET /api/panier", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(SESSION)
  })

  it("returns cart items when cart exists (200)", async () => {
    prismaMock.appConfig.findUnique.mockResolvedValue({
      cle: CART_KEY,
      valeur: JSON.stringify({ items: [ITEM], updatedAt: "2026-04-03T00:00:00Z" }),
    })

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.items).toHaveLength(1)
    expect(json.items[0].id).toBe("prod_1")
    expect(json.updatedAt).toBeDefined()
  })

  it("returns empty items when no cart stored (200)", async () => {
    prismaMock.appConfig.findUnique.mockResolvedValue(null)

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.items).toHaveLength(0)
  })

  it("returns empty items for unauthenticated user without 401", async () => {
    mockAuth.mockResolvedValue(null)

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.items).toHaveLength(0)
  })

  it("handles legacy array format gracefully", async () => {
    prismaMock.appConfig.findUnique.mockResolvedValue({
      cle: CART_KEY,
      valeur: JSON.stringify([ITEM]), // old format
    })

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.items).toHaveLength(1)
  })
})

// ────────────────────────────────────────────────────────────────────────────
describe("Panier — POST /api/panier (save cart)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(SESSION)
    prismaMock.appConfig.upsert.mockResolvedValue({})
  })

  it("saves cart items successfully (200)", async () => {
    const req = buildJsonRequest("/api/panier", [ITEM])
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(prismaMock.appConfig.upsert).toHaveBeenCalledOnce()

    const upsertCall = prismaMock.appConfig.upsert.mock.calls[0][0]
    expect(upsertCall.where.cle).toBe(CART_KEY)
    const savedData = JSON.parse(upsertCall.create.valeur)
    expect(savedData.items).toHaveLength(1)
    expect(savedData.updatedAt).toBeDefined()
  })

  it("saves empty cart (clears it) (200)", async () => {
    const req = buildJsonRequest("/api/panier", [])
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
  })

  it("rejects invalid item schema (400)", async () => {
    const req = buildJsonRequest("/api/panier", [
      { id: "prod_1", nom: "Test" }, // missing required fields
    ])
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("rejects malformed JSON (400)", async () => {
    const req = new Request("http://localhost:3000/api/panier", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("rejects unauthenticated request (401)", async () => {
    mockAuth.mockResolvedValue(null)
    const req = buildJsonRequest("/api/panier", [ITEM])
    const res = await POST(req)
    expect(res.status).toBe(401)
  })
})

// ────────────────────────────────────────────────────────────────────────────
describe("Panier — DELETE /api/panier (clear cart)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(SESSION)
    prismaMock.appConfig.deleteMany.mockResolvedValue({ count: 1 })
  })

  it("clears cart successfully (200)", async () => {
    const res = await DELETE()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(prismaMock.appConfig.deleteMany).toHaveBeenCalledWith({
      where: { cle: CART_KEY },
    })
  })

  it("rejects unauthenticated request (401)", async () => {
    mockAuth.mockResolvedValue(null)
    const res = await DELETE()
    expect(res.status).toBe(401)
  })
})
