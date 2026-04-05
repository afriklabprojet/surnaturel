import { describe, it, expect, beforeEach, vi } from "vitest"
import { prismaMock, mockAuth, buildRequest, buildJsonRequest } from "./setup"

const preferencesModule = await import("@/app/api/rencontres/preferences/route")
const suggestionsModule = await import("@/app/api/rencontres/suggestions/route")
const likeModule = await import("@/app/api/rencontres/like/route")
const matchesModule = await import("@/app/api/rencontres/matches/route")
const matchIdModule = await import("@/app/api/rencontres/[matchId]/route")
const quiMALikeModule = await import("@/app/api/rencontres/qui-ma-like/route")

const fakeSession = {
  user: {
    id: "usr_alice",
    email: "alice@example.com",
    prenom: "Alice",
    nom: "Yao",
    role: "CLIENT",
    image: null,
  },
}

// ─── Préférences ─────────────────────────────────────────────────

describe("Rencontres — Préférences", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(fakeSession)
  })

  it("GET retourne null si aucune préférence (200)", async () => {
    prismaMock.rencontrePreference.findUnique.mockResolvedValue(null)
    const res = await preferencesModule.GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toBeNull()
  })

  it("GET retourne les préférences existantes (200)", async () => {
    const pref = {
      id: "pref_1",
      userId: "usr_alice",
      intention: "RELATION_SERIEUSE",
      ageMin: 25,
      ageMax: 40,
      distanceKm: 30,
      actif: true,
      updatedAt: new Date(),
    }
    prismaMock.rencontrePreference.findUnique.mockResolvedValue(pref)
    const res = await preferencesModule.GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.intention).toBe("RELATION_SERIEUSE")
    expect(json.ageMin).toBe(25)
  })

  it("GET 401 si non authentifié", async () => {
    mockAuth.mockResolvedValue(null)
    const res = await preferencesModule.GET()
    expect(res.status).toBe(401)
  })

  it("PUT enregistre les préférences (200)", async () => {
    const pref = {
      id: "pref_1",
      userId: "usr_alice",
      intention: "MARIAGE",
      ageMin: 28,
      ageMax: 45,
      distanceKm: 20,
      actif: true,
      updatedAt: new Date(),
    }
    prismaMock.rencontrePreference.upsert.mockResolvedValue(pref)
    const req = buildJsonRequest("/api/rencontres/preferences", {
      intention: "MARIAGE",
      ageMin: 28,
      ageMax: 45,
      distanceKm: 20,
    }, "PUT")
    const res = await preferencesModule.PUT(req as never)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.intention).toBe("MARIAGE")
  })

  it("PUT 400 si ageMin > ageMax", async () => {
    const req = buildJsonRequest("/api/rencontres/preferences", { ageMin: 50, ageMax: 30 }, "PUT")
    const res = await preferencesModule.PUT(req as never)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/minimum/)
  })

  it("PUT 400 si body invalide (enum inconnu)", async () => {
    const req = buildJsonRequest("/api/rencontres/preferences", { intention: "AVENTURE" }, "PUT")
    const res = await preferencesModule.PUT(req as never)
    expect(res.status).toBe(400)
  })

  it("PUT 400 si body non JSON", async () => {
    const req = buildRequest("/api/rencontres/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    })
    const res = await preferencesModule.PUT(req as never)
    expect(res.status).toBe(400)
  })

  it("PUT 401 si non authentifié", async () => {
    mockAuth.mockResolvedValue(null)
    const req = buildJsonRequest("/api/rencontres/preferences", { intention: "AMITIE" }, "PUT")
    const res = await preferencesModule.PUT(req as never)
    expect(res.status).toBe(401)
  })
})

// ─── Suggestions ─────────────────────────────────────────────────

describe("Rencontres — Suggestions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(fakeSession)
    prismaMock.rencontrePreference.findUnique.mockResolvedValue(null)
    prismaMock.user.findUnique.mockResolvedValue({ centresInteret: [] })
    prismaMock.rencontreLike.findMany.mockResolvedValue([])
    prismaMock.blocage.findMany.mockResolvedValue([])
  })

  it("GET retourne la liste de profils (200)", async () => {
    prismaMock.user.findMany.mockResolvedValue([
      {
        id: "usr_bob",
        prenom: "Bob",
        nom: "Dupont",
        pseudo: null,
        photoUrl: null,
        bio: null,
        ville: "Abidjan",
        centresInteret: [],
        verificationStatus: "AUCUNE",
        dateNaissance: null,
        derniereVueAt: null,
        profilDetail: null,
      },
    ])
    const req = buildRequest("/api/rencontres/suggestions")
    const res = await suggestionsModule.GET(req as never)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.profiles).toHaveLength(1)
    expect(json.profiles[0].id).toBe("usr_bob")
  })

  it("GET calcule un score de compatibilité (200)", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ centresInteret: ["sport", "musique"] })
    prismaMock.user.findMany.mockResolvedValue([
      {
        id: "usr_bob",
        prenom: "Bob",
        nom: "Dupont",
        pseudo: null,
        photoUrl: null,
        bio: null,
        ville: null,
        centresInteret: ["sport", "lecture"],
        verificationStatus: "AUCUNE",
        dateNaissance: null,
        derniereVueAt: null,
        profilDetail: null,
      },
    ])
    const req = buildRequest("/api/rencontres/suggestions")
    const res = await suggestionsModule.GET(req as never)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.profiles[0].compatibilityScore).toBeGreaterThan(0)
  })

  it("GET fonctionne si currentUser introuvable (intérêts vides)", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)
    prismaMock.user.findMany.mockResolvedValue([])
    const req = buildRequest("/api/rencontres/suggestions")
    const res = await suggestionsModule.GET(req as never)
    expect(res.status).toBe(200)
  })

  it("GET retourne liste vide si mode actif=false", async () => {
    prismaMock.rencontrePreference.findUnique.mockResolvedValue({
      actif: false,
      userId: "usr_alice",
    })
    const req = buildRequest("/api/rencontres/suggestions")
    const res = await suggestionsModule.GET(req as never)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.profiles).toHaveLength(0)
    expect(json.nextCursor).toBeNull()
  })

  it("GET pagine avec cursor (200)", async () => {
    prismaMock.user.findMany.mockResolvedValue([])
    const req = buildRequest("/api/rencontres/suggestions", {
      searchParams: { cursor: "usr_last" },
    })
    const res = await suggestionsModule.GET(req as never)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.nextCursor).toBeNull()
  })

  it("GET exclut les profils déjà swipés", async () => {
    prismaMock.rencontreLike.findMany.mockResolvedValue([
      { toUserId: "usr_bob" },
    ])
    prismaMock.user.findMany.mockResolvedValue([])
    const req = buildRequest("/api/rencontres/suggestions")
    await suggestionsModule.GET(req as never)
    const call = prismaMock.user.findMany.mock.calls[0][0]
    expect(call.where.id.notIn).toContain("usr_bob")
  })

  it("GET exclut les utilisateurs bloqués", async () => {
    prismaMock.blocage.findMany.mockResolvedValue([
      { bloqueurId: "usr_alice", bloqueId: "usr_troll" },
    ])
    prismaMock.user.findMany.mockResolvedValue([])
    const req = buildRequest("/api/rencontres/suggestions")
    await suggestionsModule.GET(req as never)
    const call = prismaMock.user.findMany.mock.calls[0][0]
    expect(call.where.id.notIn).toContain("usr_troll")
  })

  it("GET exclut les profils qui vous ont bloqué", async () => {
    prismaMock.blocage.findMany.mockResolvedValue([
      { bloqueurId: "usr_hater", bloqueId: "usr_alice" },
    ])
    prismaMock.user.findMany.mockResolvedValue([])
    const req = buildRequest("/api/rencontres/suggestions")
    await suggestionsModule.GET(req as never)
    const call = prismaMock.user.findMany.mock.calls[0][0]
    expect(call.where.id.notIn).toContain("usr_hater")
  })

  it("GET applique filtres d'âge si préférences définies", async () => {
    prismaMock.rencontrePreference.findUnique.mockResolvedValue({
      actif: true,
      ageMin: 25,
      ageMax: 40,
      userId: "usr_alice",
    })
    prismaMock.user.findMany.mockResolvedValue([])
    const req = buildRequest("/api/rencontres/suggestions")
    await suggestionsModule.GET(req as never)
    const call = prismaMock.user.findMany.mock.calls[0][0]
    expect(call.where.dateNaissance).toBeDefined()
  })

  it("GET retourne nextCursor si plus d'une page", async () => {
    // 11 profiles → hasMore = true, slice 10
    const manyProfiles = Array.from({ length: 11 }, (_, i) => ({
      id: `usr_${i}`,
      prenom: `User${i}`,
      nom: "Test",
      pseudo: null,
      photoUrl: null,
      bio: null,
      ville: null,
      centresInteret: [],
      verificationStatus: "AUCUNE",
      dateNaissance: null,
      derniereVueAt: null,
      profilDetail: null,
    }))
    prismaMock.user.findMany.mockResolvedValue(manyProfiles)
    const req = buildRequest("/api/rencontres/suggestions")
    const res = await suggestionsModule.GET(req as never)
    const json = await res.json()
    expect(json.profiles).toHaveLength(10)
    expect(json.nextCursor).toBe("usr_9")
  })

  it("GET 401 si non authentifié", async () => {
    mockAuth.mockResolvedValue(null)
    const req = buildRequest("/api/rencontres/suggestions")
    const res = await suggestionsModule.GET(req as never)
    expect(res.status).toBe(401)
  })
})

// ─── Like ─────────────────────────────────────────────────────────

describe("Rencontres — Like", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(fakeSession)
    prismaMock.rencontreLike.count.mockResolvedValue(0)
  })

  it("POST PASS → no match (200)", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "usr_bob" })
    prismaMock.rencontreLike.upsert.mockResolvedValue({})
    const req = buildJsonRequest("/api/rencontres/like", { toUserId: "usr_bob", type: "PASS" })
    const res = await likeModule.POST(req as never)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.matched).toBe(false)
  })

  it("POST LIKE sans réciproque → no match (200)", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "usr_bob" })
    prismaMock.rencontreLike.upsert.mockResolvedValue({})
    prismaMock.rencontreLike.findUnique.mockResolvedValue(null)
    const req = buildJsonRequest("/api/rencontres/like", { toUserId: "usr_bob", type: "LIKE" })
    const res = await likeModule.POST(req as never)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.matched).toBe(false)
  })

  it("POST LIKE avec réciproque PASS → no match (200)", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "usr_bob" })
    prismaMock.rencontreLike.upsert.mockResolvedValue({})
    prismaMock.rencontreLike.findUnique.mockResolvedValue({ type: "PASS" })
    const req = buildJsonRequest("/api/rencontres/like", { toUserId: "usr_bob", type: "LIKE" })
    const res = await likeModule.POST(req as never)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.matched).toBe(false)
  })

  it("POST LIKE avec réciproque → MATCH créé (200)", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "usr_bob" })
    prismaMock.rencontreLike.upsert.mockResolvedValue({})
    prismaMock.rencontreLike.findUnique.mockResolvedValue({ type: "LIKE" })
    prismaMock.rencontreMatch.findUnique.mockResolvedValue(null)
    prismaMock.conversation.upsert.mockResolvedValue({ id: "conv_1" })
    prismaMock.rencontreMatch.create.mockResolvedValue({ id: "match_1", userAId: "usr_alice", userBId: "usr_bob" })

    const req = buildJsonRequest("/api/rencontres/like", { toUserId: "usr_bob", type: "LIKE" })
    const res = await likeModule.POST(req as never)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.matched).toBe(true)
    expect(json.matchId).toBe("match_1")
    expect(json.conversationId).toBe("conv_1")
  })

  it("POST LIKE avec match déjà existant → alreadyExisted (200)", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "usr_bob" })
    prismaMock.rencontreLike.upsert.mockResolvedValue({})
    prismaMock.rencontreLike.findUnique.mockResolvedValue({ type: "LIKE" })
    prismaMock.rencontreMatch.findUnique.mockResolvedValue({
      id: "match_existing",
      userAId: "usr_alice",
      userBId: "usr_bob",
    })

    const req = buildJsonRequest("/api/rencontres/like", { toUserId: "usr_bob" })
    const res = await likeModule.POST(req as never)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.matched).toBe(true)
    expect(json.alreadyExisted).toBe(true)
  })

  it("POST 400 si self-like", async () => {
    const req = buildJsonRequest("/api/rencontres/like", { toUserId: "usr_alice", type: "LIKE" })
    const res = await likeModule.POST(req as never)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/vous-même/)
  })

  it("POST 404 si utilisateur cible introuvable", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)
    const req = buildJsonRequest("/api/rencontres/like", { toUserId: "usr_ghost" })
    const res = await likeModule.POST(req as never)
    expect(res.status).toBe(404)
  })

  it("POST 400 si données invalides (toUserId vide)", async () => {
    const req = buildJsonRequest("/api/rencontres/like", { toUserId: "" })
    const res = await likeModule.POST(req as never)
    expect(res.status).toBe(400)
  })

  it("POST 400 si body non JSON", async () => {
    const req = buildRequest("/api/rencontres/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    })
    const res = await likeModule.POST(req as never)
    expect(res.status).toBe(400)
  })

  it("POST 429 si limite journalière atteinte", async () => {
    prismaMock.rencontreLike.count.mockResolvedValue(20)
    const req = buildJsonRequest("/api/rencontres/like", { toUserId: "usr_bob", type: "LIKE" })
    const res = await likeModule.POST(req as never)
    expect(res.status).toBe(429)
    const json = await res.json()
    expect(json.error).toMatch(/limite/i)
    expect(json.resetAt).toBeDefined()
  })

  it("POST PASS ne compte pas contre la limite (200)", async () => {
    prismaMock.rencontreLike.count.mockResolvedValue(20)
    prismaMock.user.findUnique.mockResolvedValue({ id: "usr_bob" })
    prismaMock.rencontreLike.upsert.mockResolvedValue({})
    const req = buildJsonRequest("/api/rencontres/like", { toUserId: "usr_bob", type: "PASS" })
    const res = await likeModule.POST(req as never)
    expect(res.status).toBe(200)
  })

  it("POST 401 si non authentifié", async () => {
    mockAuth.mockResolvedValue(null)
    const req = buildJsonRequest("/api/rencontres/like", { toUserId: "usr_bob" })
    const res = await likeModule.POST(req as never)
    expect(res.status).toBe(401)
  })
})

// ─── Matches ─────────────────────────────────────────────────────

describe("Rencontres — Matches", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(fakeSession)
  })

  it("GET retourne les matches de l'utilisateur (200)", async () => {
    prismaMock.rencontreMatch.findMany.mockResolvedValue([
      {
        id: "match_1",
        conversationId: "conv_1",
        createdAt: new Date().toISOString(),
        userAId: "usr_alice",
        userBId: "usr_bob",
        actif: true,
        userA: {
          id: "usr_alice",
          prenom: "Alice",
          nom: "Yao",
          pseudo: null,
          photoUrl: null,
          bio: null,
          ville: null,
          verificationStatus: "AUCUNE",
          derniereVueAt: null,
        },
        userB: {
          id: "usr_bob",
          prenom: "Bob",
          nom: "Dupont",
          pseudo: null,
          photoUrl: null,
          bio: null,
          ville: "Abidjan",
          verificationStatus: "AUCUNE",
          derniereVueAt: null,
        },
      },
    ])
    const res = await matchesModule.GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.matches).toHaveLength(1)
    // Alice est userA → interlocuteur = Bob
    expect(json.matches[0].interlocuteur.id).toBe("usr_bob")
  })

  it("GET retourne interlocuteur=userA si user est userB", async () => {
    prismaMock.rencontreMatch.findMany.mockResolvedValue([
      {
        id: "match_2",
        conversationId: null,
        createdAt: new Date().toISOString(),
        userAId: "usr_charlie",
        userBId: "usr_alice",
        actif: true,
        userA: {
          id: "usr_charlie",
          prenom: "Charlie",
          nom: "K",
          pseudo: null,
          photoUrl: null,
          bio: null,
          ville: null,
          verificationStatus: "AUCUNE",
          derniereVueAt: null,
        },
        userB: {
          id: "usr_alice",
          prenom: "Alice",
          nom: "Yao",
          pseudo: null,
          photoUrl: null,
          bio: null,
          ville: null,
          verificationStatus: "AUCUNE",
          derniereVueAt: null,
        },
      },
    ])
    const res = await matchesModule.GET()
    const json = await res.json()
    expect(json.matches[0].interlocuteur.id).toBe("usr_charlie")
  })

  it("GET retourne liste vide s'il n'y a pas de matches (200)", async () => {
    prismaMock.rencontreMatch.findMany.mockResolvedValue([])
    const res = await matchesModule.GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.matches).toHaveLength(0)
  })

  it("GET 401 si non authentifié", async () => {
    mockAuth.mockResolvedValue(null)
    const res = await matchesModule.GET()
    expect(res.status).toBe(401)
  })
})

// ─── Unmatch ─────────────────────────────────────────────────────

describe("Rencontres — Unmatch (DELETE /[matchId])", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(fakeSession)
  })

  it("DELETE désactive le match (200)", async () => {
    prismaMock.rencontreMatch.findUnique.mockResolvedValue({
      id: "match_1",
      userAId: "usr_alice",
      userBId: "usr_bob",
      actif: true,
    })
    prismaMock.rencontreMatch.update.mockResolvedValue({ id: "match_1", actif: false })
    const req = buildRequest("/api/rencontres/match_1", { method: "DELETE" })
    const res = await matchIdModule.DELETE(req as never, {
      params: Promise.resolve({ matchId: "match_1" }),
    })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(prismaMock.rencontreMatch.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { actif: false } })
    )
  })

  it("DELETE 404 si match introuvable", async () => {
    prismaMock.rencontreMatch.findUnique.mockResolvedValue(null)
    const req = buildRequest("/api/rencontres/ghost", { method: "DELETE" })
    const res = await matchIdModule.DELETE(req as never, {
      params: Promise.resolve({ matchId: "ghost" }),
    })
    expect(res.status).toBe(404)
  })

  it("DELETE 403 si l'utilisateur n'est pas participant", async () => {
    prismaMock.rencontreMatch.findUnique.mockResolvedValue({
      id: "match_x",
      userAId: "usr_charlie",
      userBId: "usr_dave",
      actif: true,
    })
    const req = buildRequest("/api/rencontres/match_x", { method: "DELETE" })
    const res = await matchIdModule.DELETE(req as never, {
      params: Promise.resolve({ matchId: "match_x" }),
    })
    expect(res.status).toBe(403)
  })

  it("DELETE 401 si non authentifié", async () => {
    mockAuth.mockResolvedValue(null)
    const req = buildRequest("/api/rencontres/match_1", { method: "DELETE" })
    const res = await matchIdModule.DELETE(req as never, {
      params: Promise.resolve({ matchId: "match_1" }),
    })
    expect(res.status).toBe(401)
  })

  it("DELETE fonctionne si user est userB", async () => {
    prismaMock.rencontreMatch.findUnique.mockResolvedValue({
      id: "match_2",
      userAId: "usr_charlie",
      userBId: "usr_alice",
      actif: true,
    })
    prismaMock.rencontreMatch.update.mockResolvedValue({ id: "match_2", actif: false })
    const req = buildRequest("/api/rencontres/match_2", { method: "DELETE" })
    const res = await matchIdModule.DELETE(req as never, {
      params: Promise.resolve({ matchId: "match_2" }),
    })
    expect(res.status).toBe(200)
  })
})

// ─── Qui m'a liké ────────────────────────────────────────────────

describe("Rencontres — Qui m'a liké", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(fakeSession)
  })

  it("GET retourne les likes reçus (200)", async () => {
    prismaMock.rencontreLike.findMany.mockResolvedValue([
      {
        fromUserId: "usr_bob",
        type: "LIKE",
        createdAt: new Date(),
        fromUser: {
          id: "usr_bob",
          prenom: "Bob",
          photoUrl: null,
          ville: "Abidjan",
          dateNaissance: null,
          verificationStatus: "AUCUNE",
        },
      },
    ])
    prismaMock.rencontreMatch.findMany.mockResolvedValue([])
    const req = buildRequest("/api/rencontres/qui-ma-like")
    const res = await quiMALikeModule.GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.count).toBe(1)
    expect(json.likes[0].id).toBe("usr_bob")
  })

  it("GET exclut ceux avec qui il y a déjà un match actif", async () => {
    prismaMock.rencontreLike.findMany.mockResolvedValue([
      {
        fromUserId: "usr_bob",
        type: "LIKE",
        createdAt: new Date(),
        fromUser: {
          id: "usr_bob",
          prenom: "Bob",
          photoUrl: null,
          ville: null,
          dateNaissance: null,
          verificationStatus: "AUCUNE",
        },
      },
    ])
    prismaMock.rencontreMatch.findMany.mockResolvedValue([
      { userAId: "usr_alice", userBId: "usr_bob" },
    ])
    const req = buildRequest("/api/rencontres/qui-ma-like")
    const res = await quiMALikeModule.GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.count).toBe(0)
    expect(json.likes).toHaveLength(0)
  })

  it("GET exclut correctement quand l'utilisateur est userB du match", async () => {
    prismaMock.rencontreLike.findMany.mockResolvedValue([
      {
        fromUserId: "usr_charlie",
        type: "SUPER_LIKE",
        createdAt: new Date(),
        fromUser: {
          id: "usr_charlie",
          prenom: "Charlie",
          photoUrl: null,
          ville: null,
          dateNaissance: null,
          verificationStatus: "AUCUNE",
        },
      },
    ])
    // Alice est userB ici
    prismaMock.rencontreMatch.findMany.mockResolvedValue([
      { userAId: "usr_charlie", userBId: "usr_alice" },
    ])
    const req = buildRequest("/api/rencontres/qui-ma-like")
    const res = await quiMALikeModule.GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.count).toBe(0)
  })

  it("GET retourne liste vide si aucun like (200)", async () => {
    prismaMock.rencontreLike.findMany.mockResolvedValue([])
    prismaMock.rencontreMatch.findMany.mockResolvedValue([])
    const req = buildRequest("/api/rencontres/qui-ma-like")
    const res = await quiMALikeModule.GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.count).toBe(0)
    expect(json.likes).toHaveLength(0)
  })

  it("GET 401 si non authentifié", async () => {
    mockAuth.mockResolvedValue(null)
    const req = buildRequest("/api/rencontres/qui-ma-like")
    const res = await quiMALikeModule.GET()
    expect(res.status).toBe(401)
  })
})
