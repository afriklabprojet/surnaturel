"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface FavoriButtonProps {
  soinId?: string
  produitId?: string
  initialState?: boolean
  className?: string
  size?: "sm" | "md" | "lg"
  variant?: "icon" | "button"
}

export default function FavoriButton({
  soinId,
  produitId,
  initialState = false,
  className,
  size = "md",
  variant = "icon",
}: FavoriButtonProps) {
  const [isFavori, setIsFavori] = useState(initialState)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Vérifier si l'élément est en favoris
    async function checkFavori() {
      try {
        const res = await fetch("/api/favoris")
        if (res.ok) {
          const data = await res.json()

          if (soinId) {
            const found = data.soins?.some((s: { id: string }) => s.id === soinId)
            setIsFavori(!!found)
          } else if (produitId) {
            const found = data.produits?.some((p: { id: string }) => p.id === produitId)
            setIsFavori(!!found)
          }
        }
      } catch {
        // silently fail
      }
    }

    checkFavori()
  }, [soinId, produitId])

  async function toggleFavori() {
    if (loading) return
    setLoading(true)

    try {
      if (isFavori) {
        // Supprimer des favoris
        const params = new URLSearchParams()
        if (soinId) params.set("soinId", soinId)
        if (produitId) params.set("produitId", produitId)

        const res = await fetch(`/api/favoris?${params.toString()}`, {
          method: "DELETE",
        })

        if (res.ok) {
          setIsFavori(false)
        } else {
          toast.error("Impossible de retirer ce favori. Réessayez.")
        }
      } else {
        // Ajouter aux favoris
        const res = await fetch("/api/favoris", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ soinId, produitId }),
        })

        if (res.ok) {
          setIsFavori(true)
        } else {
          toast.error("Impossible d'ajouter ce favori. Réessayez.")
        }
      }
    } catch {
      toast.error("Erreur réseau")
    } finally {
      setLoading(false)
    }
  }

  const sizeMap = {
    sm: 14,
    md: 18,
    lg: 22,
  }

  const iconSize = sizeMap[size]

  if (variant === "button") {
    return (
      <button
        onClick={toggleFavori}
        disabled={loading}
        className={cn(
          "flex items-center gap-2 border px-4 py-2 font-body text-[12px] font-medium transition-colors disabled:opacity-50",
          isFavori
            ? "border-danger bg-danger/5 text-danger"
            : "border-border-brand text-text-muted-brand hover:border-danger hover:text-danger",
          className
        )}
      >
        <Heart
          size={iconSize}
          className={isFavori ? "fill-current" : ""}
        />
        {isFavori ? "Retirer des favoris" : "Ajouter aux favoris"}
      </button>
    )
  }

  return (
    <motion.button
      onClick={toggleFavori}
      disabled={loading}
      className={cn(
        "flex items-center justify-center transition-colors disabled:opacity-50",
        isFavori ? "text-danger" : "text-text-muted-brand hover:text-danger",
        className
      )}
      whileTap={{ scale: 0.9 }}
      animate={isFavori ? { scale: [1, 1.2, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      <Heart
        size={iconSize}
        className={cn(
          "transition-all",
          isFavori ? "fill-current" : ""
        )}
      />
    </motion.button>
  )
}
