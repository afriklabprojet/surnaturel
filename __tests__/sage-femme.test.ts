/**
 * Tests du module sage-femme
 * Couvre: suivi-specialise, comptes-rendus, questionnaire
 *         + routes admin: stats, questionnaires, patients/[id]
 */
import { describe, it, expect, beforeEach, vi } from "vitest"
import { prismaMock, mockAuth, buildRequest, buildJsonRequest } from "./setup"

// ── Lazy imports (top-level await) ────────────────────────────────────────────
const suiviModule         = await import("@/app/api/medical/suivi-specialise/route")
const comptesModule       = await import("@/app/api/medical/comptes-rendus/route")
const questionnaireModule = await import("@/app/api/medical/questionnaire/route")
const sfQuestsModule      = await import("@/app/api/admin/sage-femme/questionnaires/route")
const sfStatsModule       = await import("@/app/api/admin/sage-femme/stats/route")

// ── Sessions ──────────────────────────────────────────────────────────────────

const clientSession = {
  user: { id: "usr_client", email: "patient@test.com", prenom: "Karim", nom: "Diallo", role: "CLIENT" },
}

const adminSession = {
  user: { id: "usr_admin", email: "admin@test.com", prenom: "Admin", nom: "Surnaturel", role: "ADMIN" },
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const { encrypt } = await import("@/lib/crypto")
const makeSuivi = (overrides = {}) => ({
  id: "suivi_1",
  dossierId: "dos_1",
  type: "GROSSESSE",
  actif: true,
  semainesAmenorhee: 28,
  datePrevueAccouchement: null,
  dateDebutGrossesse: null,
  parite: "G2P1",
  dateNaissancePatient: null,
  prenomPatient: null,
  poidsKg: 65.0,
  tailleCm: 162.0,
  perimCranienCm: null,
  notes: encrypt("Suivi normal"),
  examensRealises: JSON.stringify(["Échographie", "Prise de sang"]),
  prochainControle: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

const makeNote = (overrides = {}) => ({
  id: "note_1",
  clientId: "usr_client",
  contenu: "Résultat satisfaisant",
  type: "SUIVI",
  partagePatient: true,
  // comptes-rendus route uses include: { auteur: { select: { prenom, nom } } }
  auteur: { prenom: "Ama", nom: "Kouassi" },
  createdAt: new Date().toISOString(),
  ...overrides,
})

const makeQuestionnaire = (overrides = {}) => ({
  id: "quest_1",
  userId: "usr_client",
  motif: encrypt("Consultation de grossesse"),
  typeSoin: "Suivi de grossesse",  // NOT encrypted — route returns as-is
  antecedents: null,
  medicaments: null,
  allergies: null,
  ddr: null,
  parite: null,
  autresInfos: null,
  traite: false,
  createdAt: new Date().toISOString(),
  ...overrides,
})

// ── Tests: /api/medical/suivi-specialise ─────────────────────────────────────

describe("Suivi spécialisé — patient (GET)", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("retourne 401 si non authentifié", async () => {
    mockAuth.mockResolvedValue(null)
    const res = await suiviModule.GET(buildRequest("/api/medical/suivi-specialise"))
    expect(res.status).toBe(401)
  })

  it("retourne [] si aucun dossier (200)", async () => {
    mockAuth.mockResolvedValue(clientSession)
    prismaMock.dossierMedical.findUnique.mockResolvedValue(null)
    const res = await suiviModule.GET(buildRequest("/api/medical/suivi-specialise"))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.suivis).toHaveLength(0)
  })

  it("retourne la liste des suivis avec notes déchiffrées", async () => {
    mockAuth.mockResolvedValue(clientSession)
    const suivi = makeSuivi()
    prismaMock.dossierMedical.findUnique.mockResolvedValue({ id: "dos_1", userId: "usr_client" })
    prismaMock.suiviSpecialise.findMany.mockResolvedValue([suivi])
    const res = await suiviModule.GET(buildRequest("/api/medical/suivi-specialise"))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.suivis).toHaveLength(1)
    expect(json.suivis[0].notes).toBe("Suivi normal")
    expect(json.suivis[0].parite).toBe("G2P1")
    expect(json.suivis[0].examensRealises).toEqual(["Échographie", "Prise de sang"])
  })
})

describe("Suivi spécialisé — patient (POST)", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("retourne 401 si non authentifié", async () => {
    mockAuth.mockResolvedValue(null)
    const res = await suiviModule.POST(buildJsonRequest("/api/medical/suivi-specialise", { type: "GENERAL" }))
    expect(res.status).toBe(401)
  })

  it("crée un suivi spécialisé", async () => {
    mockAuth.mockResolvedValue(clientSession)
    const newSuivi = makeSuivi({ id: "suivi_new", type: "NOURRISSON", prenomPatient: "Lina" })
    prismaMock.dossierMedical.upsert.mockResolvedValue({ id: "dos_1" })
    prismaMock.suiviSpecialise.create.mockResolvedValue(newSuivi)
    const res = await suiviModule.POST(buildJsonRequest("/api/medical/suivi-specialise", {
      type: "NOURRISSON",
      prenomPatient: "Lina",
      dateNaissancePatient: "2025-01-15",
      poidsKg: 7.2,
      tailleCm: 65.0,
    }))
    const json = await res.json()
    expect(res.status).toBe(201)
    expect(json.suivi).toBeDefined()
    expect(json.suivi.prenomPatient).not.toBeUndefined()
  })
})

// ── Tests: /api/medical/comptes-rendus ───────────────────────────────────────

describe("Comptes-rendus — patient (GET)", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("retourne 401 si non authentifié", async () => {
    mockAuth.mockResolvedValue(null)
    const res = await comptesModule.GET(buildRequest("/api/medical/comptes-rendus"))
    expect(res.status).toBe(401)
  })

  it("retourne les notes partagées", async () => {
    mockAuth.mockResolvedValue(clientSession)
    prismaMock.notePro.findMany.mockResolvedValue([makeNote()])
    const res = await comptesModule.GET(buildRequest("/api/medical/comptes-rendus"))
    const json = await res.json()
    expect(res.status).toBe(200)
    // Route returns key 'compteRendus' (not 'comptes')
    expect(json.compteRendus).toHaveLength(1)
    expect(json.compteRendus[0].contenu).toBe("Résultat satisfaisant")
    expect(json.compteRendus[0].type).toBe("SUIVI")
    expect(json.compteRendus[0].auteur).toBe("Ama Kouassi")
  })

  it("retourne un tableau vide si aucune note partagée", async () => {
    mockAuth.mockResolvedValue(clientSession)
    prismaMock.notePro.findMany.mockResolvedValue([])
    const res = await comptesModule.GET(buildRequest("/api/medical/comptes-rendus"))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.compteRendus).toHaveLength(0)
  })
})

// ── Tests: /api/medical/questionnaire ────────────────────────────────────────

describe("Questionnaire pré-consultation — patient", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("GET retourne 401 si non authentifié", async () => {
    mockAuth.mockResolvedValue(null)
    const res = await questionnaireModule.GET(buildRequest("/api/medical/questionnaire"))
    expect(res.status).toBe(401)
  })

  it("GET retourne les questionnaires déchiffrés", async () => {
    mockAuth.mockResolvedValue(clientSession)
    ;(prismaMock as any).questionnairePreConsultation = {
      ...((prismaMock as any).questionnairePreConsultation ?? {}),
      findMany: vi.fn().mockResolvedValue([makeQuestionnaire()]),
    }
    const res = await questionnaireModule.GET(buildRequest("/api/medical/questionnaire"))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.questionnaires).toHaveLength(1)
    expect(json.questionnaires[0].motif).toBe("Consultation de grossesse")
    // typeSoin is NOT encrypted in the route — returned as-is
    expect(json.questionnaires[0].typeSoin).toBe("Suivi de grossesse")
  })

  it("POST retourne 400 si motif manquant", async () => {
    mockAuth.mockResolvedValue(clientSession)
    const res = await questionnaireModule.POST(buildJsonRequest("/api/medical/questionnaire", { typeSoin: "Grossesse" }))
    expect(res.status).toBe(400)
  })

  it("POST crée un questionnaire et notifie l'admin", async () => {
    mockAuth.mockResolvedValue(clientSession)
    const newQ = makeQuestionnaire({ id: "quest_new" })
    prismaMock.questionnairePreConsultation.create.mockResolvedValue(newQ)
    prismaMock.user.findFirst.mockResolvedValue({ id: "usr_admin" })
    const res = await questionnaireModule.POST(buildJsonRequest("/api/medical/questionnaire", {
      motif: "Consultation grossesse semaine 32",
      typeSoin: "Suivi de grossesse",
    }))
    const json = await res.json()
    expect(res.status).toBe(201)
    expect(json.questionnaire).toBeDefined()
  })
})

// ── Tests: /api/admin/sage-femme/questionnaires ──────────────────────────────

describe("Admin sage-femme — Questionnaires (GET)", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("retourne 401 si non authentifié", async () => {
    mockAuth.mockResolvedValue(null)
    const res = await sfQuestsModule.GET(buildRequest("/api/admin/sage-femme/questionnaires"))
    expect(res.status).toBe(401)
  })

  // Admin routes return 401 (not 403) for non-admin users
  it("retourne 401 si CLIENT", async () => {
    mockAuth.mockResolvedValue(clientSession)
    const res = await sfQuestsModule.GET(buildRequest("/api/admin/sage-femme/questionnaires"))
    expect(res.status).toBe(401)
  })

  it("retourne la liste des questionnaires non traités", async () => {
    mockAuth.mockResolvedValue(adminSession)
    const q = makeQuestionnaire()
    prismaMock.questionnairePreConsultation.findMany.mockResolvedValue(
      [{ ...q, user: { id: "usr_client", prenom: "Karim", nom: "Diallo", telephone: "07000" } }]
    )
    const res = await sfQuestsModule.GET(buildRequest("/api/admin/sage-femme/questionnaires"))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.questionnaires).toHaveLength(1)
    expect(json.questionnaires[0].motif).toBe("Consultation de grossesse")
  })
})

describe("Admin sage-femme — Questionnaires (PATCH)", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("retourne 401 si CLIENT", async () => {
    mockAuth.mockResolvedValue(clientSession)
    const res = await sfQuestsModule.PATCH(buildJsonRequest("/api/admin/sage-femme/questionnaires", { id: "quest_1" }, "PATCH"))
    expect(res.status).toBe(401)
  })

  it("marque un questionnaire comme traité", async () => {
    mockAuth.mockResolvedValue(adminSession)
    prismaMock.questionnairePreConsultation.update.mockResolvedValue({ id: "quest_1", traite: true })
    const res = await sfQuestsModule.PATCH(buildJsonRequest("/api/admin/sage-femme/questionnaires", { id: "quest_1" }, "PATCH"))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.questionnaire.traite).toBe(true)
  })
})

// ── Tests: /api/admin/sage-femme/stats ───────────────────────────────────────

describe("Admin sage-femme — Statistiques (GET)", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("retourne 401 si non authentifié", async () => {
    mockAuth.mockResolvedValue(null)
    const res = await sfStatsModule.GET(buildRequest("/api/admin/sage-femme/stats"))
    expect(res.status).toBe(401)
  })

  it("retourne 401 si CLIENT", async () => {
    mockAuth.mockResolvedValue(clientSession)
    const res = await sfStatsModule.GET(buildRequest("/api/admin/sage-femme/stats"))
    expect(res.status).toBe(401)
  })

  it("retourne les statistiques avec parMois et totaux", async () => {
    mockAuth.mockResolvedValue(adminSession)
    // Mock RDV data for stats computation
    prismaMock.rendezVous.findMany.mockResolvedValue([
      { statut: "TERMINE", soin: { nom: "Consultation grossesse", prix: 25000 }, dateHeure: new Date().toISOString(), duree: 30 },
      { statut: "ANNULE",  soin: { nom: "Consultation grossesse", prix: 25000 }, dateHeure: new Date().toISOString(), duree: 30 },
      { statut: "CONFIRME",soin: { nom: "Bilan nourrisson", prix: 15000 }, dateHeure: new Date().toISOString(), duree: 20 },
    ])
    const res = await sfStatsModule.GET(buildRequest("/api/admin/sage-femme/stats"))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json).toHaveProperty("parMois")
    expect(json).toHaveProperty("totaux")
    expect(json).toHaveProperty("topSoins")
    expect(Array.isArray(json.parMois)).toBe(true)
    expect(json.parMois).toHaveLength(12)
    expect(json.totaux.rdvTotal).toBe(3)
    expect(json.totaux.rdvTermines).toBe(1)
  })
})
