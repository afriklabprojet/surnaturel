"use server"

import { unstable_cache, revalidatePath, updateTag } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import type { BrandingSettings } from "@/generated/prisma/client"
import { DEFAULT_BRANDING, BRANDING_PRESETS, type BrandingData, type BrandingPreset } from "@/lib/branding-utils"

// ─── Lecture avec cache ──────────────────────────────────────────

/**
 * Récupère les paramètres de branding (avec cache Next.js)
 * @param tenantId - ID du tenant (null pour global)
 */
export const getBranding = unstable_cache(
  async (tenantId?: string | null): Promise<BrandingData> => {
    try {
      const branding = await prisma.brandingSettings.findFirst({
        where: tenantId ? { tenantId } : { tenantId: null },
      })
      
      if (!branding) {
        return DEFAULT_BRANDING
      }
      
      // Retourner sans id, createdAt, updatedAt
      const { id, createdAt, updatedAt, ...data } = branding
      return data
    } catch (error) {
      console.error("[BRANDING] Erreur lecture:", error)
      return DEFAULT_BRANDING
    }
  },
  ["branding-settings"],
  { tags: ["branding"], revalidate: 300 }
)

/**
 * Récupère les préréglages disponibles
 */
export async function getBrandingPresets(): Promise<BrandingPreset[]> {
  return BRANDING_PRESETS
}

// ─── Mise à jour ─────────────────────────────────────────────────

/**
 * Met à jour les paramètres de branding
 * Réservé aux administrateurs
 */
export async function updateBranding(
  data: Partial<BrandingData>,
  tenantId?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    // Vérifier l'authentification et les droits
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Accès non autorisé" }
    }

    // Valider les couleurs (format hex)
    const colorFields = [
      "primaryColor", "primaryDarkColor", "primaryLightColor",
      "secondaryColor", "accentColor", "accentLightColor",
      "backgroundColor", "foregroundColor", "cardColor",
      "borderColor", "dangerColor", "successColor", "emailPrimaryColor"
    ] as const

    for (const field of colorFields) {
      if (data[field] && !/^#[0-9A-Fa-f]{6}$/.test(data[field]!)) {
        return { success: false, error: `Couleur invalide pour ${field}` }
      }
    }

    // Valider buttonRadius
    if (data.buttonRadius && !["sm", "md", "lg", "full"].includes(data.buttonRadius)) {
      return { success: false, error: "buttonRadius doit être sm, md, lg ou full" }
    }

    // Valider sidebarTheme
    if (data.sidebarTheme && !["light", "dark"].includes(data.sidebarTheme)) {
      return { success: false, error: "sidebarTheme doit être light ou dark" }
    }

    // Valider loginLogoSize
    if (data.loginLogoSize && !["sm", "md", "lg"].includes(data.loginLogoSize)) {
      return { success: false, error: "loginLogoSize doit être sm, md ou lg" }
    }

    // Sanitize customCss (basique - éviter les injections)
    if (data.customCss) {
      // Supprimer les balises script et les imports dangereux
      data.customCss = data.customCss
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/@import\s+url\([^)]+\)/gi, "")
        .replace(/javascript:/gi, "")
        .replace(/expression\s*\(/gi, "")
    }

    // Upsert (créer ou mettre à jour)
    const whereClause = tenantId ? { tenantId } : { tenantId: null }
    
    const existing = await prisma.brandingSettings.findFirst({ where: whereClause })

    if (existing) {
      await prisma.brandingSettings.update({
        where: { id: existing.id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      })
    } else {
      await prisma.brandingSettings.create({
        data: {
          ...DEFAULT_BRANDING,
          ...data,
          tenantId: tenantId ?? null,
        },
      })
    }

    // Invalider le cache branding
    updateTag("branding")
    revalidatePath("/", "layout")

    return { success: true }
  } catch (error) {
    console.error("[BRANDING] Erreur mise à jour:", error)
    return { success: false, error: "Erreur lors de la sauvegarde" }
  }
}

/**
 * Applique un preset de branding
 */
export async function applyBrandingPreset(
  presetName: string,
  tenantId?: string | null
): Promise<{ success: boolean; error?: string }> {
  const preset = BRANDING_PRESETS.find(p => p.name === presetName)
  if (!preset) {
    return { success: false, error: "Preset non trouvé" }
  }

  return updateBranding({ ...preset.settings, presetName }, tenantId)
}

/**
 * Réinitialise le branding aux valeurs par défaut
 */
export async function resetBranding(
  tenantId?: string | null
): Promise<{ success: boolean; error?: string }> {
  return updateBranding(DEFAULT_BRANDING, tenantId)
}

/**
 * Exporte la configuration en JSON
 */
export async function exportBrandingConfig(tenantId?: string | null): Promise<string> {
  const branding = await getBranding(tenantId)
  return JSON.stringify(branding, null, 2)
}

/**
 * Importe une configuration JSON
 */
export async function importBrandingConfig(
  jsonConfig: string,
  tenantId?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const data = JSON.parse(jsonConfig) as Partial<BrandingData>
    // Supprimer les champs non modifiables
    delete (data as Record<string, unknown>).id
    delete (data as Record<string, unknown>).createdAt
    delete (data as Record<string, unknown>).updatedAt
    
    return updateBranding(data, tenantId)
  } catch {
    return { success: false, error: "JSON invalide" }
  }
}
