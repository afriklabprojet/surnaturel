"use client"

import { useState, useEffect, useCallback } from "react"
import { Download, X, Smartphone } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const STORAGE_KEY = "pwa-install-dismissed"
const VISIT_KEY = "pwa-visit-count"

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  const shouldShow = useCallback(() => {
    // Don't show if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) return false
    // Don't show if dismissed in last 7 days
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10)
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return false
    }
    // Show after 2nd visit
    const visits = parseInt(localStorage.getItem(VISIT_KEY) || "0", 10) + 1
    localStorage.setItem(VISIT_KEY, String(visits))
    return visits >= 2
  }, [])

  useEffect(() => {
    // Check iOS (Safari doesn't fire beforeinstallprompt)
    const ua = navigator.userAgent
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    setIsIOS(ios)

    if (!shouldShow()) return

    // For iOS, show the manual instructions after delay
    if (ios) {
      const timer = setTimeout(() => setShow(true), 3000)
      return () => clearTimeout(timer)
    }

    // For Chrome/Edge/etc, listen for the prompt event
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => setShow(true), 3000)
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [shouldShow])

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === "accepted") {
        setShow(false)
      }
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem(STORAGE_KEY, String(Date.now()))
  }

  if (!show) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-sm lg:bottom-6 lg:left-auto lg:right-6">
      <div className="border border-border-brand bg-white shadow-lg p-4 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-text-muted-brand hover:text-text-main transition-colors"
          aria-label="Fermer"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary-light text-primary-brand">
            <Smartphone size={20} />
          </div>
          <div className="min-w-0">
            <p className="font-display text-[15px] font-light text-text-main">
              Installer l&apos;application
            </p>
            <p className="mt-1 font-body text-[12px] text-text-muted-brand leading-relaxed">
              {isIOS
                ? "Appuyez sur le bouton Partager puis « Sur l'écran d'accueil »"
                : "Accédez rapidement à vos RDV, commandes et soins depuis votre écran d'accueil"}
            </p>
          </div>
        </div>

        {!isIOS && deferredPrompt && (
          <button
            onClick={handleInstall}
            className="mt-3 flex w-full items-center justify-center gap-2 bg-primary-brand px-4 py-2.5 font-body text-xs font-medium uppercase tracking-[0.15em] text-white transition-colors hover:bg-primary-dark"
          >
            <Download size={14} />
            Installer
          </button>
        )}

        {isIOS && (
          <div className="mt-3 flex items-center gap-2 bg-bg-page px-3 py-2">
            <span className="font-body text-[20px]">⎋</span>
            <span className="font-body text-xs text-text-mid">
              Partager → Sur l&apos;écran d&apos;accueil
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
