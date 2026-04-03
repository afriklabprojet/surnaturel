"use client"

import { useState, useEffect } from "react"
import { MessageCircle, X } from "lucide-react"
import { usePathname } from "next/navigation"
import { useSiteConfig } from "@/components/providers/SiteConfigProvider"

export default function WhatsAppButton() {
  const config = useSiteConfig()
  const pathname = usePathname()
  const [tooltip, setTooltip] = useState(false)

  useEffect(() => {
    setTooltip(localStorage.getItem("whatsapp_tooltip_dismissed") !== "true")
  }, [])

  // Masquer sur les pages de messagerie (le bouton gêne l'envoi de messages)
  if (pathname.startsWith("/communaute/messages") || pathname.startsWith("/suivi-medical/messagerie")) return null

  const url = `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(config.whatsappMessage)}`

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-end gap-3">
      {/* Tooltip */}
      {tooltip && (
        <div className="relative mb-1 flex items-center gap-2 border border-border-brand bg-white px-4 py-2.5 shadow-md">
          <p className="font-body text-[12px] leading-snug text-text-main">
            Besoin d&apos;aide ?<br />
            <span className="text-text-mid">Écrivez-nous sur WhatsApp</span>
          </p>
          <button
            onClick={() => { setTooltip(false); localStorage.setItem("whatsapp_tooltip_dismissed", "true") }}
            className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center text-text-muted-brand transition-colors hover:text-text-mid"
            aria-label="Fermer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Bouton WhatsApp */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Nous contacter sur WhatsApp"
        className="flex h-14 w-14 items-center justify-center bg-[#25D366] text-white shadow-lg transition-transform duration-300 hover:scale-105"
      >
        <MessageCircle size={26} fill="white" strokeWidth={0} />
      </a>
    </div>
  )
}
