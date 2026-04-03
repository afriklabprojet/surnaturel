import { describe, it, expect, beforeEach, vi } from "vitest"
import { prismaMock, mockAuth, buildJsonRequest } from "./setup"

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _accompSession = {
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

describe("Medical — Messages médicaux", () => {
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
})
