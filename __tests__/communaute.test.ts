import { describe, it, expect, beforeEach, vi } from "vitest"
import { prismaMock, mockAuth, buildJsonRequest } from "./setup"

const postsModule = await import("@/app/api/communaute/posts/route")
const messagesModule = await import("@/app/api/messages/route")

const fakeSession = {
  user: {
    id: "usr_alice",
    email: "alice@example.com",
    prenom: "Alice",
    nom: "Yao",
    role: "CLIENT",
  },
}

describe("Communauté — Posts", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(fakeSession)
  })

  it("creates a text post (201)", async () => {
    prismaMock.post.create.mockResolvedValue({
      id: "post_1",
      contenu: "Bonjour la communauté ! #bienvenue",
      auteurId: "usr_alice",
      hashtags: ["#bienvenue"],
      auteur: {
        id: "usr_alice",
        nom: "Yao",
        prenom: "Alice",
        pseudo: null,
        photoUrl: null,
        statutProfil: "PUBLIC",
        verificationStatus: null,
      },
      commentaires: [],
      _count: { commentaires: 0, reactions: 0, partages: 0 },
      partageDe: null,
    })
    // Mock for user lookup during mentions processing
    prismaMock.user.findMany.mockResolvedValue([])
    prismaMock.user.findUnique.mockResolvedValue(null)

    const req = buildJsonRequest("/api/communaute/posts", {
      contenu: "Bonjour la communauté ! #bienvenue",
    })

    const res = await postsModule.POST(req as never)
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.contenu).toBe("Bonjour la communauté ! #bienvenue")
  })

  it("fetches feed with pagination (200)", async () => {
    prismaMock.blocage.findMany.mockResolvedValue([])
    prismaMock.post.findMany.mockResolvedValue([
      {
        id: "post_1",
        contenu: "Hello",
        auteur: { id: "usr_alice", nom: "Yao", prenom: "Alice" },
        reactions: [],
        sauvegardes: [],
        _count: { commentaires: 0, reactions: 0, partages: 0 },
        partageDe: null,
        commentaires: [],
      },
    ])
    prismaMock.post.count.mockResolvedValue(1)

    const req = new Request("http://localhost:3000/api/communaute/posts?page=1&limit=10")

    const res = await postsModule.GET(req as never)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.posts).toHaveLength(1)
    expect(json.total).toBe(1)
  })

  it("rejects post creation without auth (401)", async () => {
    mockAuth.mockResolvedValue(null)

    const req = buildJsonRequest("/api/communaute/posts", {
      contenu: "Hello",
    })

    const res = await postsModule.POST(req as never)
    expect(res.status).toBe(401)
  })

  it("rejects empty content (400)", async () => {
    const req = buildJsonRequest("/api/communaute/posts", {
      contenu: "",
    })

    const res = await postsModule.POST(req as never)
    expect(res.status).toBe(400)
  })

  it("rejects post in group user is not member of (403)", async () => {
    prismaMock.membreGroupe.findUnique.mockResolvedValue(null) // not a member

    const req = buildJsonRequest("/api/communaute/posts", {
      contenu: "Group post",
      groupeId: "grp_private",
    })

    const res = await postsModule.POST(req as never)
    expect(res.status).toBe(403)
  })
})

describe("Communauté — Messages privés", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(fakeSession)
  })

  it("sends a private message (201)", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "usr_bob" })
    prismaMock.message.create.mockResolvedValue({
      id: "msg_1",
      contenu: "Salut Bob !",
      expediteur: {
        id: "usr_alice",
        nom: "Yao",
        prenom: "Alice",
        photoUrl: null,
      },
      replyTo: null,
    })
    // For notification preference check
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: "usr_bob" })
      .mockResolvedValueOnce({ notifMessages: true })

    const req = buildJsonRequest("/api/messages", {
      destinataireId: "usr_bob",
      contenu: "Salut Bob !",
    })

    const res = await messagesModule.POST(req as never)
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.message.contenu).toBe("Salut Bob !")
  })

  it("cannot send message to self (400)", async () => {
    const req = buildJsonRequest("/api/messages", {
      destinataireId: "usr_alice", // same as session
      contenu: "Hello me",
    })

    // findUnique returns user exists
    prismaMock.user.findUnique.mockResolvedValue({ id: "usr_alice" })

    const res = await messagesModule.POST(req as never)
    expect(res.status).toBe(400)
  })

  it("rejects message to non-existent user (404)", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)

    const req = buildJsonRequest("/api/messages", {
      destinataireId: "usr_ghost",
      contenu: "Hello?",
    })

    const res = await messagesModule.POST(req as never)
    expect(res.status).toBe(404)
  })

  it("rejects unauthenticated access (401)", async () => {
    mockAuth.mockResolvedValue(null)

    const req = buildJsonRequest("/api/messages", {
      destinataireId: "usr_bob",
      contenu: "test",
    })

    const res = await messagesModule.POST(req as never)
    expect(res.status).toBe(401)
  })
})
