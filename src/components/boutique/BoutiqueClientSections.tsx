"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Package, SlidersHorizontal, Search, X, Leaf, Truck, Shield, RefreshCw, ArrowRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import CarteP from "@/components/boutique/CarteP"
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/animations"

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

const TRIS = [
  { value: "popularite", label: "Popularité" },
  { value: "prix-asc", label: "Prix croissant" },
  { value: "prix-desc", label: "Prix décroissant" },
  { value: "nouveautes", label: "Nouveautés" },
]

// ─── Hero Section (server-rendered content, client animations) ───

interface HeroBoutiqueProps {
  codePromo: string
  promoPourcentage: string
}

export function HeroBoutique({ codePromo, promoPourcentage }: HeroBoutiqueProps) {
  const TRUST = [
    { icon: Leaf, text: "100% naturels" },
    { icon: Truck, text: "Livraison 48h" },
    { icon: Shield, text: "Paiement sécurisé" },
    { icon: RefreshCw, text: "Retours 7 jours" },
  ]

  const VITRINES = [
    { label: "Corps", sub: "Huiles & Crèmes", accent: "◈" },
    { label: "Visage", sub: "Soins & Éclat", accent: "✦" },
    { label: "Bien-être", sub: "Sérénité", accent: "❋" },
    { label: "Nouveautés", sub: "Arrivages", accent: "✶" },
  ]

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary-brand">
        {/* Cercles décoratifs */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -right-40 -top-40 h-125 w-125 rounded-full border border-white/5" />
          <div className="absolute -bottom-40 -left-20 h-100 w-100 rounded-full border border-white/5" />
          <div className="absolute right-1/4 top-1/2 h-55 w-55 -translate-y-1/2 rounded-full border border-white/5" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-5">

            {/* Gauche : typographie — 3/5 */}
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              className="lg:col-span-3"
            >
              <p className="flex items-center gap-3 font-body text-xs uppercase tracking-[0.2em] text-gold">
                <span className="h-px w-8 bg-gold" />
                Boutique Naturelle
                <span className="h-px w-8 bg-gold" />
              </p>
              <h1 className="mt-6 font-display text-[42px] font-light leading-[1.1] text-white lg:text-[54px]">
                Des soins{" "}
                <em className="not-italic text-gold">naturels</em>
                <br />
                pensés pour{" "}
                <em className="not-italic text-white/80">vous</em>
              </h1>
              <p className="mt-5 max-w-sm font-body text-[13px] font-light leading-[1.8] text-white/55">
                Formulés avec des ingrédients naturels, sélectionnés par notre équipe
                spécialisée en bien-être féminin.
              </p>

              {/* Badges de confiance */}
              <div className="mt-10 grid grid-cols-2 gap-3 xl:grid-cols-4">
                {TRUST.map(({ icon: Icon, text }) => (
                  <div
                    key={text}
                    className="flex flex-col items-center gap-2 border border-white/10 bg-white/5 px-3 py-4 text-center"
                  >
                    <Icon size={16} className="text-gold" />
                    <span className="font-body text-[10px] uppercase tracking-widest text-white/60">
                      {text}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Droite : vitrine catégories — 2/5 */}
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid grid-cols-2 gap-3 lg:col-span-2"
            >
              {VITRINES.map((v) => (
                <motion.div
                  key={v.label}
                  variants={staggerItem}
                  className="group border border-white/10 bg-white/5 p-5 transition-colors duration-300 hover:border-gold/40 hover:bg-white/10"
                >
                  <span className="font-body text-[26px] leading-none text-gold/50 transition-colors duration-300 group-hover:text-gold/80">
                    {v.accent}
                  </span>
                  <p className="mt-3 font-display text-[17px] font-light text-white">
                    {v.label}
                  </p>
                  <p className="mt-1 font-body text-[9px] uppercase tracking-[0.15em] text-white/35">
                    {v.sub}
                  </p>
                </motion.div>
              ))}
            </motion.div>

          </div>
        </div>
      </section>

      {/* Bannière promo */}
      {codePromo && (
        <section className="border-y border-gold bg-gold-light py-4">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-4 px-6 text-center sm:flex-row lg:px-10">
            <p className="font-display text-[17px] font-light text-text-main">
              Offre de bienvenue —{" "}
              <em className="not-italic text-gold">{promoPourcentage}</em>{" "}
              sur votre première commande
            </p>
            <div className="flex items-center gap-2 border border-dashed border-gold px-4 py-2">
              <span className="font-body text-[11px] uppercase tracking-[0.2em] text-gold">
                {codePromo}
              </span>
            </div>
          </div>
        </section>
      )}
    </>
  )
}

// ─── Filtres + Grille + Pagination (interactif) ──────────────────

interface BoutiqueCatalogueProps {
  produitsInitiaux: Produit[]
  totalInitial: number
  pagesInitiales: number
  categoriesConfig: { label: string; value: string }[]
}

export function BoutiqueCatalogue({
  produitsInitiaux,
  totalInitial,
  pagesInitiales,
  categoriesConfig,
}: BoutiqueCatalogueProps) {
  const searchParams = useSearchParams()
  const [categorie, setCategorie] = useState(searchParams.get("categorie") || "tout")
  const [tri, setTri] = useState("popularite")
  const [page, setPage] = useState(1)
  const [prixMin, setPrixMin] = useState("")
  const [prixMax, setPrixMax] = useState("")
  const [enStock, setEnStock] = useState(false)
  const [recherche, setRecherche] = useState("")
  const [showFiltres, setShowFiltres] = useState(false)
  const [produits, setProduits] = useState<Produit[]>(produitsInitiaux)
  const [totalPages, setTotalPages] = useState(pagesInitiales)
  const [loading, setLoading] = useState(false)
  const [favoris, setFavoris] = useState<Set<string>>(new Set())
  // Track if the user has changed filters (initial data from server is used on first render)
  const [hasNavigated, setHasNavigated] = useState(false)

  // Catégories dynamiques : Tout + config admin + Nouveautés
  const CATEGORIES = [
    { value: "tout", label: "Tout" },
    ...categoriesConfig,
    { value: "nouveautes", label: "Nouveautés" },
  ]

  const fetchProduits = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        categorie,
        tri,
        page: String(page),
        limit: "8",
      })
      if (prixMin) params.set("prixMin", prixMin)
      if (prixMax) params.set("prixMax", prixMax)
      if (enStock) params.set("enStock", "true")
      if (recherche) params.set("recherche", recherche)
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
  }, [categorie, tri, page, prixMin, prixMax, enStock, recherche])

  // Only fetch client-side when filters change (not on initial mount)
  useEffect(() => {
    if (hasNavigated) {
      fetchProduits()
    }
  }, [fetchProduits, hasNavigated])

  // Load user favorites
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
        // Not logged in or error
      }
    }
    loadFavoris()
  }, [])

  function handleCategorieChange(val: string) {
    setCategorie(val)
    setPage(1)
    setHasNavigated(true)
  }

  function handleTriChange(val: string) {
    setTri(val)
    setPage(1)
    setHasNavigated(true)
  }

  function handlePageChange(p: number) {
    setPage(p)
    setHasNavigated(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

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
      {/* Filtres & Tri */}
      <section className="bg-bg-page border-b border-border-brand">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-6">
          {/* Barre de recherche */}
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-brand" />
            <input
              type="text"
              value={recherche}
              onChange={(e) => { setRecherche(e.target.value); setPage(1); setHasNavigated(true) }}
              placeholder="Rechercher un produit…"
              className="w-full border border-border-brand bg-white py-2.5 pl-10 pr-10 font-body text-[13px] text-text-main outline-none focus:border-gold transition-colors duration-200"
            />
            {recherche && (
              <button
                onClick={() => { setRecherche(""); setPage(1); setHasNavigated(true) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted-brand hover:text-text-main transition-colors"
                aria-label="Effacer la recherche"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => handleCategorieChange(cat.value)}
                  className={`rounded-full px-5 py-2 font-body text-[10px] uppercase tracking-[0.15em] transition-all duration-200 ${
                    categorie === cat.value
                      ? "bg-primary-brand text-white shadow-sm"
                      : "border border-border-brand bg-white text-neutral-500 hover:border-primary-brand hover:text-primary-brand"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFiltres((v) => !v)}
                className={`flex items-center gap-2 px-4 py-2.5 border font-body text-xs uppercase tracking-[0.12em] transition-colors duration-200 ${
                  showFiltres || prixMin || prixMax || enStock
                    ? "border-gold text-gold bg-gold-light"
                    : "border-border-brand text-neutral-500 hover:border-gold hover:text-gold"
                }`}
              >
                <SlidersHorizontal size={14} />
                Filtres
                {(prixMin || prixMax || enStock) && (
                  <span className="ml-1 w-5 h-5 flex items-center justify-center bg-gold text-white text-xs font-medium">
                    {(prixMin ? 1 : 0) + (prixMax ? 1 : 0) + (enStock ? 1 : 0)}
                  </span>
                )}
              </button>
              <span className="font-body text-xs text-text-muted-brand">
                Trier par
              </span>
              <select
                value={tri}
                onChange={(e) => handleTriChange(e.target.value)}
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

          {/* Panneau de filtres avancés */}
          {showFiltres && (
            <div className="mt-4 pt-4 border-t border-border-brand flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-body text-[12px] text-text-muted-brand whitespace-nowrap">Prix :</span>
                <input
                  type="number"
                  value={prixMin}
                  onChange={(e) => { setPrixMin(e.target.value); setPage(1); setHasNavigated(true) }}
                  placeholder="Min"
                  min="0"
                  className="w-full sm:w-24 border border-border-brand bg-white px-3 py-2 font-body text-[12px] text-text-main outline-none focus:border-gold transition-colors duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="font-body text-[12px] text-text-muted-brand">—</span>
                <input
                  type="number"
                  value={prixMax}
                  onChange={(e) => { setPrixMax(e.target.value); setPage(1); setHasNavigated(true) }}
                  placeholder="Max"
                  min="0"
                  className="w-full sm:w-24 border border-border-brand bg-white px-3 py-2 font-body text-[12px] text-text-main outline-none focus:border-gold transition-colors duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="font-body text-xs text-text-muted-brand">FCFA</span>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={enStock}
                  onChange={(e) => { setEnStock(e.target.checked); setPage(1); setHasNavigated(true) }}
                  className="w-4 h-4 border-border-brand text-primary-brand focus:ring-primary-brand accent-primary-brand"
                />
                <span className="font-body text-[12px] text-text-mid">En stock uniquement</span>
              </label>

              {(prixMin || prixMax || enStock) && (
                <button
                  onClick={() => { setPrixMin(""); setPrixMax(""); setEnStock(false); setPage(1); setHasNavigated(true) }}
                  className="font-body text-xs text-gold underline underline-offset-2 hover:text-primary-brand transition-colors duration-200"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Grille produits */}
      <section className="bg-bg-subtle py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">

          {/* En-tête de section */}
          <div className="mb-8 flex items-end justify-between border-b border-border-brand pb-6">
            <div>
              <p className="font-body text-[10px] uppercase tracking-[0.2em] text-gold">
                Notre sélection
              </p>
              <h2 className="mt-1 font-display text-[28px] font-light text-text-main">
                {categorie === "tout"
                  ? "Tous les produits"
                  : CATEGORIES.find((c) => c.value === categorie)?.label ?? categorie}
              </h2>
            </div>
            {!loading && produits.length > 0 && (
              <p className="hidden font-body text-[12px] text-text-muted-brand sm:block">
                {produits.length} résultat{produits.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>

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
            <AnimatePresence mode="wait">
              <motion.div
                key={`${categorie}-${tri}-${page}`}
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                {produits.map((produit) => (
                  <motion.div key={produit.id} variants={staggerItem} className="overflow-hidden border border-border-brand bg-white">
                    <CarteP
                      produit={produit}
                      isFavori={favoris.has(produit.id)}
                      onToggleFavori={handleToggleFavori}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                disabled={page === 1}
                className="w-10 h-10 flex items-center justify-center border border-border-brand bg-white text-text-muted-brand transition-colors duration-200 hover:border-gold hover:text-gold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
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
                onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="w-10 h-10 flex items-center justify-center border border-border-brand bg-white text-text-muted-brand transition-colors duration-200 hover:border-gold hover:text-gold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* CTA — Diff\u00e9renciateur de marque */}
      <section className="bg-primary-brand py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 text-center">
          <p className="font-body text-[10px] uppercase tracking-[0.2em] text-gold">
            Notre promesse
          </p>
          <h2 className="mx-auto mt-4 max-w-xl font-display text-[30px] font-light leading-[1.2] text-white lg:text-[36px]">
            Conseill\u00e9s par des{" "}
            <em className="not-italic text-gold">professionnelles de sant\u00e9</em>
          </h2>
          <p className="mx-auto mt-4 max-w-md font-body text-[13px] font-light leading-[1.8] text-white/55">
            Notre sage-femme s\u00e9lectionne chaque produit pour accompagner les femmes
            \u00e0 chaque \u00e9tape de leur vie.
          </p>
          <Link
            href="/sage-femme"
            className="mt-8 inline-flex items-center gap-2 border border-gold px-8 py-3.5 font-body text-xs uppercase tracking-[0.15em] text-gold transition-all duration-300 hover:bg-gold hover:text-white"
          >
            Consulter notre sage-femme
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </>
  )
}
