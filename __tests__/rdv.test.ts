import { describe, it, expect, beforeEach, vi } from "vitest"
import { NextRequest } from "next/server"
import { prismaMock, mockAuth, buildJsonRequest } from "./setup"

const rdvModule = await import("@/app/api/rdv/route")
const dispoModule = await import("@/app/api/rdv/disponibilites/route")

const fakeSession = {
  user: {
    id: "usr_client",
    email: "client@example.com",
    prenom: "Aminata",
    nom: "Traoré",
    role: "CLIENT",
  },
}

const fakeSoin = {
  id: "soin_1",
  nom: "Massage relaxant",
  prix: 15000,
  slug: "massage-relaxant",
}

describe("RDV — Prise de rendez-vous", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(fakeSession)
  })

  it("books a free slot (201)", async () => {
    prismaMock.soin.findUnique.mockResolvedValue(fakeSoin)
    prismaMock.rendezVous.findUnique.mockResolvedValue(null) // slot free
    prismaMock.rendezVous.create.mockResolvedValue({
      id: "rdv_1",
      soin: fakeSoin,
    })

    const dateHeure = new Date(Date.now() + 86400_000).toISOString()
    const req = buildJsonRequest("/api/rdv", {
      soinId: "soin_1",
      dateHeure,
    })

    const res = await rdvModule.POST(req)
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.rdvId).toBe("rdv_1")
    expect(json.message).toContain("succès")
  })

  it("rejects booking on an already-taken slot (409)", async () => {
    prismaMock.soin.findUnique.mockResolvedValue(fakeSoin)
    prismaMock.rendezVous.findUnique.mockResolvedValue({ id: "rdv_existing" }) // slot taken

    const dateHeure = new Date(Date.now() + 86400_000).toISOString()
    const req = buildJsonRequest("/api/rdv", {
      soinId: "soin_1",
      dateHeure,
    })

    const res = await rdvModule.POST(req)
    const json = await res.json()

    expect(res.status).toBe(409)
    expect(json.error).toContain("réservé")
  })

  it("rejects booking for unknown soin (404)", async () => {
    prismaMock.soin.findUnique.mockResolvedValue(null)

    const req = buildJsonRequest("/api/rdv", {
      soinId: "soin_ghost",
      dateHeure: new Date().toISOString(),
    })

    const res = await rdvModule.POST(req)
    expect(res.status).toBe(404)
  })

  it("rejects unauthenticated booking (401)", async () => {
    mockAuth.mockResolvedValue(null)
    prismaMock.soin.findUnique.mockResolvedValue(fakeSoin)
    prismaMock.rendezVous.findFirst.mockResolvedValue(null)

    const req = buildJsonRequest("/api/rdv", {
      soinId: "soin_1",
      dateHeure: new Date().toISOString(),
    })

    const res = await rdvModule.POST(req)
    expect(res.status).toBe(401)
  })

  it("rejects invalid body (400)", async () => {
    const req = buildJsonRequest("/api/rdv", {})

    const res = await rdvModule.POST(req)
    expect(res.status).toBe(400)
  })
})

describe("RDV — Disponibilités", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns booked hours for a date", async () => {
    const h10 = new Date("2025-09-15T10:30:00.000Z")
    const h14 = new Date("2025-09-15T14:00:00.000Z")
    prismaMock.rendezVous.findMany.mockResolvedValue([
      { dateHeure: h10 },
      { dateHeure: h14 },
    ])

    const req = new NextRequest(
      "http://localhost:3000/api/rdv/disponibilites?soinId=soin_1&date=2025-09-15"
    )

    const res = await dispoModule.GET(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.heuresReservees).toEqual([10, 14])
  })

  it("requires soinId and date params (400)", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/rdv/disponibilites"
    )

    const res = await dispoModule.GET(req)
    expect(res.status).toBe(400)
  })

  it("rejects invalid date format (400)", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/rdv/disponibilites?soinId=soin_1&date=not-a-date"
    )

    const res = await dispoModule.GET(req)
    expect(res.status).toBe(400)
  })
})
