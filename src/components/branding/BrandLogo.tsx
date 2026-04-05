"use client"

import { useTheme } from "next-themes"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────────

interface BrandLogoProps {
  /** URL du logo pour fond clair */
  logoLight?: string | null
  /** URL du logo pour fond sombre */
  logoDark?: string | null
  /** Nom de l'app (fallback si pas de logo) */
  appName?: string
  /** Taille: sm (24px), md (32px), lg (48px), xl (64px) */
  size?: "sm" | "md" | "lg" | "xl"
  /** Afficher le texte à côté du logo */
  showText?: boolean
  /** Lien vers la page d'accueil */
  href?: string
  /** Classes additionnelles */
  className?: string
  /** Forcer un mode (light/dark) */
  forceMode?: "light" | "dark"
}

// ─── Dimensions ──────────────────────────────────────────────────

const SIZES = {
  sm: { width: 24, height: 24, text: "text-sm" },
  md: { width: 32, height: 32, text: "text-base" },
  lg: { width: 48, height: 48, text: "text-lg" },
  xl: { width: 64, height: 64, text: "text-xl" },
}

// ─── Logo par défaut (SVG inline) ────────────────────────────────

function DefaultLogo({ size = "md", className }: { size?: keyof typeof SIZES; className?: string }) {
  const { width, height } = SIZES[size]
  return (
    <svg
      viewBox="0 0 40 40"
      width={width}
      height={height}
      className={cn("fill-current", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="20" cy="20" r="18" fill="currentColor" opacity="0.1" />
      <path
        d="M20 8L24 16H16L20 8Z"
        fill="currentColor"
      />
      <path
        d="M12 18H28V20H12V18Z"
        fill="currentColor"
      />
      <path
        d="M14 22H26V24H14V22Z"
        fill="currentColor"
      />
      <path
        d="M16 26H24V28H16V26Z"
        fill="currentColor"
      />
      <circle cx="20" cy="32" r="2" fill="currentColor" />
    </svg>
  )
}

// ─── Composant principal ─────────────────────────────────────────

export function BrandLogo({
  logoLight,
  logoDark,
  appName = "Le Surnaturel de Dieu",
  size = "md",
  showText = false,
  href = "/",
  className,
  forceMode,
}: BrandLogoProps) {
  const { resolvedTheme } = useTheme()
  
  // Déterminer le mode actuel
  const currentMode = forceMode || resolvedTheme || "light"
  const isDark = currentMode === "dark"
  
  // Sélectionner le bon logo
  const logoUrl = isDark ? (logoDark || logoLight) : (logoLight || logoDark)
  
  const dimensions = SIZES[size]
  
  const content = (
    <div className={cn("flex items-center gap-2", className)}>
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={appName}
          width={dimensions.width}
          height={dimensions.height}
          className="object-contain"
          priority
        />
      ) : (
        <DefaultLogo size={size} className={isDark ? "text-white" : "text-primary"} />
      )}
      
      {showText && (
        <span className={cn(
          "font-semibold",
          dimensions.text,
          isDark ? "text-white" : "text-foreground"
        )}>
          {appName}
        </span>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="inline-flex">
        {content}
      </Link>
    )
  }

  return content
}

// ─── Variantes spécialisées ──────────────────────────────────────

/** Logo pour le header (taille moyenne avec texte) */
export function HeaderLogo(props: Omit<BrandLogoProps, "size" | "showText">) {
  return <BrandLogo {...props} size="md" showText />
}

/** Logo pour le footer (taille petite) */
export function FooterLogo(props: Omit<BrandLogoProps, "size">) {
  return <BrandLogo {...props} size="sm" />
}

/** Logo pour la page de connexion (grande taille) */
export function LoginLogo(props: Omit<BrandLogoProps, "href">) {
  return <BrandLogo {...props} href={undefined} />
}

/** Logo pour le loader (taille xl, pas de lien) */
export function LoaderLogo(props: Omit<BrandLogoProps, "size" | "href" | "showText">) {
  return <BrandLogo {...props} size="xl" href={undefined} showText={false} />
}

/** Logo pour les emails (URL statique, pas de composant React) */
export function getEmailLogoUrl(
  emailLogoUrl: string | null | undefined,
  logoLight: string | null | undefined,
  fallbackUrl: string
): string {
  return emailLogoUrl || logoLight || fallbackUrl
}
