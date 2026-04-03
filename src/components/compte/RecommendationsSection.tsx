"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import {
  Sparkles,
  ArrowRight,
  Star,
  Clock,
  ShoppingBag,
  Heart,
  Loader2,
} from "lucide-react"
import { formatPrix } from "@/lib/utils"
import { staggerItem } from "@/lib/animations"

interface SoinRecommande {
  slug: string
  nom: string
  categorie: string
  prix: number
  duree: number
  avgRating?: number
  avisCount?: number
}

interface ProduitRecommande {
  id: string
  nom: string
  prix: number
  prixPromo?: number | null
  imageUrl?: string | null
  categorie?: string
}

interface RecommendationsSectionProps {
  type: "soins" | "produits" | "mixed"
  title?: string
  subtitle?: string
  maxItems?: number
  basedOn?: "history" | "popular" | "related"
  relatedTo?: string // slug or ID for related items
  className?: string
}

export default function RecommendationsSection({
  type,
  title,
  subtitle,
  maxItems = 4,
  basedOn = "popular",
  relatedTo,
  className = "",
}: RecommendationsSectionProps) {
  const [soins, setSoins] = useState<SoinRecommande[]>([])
  const [produits, setProduits] = useState<ProduitRecommande[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRecommendations() {
      setLoading(true)
      try {
        if (type === "soins" || type === "mixed") {
          const params = new URLSearchParams()
          if (basedOn === "related" && relatedTo) {
            params.set("related", relatedTo)
          }
          const res = await fetch(`/api/soins/recommandes?${params}`)
          if (res.ok) {
            const data = await res.json()
            setSoins((data.soins || []).slice(0, maxItems))
          }
        }

        if (type === "produits" || type === "mixed") {
          const params = new URLSearchParams()
          if (basedOn === "related" && relatedTo) {
            params.set("related", relatedTo)
          }
          const res = await fetch(`/api/boutique/recommandes?${params}`)
          if (res.ok) {
            const data = await res.json()
            setProduits((data.produits || []).slice(0, maxItems))
          }
        }
      } catch {
        // Silent fail
      }
      setLoading(false)
    }

    fetchRecommendations()
  }, [type, maxItems, basedOn, relatedTo])

  const defaultTitle = {
    soins: "Soins recommandés",
    produits: "Produits pour vous",
    mixed: "Recommandations",
  }[type]

  const defaultSubtitle = {
    soins: "Basés sur vos préférences et les tendances",
    produits: "Complétez votre routine beauté",
    mixed: "Choisis pour vous",
  }[type]

  const hasItems = soins.length > 0 || produits.length > 0

  if (loading) {
    return (
      <div className={`py-8 ${className}`}>
        <div className="flex justify-center">
          <Loader2 size={24} className="animate-spin text-gold" />
        </div>
      </div>
    )
  }

  if (!hasItems) {
    return null
  }

  return (
    <motion.section variants={staggerItem} className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} className="text-gold" />
            <h2 className="font-display text-[20px] font-light text-text-main">
              {title || defaultTitle}
            </h2>
          </div>
          {(subtitle || defaultSubtitle) && (
            <p className="font-body text-[12px] text-text-muted-brand">
              {subtitle || defaultSubtitle}
            </p>
          )}
        </div>
        <Link
          href={type === "produits" ? "/boutique" : "/soins"}
          className="flex items-center gap-1 font-body text-[12px] text-primary-brand hover:text-primary-dark transition-colors"
        >
          Tout voir
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Soins Grid */}
      {soins.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {soins.map((soin) => (
            <Link
              key={soin.slug}
              href={`/soins/${soin.slug}`}
              className="group border border-border-brand bg-white p-4 hover:border-gold transition-colors"
            >
              <span className="font-body text-[10px] uppercase tracking-wider text-gold">
                {soin.categorie}
              </span>
              <h3 className="mt-1 font-display text-[16px] text-text-main group-hover:text-primary-brand transition-colors line-clamp-2">
                {soin.nom}
              </h3>
              
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1 text-text-muted-brand">
                  <Clock size={12} />
                  <span className="font-body text-[11px]">{soin.duree} min</span>
                </div>
                {soin.avgRating && soin.avgRating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star size={12} className="fill-gold text-gold" />
                    <span className="font-body text-[11px] text-text-mid">
                      {soin.avgRating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-border-brand flex items-center justify-between">
                <span className="font-display text-[18px] text-primary-brand">
                  {formatPrix(soin.prix)}
                </span>
                <span className="font-body text-[10px] uppercase tracking-wider text-primary-brand opacity-0 group-hover:opacity-100 transition-opacity">
                  Réserver →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Produits Grid */}
      {produits.length > 0 && (
        <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${soins.length > 0 ? "mt-6" : ""}`}>
          {produits.map((produit) => (
            <Link
              key={produit.id}
              href={`/boutique/${produit.id}`}
              className="group border border-border-brand bg-white overflow-hidden hover:border-gold transition-colors"
            >
              <div className="relative aspect-square bg-muted">
                <Image
                  src={produit.imageUrl || "/images/placeholder-produit.jpg"}
                  alt={`Photo du produit ${produit.nom} - Recommandation personnalisée`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
                {produit.prixPromo && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-danger text-white font-body text-[10px] uppercase">
                    Promo
                  </span>
                )}
              </div>
              <div className="p-4">
                {produit.categorie && (
                  <span className="font-body text-[10px] uppercase tracking-wider text-gold">
                    {produit.categorie}
                  </span>
                )}
                <h3 className="mt-1 font-display text-[14px] text-text-main group-hover:text-primary-brand transition-colors line-clamp-2">
                  {produit.nom}
                </h3>
                <div className="mt-2 flex items-center gap-2">
                  {produit.prixPromo ? (
                    <>
                      <span className="font-display text-[16px] text-danger">
                        {formatPrix(produit.prixPromo)}
                      </span>
                      <span className="font-body text-[12px] text-text-muted-brand line-through">
                        {formatPrix(produit.prix)}
                      </span>
                    </>
                  ) : (
                    <span className="font-display text-[16px] text-primary-brand">
                      {formatPrix(produit.prix)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </motion.section>
  )
}
