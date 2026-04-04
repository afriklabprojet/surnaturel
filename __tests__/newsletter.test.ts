import { describe, it, expect, beforeEach, vi } from "vitest"
import { prismaMock, mockAuth, buildJsonRequest } from "./setup"

const { POST } = await import("@/app/api/newsletter/subscribe/route")

// ────────────────────────────────────────────────────────────────────────────
describe("Newsletter — POST /api/newsletter/subscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("subscribes a new visitor (200)", async () => {
    prismaMock.abonneNewsletter.findUnique.mockResolvedValue(null)
    prismaMock.user.findUnique.mockResolvedValue(null)
    prismaMock.abonneNewsletter.create.mockResolvedValue({ id: "sub_1" })

    const req = buildJsonRequest(
      "/api/newsletter/subscribe",
      { email: "visiteur@example.com" }
    )
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.message).toContain("Merci")
    expect(prismaMock.abonneNewsletter.create).toHaveBeenCalledOnce()
  })

  it("returns friendly message when already subscribed and active (200)", async () => {
    prismaMock.abonneNewsletter.findUnique.mockResolvedValue({
      email: "test@example.com",
      actif: true,
    })

    const req = buildJsonRequest(
      "/api/newsletter/subscribe",
      { email: "test@example.com" }
    )
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.message).toContain("déjà inscrit")
    expect(prismaMock.abonneNewsletter.create).not.toHaveBeenCalled()
  })

  it("reactivates unsubscribed email (200)", async () => {
    prismaMock.abonneNewsletter.findUnique.mockResolvedValue({
      email: "test@example.com",
      actif: false,
    })
    prismaMock.abonneNewsletter.update.mockResolvedValue({ actif: true })

    const req = buildJsonRequest(
      "/api/newsletter/subscribe",
      { email: "test@example.com" }
    )
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.message).toContain("réinscrit")
    expect(prismaMock.abonneNewsletter.update).toHaveBeenCalledOnce()
  })

  it("activates newsletter on existing user account (200)", async () => {
    prismaMock.abonneNewsletter.findUnique.mockResolvedValue(null)
    prismaMock.user.findUnique.mockResolvedValue({
      email: "user@example.com",
      notifNewsletter: false,
    })
    prismaMock.user.update.mockResolvedValue({})

    const req = buildJsonRequest(
      "/api/newsletter/subscribe",
      { email: "user@example.com" }
    )
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.message).toContain("compte")
    expect(prismaMock.user.update).toHaveBeenCalledOnce()
  })

  it("does not call update when user already has newsletter active (200)", async () => {
    prismaMock.abonneNewsletter.findUnique.mockResolvedValue(null)
    prismaMock.user.findUnique.mockResolvedValue({
      email: "user@example.com",
      notifNewsletter: true,
    })

    const req = buildJsonRequest(
      "/api/newsletter/subscribe",
      { email: "user@example.com" }
    )
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(prismaMock.user.update).not.toHaveBeenCalled()
    expect(json.message).toContain("compte")
  })

  it("rejects missing email (400)", async () => {
    const req = buildJsonRequest("/api/newsletter/subscribe", {})
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain("Email requis")
  })

  it("rejects invalid email format (400)", async () => {
    const req = buildJsonRequest(
      "/api/newsletter/subscribe",
      { email: "not-valid" }
    )
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain("invalide")
  })

  it("normalises email to lowercase before storing", async () => {
    prismaMock.abonneNewsletter.findUnique.mockResolvedValue(null)
    prismaMock.user.findUnique.mockResolvedValue(null)
    prismaMock.abonneNewsletter.create.mockResolvedValue({ id: "sub_2" })

    const req = buildJsonRequest(
      "/api/newsletter/subscribe",
      { email: "UPPER@EXAMPLE.COM" }
    )
    await POST(req)

    const createCall = prismaMock.abonneNewsletter.create.mock.calls[0][0]
    expect(createCall.data.email).toBe("upper@example.com")
  })

  it("handles server error (500)", async () => {
    prismaMock.abonneNewsletter.findUnique.mockRejectedValue(new Error("DB down"))

    const req = buildJsonRequest(
      "/api/newsletter/subscribe",
      { email: "test@example.com" }
    )
    const res = await POST(req)
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toContain("erreur")
  })
})
