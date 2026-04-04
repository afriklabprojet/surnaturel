import { describe, it, expect, beforeEach, vi } from "vitest"
import bcrypt from "bcryptjs"
import { NextRequest } from "next/server"
import { prismaMock, mockAuth, buildJsonRequest, buildRequest } from "./setup"

const { GET, PATCH, PUT } = await import("@/app/api/profil/route")
const { POST: requestReset, PUT: confirmReset } = await import(
  "@/app/api/auth/reset-password/route"
)

const SESSION = { user: { id: "usr_1" } }

const USER_DB = {
  id: "usr_1",
  nom: "Koné",
  prenom: "Awa",
  email: "awa@example.com",
  telephone: "+2250700000000",
  photoUrl: null,
  createdAt: new Date(),
}

// ────────────────────────────────────────────────────────────────────────────
describe("Profil — GET /api/profil", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(SESSION)
  })

  it("returns user profile for authenticated user (200)", async () => {
    prismaMock.user.findUnique.mockResolvedValue(USER_DB)
    const res = await GET()
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.email).toBe("awa@example.com")
    expect(json.id).toBe("usr_1")
  })

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it("returns 404 when user deleted from DB", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(404)
  })
})

// ────────────────────────────────────────────────────────────────────────────
describe("Profil — PATCH /api/profil", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(SESSION)
  })

  it("updates profile fields successfully (200)", async () => {
    prismaMock.user.update.mockResolvedValue({ ...USER_DB, nom: "Coulibaly" })
    const req = buildJsonRequest("/api/profil", { nom: "Coulibaly" }, "PATCH")
    const res = await PATCH(req)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.user.nom).toBe("Coulibaly")
  })

  it("updates all conditional fields (nom, prenom, telephone, photoUrl)", async () => {
    prismaMock.user.update.mockResolvedValue({
      ...USER_DB,
      nom: "Coulibaly",
      prenom: "Fatoumata",
      telephone: "+2250700111222",
      photoUrl: "https://example.com/photo.jpg",
    })
    const req = buildJsonRequest("/api/profil", {
      nom: "Coulibaly",
      prenom: "Fatoumata",
      telephone: "+2250700111222",
      photoUrl: "https://example.com/photo.jpg",
    }, "PATCH")
    const res = await PATCH(req)
    const json = await res.json()
    expect(res.status).toBe(200)
    const updateCall = prismaMock.user.update.mock.calls[0][0]
    expect(updateCall.data.nom).toBe("Coulibaly")
    expect(updateCall.data.prenom).toBe("Fatoumata")
    expect(updateCall.data.telephone).toBe("+2250700111222")
    expect(updateCall.data.photoUrl).toBe("https://example.com/photo.jpg")
  })

  it("rejects invalid photoUrl (400)", async () => {
    const req = buildJsonRequest(
      "/api/profil",
      { photoUrl: "not-a-url" },
      "PATCH"
    )
    const res = await PATCH(req)
    expect(res.status).toBe(400)
  })

  it("rejects malformed JSON (400)", async () => {
    const req = new NextRequest("http://localhost:3000/api/profil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: "bad json",
    })
    const res = await PATCH(req)
    expect(res.status).toBe(400)
  })

  it("rejects unauthenticated request (401)", async () => {
    mockAuth.mockResolvedValue(null)
    const req = buildJsonRequest("/api/profil", { nom: "Test" }, "PATCH")
    const res = await PATCH(req)
    expect(res.status).toBe(401)
  })
})

// ────────────────────────────────────────────────────────────────────────────
describe("Profil — PUT /api/profil (change password)", () => {
  const PLAIN_PW = "OldPass123!"
  let hashedPw: string

  beforeEach(async () => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(SESSION)
    hashedPw = await bcrypt.hash(PLAIN_PW, 10)
  })

  it("changes password successfully (200)", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ passwordHash: hashedPw })
    prismaMock.user.update.mockResolvedValue({})

    const req = buildJsonRequest("/api/profil", {
      motDePasseActuel: PLAIN_PW,
      nouveauMotDePasse: "NewPass456!",
      confirmation: "NewPass456!",
    }, "PUT")

    const res = await PUT(req)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.success).toBe(true)

    // Verify password is re-hashed
    const updateCall = prismaMock.user.update.mock.calls[0][0]
    expect(updateCall.data.passwordHash).toBeDefined()
    expect(updateCall.data.passwordHash).not.toBe("NewPass456!")
  })

  it("rejects incorrect current password (400)", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ passwordHash: hashedPw })

    const req = buildJsonRequest("/api/profil", {
      motDePasseActuel: "WrongPassword!",
      nouveauMotDePasse: "NewPass456!",
      confirmation: "NewPass456!",
    }, "PUT")

    const res = await PUT(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain("incorrect")
  })

  it("rejects mismatched confirmation (400)", async () => {
    const req = buildJsonRequest("/api/profil", {
      motDePasseActuel: PLAIN_PW,
      nouveauMotDePasse: "NewPass456!",
      confirmation: "DifferentPass!",
    }, "PUT")

    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  it("rejects new password shorter than 8 chars (400)", async () => {
    const req = buildJsonRequest("/api/profil", {
      motDePasseActuel: PLAIN_PW,
      nouveauMotDePasse: "short",
      confirmation: "short",
    }, "PUT")

    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  it("rejects unauthenticated request (401)", async () => {
    mockAuth.mockResolvedValue(null)
    const req = buildJsonRequest("/api/profil", {
      motDePasseActuel: PLAIN_PW,
      nouveauMotDePasse: "NewPass456!",
      confirmation: "NewPass456!",
    }, "PUT")
    const res = await PUT(req)
    expect(res.status).toBe(401)
  })

  it("rejects PUT with malformed JSON (400)", async () => {
    const req = new NextRequest("http://localhost:3000/api/profil", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: "bad json",
    })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  it("returns 404 when user not found in PUT", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)

    const req = buildJsonRequest("/api/profil", {
      motDePasseActuel: PLAIN_PW,
      nouveauMotDePasse: "NewPass456!",
      confirmation: "NewPass456!",
    }, "PUT")
    const res = await PUT(req)
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toContain("introuvable")
  })

  it("rejects when user has no passwordHash (OAuth user)", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ passwordHash: null })

    const req = buildJsonRequest("/api/profil", {
      motDePasseActuel: "SomePass123!",
      nouveauMotDePasse: "NewPass456!",
      confirmation: "NewPass456!",
    }, "PUT")
    const res = await PUT(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain("incorrect")
  })
})

// ────────────────────────────────────────────────────────────────────────────
describe("Auth — Reset password POST (request)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("sends reset link when email exists (200)", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "usr_1",
      email: "awa@example.com",
      prenom: "Awa",
    })
    prismaMock.user.update.mockResolvedValue({})

    const req = buildJsonRequest("/api/auth/reset-password", {
      email: "awa@example.com",
    })
    const res = await requestReset(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.message).toContain("lien de réinitialisation")
    expect(prismaMock.user.update).toHaveBeenCalledOnce()
    const updateCall = prismaMock.user.update.mock.calls[0][0]
    expect(updateCall.data.resetToken).toBeDefined()
  })

  it("returns 200 even when email does not exist (no disclosure)", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)

    const req = buildJsonRequest("/api/auth/reset-password", {
      email: "unknown@example.com",
    })
    const res = await requestReset(req)
    expect(res.status).toBe(200)
    expect(prismaMock.user.update).not.toHaveBeenCalled()
  })

  it("rejects invalid email format (400)", async () => {
    const req = buildJsonRequest("/api/auth/reset-password", {
      email: "not-an-email",
    })
    const res = await requestReset(req)
    expect(res.status).toBe(400)
  })
})

// ────────────────────────────────────────────────────────────────────────────
describe("Auth — Reset password PUT (confirm)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("resets password with valid token (200)", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "usr_1",
      resetToken: "valid_token",
      resetTokenExpiry: new Date(Date.now() + 30 * 60 * 1000), // 30 min in future
    })
    prismaMock.user.update.mockResolvedValue({})

    const req = buildJsonRequest(
      "/api/auth/reset-password",
      {
        token: "valid_token",
        motDePasse: "NewSecure123!",
        confirmation: "NewSecure123!",
      },
      "PUT"
    )
    const res = await confirmReset(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.message).toContain("réinitialisé")
    const updateCall = prismaMock.user.update.mock.calls[0][0]
    expect(updateCall.data.passwordHash).toBeDefined()
    expect(updateCall.data.resetToken).toBeNull()
  })

  it("rejects expired token (400)", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "usr_1",
      resetToken: "old_token",
      resetTokenExpiry: new Date(Date.now() - 1000), // expired
    })

    const req = buildJsonRequest(
      "/api/auth/reset-password",
      {
        token: "old_token",
        motDePasse: "NewSecure123!",
        confirmation: "NewSecure123!",
      },
      "PUT"
    )
    const res = await confirmReset(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain("expiré")
  })

  it("rejects unknown token (400)", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)

    const req = buildJsonRequest(
      "/api/auth/reset-password",
      {
        token: "nonexistent",
        motDePasse: "NewSecure123!",
        confirmation: "NewSecure123!",
      },
      "PUT"
    )
    const res = await confirmReset(req)
    expect(res.status).toBe(400)
  })

  it("rejects mismatched password confirmation (400)", async () => {
    const req = buildJsonRequest(
      "/api/auth/reset-password",
      {
        token: "some_token",
        motDePasse: "NewSecure123!",
        confirmation: "Different456!",
      },
      "PUT"
    )
    const res = await confirmReset(req)
    expect(res.status).toBe(400)
  })

  it("handles server error in PUT confirm (500)", async () => {
    prismaMock.user.findUnique.mockRejectedValue(new Error("DB down"))

    const req = buildJsonRequest(
      "/api/auth/reset-password",
      {
        token: "valid_token",
        motDePasse: "NewSecure123!",
        confirmation: "NewSecure123!",
      },
      "PUT"
    )
    const res = await confirmReset(req)
    expect(res.status).toBe(500)
  })
})

describe("Auth — Reset password POST server error", () => {
  it("handles server error in POST request (500)", async () => {
    prismaMock.user.findUnique.mockRejectedValue(new Error("DB down"))

    const req = buildJsonRequest("/api/auth/reset-password", {
      email: "test@example.com",
    })
    const res = await requestReset(req)
    expect(res.status).toBe(500)
  })
})
