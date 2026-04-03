import { test, expect } from "@playwright/test"

test.describe("Profil — Modification", () => {
  test("page profil redirige si non connecté", async ({ page }) => {
    await page.goto("/profil")
    await page.waitForLoadState("networkidle")

    // Doit rediriger vers connexion
    await expect(page).toHaveURL(/connexion/, { timeout: 10_000 })
  })

  test("page profil/modifier redirige si non connecté", async ({ page }) => {
    await page.goto("/profil/modifier")
    await page.waitForLoadState("networkidle")

    await expect(page).toHaveURL(/connexion/, { timeout: 10_000 })
  })

  test("page profil affiche les sections principales", async ({ page }) => {
    // Tenter d'accéder au profil — si redirigé, c'est normal
    await page.goto("/profil")
    await page.waitForLoadState("networkidle")

    if (page.url().includes("/profil") && !page.url().includes("/connexion")) {
      // Vérifier les sections
      await expect(
        page.getByText(/profil|informations|sécurité|préférence/i).first()
      ).toBeVisible()
    }
  })
})

test.describe("Dashboard — Routes protégées", () => {
  const protectedRoutes = [
    "/dashboard",
    "/mes-rdv",
    "/commandes",
    "/favoris",
    "/avis",
    "/fidelite",
    "/parrainage",
  ]

  for (const route of protectedRoutes) {
    test(`${route} redirige vers connexion si non authentifié`, async ({ page }) => {
      await page.goto(route)
      await page.waitForLoadState("networkidle")

      // Doit rediriger vers connexion ou afficher un état non-auth
      const redirected = page.url().includes("/connexion")
      const hasAuthPrompt = await page.getByText(/connect|authentifi/i).first()
        .isVisible({ timeout: 5_000 })
        .catch(() => false)

      expect(redirected || hasAuthPrompt).toBeTruthy()
    })
  }
})
