"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight, Package } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import CarteP from "@/components/boutique/CarteP"
import { fadeInUp, fadeInRight, staggerContainer, staggerItem } from "@/lib/animations"

// ─── Types ───────────────────────────────────────────────────────

interface Produit {
  id: string
  nom: string
  description: string
  prix: number
  prixPromo?: number | null
  stock: number
  imageUrl?: string | null
  categorie: string
  nouveau?: boolean
  notesMoyenne?: number
  nombreAvis?: number
}

interface ProduitsResponse {
  produits: Produit[]
  total: number
  pages: number
}

// ─── Constantes ──────────────────────────────────────────────────

const CATEGORIES = [
  { value: "tout", label: "Tout" },
  { value: "corps", label: "Corps" },
  { value: "visage", label: "Visage" },
  { value: "bien-etre", label: "Bien-être" },
  { value: "nouveautes", label: "Nouveautés" },
]

const TRIS = [
  { value: "popularite", label: "Popularité" },
  { value: "prix-asc", label: "Prix croissant" },
  { value: "prix-desc", label: "Prix décroissant" },
  { value: "nouveautes", label: "Nouveautés" },
]

const STATS = [
  { chiffre: "50+", label: "Produits" },
  { chiffre: "100%", label: "Naturels" },
  { chiffre: "48h", label: "Livraison" },
  { chiffre: "✓", label: "Testés" },
]

const CODE_PROMO = process.env.NEXT_PUBLIC_CODE_PROMO_BIENVENUE || "BIENVENUE10"
const PROMO_POURCENTAGE = process.env.NEXT_PUBLIC_PROMO_POURCENTAGE || "10%"

// ─── Page ────────────────────────────────────────────────────────

export default function PageBoutique() {
  const searchParams = useSearchParams()
  const [categorie, setCategorie] = useState(searchParams.get("categorie") || "tout")
  const [tri, setTri] = useState("popularite")
  const [page, setPage] = useState(1)
  const [produits, setProduits] = useState<Produit[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [favoris, setFavoris] = useState<Set<string>>(new Set())

  const fetchProduits = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        categorie,
        tri,
        page: String(page),
        limit: "8",
      })
      const res = await fetch(`/api/boutique/produits?${params}`)
      if (res.ok) {
        const data: ProduitsResponse = await res.json()
        setProduits(data.produits)
        setTotalPages(data.pages)
      }
    } catch (error) {
      console.error("Erreur fetch produits:", error)
    } finally {
      setLoading(false)
    }
  }, [categorie, tri, page])

  useEffect(() => {
    fetchProduits()
  }, [fetchProduits])

  // Load user favorites from API on mount
  useEffect(() => {
    async function loadFavoris() {
      try {
        const res = await fetch("/api/favoris")
        if (res.ok) {
          const data = await res.json()
          const ids = (data.produits ?? []).map((p: { id: string }) => p.id)
          setFavoris(new Set(ids))
        }
      } catch {
        // Not logged in or error — keep empty set
      }
    }
    loadFavoris()
  }, [])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [categorie, tri])

  function handleToggleFavori(id: string) {
    setFavoris((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <>
      {/* ─── Hero Section ─── */}
      <section className="bg-primary-brand py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Colonne gauche */}
            <motion.div variants={fadeInUp} initial="initial" animate="animate">
              <p className="font-body text-[11px] uppercase tracking-[0.15em] text-gold flex items-center gap-3">
                <span className="w-8 h-px bg-gold" />
                Nos produits bien-être
                <span className="w-8 h-px bg-gold" />
              </p>
              <h1 className="mt-6 font-display text-[40px] font-light leading-[1.15] text-white">
                Des soins{" "}
                <em className="not-italic text-gold">naturels</em>
                <br />
                pour votre beauté
              </h1>
              <p className="mt-6 font-body text-[13px] font-light leading-[1.7] text-white/60 max-w-md">
                Découvrez notre sélection de produits de beauté et bien-être, 
                formulés avec des ingrédients naturels et testés pour votre peau.
              </p>
            </motion.div>

            {/* Colonne droite - Stats */}
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid grid-cols-2 gap-4"
            >
              {STATS.map((stat) => (
                <motion.div
                  key={stat.label}
                  variants={staggerItem}
                  className="p-6 bg-white/[0.08] border border-white/10"
                >
                  <p className="font-display text-[28px] font-normal text-gold">
                    {stat.chiffre}
                  </p>
                  <p className="mt-1 font-body text-[9px] uppercase tracking-[0.15em] text-white/50">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Bannière promo ─── */}
      <section className="bg-gold-light border-y border-gold py-4">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
          <p className="font-display text-[18px] font-light text-text-main">
            Offre de bienvenue —{" "}
            <em className="not-italic text-gold">{PROMO_POURCENTAGE}</em>{" "}
            sur votre première commande
          </p>
          <div className="px-4 py-2 border border-dashed border-gold">
            <span className="font-body text-[12px] uppercase tracking-[0.15em] text-gold">
              {CODE_PROMO}
            </span>
          </div>
        </div>
      </section>

      {/* ─── Filtres & Tri ─── */}
      <section className="bg-white border-b border-border-brand">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Boutons catégories */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategorie(cat.value)}
                  className={`px-5 py-2.5 font-body text-[11px] uppercase tracking-[0.12em] transition-colors duration-200 ${
                    categorie === cat.value
                      ? "bg-primary-brand text-white"
                      : "border border-border-brand bg-white text-neutral-500 hover:border-gold hover:text-gold"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Select tri */}
            <div className="flex items-center gap-3">
              <span className="font-body text-[11px] text-text-muted-brand">
                Trier par
              </span>
              <select
                value={tri}
                onChange={(e) => setTri(e.target.value)}
                className="border border-border-brand bg-white px-4 py-2.5 font-body text-[12px] text-text-main outline-none focus:border-gold transition-colors duration-200"
              >
                {TRIS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Grille produits ─── */}
      <section className="bg-bg-subtle py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary-brand border-t-transparent animate-spin" />
            </div>
          ) : produits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package size={48} className="mb-4 text-border-brand" />
              <p className="font-display text-lg font-light text-text-main">
                Aucun produit trouvé
              </p>
              <p className="mt-1 font-body text-[12px] text-text-muted-brand">
                Essayez un autre filtre ou revenez plus tard.
              </p>
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border-brand border border-border-brand"
            >
              {produits.map((produit) => (
                <motion.div key={produit.id} variants={staggerItem}>
                  <CarteP
                    produit={produit}
                    isFavori={favoris.has(produit.id)}
                    onToggleFavori={handleToggleFavori}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* ─── Pagination ─── */}
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-10 h-10 flex items-center justify-center border border-border-brand bg-white text-text-muted-brand transition-colors duration-200 hover:border-gold hover:text-gold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-10 h-10 flex items-center justify-center font-body text-[12px] transition-colors duration-200 ${
                    page === p
                      ? "bg-primary-brand text-white"
                      : "border border-border-brand bg-white text-text-muted-brand hover:border-gold hover:text-gold"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-10 h-10 flex items-center justify-center border border-border-brand bg-white text-text-muted-brand transition-colors duration-200 hover:border-gold hover:text-gold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
