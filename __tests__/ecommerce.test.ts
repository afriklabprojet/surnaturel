import { describe, it, expect, beforeEach, vi } from "vitest"
import { prismaMock, mockAuth, buildJsonRequest } from "./setup"

const { POST } = await import("@/app/api/boutique/commandes/route")

const fakeSession = {
  user: {
    id: "usr_buyer",
    email: "buyer@example.com",
    prenom: "Fatou",
    nom: "Diallo",
    role: "CLIENT",
  },
}

const fakeProduit = {
  id: "prod_1",
  nom: "Crème hydratante",
  prix: 5000,
  prixPromo: null as number | null,
  stock: 10,
  actif: true,
}

describe("E-commerce — Commandes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(fakeSession)
    // Le route vérifie le téléphone de l'utilisateur avant de créer la commande
    prismaMock.user.findUnique.mockResolvedValue({ telephone: "+2250101020304" })
  })

  it("creates an order with valid items (201)", async () => {
    prismaMock.produit.findMany.mockResolvedValue([fakeProduit])
    prismaMock.produit.update.mockResolvedValue({})
    prismaMock.commande.create.mockResolvedValue({
      id: "cmd_1",
      total: 10000,
      lignes: [
        { produit: { nom: "Crème hydratante" }, quantite: 2, prixUnitaire: 5000 },
      ],
      user: { email: "buyer@example.com", prenom: "Fatou" },
    })

    const req = buildJsonRequest("/api/boutique/commandes", {
      items: [{ produitId: "prod_1", quantite: 2 }],
    })

    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.commandeId).toBe("cmd_1")
  })

  it("rejects order for out-of-stock product (409)", async () => {
    prismaMock.produit.findMany.mockResolvedValue([
      { ...fakeProduit, stock: 1 },
    ])

    const req = buildJsonRequest("/api/boutique/commandes", {
      items: [{ produitId: "prod_1", quantite: 5 }],
    })

    const res = await POST(req)
    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.error).toContain("Stock insuffisant")
  })

  it("rejects order for non-existent product (409)", async () => {
    prismaMock.produit.findMany.mockResolvedValue([]) // no matching product

    const req = buildJsonRequest("/api/boutique/commandes", {
      items: [{ produitId: "prod_ghost", quantite: 1 }],
    })

    const res = await POST(req)
    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.error).toContain("introuvable")
  })

  it("uses promo price when available", async () => {
    const promo = { ...fakeProduit, prixPromo: 3500 }
    prismaMock.produit.findMany.mockResolvedValue([promo])
    prismaMock.produit.update.mockResolvedValue({})
    prismaMock.commande.create.mockResolvedValue({
      id: "cmd_promo",
      total: 3500,
      lignes: [
        { produit: { nom: "Crème hydratante" }, quantite: 1, prixUnitaire: 3500 },
      ],
      user: { email: "buyer@example.com", prenom: "Fatou" },
    })

    const req = buildJsonRequest("/api/boutique/commandes", {
      items: [{ produitId: "prod_1", quantite: 1 }],
    })

    const res = await POST(req)
    expect(res.status).toBe(201)
  })

  it("rejects unauthenticated request (401)", async () => {
    mockAuth.mockResolvedValue(null)

    const req = buildJsonRequest("/api/boutique/commandes", {
      items: [{ produitId: "prod_1", quantite: 1 }],
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it("rejects empty items array (400)", async () => {
    const req = buildJsonRequest("/api/boutique/commandes", {
      items: [],
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("rejects invalid body (400)", async () => {
    const req = new Request("http://localhost:3000/api/boutique/commandes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "broken",
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("rejects user without phone number (400)", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ telephone: null })

    const req = buildJsonRequest("/api/boutique/commandes", {
      items: [{ produitId: "prod_1", quantite: 1 }],
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain("téléphone")
  })

  it("rejects user with invalid phone format (400)", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ telephone: "123" })

    const req = buildJsonRequest("/api/boutique/commandes", {
      items: [{ produitId: "prod_1", quantite: 1 }],
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain("téléphone")
  })

  it("applies promo code from AppConfig", async () => {
    prismaMock.appConfig.findUnique.mockResolvedValue({
      cle: "bandeau_promo",
      valeur: JSON.stringify({
        actif: true,
        code: "PROMO10",
        texte: "−10% sur tout",
        detail: "10% de réduction",
      }),
    })
    prismaMock.produit.findMany.mockResolvedValue([fakeProduit])
    prismaMock.produit.update.mockResolvedValue({})
    prismaMock.commande.create.mockResolvedValue({
      id: "cmd_promo2",
      total: 9000,
      lignes: [
        { produit: { nom: "Crème hydratante" }, quantite: 2, prixUnitaire: 5000 },
      ],
      user: { email: "buyer@example.com", prenom: "Fatou" },
    })

    const req = buildJsonRequest("/api/boutique/commandes", {
      items: [{ produitId: "prod_1", quantite: 2 }],
      codePromo: "PROMO10",
    })

    const res = await POST(req)
    expect(res.status).toBe(201)
  })

  it("ignores promo code when bandeau_promo config not found", async () => {
    prismaMock.appConfig.findUnique.mockResolvedValue(null)
    prismaMock.produit.findMany.mockResolvedValue([fakeProduit])
    prismaMock.produit.update.mockResolvedValue({})
    prismaMock.commande.create.mockResolvedValue({
      id: "cmd_no_promo_config",
      total: 10000,
      lignes: [{ produit: { nom: "Crème" }, quantite: 2, prixUnitaire: 5000 }],
      user: { email: "buyer@example.com", prenom: "Fatou" },
    })

    const req = buildJsonRequest("/api/boutique/commandes", {
      items: [{ produitId: "prod_1", quantite: 2 }],
      codePromo: "INVALID",
    })

    const res = await POST(req)
    expect(res.status).toBe(201)
  })

  it("ignores promo code when code does not match", async () => {
    prismaMock.appConfig.findUnique.mockResolvedValue({
      cle: "bandeau_promo",
      valeur: JSON.stringify({
        actif: true,
        code: "BIENVENUE",
        texte: "−10% sur tout",
      }),
    })
    prismaMock.produit.findMany.mockResolvedValue([fakeProduit])
    prismaMock.produit.update.mockResolvedValue({})
    prismaMock.commande.create.mockResolvedValue({
      id: "cmd_mismatch",
      total: 10000,
      lignes: [{ produit: { nom: "Crème" }, quantite: 2, prixUnitaire: 5000 }],
      user: { email: "buyer@example.com", prenom: "Fatou" },
    })

    const req = buildJsonRequest("/api/boutique/commandes", {
      items: [{ produitId: "prod_1", quantite: 2 }],
      codePromo: "WRONGCODE",
    })

    const res = await POST(req)
    expect(res.status).toBe(201)
  })

  it("handles promo texte without percentage pattern", async () => {
    prismaMock.appConfig.findUnique.mockResolvedValue({
      cle: "bandeau_promo",
      valeur: JSON.stringify({
        actif: true,
        code: "OFFRE",
        texte: "Offre spéciale sans pourcentage",
      }),
    })
    prismaMock.produit.findMany.mockResolvedValue([fakeProduit])
    prismaMock.produit.update.mockResolvedValue({})
    prismaMock.commande.create.mockResolvedValue({
      id: "cmd_no_pct",
      total: 10000,
      lignes: [{ produit: { nom: "Crème" }, quantite: 2, prixUnitaire: 5000 }],
      user: { email: "buyer@example.com", prenom: "Fatou" },
    })

    const req = buildJsonRequest("/api/boutique/commandes", {
      items: [{ produitId: "prod_1", quantite: 2 }],
      codePromo: "OFFRE",
    })

    const res = await POST(req)
    expect(res.status).toBe(201)
  })

  it("creates order with delivery zone (zoneId)", async () => {
    prismaMock.appConfig.findUnique.mockResolvedValue({
      cle: "livraison",
      valeur: JSON.stringify({
        zones: [{ id: "zone_1", nom: "Cocody", frais: 2000, actif: true }],
        seuilGratuit: 50000,
      }),
    })
    prismaMock.produit.findMany.mockResolvedValue([fakeProduit])
    prismaMock.produit.update.mockResolvedValue({})
    prismaMock.commande.create.mockResolvedValue({
      id: "cmd_livraison",
      total: 12000,
      lignes: [
        { produit: { nom: "Crème hydratante" }, quantite: 2, prixUnitaire: 5000 },
      ],
      user: { email: "buyer@example.com", prenom: "Fatou" },
    })

    const req = buildJsonRequest("/api/boutique/commandes", {
      items: [{ produitId: "prod_1", quantite: 2 }],
      zoneId: "zone_1",
    })

    const res = await POST(req)
    expect(res.status).toBe(201)
  })

  it("creates order with delivery address", async () => {
    prismaMock.produit.findMany.mockResolvedValue([fakeProduit])
    prismaMock.produit.update.mockResolvedValue({})
    prismaMock.commande.create.mockResolvedValue({
      id: "cmd_addr",
      total: 5000,
      lignes: [
        { produit: { nom: "Crème hydratante" }, quantite: 1, prixUnitaire: 5000 },
      ],
      user: { email: "buyer@example.com", prenom: "Fatou" },
    })

    const req = buildJsonRequest("/api/boutique/commandes", {
      items: [{ produitId: "prod_1", quantite: 1 }],
      nomDestinataire: "Fatou Diallo",
      adresseLivraison: "Cocody, Abidjan",
      telephoneLivraison: "+2250101020304",
    })

    const res = await POST(req)
    expect(res.status).toBe(201)
  })

  it("handles unexpected server error (500)", async () => {
    prismaMock.produit.findMany.mockRejectedValue(new Error("DB connection lost"))

    const req = buildJsonRequest("/api/boutique/commandes", {
      items: [{ produitId: "prod_1", quantite: 1 }],
    })

    const res = await POST(req)
    expect(res.status).toBe(500)
  })

  it("returns generic error message when non-Error is thrown (500)", async () => {
    prismaMock.produit.findMany.mockRejectedValue("string error")

    const req = buildJsonRequest("/api/boutique/commandes", {
      items: [{ produitId: "prod_1", quantite: 1 }],
    })

    const res = await POST(req)
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe("Erreur lors de la création de la commande")
  })

  it("applies free shipping when total exceeds seuilGratuit", async () => {
    prismaMock.appConfig.findUnique.mockResolvedValue({
      cle: "livraison",
      valeur: JSON.stringify({
        zones: [{ id: "zone_1", nom: "Cocody", frais: 2000, actif: true }],
        seuilGratuit: 5000,
      }),
    })
    prismaMock.produit.findMany.mockResolvedValue([{ ...fakeProduit, prix: 6000 }])
    prismaMock.produit.update.mockResolvedValue({})
    prismaMock.commande.create.mockResolvedValue({
      id: "cmd_free_ship",
      total: 6000,
      lignes: [{ produit: { nom: "Crème" }, quantite: 1, prixUnitaire: 6000 }],
      user: { email: "buyer@example.com", prenom: "Fatou" },
    })

    const req = buildJsonRequest("/api/boutique/commandes", {
      items: [{ produitId: "prod_1", quantite: 1 }],
      zoneId: "zone_1",
    })

    const res = await POST(req)
    expect(res.status).toBe(201)
    // fraisLivraison should be 0 since total >= seuilGratuit
    const createCall = prismaMock.commande.create.mock.calls[0][0]
    expect(createCall.data.fraisLivraison).toBe(0)
  })

  it("uses prixPromo for zone total calculation when available", async () => {
    prismaMock.appConfig.findUnique.mockResolvedValue({
      cle: "livraison",
      valeur: JSON.stringify({
        zones: [{ id: "zone_1", nom: "Cocody", frais: 2000, actif: true }],
        seuilGratuit: 50000,
      }),
    })
    // prixPromo is lower than prix → should use prixPromo for zone total
    prismaMock.produit.findMany.mockResolvedValue([
      { ...fakeProduit, prix: 5000, prixPromo: 3500 },
    ])
    prismaMock.produit.update.mockResolvedValue({})
    prismaMock.commande.create.mockResolvedValue({
      id: "cmd_promo_zone",
      total: 5500,
      lignes: [{ produit: { nom: "Crème" }, quantite: 1, prixUnitaire: 3500 }],
      user: { email: "buyer@example.com", prenom: "Fatou" },
    })

    const req = buildJsonRequest("/api/boutique/commandes", {
      items: [{ produitId: "prod_1", quantite: 1 }],
      zoneId: "zone_1",
    })

    const res = await POST(req)
    expect(res.status).toBe(201)
    // Total below seuilGratuit → frais should be zone.frais
    const createCall = prismaMock.commande.create.mock.calls[0][0]
    expect(createCall.data.fraisLivraison).toBe(2000)
  })

  it("ignores zoneId when livraison config not found", async () => {
    prismaMock.appConfig.findUnique.mockResolvedValue(null)
    prismaMock.produit.findMany.mockResolvedValue([fakeProduit])
    prismaMock.produit.update.mockResolvedValue({})
    prismaMock.commande.create.mockResolvedValue({
      id: "cmd_no_config",
      total: 5000,
      lignes: [{ produit: { nom: "Crème" }, quantite: 1, prixUnitaire: 5000 }],
      user: { email: "buyer@example.com", prenom: "Fatou" },
    })

    const req = buildJsonRequest("/api/boutique/commandes", {
      items: [{ produitId: "prod_1", quantite: 1 }],
      zoneId: "zone_1",
    })

    const res = await POST(req)
    expect(res.status).toBe(201)
    const createCall = prismaMock.commande.create.mock.calls[0][0]
    expect(createCall.data.fraisLivraison).toBe(0)
  })

  it("ignores zoneId when zone is not found or inactive", async () => {
    prismaMock.appConfig.findUnique.mockResolvedValue({
      cle: "livraison",
      valeur: JSON.stringify({
        zones: [{ id: "zone_1", nom: "Cocody", frais: 2000, actif: false }],
      }),
    })
    prismaMock.produit.findMany.mockResolvedValue([fakeProduit])
    prismaMock.produit.update.mockResolvedValue({})
    prismaMock.commande.create.mockResolvedValue({
      id: "cmd_inactive_zone",
      total: 5000,
      lignes: [{ produit: { nom: "Crème" }, quantite: 1, prixUnitaire: 5000 }],
      user: { email: "buyer@example.com", prenom: "Fatou" },
    })

    const req = buildJsonRequest("/api/boutique/commandes", {
      items: [{ produitId: "prod_1", quantite: 1 }],
      zoneId: "zone_1",
    })

    const res = await POST(req)
    expect(res.status).toBe(201)
    const createCall = prismaMock.commande.create.mock.calls[0][0]
    expect(createCall.data.fraisLivraison).toBe(0)
  })

  it("applies zone frais when no seuilGratuit in config", async () => {
    prismaMock.appConfig.findUnique.mockResolvedValue({
      cle: "livraison",
      valeur: JSON.stringify({
        zones: [{ id: "zone_1", nom: "Cocody", frais: 1500, actif: true }],
        // no seuilGratuit
      }),
    })
    prismaMock.produit.findMany.mockResolvedValue([fakeProduit])
    prismaMock.produit.update.mockResolvedValue({})
    prismaMock.commande.create.mockResolvedValue({
      id: "cmd_no_seuil",
      total: 6500,
      lignes: [{ produit: { nom: "Crème" }, quantite: 1, prixUnitaire: 5000 }],
      user: { email: "buyer@example.com", prenom: "Fatou" },
    })

    const req = buildJsonRequest("/api/boutique/commandes", {
      items: [{ produitId: "prod_1", quantite: 1 }],
      zoneId: "zone_1",
    })

    const res = await POST(req)
    expect(res.status).toBe(201)
    const createCall = prismaMock.commande.create.mock.calls[0][0]
    expect(createCall.data.fraisLivraison).toBe(1500)
  })

  it("defaults zone frais to 0 when zone.frais is null", async () => {
    prismaMock.appConfig.findUnique.mockResolvedValue({
      cle: "livraison",
      valeur: JSON.stringify({
        zones: [{ id: "zone_1", nom: "Cocody", frais: null, actif: true }],
      }),
    })
    prismaMock.produit.findMany.mockResolvedValue([fakeProduit])
    prismaMock.produit.update.mockResolvedValue({})
    prismaMock.commande.create.mockResolvedValue({
      id: "cmd_null_frais",
      total: 5000,
      lignes: [{ produit: { nom: "Crème" }, quantite: 1, prixUnitaire: 5000 }],
      user: { email: "buyer@example.com", prenom: "Fatou" },
    })

    const req = buildJsonRequest("/api/boutique/commandes", {
      items: [{ produitId: "prod_1", quantite: 1 }],
      zoneId: "zone_1",
    })

    const res = await POST(req)
    expect(res.status).toBe(201)
    const createCall = prismaMock.commande.create.mock.calls[0][0]
    expect(createCall.data.fraisLivraison).toBe(0)
  })

  it("skips unknown product in zone total calculation", async () => {
    prismaMock.appConfig.findUnique.mockResolvedValue({
      cle: "livraison",
      valeur: JSON.stringify({
        zones: [{ id: "zone_1", nom: "Cocody", frais: 2000, actif: true }],
        seuilGratuit: 50000,
      }),
    })
    // First findMany (zone calc): only returns prod_1 — prod_2 is unknown
    prismaMock.produit.findMany.mockResolvedValueOnce([fakeProduit])
    // Second findMany (inside $transaction): returns both products
    prismaMock.produit.findMany.mockResolvedValueOnce([
      fakeProduit,
      { ...fakeProduit, id: "prod_2", nom: "Huile" },
    ])
    prismaMock.produit.update.mockResolvedValue({})
    prismaMock.commande.create.mockResolvedValue({
      id: "cmd_partial",
      total: 7000,
      lignes: [{ produit: { nom: "Crème" }, quantite: 1, prixUnitaire: 5000 }],
      user: { email: "buyer@example.com", prenom: "Fatou" },
    })

    const req = buildJsonRequest("/api/boutique/commandes", {
      items: [
        { produitId: "prod_1", quantite: 1 },
        { produitId: "prod_2", quantite: 1 },
      ],
      zoneId: "zone_1",
    })

    const res = await POST(req)
    expect(res.status).toBe(201)
  })

  it("falls back to fraisLivraisonClient when no zoneId", async () => {
    prismaMock.produit.findMany.mockResolvedValue([fakeProduit])
    prismaMock.produit.update.mockResolvedValue({})
    prismaMock.commande.create.mockResolvedValue({
      id: "cmd_fallback",
      total: 12000,
      lignes: [{ produit: { nom: "Crème" }, quantite: 2, prixUnitaire: 5000 }],
      user: { email: "buyer@example.com", prenom: "Fatou" },
    })

    const req = buildJsonRequest("/api/boutique/commandes", {
      items: [{ produitId: "prod_1", quantite: 2 }],
      fraisLivraison: 1500,
    })

    const res = await POST(req)
    expect(res.status).toBe(201)
    const createCall = prismaMock.commande.create.mock.calls[0][0]
    expect(createCall.data.fraisLivraison).toBe(1500)
  })

  it("returns stock error message as 409", async () => {
    prismaMock.produit.findMany.mockResolvedValue([{ ...fakeProduit, stock: 0 }])

    const req = buildJsonRequest("/api/boutique/commandes", {
      items: [{ produitId: "prod_1", quantite: 1 }],
    })

    const res = await POST(req)
    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.error).toContain("Stock insuffisant")
  })

  it("logs error when confirmation email fails (background catch)", async () => {
    const { envoyerEmailConfirmationCommande } = await import("@/lib/email")
    vi.mocked(envoyerEmailConfirmationCommande).mockRejectedValueOnce(new Error("Email down"))

    prismaMock.produit.findMany.mockResolvedValue([fakeProduit])
    prismaMock.commande.create.mockResolvedValue({
      id: "cmd_email_fail",
      total: 5000,
      user: { email: "client@test.com", prenom: "Awa" },
      lignes: [{ produit: { nom: "Produit Test" }, quantite: 1, prixUnitaire: 5000 }],
    })

    const req = buildJsonRequest("/api/boutique/commandes", {
      items: [{ produitId: "prod_1", quantite: 1 }],
    })

    const res = await POST(req)
    expect(res.status).toBe(201)
    // Wait for background .catch() to settle
    await new Promise((r) => setTimeout(r, 50))
  })
})
