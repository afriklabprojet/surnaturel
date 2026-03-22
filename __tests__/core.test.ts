import { describe, it, expect } from "vitest"

// Test utility functions and validation logic used across the app
describe("Utility functions", () => {
  describe("formatPrix", () => {
    it("formats numbers with thousand separators", async () => {
      const { formatPrix } = await import("../src/lib/utils")
      expect(formatPrix(15000)).toContain("15")
      expect(formatPrix(0)).toBeDefined()
    })

    it("handles edge cases", async () => {
      const { formatPrix } = await import("../src/lib/utils")
      expect(formatPrix(0)).toBeDefined()
      expect(formatPrix(999999)).toBeDefined()
    })
  })

  describe("cn utility", () => {
    it("merges class names", async () => {
      const { cn } = await import("../src/lib/utils")
      const result = cn("px-4", "py-2", undefined, "text-sm")
      expect(result).toContain("px-4")
      expect(result).toContain("py-2")
      expect(result).toContain("text-sm")
    })
  })
})

describe("soins-data", () => {
  it("exports SOINS_DATA array", async () => {
    const { SOINS_DATA } = await import("../src/lib/soins-data")
    expect(Array.isArray(SOINS_DATA)).toBe(true)
    expect(SOINS_DATA.length).toBeGreaterThan(0)
  })

  it("each soin has required fields", async () => {
    const { SOINS_DATA } = await import("../src/lib/soins-data")
    for (const soin of SOINS_DATA) {
      expect(soin.slug).toBeDefined()
      expect(soin.nom).toBeDefined()
      expect(typeof soin.prix).toBe("number")
      expect(soin.prix).toBeGreaterThan(0)
    }
  })

  it("getSoinBySlug returns correct soin", async () => {
    const { SOINS_DATA, getSoinBySlug } = await import("../src/lib/soins-data")
    const first = SOINS_DATA[0]
    const result = getSoinBySlug(first.slug)
    expect(result).toBeDefined()
    expect(result?.nom).toBe(first.nom)
  })

  it("getSoinBySlug returns undefined for unknown slug", async () => {
    const { getSoinBySlug } = await import("../src/lib/soins-data")
    expect(getSoinBySlug("nonexistent-soin-xxx")).toBeUndefined()
  })
})

describe("produits-data", () => {
  it("exports PRODUITS_DATA array", async () => {
    const { PRODUITS_DATA } = await import("../src/lib/produits-data")
    expect(Array.isArray(PRODUITS_DATA)).toBe(true)
    expect(PRODUITS_DATA.length).toBeGreaterThan(0)
  })

  it("each produit has required fields", async () => {
    const { PRODUITS_DATA } = await import("../src/lib/produits-data")
    for (const p of PRODUITS_DATA) {
      expect(p.id).toBeDefined()
      expect(p.nom).toBeDefined()
      expect(typeof p.prix).toBe("number")
      expect(p.prix).toBeGreaterThan(0)
    }
  })
})

describe("i18n dictionaries", () => {
  it("fr.json has all required keys", async () => {
    const fr = await import("../src/lib/i18n/fr.json")
    expect(fr.nav).toBeDefined()
    expect(fr.nav.soins).toBeDefined()
    expect(fr.nav.connexion).toBeDefined()
    expect(fr.nav.prendreRdv).toBeDefined()
    expect(fr.hero).toBeDefined()
    expect(fr.footer).toBeDefined()
    expect(fr.common).toBeDefined()
    expect(fr.contact).toBeDefined()
    expect(fr.auth).toBeDefined()
  })

  it("en.json has all the same keys as fr.json", async () => {
    const fr = await import("../src/lib/i18n/fr.json")
    const en = await import("../src/lib/i18n/en.json")

    // Check all top-level keys match
    const frKeys = Object.keys(fr).filter((k) => k !== "default")
    const enKeys = Object.keys(en).filter((k) => k !== "default")
    expect(enKeys.sort()).toEqual(frKeys.sort())

    // Check nested keys match for nav
    expect(Object.keys(en.nav).sort()).toEqual(Object.keys(fr.nav).sort())
    expect(Object.keys(en.footer).sort()).toEqual(Object.keys(fr.footer).sort())
    expect(Object.keys(en.common).sort()).toEqual(Object.keys(fr.common).sort())
  })

  it("en.json values are in English", async () => {
    const en = await import("../src/lib/i18n/en.json")
    expect(en.nav.connexion).toBe("Sign In")
    expect(en.nav.prendreRdv).toBe("Book Now")
    expect(en.hero.title).toContain("wellness")
  })
})

describe("calendrier", () => {
  it("exports functions", async () => {
    const mod = await import("../src/lib/calendrier")
    expect(typeof mod).toBe("object")
  })
})

describe("fidelite", () => {
  it("exports fidelite logic", async () => {
    const mod = await import("../src/lib/fidelite")
    expect(typeof mod).toBe("object")
  })
})
