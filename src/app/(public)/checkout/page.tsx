"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  ShoppingBag,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  Lock,
  Check,
} from "lucide-react"
import { formatPrix } from "@/lib/utils"
import { useCart } from "@/lib/cart-context"

// ─── Méthodes de paiement Jeko Africa ────────────────────────────

const METHODES = [
  { id: "wave", label: "Wave", color: "#1A9BF4" },
  { id: "orange", label: "Orange Money", color: "#FF6600" },
  { id: "mtn", label: "MTN MoMo", color: "#FFC000" },
  { id: "moov", label: "Moov Money", color: "#0066CC" },
  { id: "djamo", label: "Djamo", color: "#6C47FF" },
] as const

type MethodeId = typeof METHODES[number]["id"]

// ─── Component ───────────────────────────────────────────────────

export default function PageCheckout() {
  const router = useRouter()
  const { items, totalPrix } = useCart()
  const [methode, setMethode] = useState<MethodeId | null>(null)
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState("")

  if (items.length === 0) {
    return (
      <section className="mx-auto flex max-w-7xl flex-col items-center justify-center px-6 py-24 text-center lg:px-10">
        <ShoppingBag size={48} className="mb-4 text-border-brand" />
        <h1 className="font-display text-[28px] font-light text-text-main">
          Votre panier est vide
        </h1>
        <p className="mt-2 font-body text-[13px] text-text-muted-brand">
          Ajoutez des produits avant de passer commande.
        </p>
        <Link
          href="/boutique"
          className="mt-8 flex items-center gap-2 px-6 py-3 bg-primary-brand font-body text-[11px] uppercase tracking-[0.1em] text-white transition-colors duration-200 hover:bg-primary-dark"
        >
          <ArrowLeft size={14} />
          Voir la boutique
        </Link>
      </section>
    )
  }

  async function handlePayer() {
    if (!methode) return
    setErreur("")
    setLoading(true)

    try {
      // 1. Créer la commande en base
      const commandeRes = await fetch("/api/boutique/commandes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            produitId: i.id,
            quantite: i.quantite,
          })),
        }),
      })

      if (!commandeRes.ok) {
        const data: { error?: string } = await commandeRes.json()
        setErreur(data.error ?? "Erreur lors de la création de la commande.")
        setLoading(false)
        return
      }

      const { commandeId }: { commandeId: string } = await commandeRes.json()

      // 2. Initier le paiement Jeko
      const paiementRes = await fetch("/api/paiement/initier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commandeId,
          montant: totalPrix,
          methode,
        }),
      })

      if (!paiementRes.ok) {
        const data: { error?: string } = await paiementRes.json()
        setErreur(data.error ?? "Erreur lors de l'initiation du paiement.")
        setLoading(false)
        return
      }

      const { redirectUrl }: { redirectUrl: string } = await paiementRes.json()

      // Cart will be cleared on the success page after payment confirmation
      router.push(redirectUrl)
    } catch {
      setErreur("Impossible de contacter le serveur. Veuillez réessayer.")
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <Link
          href="/panier"
          className="flex items-center gap-2 font-body text-[12px] text-text-muted-brand transition-colors duration-200 hover:text-primary-brand"
        >
          <ArrowLeft size={14} />
          Retour au panier
        </Link>
      </nav>

      {/* Titre */}
      <h1 className="font-display text-[32px] font-light text-text-main">
        Finaliser la commande
      </h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-3">
        {/* ─── Colonne gauche — Paiement ─── */}
        <div className="lg:col-span-2">
          <div className="border border-border-brand bg-white p-6 lg:p-8">
            {/* Tag */}
            <p className="font-body text-[11px] uppercase tracking-[0.15em] text-gold flex items-center gap-3">
              <span className="w-8 h-px bg-gold" />
              Choisissez votre méthode
              <span className="w-8 h-px bg-gold" />
            </p>

            {/* Grille méthodes */}
            <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
              {METHODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethode(m.id)}
                  className={`flex flex-col items-center gap-3 p-5 border-2 transition-all duration-200 ${
                    methode === m.id
                      ? "border-primary-brand bg-primary-light"
                      : "border-border-brand bg-white hover:border-gold"
                  }`}
                >
                  {/* Logo placeholder */}
                  <div
                    className="w-10 h-10 flex items-center justify-center"
                    style={{ backgroundColor: m.color + "20" }}
                  >
                    <span
                      className="font-body text-[14px] font-medium"
                      style={{ color: m.color }}
                    >
                      {m.label.charAt(0)}
                    </span>
                  </div>
                  <span className="font-body text-[13px] text-text-main">
                    {m.label}
                  </span>
                  {methode === m.id && (
                    <Check size={16} className="text-primary-brand" />
                  )}
                </button>
              ))}
            </div>

            {/* Erreur */}
            {erreur && (
              <div className="mt-6 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200">
                <AlertCircle size={16} className="shrink-0 text-danger" />
                <span className="font-body text-[12px] text-danger">{erreur}</span>
              </div>
            )}

            {/* Bouton payer */}
            <button
              onClick={handlePayer}
              disabled={!methode || loading}
              className="mt-8 flex w-full items-center justify-center gap-2 py-4 bg-primary-brand font-body text-[11px] uppercase tracking-[0.1em] text-white transition-colors duration-200 hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Traitement en cours…
                </>
              ) : (
                <>
                  Payer {formatPrix(totalPrix)} F CFA
                  <ArrowRight size={14} />
                </>
              )}
            </button>

            {/* Mentions sécurité */}
            <div className="mt-6 flex items-center justify-center gap-2 text-center">
              <Lock size={12} className="text-text-muted-brand" />
              <span className="font-body text-[11px] text-text-muted-brand">
                Transaction sécurisée et cryptée via Jeko Africa
              </span>
            </div>
          </div>
        </div>

        {/* ─── Colonne droite — Récapitulatif ─── */}
        <div>
          <div className="border border-gold bg-white p-6">
            <h2 className="font-display text-[20px] font-normal text-text-main">
              Votre commande
            </h2>

            {/* Articles */}
            <ul className="mt-6 divide-y divide-border-brand">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-4">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-muted">
                    <Image
                      src={item.imageUrl || "/images/placeholder-produit.jpg"}
                      alt={item.nom}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-display text-[14px] font-normal text-text-main">
                      {item.nom}
                    </p>
                    <p className="mt-0.5 font-body text-[11px] text-text-muted-brand">
                      {formatPrix(item.prix)} × {item.quantite}
                    </p>
                  </div>
                  <p className="font-display text-[14px] font-normal text-gold">
                    {formatPrix(item.prix * item.quantite)}
                  </p>
                </li>
              ))}
            </ul>

            {/* Séparateur */}
            <div className="my-4 h-px bg-gold" />

            {/* Sous-total */}
            <div className="flex items-center justify-between">
              <span className="font-body text-[12px] text-text-muted-brand">Sous-total</span>
              <span className="font-display text-[16px] text-text-main">
                {formatPrix(totalPrix)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-body text-[12px] text-text-muted-brand">Livraison</span>
              <span className="font-body text-[12px] text-primary-brand">Gratuite</span>
            </div>

            {/* Total */}
            <div className="mt-4 pt-4 border-t border-border-brand">
              <div className="flex items-center justify-between">
                <span className="font-body text-[12px] uppercase tracking-[0.1em] text-text-muted-brand">
                  Total
                </span>
                <span className="font-display text-[24px] font-normal text-primary-brand">
                  {formatPrix(totalPrix)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
