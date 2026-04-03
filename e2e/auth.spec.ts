import { test, expect } from "@playwright/test"

test.describe("Inscription → Connexion", () => {
  const email = `e2e-${Date.now()}@test.ci`
  const password = "TestSecure123!"

  test("la page inscription s'affiche correctement", async ({ page }) => {
    await page.goto("/inscription")
    await expect(page.locator("h1, h2").first()).toBeVisible()
    await expect(page.locator("input#prenom")).toBeVisible()
    await expect(page.locator("input#nom")).toBeVisible()
    await expect(page.locator("input#email")).toBeVisible()
    await expect(page.locator("input#motDePasse")).toBeVisible()
  })

  test("validation empêche soumission avec champs vides", async ({ page }) => {
    await page.goto("/inscription")
    await page.click('button[type="submit"]')
    // Le formulaire ne doit pas soumettre — on reste sur la page
    await expect(page).toHaveURL(/inscription/)
  })

  test("validation email invalide", async ({ page }) => {
    await page.goto("/inscription")
    await page.fill("input#prenom", "Test")
    await page.fill("input#nom", "E2E")
    await page.fill("input#email", "invalid-email")
    await page.fill("input#motDePasse", password)
    await page.fill("input#confirmation", password)
    await page.click('button[type="submit"]')
    // Doit rester sur la page ou afficher une erreur
    await expect(page).toHaveURL(/inscription/)
  })

  test("inscription complète crée un compte", async ({ page }) => {
    await page.goto("/inscription")
    await page.fill("input#prenom", "Test")
    await page.fill("input#nom", "E2E")
    await page.fill("input#email", email)
    await page.fill("input#telephone", "0700000000")
    await page.fill("input#motDePasse", password)
    await page.fill("input#confirmation", password)

    // Cocher les conditions si présent
    const checkbox = page.locator('input[type="checkbox"]').first()
    if (await checkbox.isVisible()) {
      await checkbox.check()
    }

    await page.click('button[type="submit"]')

    // Attendre la redirection ou le message de succès
    await expect(
      page.getByText(/compte créé|vérifi|succès/i).or(page.locator('[class*="success"]'))
    ).toBeVisible({ timeout: 10_000 })
  })

  test("la page connexion s'affiche correctement", async ({ page }) => {
    await page.goto("/connexion")
    await expect(page.locator("input#email")).toBeVisible()
    await expect(page.locator("input#motDePasse")).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test("connexion avec mauvais identifiants affiche une erreur", async ({ page }) => {
    await page.goto("/connexion")
    await page.fill("input#email", "inexistant@test.ci")
    await page.fill("input#motDePasse", "mauvais123")
    await page.click('button[type="submit"]')

    await expect(
      page.getByText(/incorrect|erreur|invalide/i)
    ).toBeVisible({ timeout: 10_000 })
  })

  test("lien vers mot de passe oublié fonctionne", async ({ page }) => {
    await page.goto("/connexion")
    const link = page.getByRole("link", { name: /mot de passe|oublié/i })
    await expect(link).toBeVisible()
    await link.click()
    await expect(page).toHaveURL(/mot-de-passe-oublie/)
  })

  test("bouton Google OAuth est présent", async ({ page }) => {
    await page.goto("/connexion")
    const googleBtn = page.getByRole("button", { name: /google/i })
      .or(page.locator('[aria-label*="Google"]'))
      .or(page.locator('button:has-text("Google")'))
    await expect(googleBtn).toBeVisible()
  })
})
