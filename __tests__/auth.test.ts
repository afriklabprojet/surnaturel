import { describe, it, expect, beforeEach, vi } from "vitest"
import { prismaMock, buildJsonRequest } from "./setup"

// Import the route handler under test
const { POST } = await import("@/app/api/auth/inscription/route")

describe("Auth — Inscription", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("creates a user with valid data (201)", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null) // no existing user
    prismaMock.user.create.mockResolvedValue({ id: "usr_1" })

    const req = buildJsonRequest("/api/auth/inscription", {
      prenom: "Awa",
      nom: "Koné",
      email: "awa@example.com",
      password: "Mon8ecure!",
    })

    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.message).toContain("Compte créé")
    expect(prismaMock.user.create).toHaveBeenCalledOnce()

    // Verify password was hashed (not stored plain)
    const createCall = prismaMock.user.create.mock.calls[0][0]
    expect(createCall.data.passwordHash).toBeDefined()
    expect(createCall.data.passwordHash).not.toBe("Mon8ecure!")
  })

  it("rejects duplicate email (409)", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "existing",
      emailVerifie: true,
      createdAt: new Date(),
    })

    const req = buildJsonRequest("/api/auth/inscription", {
      prenom: "Awa",
      nom: "Koné",
      email: "awa@example.com",
      password: "Mon8ecure!",
    })

    const res = await POST(req)
    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.error).toContain("déjà utilisée")
  })

  it("rejects invalid email format (400)", async () => {
    const req = buildJsonRequest("/api/auth/inscription", {
      prenom: "Awa",
      nom: "Koné",
      email: "not-an-email",
      password: "Mon8ecure!",
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("rejects password shorter than 8 chars (400)", async () => {
    const req = buildJsonRequest("/api/auth/inscription", {
      prenom: "Awa",
      nom: "Koné",
      email: "awa@example.com",
      password: "short",
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("rejects missing required fields (400)", async () => {
    const req = buildJsonRequest("/api/auth/inscription", {
      email: "awa@example.com",
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("rejects malformed JSON body (400)", async () => {
    const req = new Request("http://localhost:3000/api/auth/inscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain("incorrectes")
  })
})
