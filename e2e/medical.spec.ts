import { test, expect } from "@playwright/test"

test.describe("Portail Médical — Accès sécurisé", () => {
  test("suivi-médical redirige vers connexion si non authentifié", async ({ page }) => {
    await page.goto("/suivi-medical")
    await page.waitForLoadState("networkidle")

    await expect(page).toHaveURL(/connexion/, { timeout: 10_000 })
  })

  test("API médicale refuse les requêtes non authentifiées", async ({ request }) => {
    const response = await request.get("/api/medical/dossier")
    expect(response.status()).toBe(401)
  })

  test("API mesures santé refuse les requêtes non authentifiées", async ({ request }) => {
    const response = await request.get("/api/medical/mesures")
    expect(response.status()).toBe(401)
  })

  test("API documents médicaux refuse les requêtes non authentifiées", async ({ request }) => {
    const response = await request.get("/api/medical/documents")
    expect(response.status()).toBe(401)
  })

  test("API messagerie médicale refuse les requêtes non authentifiées", async ({ request }) => {
    const response = await request.get("/api/medical/messages")
    expect(response.status()).toBe(401)
  })

  test("les données médicales ne sont pas exposées dans le HTML public", async ({ page }) => {
    await page.goto("/")
    const html = await page.content()

    // Vérifier qu'aucune donnée médicale n'apparaît dans le HTML public
    expect(html).not.toContain("pathologie")
    expect(html).not.toContain("dossierMedical")
    expect(html).not.toContain("antecedent")
  })
})

test.describe("API — Protection des routes critiques", () => {
  test("POST /api/paiement/initier refuse sans auth", async ({ request }) => {
    const response = await request.post("/api/paiement/initier", {
      data: { commandeId: "fake", montant: 1000, methode: "wave" },
    })
    expect(response.status()).toBe(401)
  })

  test("POST /api/rdv refuse sans auth", async ({ request }) => {
    const response = await request.post("/api/rdv", {
      data: { soinId: "fake", dateHeure: new Date().toISOString() },
    })
    expect(response.status()).toBe(401)
  })

  test("POST /api/messages refuse sans auth", async ({ request }) => {
    const response = await request.post("/api/messages", {
      data: { destinataireId: "fake", contenu: "test" },
    })
    expect(response.status()).toBe(401)
  })

  test("les routes admin refusent sans auth", async ({ request }) => {
    const response = await request.get("/api/admin/stats")
    expect([401, 403, 404]).toContain(response.status())
  })

  test("POST /api/auth/inscription valide les données", async ({ request }) => {
    // Envoi de données invalides
    const response = await request.post("/api/auth/inscription", {
      data: { email: "pas-un-email" },
    })
    expect([400, 422]).toContain(response.status())
  })
})
