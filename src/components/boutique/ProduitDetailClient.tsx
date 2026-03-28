"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ShoppingCart,
  Minus,
  Plus,
  Package,
  Check,
  Truck,
  Shield,
  Leaf,
} from "lucide-react"
import { formatPrix } from "@/lib/utils"
import { useCart } from "@/lib/cart-context"
import { BtnArrow, BtnTextLine } from "@/components/ui/buttons"
import FavoriButton from "@/components/favoris/FavoriButton"

// ─── Types ───────────────────────────────────────────────────────

export interface ProduitDetail {
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

export interface ProduitSimilaire {
  id: string
  nom: string
  description: string
  prix: number
  imageUrl?: string | null
  stock: number
  categorie: string
}

// ─── Component ───────────────────────────────────────────────────

export default function ProduitDetailClient({
  produit,
  similaires,
}: {
  produit: ProduitDetail
  similaires: ProduitSimilaire[]
}) {
  const [quantite, setQuantite] = useState(1)
  const [ajouteAuPanier, setAjouteAuPanier] = useState(false)
  const [activeTab, setActiveTab] = useState<"description" | "details" | "livraison">("description")
  const { addItem } = useCart()
  const prixEffectif =
    produit.prixPromo && produit.prixPromo < produit.prix
      ? produit.prixPromo
      : produit.prix
  const reduction = produit.prixPromo && produit.prixPromo < produit.prix
    ? Math.round(((produit.prix - produit.prixPromo) / produit.prix) * 100)
    : 0

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
    setAjouteAuPanier(true)
    setTimeout(() => {
      setAjouteAuPanier(false)
      setQuantite(1)
    }, 1500)
  }

  const TABS = [
    { id: "description" as const, label: "Description" },
    { id: "details" as const, label: "Détails" },
    { id: "livraison" as const, label: "Livraison" },
  ]

  return (
    <>
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
              <>
                <p className="font-body text-[14px] text-text-muted-brand line-through">
                  {formatPrix(produit.prix)}
                </p>
                <span className="bg-gold px-2 py-0.5 font-body text-[10px] font-semibold uppercase text-white">
                  -{reduction}%
                </span>
              </>
            )}
          </div>

          <p className="mt-6 font-body text-[14px] leading-relaxed text-text-mid">
            {produit.description}
          </p>

          {/* Avantages rapides */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            {[
              { icon: Leaf, text: "100% naturel" },
              { icon: Truck, text: "Livraison 48h" },
              { icon: Shield, text: "Qualité garantie" },
              { icon: Check, text: "Testé dermatologiquement" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2">
                <item.icon size={14} className="text-primary-brand shrink-0" />
                <span className="font-body text-[11px] text-text-mid">{item.text}</span>
              </div>
            ))}
          </div>

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
                disabled={ajouteAuPanier}
                className={`flex items-center justify-center gap-2 w-full px-6 py-3.5 font-body text-[11px] font-medium uppercase tracking-[0.15em] text-white transition-colors duration-300 ${
                  ajouteAuPanier
                    ? "bg-success"
                    : "bg-primary-brand hover:bg-primary-dark"
                }`}
              >
                {ajouteAuPanier ? (
                  <>
                    <Check size={18} />
                    Ajouté au panier !
                  </>
                ) : (
                  <>
                    <ShoppingCart size={18} />
                    Ajouter au panier
                    <span className="transition-transform duration-200">→</span>
                  </>
                )}
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

      {/* Onglets Description / Détails / Livraison */}
      <div className="mt-12">
        <div className="flex border-b border-border-brand">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-body text-[11px] font-medium uppercase tracking-[0.12em] transition-colors duration-200 ${
                activeTab === tab.id
                  ? "border-b-2 border-primary-brand text-primary-brand"
                  : "text-text-muted-brand hover:text-text-main"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="border border-t-0 border-border-brand bg-white p-6 sm:p-8">
          {activeTab === "description" && (
            <div className="font-body text-[14px] leading-[1.8] text-text-mid whitespace-pre-line">
              {produit.descriptionLongue ?? produit.description}
            </div>
          )}
          {activeTab === "details" && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex justify-between border-b border-border-brand pb-2">
                  <span className="font-body text-[12px] text-text-muted-brand">Catégorie</span>
                  <span className="font-body text-[12px] font-medium text-text-main">{produit.categorie}</span>
                </div>
                <div className="flex justify-between border-b border-border-brand pb-2">
                  <span className="font-body text-[12px] text-text-muted-brand">Disponibilité</span>
                  <span className={`font-body text-[12px] font-medium ${produit.stock > 0 ? "text-success" : "text-danger"}`}>
                    {produit.stock > 0 ? `En stock (${produit.stock})` : "Rupture de stock"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border-brand pb-2">
                  <span className="font-body text-[12px] text-text-muted-brand">Référence</span>
                  <span className="font-body text-[12px] font-medium text-text-main">{produit.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between border-b border-border-brand pb-2">
                  <span className="font-body text-[12px] text-text-muted-brand">Ingrédients</span>
                  <span className="font-body text-[12px] font-medium text-text-main">100% naturels</span>
                </div>
              </div>
            </div>
          )}
          {activeTab === "livraison" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Truck size={18} className="text-primary-brand shrink-0 mt-0.5" />
                <div>
                  <p className="font-body text-[13px] font-medium text-text-main">Livraison à Abidjan</p>
                  <p className="font-body text-[12px] text-text-muted-brand">Livraison sous 48h ouvrées dans Abidjan et communes.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield size={18} className="text-primary-brand shrink-0 mt-0.5" />
                <div>
                  <p className="font-body text-[13px] font-medium text-text-main">Retours acceptés</p>
                  <p className="font-body text-[12px] text-text-muted-brand">Retour possible sous 7 jours si le produit est non ouvert.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Package size={18} className="text-primary-brand shrink-0 mt-0.5" />
                <div>
                  <p className="font-body text-[13px] font-medium text-text-main">Emballage soigné</p>
                  <p className="font-body text-[12px] text-text-muted-brand">Chaque commande est emballée avec soin dans un packaging écologique.</p>
                </div>
              </div>
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
    </>
  )
}
