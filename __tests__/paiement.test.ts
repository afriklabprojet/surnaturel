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
})
