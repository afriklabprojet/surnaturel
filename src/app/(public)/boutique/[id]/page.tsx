"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  ShoppingCart,
  Minus,
  Plus,
  ArrowLeft,
  Package,
  Loader2,
} from "lucide-react"
import { formatPrix } from "@/lib/utils"
import { useCart } from "@/lib/cart-context"
import { BtnArrow, BtnTextLine } from "@/components/ui/buttons"
import FavoriButton from "@/components/favoris/FavoriButton"

interface Produit {
  id: string
  nom: string
  description: string
  descriptionLongue?: string | null
  prix: number
  prixPromo?: number | null
  stock: number
  imageUrl?: string | null
  categorie: string
}

interface ProduitSimilaire {
  id: string
  nom: string
  description: string
  prix: number
  imageUrl?: string | null
  stock: number
  categorie: string
}

export default function PageDetailProduit() {
  const params = useParams<{ id: string }>()
  const [produit, setProduit] = useState<Produit | null>(null)
  const [similaires, setSimilaires] = useState<ProduitSimilaire[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function fetchProduit() {
      try {
        const res = await fetch(`/api/boutique/produits/${params.id}`)
        if (!res.ok) {
          setNotFound(true)
          return
        }
        const data = await res.json()
        setProduit(data.produit)
        setSimilaires(data.similaires ?? [])
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    fetchProduit()
  }, [params.id])

  if (loading) {
    return (
      <section className="mx-auto flex max-w-7xl items-center justify-center px-4 py-24 lg:px-8">
        <Loader2 size={32} className="animate-spin text-primary-brand" />
      </section>
    )
  }

  if (notFound || !produit) {
    return (
      <section className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-24 text-center lg:px-8">
        <Package size={48} className="mb-4 text-border-brand" />
        <h1 className="font-display text-[28px] font-light text-text-main">
          Produit introuvable
        </h1>
        <p className="mt-2 font-body text-[13px] text-text-muted-brand">
          Ce produit n&apos;existe pas ou n&apos;est plus disponible.
        </p>
        <Link
          href="/boutique"
          className="mt-8 flex items-center gap-2 px-6 py-3 bg-primary-brand font-body text-[11px] uppercase tracking-[0.15em] text-white transition-colors duration-200 hover:bg-primary-dark"
        >
          <ArrowLeft size={14} />
          Retour à la boutique
        </Link>
      </section>
    )
  }

  return <DetailProduit produit={produit} similaires={similaires} />
}

function DetailProduit({ produit, similaires }: { produit: Produit; similaires: ProduitSimilaire[] }) {
  const [quantite, setQuantite] = useState(1)
  const { addItem } = useCart()
  const prixEffectif = produit.prixPromo && produit.prixPromo < produit.prix ? produit.prixPromo : produit.prix

  function decremente() {
    setQuantite((q) => Math.max(1, q - 1))
  }

  function incremente() {
    setQuantite((q) => Math.min(produit.stock, q + 1))
  }

  function handleAddToCart() {
    addItem({
      id: produit.id,
      nom: produit.nom,
      prix: prixEffectif,
      quantite,
      imageUrl: produit.imageUrl || "/images/placeholder-produit.jpg",
      stock: produit.stock,
    })
    setQuantite(1)
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <Link
          href="/boutique"
          className="flex items-center gap-2 font-body text-[13px] text-text-muted-brand transition-colors duration-200 hover:text-primary-brand"
        >
          <ArrowLeft size={14} />
          Retour à la boutique
        </Link>
      </nav>

      {/* Produit principal */}
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden border border-border-brand bg-bg-page">
          {produit.imageUrl ? (
            <Image
              src={produit.imageUrl}
              alt={produit.nom}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package size={64} className="text-border-brand" />
            </div>
          )}
          {produit.stock > 0 && produit.stock < 5 && (
            <span className="absolute right-4 top-4 bg-orange-500 px-3 py-1 font-body text-[11px] font-semibold text-white">
              Plus que {produit.stock} en stock
            </span>
          )}
          <div className="absolute left-4 top-4">
            <FavoriButton produitId={produit.id} />
          </div>
        </div>

        {/* Infos */}
        <div className="flex flex-col justify-center">
          <p className="font-body text-[11px] font-medium uppercase tracking-[0.15em] text-primary-brand">
            {produit.categorie}
          </p>
          <h1 className="mt-2 font-display text-[28px] font-light text-text-main sm:text-[34px]">
            {produit.nom}
          </h1>
          <div className="mt-3 flex items-center gap-3">
            <p className="font-display text-[22px] text-gold">
              {formatPrix(prixEffectif)}
            </p>
            {produit.prixPromo && produit.prixPromo < produit.prix && (
              <p className="font-body text-[14px] text-text-muted-brand line-through">
                {formatPrix(produit.prix)}
              </p>
            )}
          </div>

          <p className="mt-6 font-body text-[14px] leading-relaxed text-text-mid">
            {produit.descriptionLongue ?? produit.description}
          </p>

          {/* Sélecteur quantité + Ajouter au panier */}
          {produit.stock > 0 ? (
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <div className="flex items-center border border-border-brand">
                <button
                  onClick={decremente}
                  disabled={quantite <= 1}
                  className="flex h-10 w-10 items-center justify-center text-text-mid transition-colors duration-200 hover:bg-bg-page disabled:opacity-40"
                  aria-label="Diminuer la quantité"
                >
                  <Minus size={16} />
                </button>
                <span className="flex h-10 w-12 items-center justify-center border-x border-border-brand font-body text-[13px] font-semibold text-text-main">
                  {quantite}
                </span>
                <button
                  onClick={incremente}
                  disabled={quantite >= produit.stock}
                  className="flex h-10 w-10 items-center justify-center text-text-mid transition-colors duration-200 hover:bg-bg-page disabled:opacity-40"
                  aria-label="Augmenter la quantité"
                >
                  <Plus size={16} />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="flex items-center justify-center gap-2 w-full bg-primary-brand px-6 py-3.5 font-body text-[11px] font-medium uppercase tracking-[0.15em] text-white transition-colors duration-300 hover:bg-primary-dark"
              >
                <ShoppingCart size={18} />
                Ajouter au panier
                <span className="transition-transform duration-200">→</span>
              </button>
              <BtnTextLine href="/boutique" className="mt-3">
                Continuer mes achats
              </BtnTextLine>
            </div>
          ) : (
            <div className="mt-8 border border-red-200 bg-red-50 px-4 py-3 font-body text-[13px] text-danger">
              Ce produit est actuellement en rupture de stock.
            </div>
          )}
        </div>
      </div>

      {/* Produits similaires */}
      {similaires.length > 0 && (
        <div className="mt-16">
          <h2 className="font-display text-[22px] font-light text-text-main">
            Produits similaires
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similaires.map((s) => (
              <div
                key={s.id}
                className="group overflow-hidden border border-border-brand bg-white transition-colors duration-300 hover:bg-bg-page"
              >
                <Link href={`/boutique/${s.id}`}>
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    {s.imageUrl && (
                      <Image
                        src={s.imageUrl}
                        alt={s.nom}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-lg font-light text-text-main group-hover:text-primary-brand">
                      {s.nom}
                    </h3>
                    <p className="mt-1 font-display text-lg text-gold">
                      {formatPrix(s.prix)}
                    </p>
                  </div>
                </Link>
                <div className="px-5 pb-5">
                  <BtnArrow href={`/boutique/${s.id}`}>
                    Voir le produit
                  </BtnArrow>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
