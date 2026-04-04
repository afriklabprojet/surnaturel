import { describe, it, expect, beforeEach, vi } from "vitest"
import { prismaMock, buildRequest } from "./setup"

// Set webhook secret before importing the module
process.env.JEKO_WEBHOOK_SECRET = "test-webhook-secret"

const { POST } = await import("@/app/api/paiement/webhook/route")

const fakeCommande = {
  id: "cmd_test",
  total: 25000,
  statut: "EN_ATTENTE",
  paiementId: null,
  webhookTraite: false,
  methodePaiement: "wave",
  tentativesPaiement: 1,
  dernierEchecAt: null,
  relanceSmsEnvoyee: false,
  user: {
    id: "usr_1",
    email: "client@example.com",
    prenom: "Aminata",
    nom: "Koné",
  },
  lignes: [
    {
      quantite: 2,
      prixUnitaire: 12500,
      produit: { nom: "Crème hydratante" },
    },
  ],
}

function buildWebhookRequest(body: Record<string, unknown>) {
  return buildRequest("/api/paiement/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "test-webhook-secret",
    },
    body: JSON.stringify(body),
  })
}

describe("Payment webhook — Jeko", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.JEKO_WEBHOOK_HMAC_SECRET
  })

  it("rejects requests without valid API key (401)", async () => {
    const req = buildRequest("/api/paiement/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "wrong-key",
      },
      body: JSON.stringify({ reference: "CMD-abc-123", status: "success" }),
    })

    const res = await POST(req as never)
    expect(res.status).toBe(401)
  })

  it("rejects requests with missing data (400)", async () => {
    const req = buildWebhookRequest({})
    const res = await POST(req as never)
    expect(res.status).toBe(400)
  })

  it("rejects invalid reference format (400)", async () => {
    const req = buildWebhookRequest({
      reference: "INVALID-REF",
      status: "success",
      paymentRequestId: "pay_123",
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
  })

  it("returns 404 for unknown command (404)", async () => {
    prismaMock.commande.findUnique.mockResolvedValue(null)

    const req = buildWebhookRequest({
      reference: "CMD-cmd_unknown-1234567890",
      status: "success",
      paymentRequestId: "pay_123",
    })

    const res = await POST(req as never)
    expect(res.status).toBe(404)
  })

  it("marks order as PAYEE on success", async () => {
    prismaMock.commande.findUnique.mockResolvedValue(fakeCommande)
    prismaMock.commande.update.mockResolvedValue({
      ...fakeCommande,
      statut: "PAYEE",
    })

    const req = buildWebhookRequest({
      reference: "CMD-cmd_test-1234567890",
      status: "success",
      paymentRequestId: "pay_success",
    })

    const res = await POST(req as never)
    expect(res.status).toBe(200)

    expect(prismaMock.commande.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "cmd_test" },
        data: expect.objectContaining({
          statut: "PAYEE",
          paiementId: "pay_success",
          webhookTraite: true,
        }),
      })
    )
  })

  it("sets EN_ATTENTE on error status (allows retry)", async () => {
    prismaMock.commande.findUnique.mockResolvedValue(fakeCommande)
    prismaMock.commande.update.mockResolvedValue({
      ...fakeCommande,
      statut: "EN_ATTENTE",
    })

    const req = buildWebhookRequest({
      reference: "CMD-cmd_test-1234567890",
      status: "error",
      paymentRequestId: "pay_fail",
      paymentMethod: "wave",
    })

    const res = await POST(req as never)
    expect(res.status).toBe(200)

    expect(prismaMock.commande.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "cmd_test" },
        data: expect.objectContaining({
          statut: "EN_ATTENTE",
          webhookTraite: false,
          dernierEchecAt: expect.any(Date),
        }),
      })
    )
  })

  it("handles idempotent duplicate webhook (already processed)", async () => {
    prismaMock.commande.findUnique.mockResolvedValue({
      ...fakeCommande,
      webhookTraite: true,
      statut: "PAYEE",
    })

    const req = buildWebhookRequest({
      reference: "CMD-cmd_test-1234567890",
      status: "success",
      paymentRequestId: "pay_dup",
    })

    const res = await POST(req as never)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.alreadyProcessed).toBe(true)
    expect(prismaMock.commande.update).not.toHaveBeenCalled()
  })

  it("handles compound commandeId with hyphens", async () => {
    prismaMock.commande.findUnique.mockResolvedValue(null)

    const req = buildWebhookRequest({
      reference: "CMD-cuid-abc-def-1234567890",
      status: "success",
      paymentRequestId: "pay_123",
    })

    const res = await POST(req as never)
    // Returns 404 because commande not found, but proves the parsing works
    expect(res.status).toBe(404)
    expect(prismaMock.commande.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "cuid-abc-def" },
      })
    )
  })

  it("ignores unknown status values gracefully", async () => {
    prismaMock.commande.findUnique.mockResolvedValue(fakeCommande)

    const req = buildWebhookRequest({
      reference: "CMD-cmd_test-1234567890",
      status: "pending",
      paymentRequestId: "pay_pending",
    })

    const res = await POST(req as never)
    expect(res.status).toBe(200)
    // No update called for unknown status
    expect(prismaMock.commande.update).not.toHaveBeenCalled()
  })

  it("rejects invalid HMAC signature when HMAC secret is set", async () => {
    process.env.JEKO_WEBHOOK_HMAC_SECRET = "hmac-test-secret"

    try {
      const body = JSON.stringify({ reference: "CMD-cmd_test-1234567890", status: "success" })
      // Provide a 64-char hex string (same length as SHA-256 hex digest) to avoid timingSafeEqual length mismatch
      const wrongSig = "a".repeat(64)

      const req = buildRequest("/api/paiement/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "test-webhook-secret",
          "x-jeko-signature": wrongSig,
        },
        body,
      })

      const res = await POST(req as never)
      expect(res.status).toBe(401)
    } finally {
      delete process.env.JEKO_WEBHOOK_HMAC_SECRET
    }
  })

  it("rejects invalid JSON body (400)", async () => {
    const req = buildRequest("/api/paiement/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "test-webhook-secret",
      },
      body: "not json at all",
    })

    const res = await POST(req as never)
    expect(res.status).toBe(400)
  })

  it("handles abonnement communauté success", async () => {
    prismaMock.abonnementMensuel.findUnique.mockResolvedValue({
      id: "abo_1",
      userId: "usr_1",
      statut: "EN_ATTENTE",
      user: { id: "usr_1", email: "client@example.com", prenom: "Aminata", nom: "Koné" },
      formule: { nom: "Premium", prixMensuel: 5000 },
    })
    prismaMock.abonnementMensuel.update.mockResolvedValue({})
    prismaMock.paiementAbonnement.updateMany.mockResolvedValue({ count: 1 })
    prismaMock.user.update.mockResolvedValue({})

    const req = buildWebhookRequest({
      reference: "CMD-ABCOMM-abo_1-1234567890",
      status: "success",
      paymentRequestId: "pay_abo",
    })

    const res = await POST(req as never)
    expect(res.status).toBe(200)
  })

  it("handles abonnement communauté error status", async () => {
    prismaMock.abonnementMensuel.findUnique.mockResolvedValue({
      id: "abo_2",
      userId: "usr_1",
      statut: "EN_ATTENTE",
      user: { id: "usr_1", email: "client@example.com", prenom: "Aminata", nom: "Koné" },
      formule: { nom: "Premium", prixMensuel: 5000 },
    })
    prismaMock.paiementAbonnement.updateMany.mockResolvedValue({ count: 1 })

    const req = buildWebhookRequest({
      reference: "CMD-ABCOMM-abo_2-1234567890",
      status: "error",
      errorMessage: "Paiement refusé",
    })

    const res = await POST(req as never)
    expect(res.status).toBe(200)
  })

  it("returns 404 for unknown abonnement", async () => {
    prismaMock.abonnementMensuel.findUnique.mockResolvedValue(null)

    const req = buildWebhookRequest({
      reference: "CMD-ABCOMM-abo_ghost-1234567890",
      status: "success",
    })

    const res = await POST(req as never)
    expect(res.status).toBe(404)
  })

  it("handles idempotent abonnement already active", async () => {
    prismaMock.abonnementMensuel.findUnique.mockResolvedValue({
      id: "abo_3",
      userId: "usr_1",
      statut: "ACTIF",
      user: { id: "usr_1", email: "client@example.com", prenom: "Aminata", nom: "Koné" },
      formule: { nom: "Premium", prixMensuel: 5000 },
    })

    const req = buildWebhookRequest({
      reference: "CMD-ABCOMM-abo_3-1234567890",
      status: "success",
    })

    const res = await POST(req as never)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.alreadyProcessed).toBe(true)
  })

  it("returns 502 when Jeko verification fails for abonnement", async () => {
    const { verifierStatutPaiement } = await import("@/lib/jeko")
    vi.mocked(verifierStatutPaiement).mockRejectedValueOnce(new Error("Jeko down"))

    prismaMock.abonnementMensuel.findUnique.mockResolvedValue({
      id: "abo_jeko_fail",
      userId: "usr_1",
      statut: "EN_ATTENTE",
      user: { id: "usr_1", email: "e@example.com", prenom: "A", nom: "K" },
      formule: { nom: "Premium", prixMensuel: 5000 },
    })

    const req = buildWebhookRequest({
      reference: "CMD-ABCOMM-abo_jeko_fail-1234567890",
      status: "success",
      paymentRequestId: "pay_abo_fail",
    })

    const res = await POST(req as never)
    expect(res.status).toBe(502)
  })

  it("skips unconfirmed abonnement when Jeko says not success", async () => {
    const { verifierStatutPaiement } = await import("@/lib/jeko")
    vi.mocked(verifierStatutPaiement).mockResolvedValueOnce("pending")

    prismaMock.abonnementMensuel.findUnique.mockResolvedValue({
      id: "abo_unconfirmed",
      userId: "usr_1",
      statut: "EN_ATTENTE",
      user: { id: "usr_1", email: "e@example.com", prenom: "A", nom: "K" },
      formule: { nom: "Premium", prixMensuel: 5000 },
    })

    const req = buildWebhookRequest({
      reference: "CMD-ABCOMM-abo_unconfirmed-1234567890",
      status: "success",
      paymentRequestId: "pay_abo_pending",
    })

    const res = await POST(req as never)
    const json = await res.json()
    expect(json.skipped).toBe("unconfirmed")
  })

  it("returns 502 when Jeko verification fails on success", async () => {
    const { verifierStatutPaiement } = await import("@/lib/jeko")
    vi.mocked(verifierStatutPaiement).mockRejectedValueOnce(new Error("Jeko down"))

    prismaMock.commande.findUnique.mockResolvedValue(fakeCommande)

    const req = buildWebhookRequest({
      reference: "CMD-cmd_test-1234567890",
      status: "success",
      paymentRequestId: "pay_verify_fail",
    })

    const res = await POST(req as never)
    expect(res.status).toBe(502)
  })

  it("logs error when background email fails after payment", async () => {
    const { envoyerEmailCommandePayee } = await import("@/lib/email")
    vi.mocked(envoyerEmailCommandePayee).mockRejectedValueOnce(new Error("Email service down"))

    prismaMock.commande.findUnique.mockResolvedValue(fakeCommande)

    const req = buildWebhookRequest({
      reference: "CMD-cmd_test-1234567890",
      status: "success",
      paymentRequestId: "pay_email_fail",
    })

    const res = await POST(req as never)
    expect(res.status).toBe(200)
    // Wait for background .catch() to settle
    await new Promise((r) => setTimeout(r, 50))
  })

  it("skips unconfirmed payment when Jeko says not success", async () => {
    const { verifierStatutPaiement } = await import("@/lib/jeko")
    vi.mocked(verifierStatutPaiement).mockResolvedValueOnce("pending")

    prismaMock.commande.findUnique.mockResolvedValue(fakeCommande)

    const req = buildWebhookRequest({
      reference: "CMD-cmd_test-1234567890",
      status: "success",
      paymentRequestId: "pay_unconfirmed",
    })

    const res = await POST(req as never)
    const json = await res.json()
    expect(json.skipped).toBe("unconfirmed")
    expect(prismaMock.commande.update).not.toHaveBeenCalled()
  })
})
