"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { staggerContainer, staggerItem } from "@/lib/animations"
import { Heart, Sparkles, ShoppingBag, Loader2, Trash2, Clock } from "lucide-react"
import { BtnArrow } from "@/components/ui/buttons"
import EmptyState from "@/components/ui/empty-states"
import Image from "next/image"
import Link from "next/link"

interface Soin {
  id: string
  favoriId: string
  nom: string
  slug: string
  description?: string | null
  prix: number
  duree?: number | null
  image?: string | null
  categorie?: {
    nom: string
  } | null
}

interface Produit {
  id: string
  favoriId: string
  nom: string
  slug: string
  description?: string | null
  prix: number
  image?: string | null
  categorie?: {
    nom: string
  } | null
}

interface FavorisData {
  soins: Soin[]
  produits: Produit[]
}

export default function FavorisPage() {
  const [data, setData] = useState<FavorisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [supprimant, setSupprimant] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"soins" | "produits">("soins")

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/favoris")
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function supprimerFavori(favoriId: string) {
    setSupprimant(favoriId)

    try {
      const res = await fetch(`/api/favoris?id=${favoriId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        fetchData()
      }
    } catch {
      // silently fail
    } finally {
      setSupprimant(null)
    }
  }

  const formatPrix = (prix: number) =>
    prix.toLocaleString("fr") + " FCFA"

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 size={24} className="animate-spin text-gold" />
      </div>
    )
  }

  const soins = data?.soins || []
  const produits = data?.produits || []
  const totalFavoris = soins.length + produits.length

  if (totalFavoris === 0) {
    return <EmptyState type="favoris" />
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Header avec compteur */}
      <motion.div variants={staggerItem} className="flex items-center gap-3">
        <Heart size={20} className="text-danger" />
        <h1 className="font-display text-[28px] font-light text-text-main">
          Mes favoris
        </h1>
        <span className="bg-primary-light px-3 py-1 font-body text-[12px] font-medium text-primary-brand">
          {totalFavoris}
        </span>
      </motion.div>

      {/* Tabs */}
      <motion.div
        variants={staggerItem}
        className="flex border-b border-border-brand"
      >
        <button
          onClick={() => setActiveTab("soins")}
          className={`relative flex items-center gap-2 px-4 py-3 font-body text-[13px] transition-colors ${
            activeTab === "soins"
              ? "font-medium text-primary-brand"
              : "text-text-muted-brand hover:text-text-main"
          }`}
        >
          <Sparkles size={16} />
          Soins ({soins.length})
          {activeTab === "soins" && (
            <motion.div
              layoutId="tab-indicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-brand"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab("produits")}
          className={`relative flex items-center gap-2 px-4 py-3 font-body text-[13px] transition-colors ${
            activeTab === "produits"
              ? "font-medium text-primary-brand"
              : "text-text-muted-brand hover:text-text-main"
          }`}
        >
          <ShoppingBag size={16} />
          Produits ({produits.length})
          {activeTab === "produits" && (
            <motion.div
              layoutId="tab-indicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-brand"
            />
          )}
        </button>
      </motion.div>

      {/* Contenu */}
      {activeTab === "soins" && (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid gap-4 sm:grid-cols-2"
        >
          {soins.length === 0 ? (
            <div className="col-span-full py-8 text-center">
              <p className="font-body text-[13px] text-text-muted-brand">
                Aucun soin dans vos favoris
              </p>
              <BtnArrow href="/soins" className="mt-4">
                Découvrir les soins
              </BtnArrow>
            </div>
          ) : (
            soins.map((soin) => (
              <motion.div
                key={soin.id}
                variants={staggerItem}
                className="group border border-border-brand bg-white"
              >
                <div className="flex gap-4 p-4">
                  {/* Image */}
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden bg-bg-page">
                    {soin.image ? (
                      <Image
                        src={soin.image}
                        alt={soin.nom}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Sparkles size={24} className="text-border-brand" />
                      </div>
                    )}
                  </div>

                  {/* Infos */}
                  <div className="flex-1">
                    {soin.categorie && (
                      <p className="font-body text-[10px] font-medium uppercase tracking-widest text-gold">
                        {soin.categorie.nom}
                      </p>
                    )}
                    <Link
                      href={`/soins/${soin.slug}`}
                      className="mt-1 block font-display text-[16px] font-normal text-text-main transition-colors hover:text-primary-brand"
                    >
                      {soin.nom}
                    </Link>
                    <div className="mt-2 flex items-center gap-3 text-text-muted-brand">
                      <span className="font-body text-[13px] font-medium text-gold">
                        {formatPrix(soin.prix)}
                      </span>
                      {soin.duree && (
                        <span className="flex items-center gap-1 font-body text-[11px]">
                          <Clock size={12} />
                          {soin.duree} min
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => supprimerFavori(soin.favoriId)}
                    disabled={supprimant === soin.favoriId}
                    className="self-start p-2 text-text-muted-brand transition-colors hover:text-danger disabled:opacity-50"
                  >
                    {supprimant === soin.favoriId ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>

                {/* Footer avec action */}
                <div className="border-t border-border-brand bg-bg-page p-3">
                  <BtnArrow href={`/prise-rdv?soin=${soin.id}`} className="text-[11px]">
                    Prendre RDV
                  </BtnArrow>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      )}

      {activeTab === "produits" && (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {produits.length === 0 ? (
            <div className="col-span-full py-8 text-center">
              <p className="font-body text-[13px] text-text-muted-brand">
                Aucun produit dans vos favoris
              </p>
              <BtnArrow href="/produits" className="mt-4">
                Voir les produits
              </BtnArrow>
            </div>
          ) : (
            produits.map((produit) => (
              <motion.div
                key={produit.id}
                variants={staggerItem}
                className="group border border-border-brand bg-white"
              >
                {/* Image */}
                <div className="relative aspect-square overflow-hidden bg-bg-page">
                  {produit.image ? (
                    <Image
                      src={produit.image}
                      alt={produit.nom}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ShoppingBag size={32} className="text-border-brand" />
                    </div>
                  )}

                  {/* Bouton supprimer */}
                  <button
                    onClick={() => supprimerFavori(produit.favoriId)}
                    disabled={supprimant === produit.favoriId}
                    className="absolute right-3 top-3 bg-white p-2 text-text-muted-brand transition-colors hover:text-danger disabled:opacity-50"
                  >
                    {supprimant === produit.favoriId ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>

                {/* Infos */}
                <div className="p-4">
                  {produit.categorie && (
                    <p className="font-body text-[10px] font-medium uppercase tracking-widest text-gold">
                      {produit.categorie.nom}
                    </p>
                  )}
                  <Link
                    href={`/produits/${produit.slug}`}
                    className="mt-1 block font-display text-[16px] font-normal text-text-main transition-colors hover:text-primary-brand"
                  >
                    {produit.nom}
                  </Link>
                  <p className="mt-2 font-body text-[14px] font-medium text-gold">
                    {formatPrix(produit.prix)}
                  </p>
                </div>

                {/* Action */}
                <div className="border-t border-border-brand p-3">
                  <BtnArrow href={`/produits/${produit.slug}`} className="text-[11px]">
                    Voir le produit
                  </BtnArrow>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
