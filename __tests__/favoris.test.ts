import { describe, it, expect, beforeEach, vi } from "vitest"
import { prismaMock, mockAuth, buildJsonRequest, buildRequest } from "./setup"

const { GET, POST, DELETE } = await import("@/app/api/favoris/route")

const SESSION = { user: { id: "usr_1" } }

const SOIN = { id: "soin_1", nom: "Hammam", imageUrl: null }
const PRODUIT = { id: "prod_1", nom: "Huile d'argan", imageUrl: null }

const FAVORI_SOIN = {
  id: "fav_1",
  userId: "usr_1",
  soinId: "soin_1",
  produitId: null,
  soin: SOIN,
  produit: null,
  createdAt: new Date(),
}

const FAVORI_PRODUIT = {
  id: "fav_2",
  userId: "usr_1",
  soinId: null,
  produitId: "prod_1",
  soin: null,
  produit: PRODUIT,
  createdAt: new Date(),
}

// ────────────────────────────────────────────────────────────────────────────
describe("Favoris — GET /api/favoris", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(SESSION)
  })

  it("returns soins and produits favoris (200)", async () => {
    prismaMock.favori.findMany.mockResolvedValue([FAVORI_SOIN, FAVORI_PRODUIT])

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.soins).toHaveLength(1)
    expect(json.soins[0].nom).toBe("Hammam")
    expect(json.produits).toHaveLength(1)
    expect(json.produits[0].nom).toBe("Huile d'argan")
  })

  it("returns empty lists when no favorites (200)", async () => {
    prismaMock.favori.findMany.mockResolvedValue([])

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.soins).toHaveLength(0)
    expect(json.produits).toHaveLength(0)
  })

  it("rejects unauthenticated request (401)", async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it("handles server error in GET (500)", async () => {
    prismaMock.favori.findMany.mockRejectedValue(new Error("DB down"))
    const res = await GET()
    expect(res.status).toBe(500)
  })
})

// ────────────────────────────────────────────────────────────────────────────
describe("Favoris — POST /api/favoris", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(SESSION)
  })

  it("adds a soin to favorites (201)", async () => {
    prismaMock.favori.findFirst.mockResolvedValue(null) // not already favorited
    prismaMock.favori.create.mockResolvedValue(FAVORI_SOIN)

    const req = buildJsonRequest("/api/favoris", { soinId: "soin_1" })
    const res = await POST(req)

    expect(res.status).toBe(201)
    expect(prismaMock.favori.create).toHaveBeenCalledOnce()
  })

  it("adds a produit to favorites (201)", async () => {
    prismaMock.favori.findFirst.mockResolvedValue(null)
    prismaMock.favori.create.mockResolvedValue(FAVORI_PRODUIT)

    const req = buildJsonRequest("/api/favoris", { produitId: "prod_1" })
    const res = await POST(req)

    expect(res.status).toBe(201)
    expect(prismaMock.favori.create).toHaveBeenCalledOnce()
  })

  it("rejects duplicate favorite (400)", async () => {
    prismaMock.favori.findFirst.mockResolvedValue(FAVORI_SOIN) // already exists

    const req = buildJsonRequest("/api/favoris", { soinId: "soin_1" })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain("Déjà en favoris")
  })

  it("rejects request without soinId or produitId (400)", async () => {
    const req = buildJsonRequest("/api/favoris", {})
    const res = await POST(req)

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain("requis")
  })

  it("rejects unauthenticated request (401)", async () => {
    mockAuth.mockResolvedValue(null)
    const req = buildJsonRequest("/api/favoris", { soinId: "soin_1" })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it("handles server error in POST (500)", async () => {
    prismaMock.favori.findFirst.mockRejectedValue(new Error("DB down"))
    const req = buildJsonRequest("/api/favoris", { soinId: "soin_1" })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})

// ────────────────────────────────────────────────────────────────────────────
describe("Favoris — DELETE /api/favoris", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(SESSION)
  })

  it("deletes favorite by id (200)", async () => {
    prismaMock.favori.findUnique.mockResolvedValue(FAVORI_SOIN)
    prismaMock.favori.delete.mockResolvedValue(FAVORI_SOIN)

    const req = buildRequest("/api/favoris", {
      method: "DELETE",
      searchParams: { id: "fav_1" },
    })
    const res = await DELETE(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
  })

  it("deletes favorite by soinId (200)", async () => {
    prismaMock.favori.findFirst.mockResolvedValue(FAVORI_SOIN)
    prismaMock.favori.delete.mockResolvedValue(FAVORI_SOIN)

    const req = buildRequest("/api/favoris", {
      method: "DELETE",
      searchParams: { soinId: "soin_1" },
    })
    const res = await DELETE(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
  })

  it("returns 404 when favorite does not exist", async () => {
    prismaMock.favori.findUnique.mockResolvedValue(null)
    prismaMock.favori.findFirst.mockResolvedValue(null)

    const req = buildRequest("/api/favoris", {
      method: "DELETE",
      searchParams: { id: "nonexistent" },
    })
    const res = await DELETE(req)
    expect(res.status).toBe(404)
  })

  it("rejects deletion of another user's favorite (403)", async () => {
    prismaMock.favori.findUnique.mockResolvedValue({
      ...FAVORI_SOIN,
      userId: "other_user",
    })

    const req = buildRequest("/api/favoris", {
      method: "DELETE",
      searchParams: { id: "fav_1" },
    })
    const res = await DELETE(req)
    expect(res.status).toBe(403)
  })

  it("rejects unauthenticated request (401)", async () => {
    mockAuth.mockResolvedValue(null)
    const req = buildRequest("/api/favoris", {
      method: "DELETE",
      searchParams: { id: "fav_1" },
    })
    const res = await DELETE(req)
    expect(res.status).toBe(401)
  })

  it("deletes favorite by produitId (200)", async () => {
    prismaMock.favori.findFirst.mockResolvedValue(FAVORI_PRODUIT)
    prismaMock.favori.delete.mockResolvedValue(FAVORI_PRODUIT)

    const req = buildRequest("/api/favoris", {
      method: "DELETE",
      searchParams: { produitId: "prod_1" },
    })
    const res = await DELETE(req)
    expect(res.status).toBe(200)
  })

  it("handles server error in DELETE (500)", async () => {
    prismaMock.favori.findUnique.mockRejectedValue(new Error("DB down"))
    const req = buildRequest("/api/favoris", {
      method: "DELETE",
      searchParams: { id: "fav_1" },
    })
    const res = await DELETE(req)
    expect(res.status).toBe(500)
  })
})
