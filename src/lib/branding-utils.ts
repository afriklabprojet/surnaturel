/**
 * Utilitaires branding - Fonctions non-server actions
 */

export type BrandingData = {
  tenantId: string | null
  appName: string
  logoLight: string | null
  logoDark: string | null
  favicon: string | null
  loaderLogo: string | null
  primaryColor: string
  primaryDarkColor: string
  primaryLightColor: string
  secondaryColor: string
  accentColor: string
  accentLightColor: string
  backgroundColor: string
  foregroundColor: string
  cardColor: string
  borderColor: string
  dangerColor: string
  successColor: string
  fontFamily: string
  fontHeading: string
  buttonRadius: string
  sidebarTheme: string
  loginBackground: string | null
  loginTitle: string | null
  loginSubtitle: string | null
  loginLogoSize: string
  emailLogoUrl: string | null
  emailPrimaryColor: string
  emailFooterText: string | null
  presetName: string | null
  customCss: string | null
}

/**
 * Génère les variables CSS à partir du branding
 */
export function generateBrandingCSS(branding: BrandingData): string {
  const radiusMap: Record<string, string> = {
    sm: "0.25rem",
    md: "0.5rem",
    lg: "0.75rem",
    full: "9999px",
  }

  return `
:root {
  /* Branding dynamique */
  --brand-primary: ${branding.primaryColor};
  --brand-primary-dark: ${branding.primaryDarkColor};
  --brand-primary-light: ${branding.primaryLightColor};
  --brand-secondary: ${branding.secondaryColor};
  --brand-accent: ${branding.accentColor};
  --brand-accent-light: ${branding.accentLightColor};
  --brand-background: ${branding.backgroundColor};
  --brand-foreground: ${branding.foregroundColor};
  --brand-card: ${branding.cardColor};
  --brand-border: ${branding.borderColor};
  --brand-danger: ${branding.dangerColor};
  --brand-success: ${branding.successColor};
  --brand-radius: ${radiusMap[branding.buttonRadius] || "0.5rem"};
  
  /* Override des tokens shadcn */
  --primary: ${branding.primaryColor};
  --primary-foreground: #FFFFFF;
  --secondary: ${branding.secondaryColor};
  --secondary-foreground: ${branding.primaryDarkColor};
  --accent: ${branding.accentColor};
  --accent-foreground: #FFFFFF;
  --background: ${branding.backgroundColor};
  --foreground: ${branding.foregroundColor};
  --card: ${branding.cardColor};
  --card-foreground: ${branding.foregroundColor};
  --border: ${branding.borderColor};
  --input: ${branding.borderColor};
  --ring: ${branding.accentColor};
  --destructive: ${branding.dangerColor};
  --radius: ${radiusMap[branding.buttonRadius] || "0.5rem"};
  
  /* Charte graphique brand */
  --color-primary-brand: ${branding.primaryColor};
  --color-primary-dark: ${branding.primaryDarkColor};
  --color-primary-light: ${branding.primaryLightColor};
  --color-gold: ${branding.accentColor};
  --color-gold-light: ${branding.accentLightColor};
  --color-bg-page: ${branding.backgroundColor};
  --color-bg-card: ${branding.cardColor};
  --color-text-main: ${branding.foregroundColor};
  --color-border-brand: ${branding.borderColor};
  --color-danger: ${branding.dangerColor};
  --color-success: ${branding.successColor};
}

${branding.customCss || ""}
`.trim()
}

/**
 * Génère l'URL Google Fonts pour les polices du branding
 */
export function generateFontUrl(branding: BrandingData): string {
  const fonts = new Set<string>()
  
  if (branding.fontFamily) fonts.add(branding.fontFamily)
  if (branding.fontHeading) fonts.add(branding.fontHeading)
  
  if (fonts.size === 0) return ""
  
  const fontQuery = Array.from(fonts)
    .map(f => f.replace(/\s+/g, "+") + ":wght@300;400;500;600;700")
    .join("&family=")
  
  return `https://fonts.googleapis.com/css2?family=${fontQuery}&display=swap`
}

/**
 * Valeurs par défaut du branding
 */
export const DEFAULT_BRANDING: BrandingData = {
  tenantId: null,
  appName: "Le Surnaturel de Dieu",
  logoLight: null,
  logoDark: null,
  favicon: null,
  loaderLogo: null,
  primaryColor: "#2D7A1F",
  primaryDarkColor: "#1A5C10",
  primaryLightColor: "#E8F5E3",
  secondaryColor: "#E8F5E3",
  accentColor: "#9A7B22",
  accentLightColor: "#F5EDD6",
  backgroundColor: "#FAFAF7",
  foregroundColor: "#1C1C1C",
  cardColor: "#FFFFFF",
  borderColor: "#E8E4DC",
  dangerColor: "#DC2626",
  successColor: "#16A34A",
  fontFamily: "Jost",
  fontHeading: "Cormorant Garamond",
  buttonRadius: "md",
  sidebarTheme: "light",
  loginBackground: null,
  loginTitle: null,
  loginSubtitle: null,
  loginLogoSize: "md",
  emailLogoUrl: null,
  emailPrimaryColor: "#2D7A1F",
  emailFooterText: null,
  presetName: null,
  customCss: null,
}

// ─── Presets de thème ────────────────────────────────────────────

export interface BrandingPreset {
  name: string
  description: string
  settings: Partial<BrandingData>
}

export const BRANDING_PRESETS: BrandingPreset[] = [
  {
    name: "Surnaturel Original",
    description: "Thème vert forêt et or, élégant et naturel",
    settings: {
      primaryColor: "#2D7A1F",
      primaryDarkColor: "#1A5C10",
      primaryLightColor: "#E8F5E3",
      secondaryColor: "#E8F5E3",
      accentColor: "#9A7B22",
      accentLightColor: "#F5EDD6",
      backgroundColor: "#FAFAF7",
      foregroundColor: "#1C1C1C",
      cardColor: "#FFFFFF",
      borderColor: "#E8E4DC",
      fontFamily: "Jost",
      fontHeading: "Cormorant Garamond",
      buttonRadius: "md",
      sidebarTheme: "light",
    },
  },
  {
    name: "Ocean Spa",
    description: "Thème bleu océan apaisant",
    settings: {
      primaryColor: "#0891B2",
      primaryDarkColor: "#0E7490",
      primaryLightColor: "#E0F7FA",
      secondaryColor: "#ECFEFF",
      accentColor: "#F59E0B",
      accentLightColor: "#FEF3C7",
      backgroundColor: "#F0FDFA",
      foregroundColor: "#134E4A",
      cardColor: "#FFFFFF",
      borderColor: "#A5F3FC",
      fontFamily: "Inter",
      fontHeading: "Playfair Display",
      buttonRadius: "lg",
      sidebarTheme: "dark",
    },
  },
  {
    name: "Rose Élégance",
    description: "Thème rose sophistiqué",
    settings: {
      primaryColor: "#BE185D",
      primaryDarkColor: "#9D174D",
      primaryLightColor: "#FCE7F3",
      secondaryColor: "#FDF2F8",
      accentColor: "#D97706",
      accentLightColor: "#FEF3C7",
      backgroundColor: "#FFFBEB",
      foregroundColor: "#1F2937",
      cardColor: "#FFFFFF",
      borderColor: "#FBCFE8",
      fontFamily: "Poppins",
      fontHeading: "Lora",
      buttonRadius: "full",
      sidebarTheme: "light",
    },
  },
  {
    name: "Minimaliste Pro",
    description: "Thème noir et blanc professionnel",
    settings: {
      primaryColor: "#18181B",
      primaryDarkColor: "#09090B",
      primaryLightColor: "#F4F4F5",
      secondaryColor: "#F4F4F5",
      accentColor: "#3B82F6",
      accentLightColor: "#DBEAFE",
      backgroundColor: "#FFFFFF",
      foregroundColor: "#18181B",
      cardColor: "#FAFAFA",
      borderColor: "#E4E4E7",
      fontFamily: "Inter",
      fontHeading: "Inter",
      buttonRadius: "sm",
      sidebarTheme: "dark",
    },
  },
]
