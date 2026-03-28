"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, ArrowRight, Lock } from "lucide-react"
import { formatPrix } from "@/lib/utils"
import { useCart } from "@/lib/cart-context"

// Logos paiement
const LOGOS_PAIEMENT = [
  { nom: "Wave", color: "#1A9BF4" },
  { nom: "Orange", color: "#FF6600" },
  { nom: "MTN", color: "#FFC000" },
  { nom: "Moov", color: "#0066CC" },
  { nom: "Djamo", color: "#6C47FF" },
]

export default function PagePanier() {
  const { items, totalPrix, totalArticles, updateQuantity, removeItem } = useCart()
  const [codePromo, setCodePromo] = useState("")
  const [promoApplique, setPromoApplique] = useState(false)
  const [promoCode, setPromoCode] = useState("")
  const [promoPourcentage, setPromoPourcentage] = useState(0)
  const [promoErreur, setPromoErreur] = useState("")
  const [promoLoading, setPromoLoading] = useState(false)

  // Livraison gratuite
  const livraison = 0

  async function handleAppliquerPromo() {
    if (!codePromo.trim()) return
    setPromoLoading(true)
    setPromoErreur("")
    try {
      const res = await fetch("/api/boutique/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codePromo.trim() }),
      })
      const data = await res.json()
      if (data.valide) {
        setPromoApplique(true)
        setPromoCode(data.code)
        setPromoPourcentage(data.pourcentage)
        setPromoErreur("")
      } else {
        setPromoErreur(data.error || "Code promo invalide")
        setPromoApplique(false)
        setPromoPourcentage(0)
      }
    } catch {
      setPromoErreur("Impossible de vérifier le code promo.")
      setPromoApplique(false)
    } finally {
      setPromoLoading(false)
    }
  }

  const reduction = promoApplique ? Math.round(totalPrix * (promoPourcentage / 100)) : 0
  const totalFinal = totalPrix - reduction + livraison

  if (items.length === 0) {
    return (
      <section className="mx-auto flex max-w-7xl flex-col items-center justify-center px-6 py-24 text-center lg:px-10">
        <ShoppingBag size={48} className="mb-4 text-border-brand" />
        <h1 className="font-display text-[28px] font-light text-text-main">
          Votre panier est vide
        </h1>
        <p className="mt-2 font-body text-[13px] text-text-muted-brand">
          Découvrez nos produits naturels pour votre bien-être.
        </p>
        <Link
          href="/boutique"
          className="mt-8 flex items-center gap-2 px-6 py-3 bg-primary-brand font-body text-[11px] uppercase tracking-widest text-white transition-colors duration-200 hover:bg-primary-dark"
        >
          <ArrowLeft size={14} />
          Voir la boutique
        </Link>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
      {/* Titre */}
      <div className="mb-10">
        <h1 className="font-display text-[28px] font-light text-text-main">
          Mon panier
        </h1>
        <p className="mt-1 font-body text-[12px] text-text-muted-brand">
          {totalArticles} article{totalArticles > 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-3">
        {/* ─── Colonne gauche (2/3) — Articles ─── */}
        <div className="lg:col-span-2">
          {/* En-tête tableau (desktop) */}
          <div className="hidden border-b border-border-brand pb-3 sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_auto] sm:items-center sm:gap-4">
            <span className="font-body text-[10px] uppercase tracking-[0.15em] text-text-muted-brand">
              Produit
            </span>
            <span className="text-center font-body text-[10px] uppercase tracking-[0.15em] text-text-muted-brand">
              Prix unitaire
            </span>
            <span className="text-center font-body text-[10px] uppercase tracking-[0.15em] text-text-muted-brand">
              Quantité
            </span>
            <span className="text-right font-body text-[10px] uppercase tracking-[0.15em] text-text-muted-brand">
              Total
            </span>
            <span className="w-8" />
          </div>

          {/* Lignes articles */}
          <ul className="divide-y divide-border-brand">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-3 py-5 bg-white transition-colors duration-200 hover:bg-bg-subtle sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_auto] sm:items-center sm:gap-4"
              >
                {/* Produit */}
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden bg-muted">
                    <Image
                      src={item.imageUrl || "/images/placeholder-produit.jpg"}
                      alt={item.nom}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div>
                    <Link
                      href={`/boutique/${item.id}`}
                      className="font-display text-[16px] font-normal text-text-main transition-colors duration-200 hover:text-primary-brand"
                    >
                      {item.nom}
                    </Link>
                    <p className="mt-1 font-body text-[11px] text-text-muted-brand">
                      Réf: {item.id.slice(-6).toUpperCase()}
                    </p>
                  </div>
                </div>

                {/* Prix unitaire */}
                <p className="text-center font-display text-[16px] text-text-main">
                  <span className="mr-1 font-body text-[10px] text-text-muted-brand sm:hidden">
                    Prix :
                  </span>
                  {formatPrix(item.prix)}
                </p>

                {/* Quantité */}
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantite - 1)}
                    className="flex h-9 w-9 items-center justify-center border border-border-brand text-text-muted-brand transition-colors duration-200 hover:border-gold hover:text-gold"
                    aria-label="Diminuer"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="flex h-9 w-12 items-center justify-center border-y border-border-brand font-body text-[13px] text-text-main">
                    {item.quantite}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantite + 1)}
                    disabled={item.quantite >= item.stock}
                    className="flex h-9 w-9 items-center justify-center border border-border-brand text-text-muted-brand transition-colors duration-200 hover:border-gold hover:text-gold disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Augmenter"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Sous-total */}
                <p className="text-right font-display text-[16px] font-normal text-text-main">
                  <span className="mr-1 font-body text-[10px] text-text-muted-brand sm:hidden">
                    Total :
                  </span>
                  {formatPrix(item.prix * item.quantite)}
                </p>

                {/* Supprimer */}
                <button
                  onClick={() => removeItem(item.id)}
                  className="flex h-9 w-9 items-center justify-center text-text-muted-brand transition-colors duration-200 hover:text-danger"
                  aria-label={`Supprimer ${item.nom}`}
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>

          {/* Lien retour */}
          <Link
            href="/boutique"
            className="mt-6 inline-flex items-center gap-2 font-body text-[12px] text-primary-brand transition-colors duration-200 hover:text-primary-dark"
          >
            <ArrowLeft size={14} />
            Continuer mes achats
          </Link>
        </div>

        {/* ─── Colonne droite (1/3) — Récapitulatif ─── */}
        <div>
          <div className="border border-gold bg-white p-6">
            <h2 className="font-display text-[20px] font-normal text-text-main">
              Récapitulatif
            </h2>

            {/* Lignes */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-body text-[12px] text-text-muted-brand">Sous-total</span>
                <span className="font-display text-[16px] text-text-main">
                  {formatPrix(totalPrix)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-body text-[12px] text-text-muted-brand">Livraison</span>
                <span className="font-body text-[12px] text-primary-brand">Gratuite</span>
              </div>
              {promoApplique && (
                <div className="flex items-center justify-between text-primary-brand">
                  <span className="font-body text-[12px]">Réduction ({promoPourcentage}%)</span>
                  <span className="font-display text-[16px]">-{formatPrix(reduction)}</span>
                </div>
              )}
            </div>

            {/* Code promo */}
            <div className="mt-6">
              <label className="font-body text-[11px] uppercase tracking-widest text-text-muted-brand">
                Code promo
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={codePromo}
                  onChange={(e) => setCodePromo(e.target.value)}
                  placeholder="Entrez votre code"
                  className="flex-1 border border-border-brand px-3 py-2 font-body text-[12px] text-text-main outline-none focus:border-gold transition-colors duration-200"
                />
                <button
                  onClick={handleAppliquerPromo}
                  disabled={promoLoading || !codePromo.trim()}
                  className="px-4 py-2 border border-primary-brand font-body text-[10px] uppercase tracking-widest text-primary-brand transition-colors duration-200 hover:bg-primary-brand hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {promoLoading ? "…" : "Appliquer"}
                </button>
              </div>
              {promoErreur && (
                <p className="mt-2 font-body text-[11px] text-danger">{promoErreur}</p>
              )}
              {promoApplique && (
                <p className="mt-2 font-body text-[11px] text-primary-brand">
                  Code {promoCode} appliqué !
                </p>
              )}
            </div>

            {/* Séparateur or */}
            <div className="my-6 h-px bg-gold" />

            {/* Total */}
            <div className="flex items-center justify-between">
              <span className="font-body text-[12px] uppercase tracking-widest text-text-muted-brand">
                Total TTC
              </span>
              <span className="font-display text-[24px] font-normal text-primary-brand">
                {formatPrix(totalFinal)}
              </span>
            </div>

            {/* Bouton commander */}
            <Link
              href={promoCode ? `/checkout?promo=${encodeURIComponent(promoCode)}` : "/checkout"}
              className="mt-6 flex w-full items-center justify-center gap-2 py-4 bg-primary-brand font-body text-[11px] uppercase tracking-widest text-white transition-colors duration-200 hover:bg-primary-dark"
            >
              Commander
              <ArrowRight size={14} />
            </Link>

            {/* Sécurité */}
            <div className="mt-6 text-center">
              <p className="flex items-center justify-center gap-2 font-body text-[11px] text-text-muted-brand">
                <Lock size={12} />
                Paiement sécurisé via Jeko Africa
              </p>
              <div className="mt-3 flex items-center justify-center gap-3">
                {LOGOS_PAIEMENT.map((logo) => (
                  <div
                    key={logo.nom}
                    className="px-2 py-1 border border-border-brand"
                    title={logo.nom}
                  >
                    <span
                      className="font-body text-[9px] font-medium"
                      style={{ color: logo.color }}
                    >
                      {logo.nom}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
