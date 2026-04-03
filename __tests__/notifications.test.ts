import { describe, it, expect, beforeEach, vi } from "vitest"
import { prismaMock, mockAuth, buildRequest, buildJsonRequest } from "./setup"

const { GET } = await import("@/app/api/notifications/route")
const { PATCH: markAllRead } = await import("@/app/api/notifications/toutes-lues/route")
const { GET: getCount } = await import("@/app/api/notifications/count/route")

const SESSION = { user: { id: "usr_1" } }

const NOTIF_1 = { id: "notif_1", userId: "usr_1", titre: "RDV confirmé", lu: false, createdAt: new Date() }
const NOTIF_2 = { id: "notif_2", userId: "usr_1", titre: "Commande payée", lu: true, createdAt: new Date() }

describe("Notifications — GET /api/notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(SESSION)
    prismaMock.notification.findMany.mockResolvedValue([NOTIF_1, NOTIF_2])
    prismaMock.notification.count
      .mockResolvedValueOnce(2)   // total
      .mockResolvedValueOnce(1)   // non lues
  })

  it("returns paginated notifications for authenticated user (200)", async () => {
    const req = buildRequest("/api/notifications")
    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.notifications).toHaveLength(2)
    expect(json.total).toBe(2)
    expect(json.totalNonLues).toBe(1)
    expect(json.page).toBe(1)
    expect(json.pages).toBe(1)
  })

  it("filters non-read notifications when nonLues=true", async () => {
    prismaMock.notification.findMany.mockResolvedValue([NOTIF_1])
    prismaMock.notification.count
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)

    const req = buildRequest("/api/notifications", {
      searchParams: { nonLues: "true" },
    })
    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.notifications).toHaveLength(1)
    // Verify where clause included lu:false
    const findManyCall = prismaMock.notification.findMany.mock.calls[0][0]
    expect(findManyCall.where).toMatchObject({ lu: false })
  })

  it("respects custom page and limit params", async () => {
    prismaMock.notification.count.mockReset()
    prismaMock.notification.count
      .mockResolvedValueOnce(50)   // total
      .mockResolvedValueOnce(10)   // non lues

    const req = buildRequest("/api/notifications", {
      searchParams: { page: "2", limit: "10" },
    })
    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.page).toBe(2)
    expect(json.pages).toBe(5) // ceil(50/10)
    const findManyCall = prismaMock.notification.findMany.mock.calls[0][0]
    expect(findManyCall.skip).toBe(10) // (page-1)*limit
    expect(findManyCall.take).toBe(10)
  })

  it("rejects unauthenticated request (401)", async () => {
    mockAuth.mockResolvedValue(null)
    const req = buildRequest("/api/notifications")
    const res = await GET(req)
    expect(res.status).toBe(401)
  })
})

describe("Notifications — PATCH /api/notifications/toutes-lues", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(SESSION)
    prismaMock.notification.updateMany.mockResolvedValue({ count: 3 })
  })

  it("marks all notifications as read (200)", async () => {
    const res = await markAllRead()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: "usr_1", lu: false },
      data: { lu: true },
    })
  })

  it("rejects unauthenticated request (401)", async () => {
    mockAuth.mockResolvedValue(null)
    const res = await markAllRead()
    expect(res.status).toBe(401)
  })
})

describe("Notifications — GET /api/notifications/count", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns unread count for authenticated user", async () => {
    mockAuth.mockResolvedValue(SESSION)
    prismaMock.notification.count.mockReset()
    prismaMock.notification.count.mockResolvedValue(5)
    const res = await getCount()
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.count).toBe(5)
  })

  it("returns 0 for unauthenticated user (no 401)", async () => {
    mockAuth.mockResolvedValue(null)
    const res = await getCount()
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.count).toBe(0)
  })
})
