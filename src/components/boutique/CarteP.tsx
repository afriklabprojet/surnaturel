"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Heart, Star, ShoppingCart, Check } from "lucide-react"
import { toast } from "sonner"
import { formatPrix } from "@/lib/utils"
import { useCart } from "@/lib/cart-context"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { cardHover } from "@/lib/animations"

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

interface CartePProps {
  produit: Produit
  isFavori?: boolean
  onToggleFavori?: (id: string) => void
}

// ─── Component ───────────────────────────────────────────────────

export default function CarteP({ produit, isFavori = false, onToggleFavori }: CartePProps) {
  const { addItem } = useCart()
  const { data: session } = useSession()
  const router = useRouter()
  const [ajouteAuPanier, setAjouteAuPanier] = useState(false)
  const [favori, setFavori] = useState(isFavori)

  const enRupture = produit.stock === 0
  const stockFaible = produit.stock > 0 && produit.stock < 5
  const enPromo = produit.prixPromo && produit.prixPromo < produit.prix
  const reduction = enPromo
    ? Math.round(((produit.prix - produit.prixPromo!) / produit.prix) * 100)
    : 0

  // Étoiles
  const note = produit.notesMoyenne ?? 0
  const nombreAvis = produit.nombreAvis ?? 0
  const etoiles = Array.from({ length: 5 }, (_, i) => i < Math.round(note))

  function handleAddToCart() {
    if (enRupture) return
    addItem({
      id: produit.id,
      nom: produit.nom,
      prix: enPromo ? produit.prixPromo! : produit.prix,
      quantite: 1,
      imageUrl: produit.imageUrl || "/images/placeholder-produit.jpg",
      stock: produit.stock,
    })
    setAjouteAuPanier(true)
    toast.success(`${produit.nom} ajouté au panier`)
    setTimeout(() => setAjouteAuPanier(false), 1500)
  }

  async function handleToggleFavori() {
    if (!session) {
      router.push("/connexion")
      return
    }
    const newState = !favori
    setFavori(newState)
    onToggleFavori?.(produit.id)

    try {
      if (newState) {
        await fetch("/api/favoris", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ produitId: produit.id }),
        })
      } else {
        await fetch(`/api/favoris?produitId=${produit.id}`, {
          method: "DELETE",
        })
      }
    } catch {
      // Revert on failure
      setFavori(!newState)
    }
  }

  return (
    <motion.div {...cardHover} className="group flex flex-col bg-white transition-colors duration-200 hover:bg-bg-subtle">
      {/* Zone image */}
      <div className="h-50 bg-primary-light overflow-hidden">
        <Link href={`/boutique/${produit.id}`} className="relative block h-full">
          {produit.imageUrl ? (
            <Image
              src={produit.imageUrl}
              alt={`Photo du produit ${produit.nom} - Boutique Le Surnaturel de Dieu`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-16 h-16 border border-border-brand flex items-center justify-center">
                <span className="font-body text-xs uppercase tracking-widest text-text-muted-brand">
                  Image
                </span>
              </div>
            </div>
          )}
        </Link>

        {/* Badge position absolue haut gauche */}
        {produit.nouveau && !enRupture && !enPromo && (
          <span className="absolute top-3 left-3 px-3 py-1 bg-primary-brand font-body text-[9px] font-medium uppercase tracking-widest text-white">
            Nouveau
          </span>
        )}
        {enPromo && !enRupture && (
          <span className="absolute top-3 left-3 px-3 py-1 bg-gold font-body text-[9px] font-medium uppercase tracking-widest text-white">
            -{reduction}%
          </span>
        )}
        {stockFaible && !enRupture && (
          <span className="absolute top-3 left-3 px-3 py-1 bg-red-50 border border-red-200 font-body text-[9px] font-medium uppercase tracking-widest text-danger">
            Stock faible
          </span>
        )}
        {enRupture && (
          <span className="absolute top-3 left-3 px-3 py-1 bg-gray-100 font-body text-[9px] font-medium uppercase tracking-widest text-gray-500">
            Rupture
          </span>
        )}

        {/* Bouton favori haut droite */}
        <button
          onClick={handleToggleFavori}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white border border-border-brand transition-colors duration-200 hover:border-gold"
          aria-label={favori ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Heart
            size={14}
            className={
              favori
                ? "fill-gold text-gold"
                : "text-text-muted-brand"
            }
          />
        </button>
      </div>

      {/* Corps carte */}
      <div className="flex flex-col flex-1 p-4">
        <Link href={`/boutique/${produit.id}`} className="flex-1">
          <p className="font-body text-[9px] font-medium uppercase tracking-[0.15em] text-gold">
            {produit.categorie}
          </p>
          <h3 className="mt-1 font-display text-[18px] font-normal text-text-main leading-tight transition-colors duration-200 group-hover:text-primary-brand">
            {produit.nom}
          </h3>
          <p className="mt-2 font-body text-xs font-light leading-[1.6] text-neutral-500 line-clamp-2">
            {produit.description}
          </p>

          {/* Étoiles + avis */}
          {nombreAvis > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-0.5" role="img" aria-label={`${note.toFixed(1)} étoiles sur 5`}>
                {etoiles.map((filled, i) => (
                  <Star
                    key={i}
                    size={14}
                    aria-hidden="true"
                    className={
                      filled ? "fill-gold text-gold" : "text-border-brand"
                    }
                  />
                ))}
              </div>
              <span className="font-body text-xs text-text-muted-brand">
                ({nombreAvis})
              </span>
            </div>
          )}
        </Link>

        {/* Pied carte */}
        <div className="mt-4 pt-4 border-t border-border-brand flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-2">
              {enPromo ? (
                <>
                  <span className="font-display text-[20px] font-normal text-primary-brand">
                    {formatPrix(produit.prixPromo!)}
                  </span>
                  <span className="font-body text-[12px] text-text-muted-brand line-through">
                    {formatPrix(produit.prix)}
                  </span>
                </>
              ) : (
                <span className="font-display text-[20px] font-normal text-primary-brand">
                  {formatPrix(produit.prix)}
                </span>
              )}
            </div>
            <span className="font-body text-xs text-text-muted-brand">CFA</span>
          </div>

          {enRupture ? (
            <button
              disabled
              className="px-4 py-2 bg-gray-100 font-body text-xs uppercase tracking-widest text-gray-500 cursor-not-allowed"
            >
              Indisponible
            </button>
          ) : ajouteAuPanier ? (
            <button
              disabled
              className="flex items-center gap-1.5 px-4 py-2 bg-primary-brand font-body text-xs uppercase tracking-widest text-white"
            >
              <Check size={12} />
              Ajouté !
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              className={`flex items-center gap-1.5 px-4 py-2 font-body text-xs uppercase tracking-widest transition-colors duration-200 ${
                stockFaible
                  ? "border border-primary-brand text-primary-brand hover:bg-primary-brand hover:text-white"
                  : "bg-primary-brand text-white hover:bg-primary-dark"
              }`}
            >
              <ShoppingCart size={12} />
              + Panier
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
