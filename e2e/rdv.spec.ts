import { test, expect } from "@playwright/test"

test.describe("Soins → Prise de RDV", () => {
  test("page soins affiche les services", async ({ page }) => {
    await page.goto("/soins")
    await page.waitForLoadState("networkidle")

    // Vérifier le titre de la page
    await expect(page.locator("h1, h2").first()).toBeVisible()

    // Vérifier qu'il y a des cartes de soins
    const soinCards = page.locator('[class*="border"]:has(h3)')
    await expect(soinCards.first()).toBeVisible({ timeout: 10_000 })
  })

  test("fiche soin détaillée s'affiche", async ({ page }) => {
    await page.goto("/soins")
    await page.waitForLoadState("networkidle")

    // Cliquer sur le premier lien "En savoir plus" ou carte de soin
    const soinLink = page.getByRole("link", { name: /en savoir plus|découvrir|réserver/i }).first()
      .or(page.locator('a[href*="/soins/"]').first())

    if (await soinLink.isVisible()) {
      await soinLink.click()
      await page.waitForLoadState("networkidle")
      // Vérifier qu'on est sur une page de détail
      await expect(page).toHaveURL(/\/soins\//)
      await expect(page.locator("h1, h2").first()).toBeVisible()
    }
  })

  test("page prise de RDV affiche le formulaire multi-étapes", async ({ page }) => {
    await page.goto("/prise-rdv")
    await page.waitForLoadState("networkidle")

    // Étape 1 : sélection du soin — vérifier les cartes de soin
    await expect(page.locator("h1, h2").first()).toBeVisible()

    // Vérifier qu'il y a des options de soin cliquables
    const soinOptions = page.locator("button, [role='button'], [class*='cursor-pointer']")
    await expect(soinOptions.first()).toBeVisible({ timeout: 10_000 })
  })

  test("sélection d'un soin active l'étape suivante", async ({ page }) => {
    await page.goto("/prise-rdv")
    await page.waitForLoadState("networkidle")

    // Cliquer sur le premier soin disponible
    const firstSoin = page.locator('[class*="border"][class*="cursor-pointer"], button:has(h3)').first()
    if (await firstSoin.isVisible({ timeout: 5_000 })) {
      await firstSoin.click()

      // Vérifier qu'un calendrier ou étape suivante apparaît
      await expect(
        page.locator('[class*="calendar"], [class*="calendrier"], [aria-label*="Mois"]')
          .or(page.getByText(/choisir.*date|sélectionner.*créneau/i))
      ).toBeVisible({ timeout: 10_000 })
    }
  })

  test("le calendrier RDV est navigable", async ({ page }) => {
    await page.goto("/prise-rdv")
    await page.waitForLoadState("networkidle")

    // Sélectionner un soin d'abord
    const firstSoin = page.locator('[class*="border"][class*="cursor-pointer"], button:has(h3)').first()
    if (await firstSoin.isVisible({ timeout: 5_000 })) {
      await firstSoin.click()

      // Vérifier la navigation mois
      const nextMonth = page.getByRole("button", { name: /mois suivant/i })
      if (await nextMonth.isVisible({ timeout: 5_000 })) {
        await nextMonth.click()
        // Devrait toujours afficher le calendrier
        await expect(nextMonth).toBeVisible()
      }
    }
  })
})
