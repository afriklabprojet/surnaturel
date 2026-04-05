"use client"

import { createContext, useContext, type ReactNode } from "react"
import type { BrandingData } from "@/lib/branding-utils"

// ─── Context ─────────────────────────────────────────────────────

const BrandingContext = createContext<BrandingData | null>(null)

// ─── Hook ────────────────────────────────────────────────────────

export function useBranding(): BrandingData {
  const context = useContext(BrandingContext)
  if (!context) {
    throw new Error("useBranding must be used within a BrandingProvider")
  }
  return context
}

// ─── Provider ────────────────────────────────────────────────────

interface BrandingProviderProps {
  children: ReactNode
  branding: BrandingData
  /** CSS généré côté serveur */
  css: string
  /** URL Google Fonts */
  fontUrl?: string
}

export function BrandingProvider({ 
  children, 
  branding, 
  css,
  fontUrl 
}: BrandingProviderProps) {
  return (
    <BrandingContext.Provider value={branding}>
      {/* Injection des polices Google */}
      {fontUrl && (
        <link rel="stylesheet" href={fontUrl} />
      )}
      
      {/* Injection des variables CSS */}
      <style dangerouslySetInnerHTML={{ __html: css }} />
      
      {children}
    </BrandingContext.Provider>
  )
}
