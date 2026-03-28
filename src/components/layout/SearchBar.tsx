"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Search, X, Package, Sparkles, FileText, Loader2, ArrowRight } from "lucide-react"
import { cn, formatPrix } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────────

interface SearchResult {
  id: string
  type: "produit" | "soin" | "article"
  titre: string
  description: string
  prix?: number
  prixOriginal?: number
  duree?: number
  imageUrl?: string | null
  url: string
  categorie: string
  tempsLecture?: number
}

interface SearchResults {
  produits: SearchResult[]
  soins: SearchResult[]
  articles: SearchResult[]
  total: number
  query: string
}

// ─── Composant SearchBar ─────────────────────────────────────────

export default function SearchBar() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Fermer avec Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false)
      }
      // Ouvrir avec Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsOpen(true)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Focus sur l'input quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Recherche avec debounce
  const search = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults(null)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=5`)
      const data = await res.json()
      setResults(data)
      setSelectedIndex(-1)
    } catch (error) {
      console.error("Erreur recherche:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      search(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, search])

  // Navigation clavier
  function handleKeyDown(e: React.KeyboardEvent) {
    if (!results) return

    const allResults = [...results.soins, ...results.produits, ...results.articles]

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, allResults.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, -1))
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault()
      const selected = allResults[selectedIndex]
      if (selected) {
        navigateTo(selected.url)
      }
    }
  }

  function navigateTo(url: string) {
    setIsOpen(false)
    setQuery("")
    setResults(null)
    router.push(url)
  }

  function getIcon(type: SearchResult["type"]) {
    switch (type) {
      case "produit":
        return <Package size={16} className="text-gold" />
      case "soin":
        return <Sparkles size={16} className="text-primary-brand" />
      case "article":
        return <FileText size={16} className="text-text-muted-brand" />
    }
  }

  function getTypeLabel(type: SearchResult["type"]) {
    switch (type) {
      case "produit":
        return "Produit"
      case "soin":
        return "Soin"
      case "article":
        return "Article"
    }
  }

  // Tous les résultats dans l'ordre d'affichage
  const allResults = results
    ? [...results.soins, ...results.produits, ...results.articles]
    : []

  return (
    <>
      {/* Bouton d'ouverture */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 border border-border-brand bg-white/50 transition-colors duration-200 hover:bg-bg-page"
        aria-label="Rechercher"
      >
        <Search size={18} className="text-text-muted-brand" />
        <span className="hidden lg:block font-body text-[13px] text-text-muted-brand">
          Rechercher...
        </span>
        <kbd className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 bg-bg-page border border-border-brand font-body text-[10px] text-text-muted-brand">
          ⌘K
        </kbd>
      </button>

      {/* Modal de recherche */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] bg-black/40 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false)
          }}
        >
          <div
            ref={containerRef}
            className="w-full max-w-2xl mx-4 bg-white border border-border-brand shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200"
          >
            {/* Input de recherche */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border-brand">
              <Search size={20} className="text-text-muted-brand shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Rechercher un soin, produit ou article..."
                className="flex-1 font-body text-[15px] text-text-main placeholder:text-text-muted-brand focus:outline-none bg-transparent"
              />
              {loading && <Loader2 size={18} className="animate-spin text-primary-brand" />}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-text-muted-brand transition-colors duration-200 hover:text-text-main"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Résultats */}
            <div className="max-h-[60vh] overflow-y-auto">
              {query.length < 2 ? (
                <div className="px-4 py-8 text-center">
                  <p className="font-body text-[14px] text-text-muted-brand">
                    Tapez au moins 2 caractères pour rechercher
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {["Hammam", "Visage", "Gommage", "Bien-être"].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setQuery(tag)}
                        className="px-3 py-1.5 bg-bg-page border border-border-brand font-body text-[12px] text-text-mid transition-colors duration-200 hover:bg-primary-light hover:border-primary-brand"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ) : results && results.total === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="font-body text-[14px] text-text-mid">
                    Aucun résultat pour "<span className="font-semibold">{query}</span>"
                  </p>
                  <p className="mt-2 font-body text-[13px] text-text-muted-brand">
                    Essayez avec d'autres termes de recherche
                  </p>
                </div>
              ) : results && results.total > 0 ? (
                <div className="py-2">
                  {/* Soins */}
                  {results.soins.length > 0 && (
                    <div>
                      <p className="px-4 py-2 font-body text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted-brand">
                        Soins ({results.soins.length})
                      </p>
                      {results.soins.map((result, index) => (
                        <SearchResultItem
                          key={result.id}
                          result={result}
                          isSelected={selectedIndex === index}
                          onClick={() => navigateTo(result.url)}
                          icon={getIcon(result.type)}
                          typeLabel={getTypeLabel(result.type)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Produits */}
                  {results.produits.length > 0 && (
                    <div>
                      <p className="px-4 py-2 font-body text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted-brand">
                        Produits ({results.produits.length})
                      </p>
                      {results.produits.map((result, index) => (
                        <SearchResultItem
                          key={result.id}
                          result={result}
                          isSelected={selectedIndex === results.soins.length + index}
                          onClick={() => navigateTo(result.url)}
                          icon={getIcon(result.type)}
                          typeLabel={getTypeLabel(result.type)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Articles */}
                  {results.articles.length > 0 && (
                    <div>
                      <p className="px-4 py-2 font-body text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted-brand">
                        Articles ({results.articles.length})
                      </p>
                      {results.articles.map((result, index) => (
                        <SearchResultItem
                          key={result.id}
                          result={result}
                          isSelected={
                            selectedIndex === results.soins.length + results.produits.length + index
                          }
                          onClick={() => navigateTo(result.url)}
                          icon={getIcon(result.type)}
                          typeLabel={getTypeLabel(result.type)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-border-brand bg-bg-page">
              <div className="flex items-center gap-4 font-body text-[11px] text-text-muted-brand">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white border border-border-brand">↑↓</kbd>
                  naviguer
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white border border-border-brand">↵</kbd>
                  ouvrir
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white border border-border-brand">esc</kbd>
                  fermer
                </span>
              </div>
              {results && results.total > 0 && (
                <span className="font-body text-[11px] text-text-muted-brand">
                  {results.total} résultat{results.total > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Composant résultat individuel ───────────────────────────────

function SearchResultItem({
  result,
  isSelected,
  onClick,
  icon,
  typeLabel,
}: {
  result: SearchResult
  isSelected: boolean
  onClick: () => void
  icon: React.ReactNode
  typeLabel: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors duration-150",
        isSelected ? "bg-primary-light" : "hover:bg-bg-page"
      )}
    >
      {/* Image */}
      {result.imageUrl ? (
        <div className="relative w-12 h-12 shrink-0 overflow-hidden bg-bg-page">
          <Image
            src={result.imageUrl}
            alt={result.titre}
            fill
            className="object-cover"
            sizes="48px"
          />
        </div>
      ) : (
        <div className="w-12 h-12 shrink-0 flex items-center justify-center bg-bg-page border border-border-brand">
          {icon}
        </div>
      )}

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-body text-[14px] font-medium text-text-main truncate">
            {result.titre}
          </h4>
          <span className="shrink-0 px-1.5 py-0.5 bg-bg-page border border-border-brand font-body text-[10px] text-text-muted-brand">
            {typeLabel}
          </span>
        </div>
        <p className="mt-0.5 font-body text-[12px] text-text-muted-brand line-clamp-1">
          {result.description}
        </p>
        {result.prix && (
          <p className="mt-1 font-body text-[13px] text-primary-brand font-medium">
            {formatPrix(result.prix)}
            {result.prixOriginal && (
              <span className="ml-2 text-text-muted-brand line-through text-[11px]">
                {formatPrix(result.prixOriginal)}
              </span>
            )}
            {result.duree && (
              <span className="ml-2 text-text-muted-brand text-[11px]">
                · {result.duree} min
              </span>
            )}
          </p>
        )}
        {result.tempsLecture && (
          <p className="mt-1 font-body text-[11px] text-text-muted-brand">
            {result.tempsLecture} min de lecture
          </p>
        )}
      </div>

      {/* Flèche */}
      <ArrowRight
        size={16}
        className={cn(
          "shrink-0 mt-3 transition-opacity duration-150",
          isSelected ? "opacity-100 text-primary-brand" : "opacity-0"
        )}
      />
    </button>
  )
}
