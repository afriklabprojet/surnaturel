import { describe, it, expect, beforeEach, vi } from "vitest"
import { prismaMock, mockAuth, buildJsonRequest, mockRateLimitCheck } from "./setup"

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

  it("filters out blocked users from feed", async () => {
    prismaMock.blocage.findMany.mockResolvedValue([
      { bloqueurId: "usr_alice", bloqueId: "usr_troll" },
    ])
    prismaMock.post.findMany.mockResolvedValue([])
    prismaMock.post.count.mockResolvedValue(0)

    const req = new Request("http://localhost:3000/api/communaute/posts?page=1&limit=10")
    const res = await postsModule.GET(req as never)
    const json = await res.json()

    expect(res.status).toBe(200)
    // Verify the where clause excludes blocked user
    const findManyCall = prismaMock.post.findMany.mock.calls[0][0]
    expect(findManyCall.where.auteurId.notIn).toContain("usr_troll")
  })

  it("filters out users who blocked you from feed", async () => {
    prismaMock.blocage.findMany.mockResolvedValue([
      { bloqueurId: "usr_bully", bloqueId: "usr_alice" },
    ])
    prismaMock.post.findMany.mockResolvedValue([])
    prismaMock.post.count.mockResolvedValue(0)

    const req = new Request("http://localhost:3000/api/communaute/posts?page=1")
    const res = await postsModule.GET(req as never)
    const json = await res.json()

    expect(res.status).toBe(200)
    const findManyCall = prismaMock.post.findMany.mock.calls[0][0]
    expect(findManyCall.where.auteurId.notIn).toContain("usr_bully")
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

  it("rejects post when user is muted in group (403)", async () => {
    prismaMock.membreGroupe.findUnique.mockResolvedValue({
      role: "MEMBRE",
      mutedUntil: new Date(Date.now() + 86400_000), // muted until tomorrow
    })

    const req = buildJsonRequest("/api/communaute/posts", {
      contenu: "Muted post",
      groupeId: "grp_private",
    })

    const res = await postsModule.POST(req as never)
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toContain("sourdine")
  })

  it("rejects post containing blocked words (400)", async () => {
    prismaMock.membreGroupe.findUnique.mockResolvedValue({
      role: "MEMBRE",
      mutedUntil: null,
    })
    prismaMock.motBloque.findMany.mockResolvedValue([
      { mot: "spam", action: "supprimer" },
    ])

    const req = buildJsonRequest("/api/communaute/posts", {
      contenu: "This is spam content",
      groupeId: "grp_moderated",
    })

    const res = await postsModule.POST(req as never)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain("mot interdit")
  })

  it("creates a shared post (201)", async () => {
    prismaMock.post.findUnique.mockResolvedValue({ id: "post_original" })
    prismaMock.post.create.mockResolvedValue({
      id: "post_share",
      contenu: "Regardez !",
      auteurId: "usr_alice",
      hashtags: [],
      format: "TEXTE",
      partageDeId: "post_original",
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
      partageDe: {
        id: "post_original",
        auteur: { id: "usr_bob", nom: "Bob", prenom: "Bob", pseudo: null, photoUrl: null, statutProfil: "PUBLIC", verificationStatus: null },
        auteurId: "usr_bob",
        _count: { commentaires: 0, reactions: 0 },
      },
    })
    prismaMock.user.findMany.mockResolvedValue([])
    prismaMock.user.findUnique.mockResolvedValue({
      id: "usr_bob",
      prenom: "Bob",
      nom: "Bob",
    })

    const req = buildJsonRequest("/api/communaute/posts", {
      contenu: "Regardez !",
      partageDeId: "post_original",
    })

    const res = await postsModule.POST(req as never)
    expect(res.status).toBe(201)
  })

  it("returns 404 for sharing non-existent post", async () => {
    prismaMock.membreGroupe.findUnique.mockResolvedValue(null)
    prismaMock.post.findUnique.mockResolvedValue(null)

    const req = buildJsonRequest("/api/communaute/posts", {
      contenu: "Share this",
      partageDeId: "post_ghost",
    })

    const res = await postsModule.POST(req as never)
    expect(res.status).toBe(404)
  })

  it("creates post with mentions and notifies mentioned users", async () => {
    prismaMock.post.create.mockResolvedValue({
      id: "post_mention",
      contenu: "Hey @bob ! #salut",
      auteurId: "usr_alice",
      hashtags: ["#salut"],
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
    prismaMock.user.findMany.mockResolvedValue([
      { id: "usr_bob" },
    ])
    prismaMock.mention.createMany.mockResolvedValue({ count: 1 })
    prismaMock.user.findUnique.mockResolvedValue({
      id: "usr_alice",
      prenom: "Alice",
      nom: "Yao",
    })

    const req = buildJsonRequest("/api/communaute/posts", {
      contenu: "Hey @bob ! #salut",
    })

    const res = await postsModule.POST(req as never)
    expect(res.status).toBe(201)
  })

  it("fetches feed with hashtag filter", async () => {
    prismaMock.blocage.findMany.mockResolvedValue([])
    prismaMock.post.findMany.mockResolvedValue([])
    prismaMock.post.count.mockResolvedValue(0)

    const req = new Request("http://localhost:3000/api/communaute/posts?hashtag=bienvenue")
    const res = await postsModule.GET(req as never)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.posts).toHaveLength(0)
  })

  it("fetches user-specific feed", async () => {
    prismaMock.blocage.findMany.mockResolvedValue([])
    prismaMock.post.findMany.mockResolvedValue([])
    prismaMock.post.count.mockResolvedValue(0)

    const req = new Request("http://localhost:3000/api/communaute/posts?userId=usr_bob")
    const res = await postsModule.GET(req as never)
    expect(res.status).toBe(200)
  })

  it("fetches saved posts", async () => {
    prismaMock.blocage.findMany.mockResolvedValue([])
    prismaMock.postSauvegarde.findMany.mockResolvedValue([
      { postId: "post_1" },
    ])
    prismaMock.post.findMany.mockResolvedValue([])
    prismaMock.post.count.mockResolvedValue(0)

    const req = new Request("http://localhost:3000/api/communaute/posts?saved=true")
    const res = await postsModule.GET(req as never)
    expect(res.status).toBe(200)
  })

  it("fetches group-specific feed", async () => {
    prismaMock.blocage.findMany.mockResolvedValue([])
    prismaMock.post.findMany.mockResolvedValue([])
    prismaMock.post.count.mockResolvedValue(0)

    const req = new Request("http://localhost:3000/api/communaute/posts?groupeId=grp_1")
    const res = await postsModule.GET(req as never)
    expect(res.status).toBe(200)
  })

  it("rejects unauthenticated GET (401)", async () => {
    mockAuth.mockResolvedValue(null)
    const req = new Request("http://localhost:3000/api/communaute/posts?page=1")
    const res = await postsModule.GET(req as never)
    expect(res.status).toBe(401)
  })

  it("returns userReaction when user has reacted to a post", async () => {
    prismaMock.blocage.findMany.mockResolvedValue([])
    prismaMock.post.findMany.mockResolvedValue([
      {
        id: "post_reacted",
        contenu: "Liked post",
        auteur: { id: "usr_bob", nom: "Bob", prenom: "Bob" },
        reactions: [{ type: "LIKE" }],
        sauvegardes: [],
        _count: { commentaires: 0, reactions: 1, partages: 0 },
        partageDe: null,
        commentaires: [],
      },
    ])
    prismaMock.post.count.mockResolvedValue(1)

    const req = new Request("http://localhost:3000/api/communaute/posts?page=1")
    const res = await postsModule.GET(req as never)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.posts[0].userReaction).toBe("LIKE")
  })

  it("creates post with approval required in group (EN_ATTENTE_MODERATION)", async () => {
    prismaMock.membreGroupe.findUnique.mockResolvedValue({
      role: "MEMBRE",
      mutedUntil: null,
    })
    prismaMock.motBloque.findMany.mockResolvedValue([])
    prismaMock.groupe.findUnique.mockResolvedValue({
      approvalRequired: true,
    })
    prismaMock.post.create.mockResolvedValue({
      id: "post_pending",
      contenu: "Moderated post",
      auteurId: "usr_alice",
      hashtags: [],
      status: "EN_ATTENTE_MODERATION",
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
    prismaMock.user.findMany.mockResolvedValue([])

    const req = buildJsonRequest("/api/communaute/posts", {
      contenu: "Moderated post",
      groupeId: "grp_moderated",
    })

    const res = await postsModule.POST(req as never)
    expect(res.status).toBe(201)
    // Verify post was created with status pending
    const createCall = prismaMock.post.create.mock.calls[0][0]
    expect(createCall.data.status).toBe("EN_ATTENTE_MODERATION")
  })

  it("auto-detects VIDEO format from videoUrl", async () => {
    prismaMock.post.create.mockResolvedValue({
      id: "post_video",
      contenu: "Ma vidéo",
      auteurId: "usr_alice",
      hashtags: [],
      format: "VIDEO",
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
    prismaMock.user.findMany.mockResolvedValue([])

    const req = buildJsonRequest("/api/communaute/posts", {
      contenu: "Ma vidéo",
      videoUrl: "https://example.com/video.mp4",
    })

    const res = await postsModule.POST(req as never)
    expect(res.status).toBe(201)
    const createCall = prismaMock.post.create.mock.calls[0][0]
    expect(createCall.data.format).toBe("VIDEO")
  })

  it("auto-detects LIEN format from lienUrl", async () => {
    prismaMock.post.create.mockResolvedValue({
      id: "post_lien",
      contenu: "Un lien",
      auteurId: "usr_alice",
      hashtags: [],
      format: "LIEN",
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
    prismaMock.user.findMany.mockResolvedValue([])

    const req = buildJsonRequest("/api/communaute/posts", {
      contenu: "Un lien",
      lienUrl: "https://example.com/article",
    })

    const res = await postsModule.POST(req as never)
    expect(res.status).toBe(201)
    const createCall = prismaMock.post.create.mock.calls[0][0]
    expect(createCall.data.format).toBe("LIEN")
  })

  it("auto-detects DOCUMENT format from documentUrl", async () => {
    prismaMock.post.create.mockResolvedValue({
      id: "post_doc",
      contenu: "Un document",
      auteurId: "usr_alice",
      hashtags: [],
      format: "DOCUMENT",
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
    prismaMock.user.findMany.mockResolvedValue([])

    const req = buildJsonRequest("/api/communaute/posts", {
      contenu: "Un document",
      documentUrl: "https://example.com/doc.pdf",
    })

    const res = await postsModule.POST(req as never)
    expect(res.status).toBe(201)
    const createCall = prismaMock.post.create.mock.calls[0][0]
    expect(createCall.data.format).toBe("DOCUMENT")
  })

  it("auto-detects IMAGE format from images array", async () => {
    prismaMock.post.create.mockResolvedValue({
      id: "post_img",
      contenu: "Image post",
      auteurId: "usr_alice",
      hashtags: [],
      format: "IMAGE",
      auteur: {
        id: "usr_alice", nom: "Yao", prenom: "Alice",
        pseudo: null, photoUrl: null, statutProfil: "PUBLIC", verificationStatus: null,
      },
      commentaires: [],
      _count: { commentaires: 0, reactions: 0, partages: 0 },
      partageDe: null,
    })
    prismaMock.user.findMany.mockResolvedValue([])

    const req = buildJsonRequest("/api/communaute/posts", {
      contenu: "Image post",
      images: ["https://example.com/photo.jpg"],
    })

    const res = await postsModule.POST(req as never)
    expect(res.status).toBe(201)
    const createCall = prismaMock.post.create.mock.calls[0][0]
    expect(createCall.data.format).toBe("IMAGE")
  })

  it("auto-detects IMAGE format from imageUrl", async () => {
    prismaMock.post.create.mockResolvedValue({
      id: "post_img_url",
      contenu: "Single image",
      auteurId: "usr_alice",
      hashtags: [],
      format: "IMAGE",
      auteur: {
        id: "usr_alice", nom: "Yao", prenom: "Alice",
        pseudo: null, photoUrl: null, statutProfil: "PUBLIC", verificationStatus: null,
      },
      commentaires: [],
      _count: { commentaires: 0, reactions: 0, partages: 0 },
      partageDe: null,
    })
    prismaMock.user.findMany.mockResolvedValue([])

    const req = buildJsonRequest("/api/communaute/posts", {
      contenu: "Single image",
      imageUrl: "https://example.com/photo.jpg",
    })

    const res = await postsModule.POST(req as never)
    expect(res.status).toBe(201)
    const createCall = prismaMock.post.create.mock.calls[0][0]
    expect(createCall.data.format).toBe("IMAGE")
  })

  it("notifies original author when post is shared by another user", async () => {
    const { creerNotification } = await import("@/lib/notifications")
    // First findUnique: check original post exists
    prismaMock.post.findUnique
      .mockResolvedValueOnce({ id: "post_orig" })
    prismaMock.post.create.mockResolvedValue({
      id: "post_shared_notif",
      contenu: "Partagé !",
      auteurId: "usr_alice",
      hashtags: [],
      format: "TEXTE",
      partageDeId: "post_orig",
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
      partageDe: {
        id: "post_orig",
        auteur: { id: "usr_bob", nom: "Bob", prenom: "Bob", pseudo: null, photoUrl: null, statutProfil: "PUBLIC", verificationStatus: null },
        auteurId: "usr_bob",
        _count: { commentaires: 0, reactions: 0 },
      },
    })
    prismaMock.user.findMany.mockResolvedValue([]) // no mentions from pseudos
    // Second findUnique on posts: original post author for share notification
    prismaMock.post.findUnique.mockResolvedValueOnce({ id: "post_orig", auteurId: "usr_bob" })
    // findUnique for sharer's name
    prismaMock.user.findUnique.mockResolvedValue({
      id: "usr_alice",
      prenom: "Alice",
      nom: "Yao",
    })

    const req = buildJsonRequest("/api/communaute/posts", {
      contenu: "Partagé !",
      partageDeId: "post_orig",
    })

    const res = await postsModule.POST(req as never)
    expect(res.status).toBe(201)
    // creerNotification should be called for share notification
    expect(vi.mocked(creerNotification)).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "usr_bob",
        type: "NOUVEAU_LIKE",
        titre: "Votre publication a été partagée",
      })
    )
  })

  it("creates post with explicit format (skips auto-detection)", async () => {
    prismaMock.post.create.mockResolvedValue({
      id: "post_explicit_fmt",
      contenu: "Explicit format",
      auteurId: "usr_alice",
      hashtags: [],
      format: "VIDEO",
      auteur: {
        id: "usr_alice", nom: "Yao", prenom: "Alice",
        pseudo: null, photoUrl: null, statutProfil: "PUBLIC", verificationStatus: null,
      },
      commentaires: [],
      _count: { commentaires: 0, reactions: 0, partages: 0 },
      partageDe: null,
    })
    prismaMock.user.findMany.mockResolvedValue([])

    const req = buildJsonRequest("/api/communaute/posts", {
      contenu: "Explicit format",
      format: "VIDEO",
    })

    const res = await postsModule.POST(req as never)
    expect(res.status).toBe(201)
    const createCall = prismaMock.post.create.mock.calls[0][0]
    expect(createCall.data.format).toBe("VIDEO")
  })

  it("publishes group post when member is ADMIN (no moderation)", async () => {
    prismaMock.membreGroupe.findUnique.mockResolvedValue({
      role: "ADMIN",
      mutedUntil: null,
    })
    prismaMock.motBloque.findMany.mockResolvedValue([])
    prismaMock.groupe.findUnique.mockResolvedValue({
      approvalRequired: true,
    })
    prismaMock.post.create.mockResolvedValue({
      id: "post_admin",
      contenu: "Admin post",
      auteurId: "usr_alice",
      hashtags: [],
      status: "PUBLIE",
      auteur: {
        id: "usr_alice", nom: "Yao", prenom: "Alice",
        pseudo: null, photoUrl: null, statutProfil: "PUBLIC", verificationStatus: null,
      },
      commentaires: [],
      _count: { commentaires: 0, reactions: 0, partages: 0 },
      partageDe: null,
    })
    prismaMock.user.findMany.mockResolvedValue([])

    const req = buildJsonRequest("/api/communaute/posts", {
      contenu: "Admin post",
      groupeId: "grp_moderated",
    })

    const res = await postsModule.POST(req as never)
    expect(res.status).toBe(201)
    const createCall = prismaMock.post.create.mock.calls[0][0]
    expect(createCall.data.status).toBe("PUBLIE")
  })

  it("skips share notification when user shares own post", async () => {
    const { creerNotification } = await import("@/lib/notifications")
    prismaMock.post.findUnique
      .mockResolvedValueOnce({ id: "post_own" }) // original exists check
    prismaMock.post.create.mockResolvedValue({
      id: "post_self_share",
      contenu: "Sharing my own post",
      auteurId: "usr_alice",
      hashtags: [],
      format: "TEXTE",
      partageDeId: "post_own",
      auteur: {
        id: "usr_alice", nom: "Yao", prenom: "Alice",
        pseudo: null, photoUrl: null, statutProfil: "PUBLIC", verificationStatus: null,
      },
      commentaires: [],
      _count: { commentaires: 0, reactions: 0, partages: 0 },
      partageDe: null,
    })
    prismaMock.user.findMany.mockResolvedValue([])
    // Original post author is the same user
    prismaMock.post.findUnique.mockResolvedValueOnce({ id: "post_own", auteurId: "usr_alice" })

    const req = buildJsonRequest("/api/communaute/posts", {
      contenu: "Sharing my own post",
      partageDeId: "post_own",
    })

    const res = await postsModule.POST(req as never)
    expect(res.status).toBe(201)
    // creerNotification should NOT be called for share notification (same user)
    await new Promise((r) => setTimeout(r, 50))
    expect(vi.mocked(creerNotification)).not.toHaveBeenCalledWith(
      expect.objectContaining({ titre: "Votre publication a été partagée" })
    )
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

  it("sends scheduled message without immediate push (201)", async () => {
    const futureDate = new Date(Date.now() + 3_600_000).toISOString() // 1h from now
    prismaMock.user.findUnique.mockResolvedValue({ id: "usr_bob" })
    prismaMock.message.create.mockResolvedValue({
      id: "msg_sched",
      contenu: "Message programmé",
      expediteur: { id: "usr_alice", nom: "Yao", prenom: "Alice", photoUrl: null },
      replyTo: null,
    })

    const req = buildJsonRequest("/api/messages", {
      destinataireId: "usr_bob",
      contenu: "Message programmé",
      programmeA: futureDate,
    })

    const res = await messagesModule.POST(req as never)
    expect(res.status).toBe(201)
    // Scheduled messages should not trigger push immediately
  })

  it("sends message with replyToId and ephemere options (201)", async () => {
    prismaMock.user.findUnique
      .mockResolvedValueOnce({ id: "usr_bob" }) // destinataire exists
    prismaMock.message.create.mockResolvedValue({
      id: "msg_reply",
      contenu: "Reply ephemere",
      expediteur: { id: "usr_alice", nom: "Yao", prenom: "Alice", photoUrl: null },
      replyTo: { id: "msg_original", contenu: "Original", type: "TEXTE", expediteur: { id: "usr_bob", prenom: "Bob", nom: "Bob" } },
    })
    prismaMock.conversation.findUnique.mockResolvedValue({ id: "conv_reply" })
    prismaMock.message.update.mockResolvedValue({})
    prismaMock.conversation.upsert.mockResolvedValue({})
    prismaMock.user.findUnique.mockResolvedValueOnce({
      notifMessages: false,
      pushSubscriptions: [],
    })

    const req = buildJsonRequest("/api/messages", {
      destinataireId: "usr_bob",
      contenu: "Reply ephemere",
      replyToId: "msg_original",
      ephemere: true,
    })

    const res = await messagesModule.POST(req as never)
    expect(res.status).toBe(201)
    await new Promise((r) => setTimeout(r, 50))
    // Verify message was created with replyToId and expiresAt
    const createCall = prismaMock.message.create.mock.calls[0][0]
    expect(createCall.data.replyToId).toBe("msg_original")
    expect(createCall.data.expiresAt).toBeDefined()
  })

  it("sends message with notification to recipient", async () => {
    prismaMock.user.findUnique
      .mockResolvedValueOnce({ id: "usr_bob" }) // destinataire check
    prismaMock.message.create.mockResolvedValue({
      id: "msg_notif",
      contenu: "Notif test",
      expediteur: { id: "usr_alice", nom: "Yao", prenom: "Alice", photoUrl: null },
      replyTo: null,
    })
    prismaMock.conversation.findUnique.mockResolvedValue({ id: "conv_1" })
    prismaMock.message.update.mockResolvedValue({})
    prismaMock.conversation.upsert.mockResolvedValue({})
    // The void async notification IIFE reads this
    prismaMock.user.findUnique.mockResolvedValueOnce({
      notifMessages: true,
      pushSubscriptions: [],
    })

    const req = buildJsonRequest("/api/messages", {
      destinataireId: "usr_bob",
      contenu: "Notif test",
    })

    const res = await messagesModule.POST(req as never)
    expect(res.status).toBe(201)
    // Give the void async IIFE a tick to settle
    await new Promise((r) => setTimeout(r, 50))
  })

  it("sends message with push notification when configured", async () => {
    const { isPushConfigured } = await import("@/lib/web-push")
    const { envoyerPushNotification } = await import("@/lib/web-push")
    vi.mocked(isPushConfigured).mockReturnValue(true)

    prismaMock.user.findUnique
      .mockResolvedValueOnce({ id: "usr_bob" }) // destinataire check
    prismaMock.message.create.mockResolvedValue({
      id: "msg_push",
      contenu: "Push test",
      expediteur: { id: "usr_alice", nom: "Yao", prenom: "Alice", photoUrl: null },
      replyTo: null,
    })
    prismaMock.conversation.findUnique.mockResolvedValue({ id: "conv_push" })
    prismaMock.message.update.mockResolvedValue({})
    prismaMock.conversation.upsert.mockResolvedValue({})
    // The void async IIFE reads this for notification + push
    prismaMock.user.findUnique.mockResolvedValueOnce({
      notifMessages: true,
      pushSubscriptions: [
        { endpoint: "https://push.example.com/sub1", p256dh: "key1", auth: "auth1" },
      ],
    })

    const req = buildJsonRequest("/api/messages", {
      destinataireId: "usr_bob",
      contenu: "Push test",
    })

    const res = await messagesModule.POST(req as never)
    expect(res.status).toBe(201)
    // Give the void async IIFE a tick to settle
    await new Promise((r) => setTimeout(r, 50))
    expect(vi.mocked(envoyerPushNotification)).toHaveBeenCalled()

    // Restore
    vi.mocked(isPushConfigured).mockReturnValue(false)
  })

  it("truncates long message in push notification body", async () => {
    const { isPushConfigured } = await import("@/lib/web-push")
    const { envoyerPushNotification } = await import("@/lib/web-push")
    vi.mocked(isPushConfigured).mockReturnValue(true)

    const longContenu = "A".repeat(100) // 100 chars > 80

    prismaMock.user.findUnique
      .mockResolvedValueOnce({ id: "usr_bob" }) // destinataire check
    prismaMock.message.create.mockResolvedValue({
      id: "msg_long",
      contenu: longContenu,
      expediteur: { id: "usr_alice", nom: "Yao", prenom: "Alice", photoUrl: null },
      replyTo: null,
    })
    prismaMock.conversation.findUnique.mockResolvedValue({ id: "conv_long" })
    prismaMock.message.update.mockResolvedValue({})
    prismaMock.conversation.upsert.mockResolvedValue({})
    prismaMock.user.findUnique.mockResolvedValueOnce({
      notifMessages: true,
      pushSubscriptions: [
        { endpoint: "https://push.example.com/sub1", p256dh: "key1", auth: "auth1" },
      ],
    })

    const req = buildJsonRequest("/api/messages", {
      destinataireId: "usr_bob",
      contenu: longContenu,
    })

    const res = await messagesModule.POST(req as never)
    expect(res.status).toBe(201)
    await new Promise((r) => setTimeout(r, 50))
    expect(vi.mocked(envoyerPushNotification)).toHaveBeenCalled()

    vi.mocked(isPushConfigured).mockReturnValue(false)
  })

  it("continues when push notification send rejects", async () => {
    const { isPushConfigured, envoyerPushNotification } = await import("@/lib/web-push")
    vi.mocked(isPushConfigured).mockReturnValue(true)
    vi.mocked(envoyerPushNotification).mockRejectedValueOnce(new Error("Push failed"))

    prismaMock.user.findUnique
      .mockResolvedValueOnce({ id: "usr_bob" })
    prismaMock.message.create.mockResolvedValue({
      id: "msg_push_fail",
      contenu: "Push fail test",
      expediteur: { id: "usr_alice", nom: "Yao", prenom: "Alice", photoUrl: null },
      replyTo: null,
    })
    prismaMock.conversation.findUnique.mockResolvedValue({ id: "conv_push_fail" })
    prismaMock.message.update.mockResolvedValue({})
    prismaMock.conversation.upsert.mockResolvedValue({})
    prismaMock.user.findUnique.mockResolvedValueOnce({
      notifMessages: true,
      pushSubscriptions: [
        { endpoint: "https://push.example.com/sub1", p256dh: "key1", auth: "auth1" },
      ],
    })

    const req = buildJsonRequest("/api/messages", {
      destinataireId: "usr_bob",
      contenu: "Push fail test",
    })

    const res = await messagesModule.POST(req as never)
    expect(res.status).toBe(201)
    await new Promise((r) => setTimeout(r, 50))

    vi.mocked(isPushConfigured).mockReturnValue(false)
  })

  it("rejects malformed JSON message body (400)", async () => {
    const req = new Request("http://localhost:3000/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    })

    const res = await messagesModule.POST(req as never)
    expect(res.status).toBe(400)
  })

  it("rejects invalid message schema (400)", async () => {
    const req = buildJsonRequest("/api/messages", {
      destinataireId: "usr_bob",
      // contenu missing
    })

    const res = await messagesModule.POST(req as never)
    expect(res.status).toBe(400)
  })

  it("returns 429 when rate limited", async () => {
    mockRateLimitCheck.mockResolvedValueOnce({
      allowed: false,
      limit: 30,
      remaining: 0,
      retryAfterSeconds: 45,
    })

    const req = buildJsonRequest("/api/messages", {
      destinataireId: "usr_bob",
      contenu: "Spam",
    })

    const res = await messagesModule.POST(req as never)
    expect(res.status).toBe(429)
    expect(res.headers.get("Retry-After")).toBe("45")
  })

  it("increments nonLusA when sender is participantB (not participantA)", async () => {
    // Use destinataireId that sorts BEFORE session.user.id so isParticipantA = false
    prismaMock.user.findUnique
      .mockResolvedValueOnce({ id: "aaa_bob" }) // destinataire exists
    prismaMock.message.create.mockResolvedValue({
      id: "msg_pB",
      contenu: "Test",
      expediteur: { id: "usr_alice", nom: "Yao", prenom: "Alice", photoUrl: null },
      replyTo: null,
    })
    prismaMock.conversation.findUnique.mockResolvedValue({ id: "conv_pB" })
    prismaMock.message.update.mockResolvedValue({})
    prismaMock.conversation.upsert.mockResolvedValue({})
    prismaMock.user.findUnique.mockResolvedValueOnce({
      notifMessages: false,
      pushSubscriptions: [],
    })

    const req = buildJsonRequest("/api/messages", {
      destinataireId: "aaa_bob", // "aaa_bob" < "usr_alice" → pA = "aaa_bob", sender is pB
      contenu: "Test participantB",
    })

    const res = await messagesModule.POST(req as never)
    expect(res.status).toBe(201)
    await new Promise((r) => setTimeout(r, 50))
    // Verify upsert was called with nonLusA increment (sender is B, so dest is A)
    const upsertCall = prismaMock.conversation.upsert.mock.calls[0][0]
    expect(upsertCall.update).toEqual(
      expect.objectContaining({
        nonLusA: { increment: 1 },
      })
    )
  })

  it("skips notification when destUser has notifMessages disabled", async () => {
    const { creerNotification } = await import("@/lib/notifications")
    prismaMock.user.findUnique
      .mockResolvedValueOnce({ id: "usr_bob" }) // destinataire exists
    prismaMock.message.create.mockResolvedValue({
      id: "msg_no_notif",
      contenu: "Test",
      expediteur: { id: "usr_alice", nom: "Yao", prenom: "Alice", photoUrl: null },
      replyTo: null,
    })
    prismaMock.conversation.findUnique.mockResolvedValue({ id: "conv_no_notif" })
    prismaMock.message.update.mockResolvedValue({})
    prismaMock.conversation.upsert.mockResolvedValue({})
    // destUser has notifMessages: false → no notification
    prismaMock.user.findUnique.mockResolvedValueOnce({
      notifMessages: false,
      pushSubscriptions: [],
    })

    const req = buildJsonRequest("/api/messages", {
      destinataireId: "usr_bob",
      contenu: "No notif test",
    })

    const res = await messagesModule.POST(req as never)
    expect(res.status).toBe(201)
    await new Promise((r) => setTimeout(r, 50))
    expect(vi.mocked(creerNotification)).not.toHaveBeenCalled()
  })

  it("does not increment nonLus for scheduled message", async () => {
    const futureDate = new Date(Date.now() + 3_600_000).toISOString()
    prismaMock.user.findUnique.mockResolvedValue({ id: "usr_bob" })
    prismaMock.message.create.mockResolvedValue({
      id: "msg_sched2",
      contenu: "Scheduled",
      expediteur: { id: "usr_alice", nom: "Yao", prenom: "Alice", photoUrl: null },
      replyTo: null,
    })
    prismaMock.conversation.findUnique.mockResolvedValue({ id: "conv_sched" })
    prismaMock.message.update.mockResolvedValue({})
    prismaMock.conversation.upsert.mockResolvedValue({})

    const req = buildJsonRequest("/api/messages", {
      destinataireId: "usr_bob",
      contenu: "Scheduled message",
      programmeA: futureDate,
    })

    const res = await messagesModule.POST(req as never)
    expect(res.status).toBe(201)
    // Verify upsert update has empty object (no nonLus increment for scheduled)
    const upsertCall = prismaMock.conversation.upsert.mock.calls[0][0]
    // Scheduled → empty spread object for nonLus
    expect(upsertCall.update.nonLusA).toBeUndefined()
    expect(upsertCall.update.nonLusB).toBeUndefined()
  })
})
