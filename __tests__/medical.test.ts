import { describe, it, expect, beforeEach, vi } from "vitest"
import { prismaMock, mockAuth, buildJsonRequest, buildRequest } from "./setup"

const dossierModule = await import("@/app/api/medical/dossier/route")
const messagesModule = await import("@/app/api/medical/messages/route")

const clientSession = {
  user: {
    id: "usr_patient",
    email: "patient@example.com",
    prenom: "Mariam",
    nom: "Bamba",
    role: "CLIENT",
  },
}

const accompSession = {
  user: {
    id: "usr_medic",
    email: "medic@example.com",
    prenom: "Docteur",
    nom: "Koné",
    role: "ACCOMPAGNATEUR_MEDICAL",
  },
}

describe("Medical — Dossier médical", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns null dossier when none exists (200)", async () => {
    mockAuth.mockResolvedValue(clientSession)
    prismaMock.dossierMedical.findUnique.mockResolvedValue(null)

    const res = await dossierModule.GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.dossier).toBeNull()
  })

  it("returns decrypted dossier when it exists (200)", async () => {
    mockAuth.mockResolvedValue(clientSession)
    // Provide encrypted values (encrypt returns hex:hex:hex)
    const { encrypt } = await import("@/lib/crypto")
    prismaMock.dossierMedical.findUnique.mockResolvedValue({
      id: "dos_1",
      pathologie: encrypt("Hypertension"),
      notes: encrypt("Notes patient"),
      allergies: encrypt("Pénicilline"),
      antecedents: null,
      medicaments: null,
      groupeSanguin: encrypt("A+"),
      contactUrgence: null,
      updatedAt: new Date(),
    })

    const res = await dossierModule.GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.dossier).not.toBeNull()
    expect(json.dossier.pathologie).toBe("Hypertension")
    expect(json.dossier.allergies).toBe("Pénicilline")
    expect(json.dossier.groupeSanguin).toBe("A+")
    expect(json.dossier.antecedents).toBe("")
  })

  it("creates/updates medical record via PATCH (200)", async () => {
    mockAuth.mockResolvedValue(clientSession)
    prismaMock.dossierMedical.upsert.mockResolvedValue({})

    const req = buildJsonRequest("/api/medical/dossier", {
      pathologie: "Hypertension",
      groupeSanguin: "A+",
      allergies: "Pénicilline",
    }, "PATCH") as never

    const res = await dossierModule.PATCH(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)

    // Verify the data was encrypted before storage
    const upsertCall = prismaMock.dossierMedical.upsert.mock.calls[0][0]
    // Encrypted fields should be non-null strings (hex:hex:hex format)
    expect(upsertCall.create.pathologie).toBeDefined()
    expect(upsertCall.create.pathologie).not.toBe("Hypertension")
    expect(upsertCall.create.pathologie).toContain(":")
    expect(upsertCall.create.allergies).toContain(":")
    // groupeSanguin is also encrypted
    expect(upsertCall.create.groupeSanguin).toContain(":")
  })

  it("rejects PATCH with malformed JSON (400)", async () => {
    mockAuth.mockResolvedValue(clientSession)
    const req = new Request("http://localhost:3000/api/medical/dossier", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    })
    const res = await dossierModule.PATCH(req as never)
    expect(res.status).toBe(400)
  })

  it("rejects PATCH with invalid schema data (400)", async () => {
    mockAuth.mockResolvedValue(clientSession)
    const req = buildJsonRequest("/api/medical/dossier", {
      groupeSanguin: "INVALID_GROUP",
    }, "PATCH") as never
    const res = await dossierModule.PATCH(req)
    expect(res.status).toBe(400)
  })

  it("rejects PATCH for disallowed role (403)", async () => {
    mockAuth.mockResolvedValue({
      user: { ...clientSession.user, role: "SAGE_FEMME" },
    })
    const req = buildJsonRequest("/api/medical/dossier", {
      pathologie: "Test",
    }, "PATCH") as never
    const res = await dossierModule.PATCH(req)
    expect(res.status).toBe(403)
  })

  it("rejects PATCH for unauthenticated (401)", async () => {
    mockAuth.mockResolvedValue(null)
    const req = buildJsonRequest("/api/medical/dossier", {
      pathologie: "Test",
    }, "PATCH") as never
    const res = await dossierModule.PATCH(req)
    expect(res.status).toBe(401)
  })

  it("rejects access for SAGE_FEMME role (403)", async () => {
    mockAuth.mockResolvedValue({
      user: { ...clientSession.user, role: "SAGE_FEMME" },
    })

    const res = await dossierModule.GET()
    expect(res.status).toBe(403)
  })

  it("rejects unauthenticated access (401)", async () => {
    mockAuth.mockResolvedValue(null)

    const res = await dossierModule.GET()
    expect(res.status).toBe(401)
  })
})

describe("Medical — Messages médicaux POST", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("CLIENT sends encrypted message to ACCOMPAGNATEUR (201)", async () => {
    mockAuth.mockResolvedValue(clientSession)
    prismaMock.user.findUnique.mockResolvedValue({
      id: "usr_medic",
      role: "ACCOMPAGNATEUR_MEDICAL",
      email: "medic@example.com",
      prenom: "Docteur",
    })
    prismaMock.messageMedical.create.mockResolvedValue({
      id: "msg_1",
      expediteurId: "usr_patient",
      destinataireId: "usr_medic",
      contenu: "encrypted_value",
      expediteur: {
        id: "usr_patient",
        nom: "Bamba",
        prenom: "Mariam",
        photoUrl: null,
      },
    })

    const req = buildJsonRequest("/api/medical/messages", {
      destinataireId: "usr_medic",
      contenu: "Bonjour docteur, j'ai des douleurs",
    })

    const res = await messagesModule.POST(req as never)
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.message).toBeDefined()
    expect(json.message.id).toBe("msg_1")

    // Verify content was encrypted before storage
    const createCall = prismaMock.messageMedical.create.mock.calls[0][0]
    expect(createCall.data.contenu).not.toBe("Bonjour docteur, j'ai des douleurs")
    expect(createCall.data.contenu).toContain(":")
  })

  it("CLIENT cannot send to another CLIENT (403)", async () => {
    mockAuth.mockResolvedValue(clientSession)
    prismaMock.user.findUnique.mockResolvedValue({
      id: "usr_other_client",
      role: "CLIENT",
      email: "other@example.com",
      prenom: "Autre",
    })

    const req = buildJsonRequest("/api/medical/messages", {
      destinataireId: "usr_other_client",
      contenu: "Hello",
    })

    const res = await messagesModule.POST(req as never)
    expect(res.status).toBe(403)
  })

  it("cannot send message to self (400)", async () => {
    mockAuth.mockResolvedValue(clientSession)

    const req = buildJsonRequest("/api/medical/messages", {
      destinataireId: "usr_patient", // same as session user
      contenu: "Hello self",
    })

    const res = await messagesModule.POST(req as never)
    expect(res.status).toBe(400)
  })

  it("rejects message to unknown user (404)", async () => {
    mockAuth.mockResolvedValue(clientSession)
    prismaMock.user.findUnique.mockResolvedValue(null)

    const req = buildJsonRequest("/api/medical/messages", {
      destinataireId: "usr_ghost",
      contenu: "Hello?",
    })

    const res = await messagesModule.POST(req as never)
    expect(res.status).toBe(404)
  })

  it("rejects unauthenticated access (401)", async () => {
    mockAuth.mockResolvedValue(null)

    const req = buildJsonRequest("/api/medical/messages", {
      destinataireId: "usr_medic",
      contenu: "test",
    })

    const res = await messagesModule.POST(req as never)
    expect(res.status).toBe(401)
  })

  it("rejects malformed JSON body (400)", async () => {
    mockAuth.mockResolvedValue(clientSession)
    const req = new Request("http://localhost:3000/api/medical/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    })
    const res = await messagesModule.POST(req as never)
    expect(res.status).toBe(400)
  })

  it("rejects invalid data (empty contenu) (400)", async () => {
    mockAuth.mockResolvedValue(clientSession)
    const req = buildJsonRequest("/api/medical/messages", {
      destinataireId: "usr_medic",
      contenu: "",
    })
    const res = await messagesModule.POST(req as never)
    expect(res.status).toBe(400)
  })

  it("rejects disallowed role (SAGE_FEMME) (403)", async () => {
    mockAuth.mockResolvedValue({
      user: { ...clientSession.user, role: "SAGE_FEMME" },
    })
    const req = buildJsonRequest("/api/medical/messages", {
      destinataireId: "usr_medic",
      contenu: "test",
    })
    const res = await messagesModule.POST(req as never)
    expect(res.status).toBe(403)
  })

  it("ACCOMPAGNATEUR can send to CLIENT (201)", async () => {
    mockAuth.mockResolvedValue(accompSession)
    prismaMock.user.findUnique.mockResolvedValue({
      id: "usr_patient",
      role: "CLIENT",
      email: "patient@example.com",
      prenom: "Mariam",
    })
    prismaMock.messageMedical.create.mockResolvedValue({
      id: "msg_2",
      expediteurId: "usr_medic",
      destinataireId: "usr_patient",
      contenu: "encrypted",
      expediteur: {
        id: "usr_medic",
        nom: "Koné",
        prenom: "Docteur",
        photoUrl: null,
      },
    })

    const req = buildJsonRequest("/api/medical/messages", {
      destinataireId: "usr_patient",
      contenu: "Résultats OK",
    })
    const res = await messagesModule.POST(req as never)
    expect(res.status).toBe(201)
  })

  it("ACCOMPAGNATEUR cannot send to another ACCOMPAGNATEUR (403)", async () => {
    mockAuth.mockResolvedValue(accompSession)
    prismaMock.user.findUnique.mockResolvedValue({
      id: "usr_other_medic",
      role: "ACCOMPAGNATEUR_MEDICAL",
      email: "other@example.com",
      prenom: "Other",
    })

    const req = buildJsonRequest("/api/medical/messages", {
      destinataireId: "usr_other_medic",
      contenu: "Hello",
    })
    const res = await messagesModule.POST(req as never)
    expect(res.status).toBe(403)
  })
})

describe("Medical — Messages GET (historique)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns paginated decrypted messages (200)", async () => {
    mockAuth.mockResolvedValue(clientSession)
    const { encrypt } = await import("@/lib/crypto")
    const encrypted = encrypt("Bonjour docteur")

    prismaMock.messageMedical.updateMany.mockResolvedValue({ count: 0 })
    prismaMock.messageMedical.findMany.mockResolvedValue([
      {
        id: "msg_1",
        expediteurId: "usr_patient",
        destinataireId: "usr_medic",
        contenu: encrypted,
        lu: true,
        createdAt: new Date(),
        expediteur: {
          id: "usr_patient",
          nom: "Bamba",
          prenom: "Mariam",
          photoUrl: null,
        },
      },
    ])
    prismaMock.messageMedical.count.mockResolvedValue(1)

    const req = buildRequest("/api/medical/messages", {
      searchParams: { userId: "usr_medic" },
    })
    const res = await messagesModule.GET(req as never)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.messages).toHaveLength(1)
    expect(json.messages[0].contenu).toBe("Bonjour docteur")
    expect(json.pagination.total).toBe(1)
  })

  it("handles undecryptable messages gracefully", async () => {
    mockAuth.mockResolvedValue(clientSession)
    prismaMock.messageMedical.updateMany.mockResolvedValue({ count: 0 })
    prismaMock.messageMedical.findMany.mockResolvedValue([
      {
        id: "msg_bad",
        expediteurId: "usr_medic",
        destinataireId: "usr_patient",
        contenu: "corrupted_data",
        lu: false,
        createdAt: new Date(),
        expediteur: {
          id: "usr_medic",
          nom: "Koné",
          prenom: "Docteur",
          photoUrl: null,
        },
      },
    ])
    prismaMock.messageMedical.count.mockResolvedValue(1)

    const req = buildRequest("/api/medical/messages", {
      searchParams: { userId: "usr_medic" },
    })
    const res = await messagesModule.GET(req as never)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.messages[0].contenu).toBe("[Message indéchiffrable]")
  })

  it("requires userId param (400)", async () => {
    mockAuth.mockResolvedValue(clientSession)
    const req = buildRequest("/api/medical/messages")
    const res = await messagesModule.GET(req as never)
    expect(res.status).toBe(400)
  })

  it("rejects unauthenticated GET (401)", async () => {
    mockAuth.mockResolvedValue(null)
    const req = buildRequest("/api/medical/messages", {
      searchParams: { userId: "usr_medic" },
    })
    const res = await messagesModule.GET(req as never)
    expect(res.status).toBe(401)
  })

  it("rejects disallowed role GET (403)", async () => {
    mockAuth.mockResolvedValue({
      user: { ...clientSession.user, role: "SAGE_FEMME" },
    })
    const req = buildRequest("/api/medical/messages", {
      searchParams: { userId: "usr_medic" },
    })
    const res = await messagesModule.GET(req as never)
    expect(res.status).toBe(403)
  })

  it("respects pagination parameters", async () => {
    mockAuth.mockResolvedValue(clientSession)
    prismaMock.messageMedical.updateMany.mockResolvedValue({ count: 0 })
    prismaMock.messageMedical.findMany.mockResolvedValue([])
    prismaMock.messageMedical.count.mockResolvedValue(100)

    const req = buildRequest("/api/medical/messages", {
      searchParams: { userId: "usr_medic", page: "3", limit: "20" },
    })
    const res = await messagesModule.GET(req as never)
    const json = await res.json()

    expect(json.pagination.page).toBe(3)
    expect(json.pagination.limit).toBe(20)
    expect(json.pagination.pages).toBe(5)
  })
})
