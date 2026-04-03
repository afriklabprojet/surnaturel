"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import {
  ShoppingBag,
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  Truck,
  MapPin,
  Tag,
  CreditCard,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Lock,
  X,
  ShieldCheck,
} from "lucide-react"
import { formatPrix } from "@/lib/utils"
import { useCart, type CartItem } from "@/lib/cart-context"

interface Methode {
  id: string
  label: string
  color: string
}

interface ZoneLivraison {
  id: string
  nom: string
  description: string
  frais: number
  delai: string
  actif: boolean
}

interface ConfigLivraison {
  zones: ZoneLivraison[]
  seuilGratuit: number | null
  messageGratuit: string
  zoneDefautId: string
}

export default function MobileCheckout() {
  const router = useRouter()
  const { items, totalPrix, totalArticles, updateQuantity, removeItem, clearCart } = useCart()

  // UI state
  const [cartExpanded, setCartExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState("")
  const [showConfirmation, setShowConfirmation] = useState(false)
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  // Focus management for confirmation modal
  useEffect(() => {
    if (showConfirmation && confirmButtonRef.current) {
      confirmButtonRef.current.focus()
    }
  }, [showConfirmation])

  // Promo
  const [codePromo, setCodePromo] = useState("")
  const [promoApplique, setPromoApplique] = useState(false)
  const [promoCode, setPromoCode] = useState("")
  const [promoPourcentage, setPromoPourcentage] = useState(0)
  const [promoErreur, setPromoErreur] = useState("")
  const [promoLoading, setPromoLoading] = useState(false)

  // Livraison
  const [configLivraison, setConfigLivraison] = useState<ConfigLivraison | null>(null)
  const [zoneSelectionnee, setZoneSelectionnee] = useState<string>("")
  const [fraisLivraison, setFraisLivraison] = useState(0)
  const [livraisonGratuite, setLivraisonGratuite] = useState(false)

  // Paiement
  const [methodes, setMethodes] = useState<Methode[]>([])
  const [methode, setMethode] = useState<string | null>(null)

  // Totaux
  const reduction = promoApplique ? Math.round(totalPrix * (promoPourcentage / 100)) : 0
  const totalFinal = totalPrix - reduction + fraisLivraison

  function handleRemoveItem(id: string, nom: string) {
    removeItem(id)
    toast.success(`${nom} retiré du panier`)
  }

  // Load saved preferences
  useEffect(() => {
    const savedZone = localStorage.getItem("checkout_zone")
    const savedMethode = localStorage.getItem("checkout_methode")
    if (savedZone) setZoneSelectionnee(savedZone)
    if (savedMethode) setMethode(savedMethode)
  }, [])

  // Load livraison config
  useEffect(() => {
    fetch("/api/boutique/livraison")
      .then((res) => res.json())
      .then((data: ConfigLivraison) => {
        setConfigLivraison(data)
        if (!zoneSelectionnee) {
          setZoneSelectionnee(data.zoneDefautId)
        }
      })
      .catch(() => {
        setFraisLivraison(0)
        setLivraisonGratuite(true)
      })
  }, [zoneSelectionnee])

  // Update frais when zone changes
  useEffect(() => {
    if (!zoneSelectionnee || !configLivraison) return

    const zone = configLivraison.zones.find((z) => z.id === zoneSelectionnee)
    if (!zone) return

    const gratuite =
      configLivraison.seuilGratuit !== null &&
      totalPrix >= configLivraison.seuilGratuit

    setLivraisonGratuite(gratuite)
    setFraisLivraison(gratuite ? 0 : zone.frais)

    // Save preference
    localStorage.setItem("checkout_zone", zoneSelectionnee)
  }, [zoneSelectionnee, totalPrix, configLivraison])

  // Load payment methods
  useEffect(() => {
    fetch("/api/config/methodes_paiement")
      .then((r) => r.json())
      .then((d) => setMethodes(d.valeur || []))
      .catch(() => {})
  }, [])

  // Save payment method preference
  useEffect(() => {
    if (methode) {
      localStorage.setItem("checkout_methode", methode)
    }
  }, [methode])

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
        toast.success(`Code ${data.code} appliqué ! -${data.pourcentage}%`)
      } else {
        setPromoErreur(data.error || "Code invalide")
        setPromoApplique(false)
        setPromoPourcentage(0)
        toast.error(data.error || "Code promo invalide")
      }
    } catch {
      setPromoErreur("Erreur de vérification")
      toast.error("Erreur de vérification du code")
    } finally {
      setPromoLoading(false)
    }
  }

  // Show confirmation modal before payment
  function handleInitierPaiement() {
    if (!methode) {
      setErreur("Choisissez un mode de paiement")
      toast.error("Choisissez un mode de paiement")
      return
    }
    setErreur("")
    setShowConfirmation(true)
  }

  async function handleConfirmerPaiement() {
    setShowConfirmation(false)
    setLoading(true)

    try {
      // 1. Créer la commande
      const commandeRes = await fetch("/api/boutique/commandes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            produitId: i.id,
            quantite: i.quantite,
          })),
          codePromo: promoCode || undefined,
          zoneId: zoneSelectionnee,
          fraisLivraison,
        }),
      })

      if (!commandeRes.ok) {
        const data = await commandeRes.json()
        setErreur(data.error ?? "Impossible de créer la commande")
        toast.error(data.error ?? "Impossible de créer la commande")
        setLoading(false)
        return
      }

      const { commandeId } = await commandeRes.json()
      toast.success("Commande créée !")

      // 2. Initier le paiement
      const paiementRes = await fetch("/api/paiement/initier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commandeId, methode }),
      })

      if (!paiementRes.ok) {
        const data = await paiementRes.json()
        setErreur(data.error ?? "Impossible d'initier le paiement")
        toast.error(data.error ?? "Impossible d'initier le paiement")
        setLoading(false)
        return
      }

      const { redirectUrl, orderId } = await paiementRes.json()

      // Vider le panier et rediriger
      clearCart()
      toast.success("Redirection vers le paiement...")
      if (redirectUrl) {
        window.location.href = redirectUrl
      } else {
        router.push(`/commandes/${orderId}?success=1`)
      }
    } catch {
      setErreur("Une erreur est survenue")
      toast.error("Une erreur est survenue")
      setLoading(false)
    }
  }

  const zonesActives = configLivraison?.zones.filter((z) => z.actif) ?? []
  const zoneInfo = configLivraison?.zones.find((z) => z.id === zoneSelectionnee)
  const montantPourGratuit = configLivraison?.seuilGratuit
    ? Math.max(0, configLivraison.seuilGratuit - totalPrix)
    : null

  if (items.length === 0) {
    return (
      <section className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <ShoppingBag size={48} className="mb-4 text-border-brand" />
        <h1 className="font-display text-[24px] font-light text-text-main">
          Panier vide
        </h1>
        <p className="mt-2 font-body text-[13px] text-text-muted-brand">
          Ajoutez des produits pour continuer.
        </p>
        <Link
          href="/boutique"
          className="mt-6 flex items-center gap-2 px-6 py-3 bg-primary-brand font-body text-xs uppercase tracking-widest text-white"
        >
          <ArrowLeft size={14} />
          Boutique
        </Link>
      </section>
    )
  }

  return (
    <section className="pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-border-brand px-4 py-3">
        <div className="flex items-center justify-between">
          <Link
            href="/boutique"
            className="flex items-center gap-2 font-body text-[13px] text-primary-brand"
          >
            <ArrowLeft size={16} />
            Boutique
          </Link>
          <h1 className="font-display text-[18px] text-text-main">Commande</h1>
          <div className="w-16" /> {/* Spacer */}
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* ─── Section 1: Panier (collapsible) ─── */}
        <div className="border border-border-brand bg-white">
          <button
            onClick={() => setCartExpanded(!cartExpanded)}
            className="w-full flex items-center justify-between px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <ShoppingBag size={18} className="text-gold" />
              <span className="font-body text-[14px] font-medium text-text-main">
                {totalArticles} article{totalArticles > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display text-[16px] text-text-main">
                {formatPrix(totalPrix)}
              </span>
              {cartExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </button>

          {cartExpanded && (
            <div className="border-t border-border-brand divide-y divide-border-brand">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 p-4">
                  <div className="relative h-16 w-16 shrink-0 bg-muted overflow-hidden">
                    <Image
                      src={item.imageUrl || "/images/placeholder-produit.jpg"}
                      alt={`Photo du produit ${item.nom}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-[13px] text-text-main truncate">
                      {item.nom}
                    </p>
                    <p className="font-body text-[12px] text-gold">
                      {formatPrix(item.prix)}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantite - 1)}
                        className="h-11 w-11 flex items-center justify-center border border-border-brand"
                        aria-label={`Réduire la quantité de ${item.nom}`}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center font-body text-[13px]">
                        {item.quantite}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantite + 1)}
                        disabled={item.quantite >= item.stock}
                        className="h-11 w-11 flex items-center justify-center border border-border-brand disabled:opacity-40"
                        aria-label={`Augmenter la quantité de ${item.nom}`}
                      >
                        <Plus size={16} />
                      </button>
                      <button
                        onClick={() => handleRemoveItem(item.id, item.nom)}
                        className="ml-auto h-11 w-11 flex items-center justify-center text-text-muted-brand hover:text-danger"
                        aria-label={`Supprimer ${item.nom} du panier`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Section 2: Livraison ─── */}
        <div className="border border-border-brand bg-white p-4">
          <div className="flex items-center gap-2 mb-3">
            <Truck size={18} className="text-primary-brand" />
            <span className="font-body text-[14px] font-medium text-text-main">
              Livraison
            </span>
          </div>

          {/* Zone selector */}
          {zonesActives.length > 1 && (
            <div className="mb-3">
              <label className="flex items-center gap-1 font-body text-[11px] uppercase tracking-wider text-text-muted-brand mb-1">
                <MapPin size={12} />
                Zone
              </label>
              <select
                value={zoneSelectionnee}
                onChange={(e) => setZoneSelectionnee(e.target.value)}
                className="w-full border border-border-brand px-3 py-2.5 font-body text-[13px] text-text-main focus:border-gold outline-none"
              >
                {zonesActives.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.nom} — {zone.frais === 0 ? "Gratuit" : formatPrix(zone.frais)}
                  </option>
                ))}
              </select>
              {zoneInfo && (
                <p className="mt-1 font-body text-[11px] text-text-muted-brand">
                  {zoneInfo.description} • {zoneInfo.delai}
                </p>
              )}
            </div>
          )}

          {/* Free shipping progress */}
          {montantPourGratuit !== null && montantPourGratuit > 0 && (
            <div className="p-3 bg-primary-light">
              <p className="font-body text-[12px] text-primary-brand">
                Plus que <strong>{formatPrix(montantPourGratuit)}</strong> pour la livraison gratuite !
              </p>
              <div className="mt-2 h-1 bg-white rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-brand transition-all"
                  style={{
                    width: `${Math.min(100, (totalPrix / (configLivraison?.seuilGratuit ?? 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {livraisonGratuite && (
            <div className="flex items-center gap-2 p-2 bg-primary-light">
              <Check size={14} className="text-primary-brand" />
              <span className="font-body text-[12px] text-primary-brand">
                Livraison gratuite !
              </span>
            </div>
          )}
        </div>

        {/* ─── Section 3: Code promo ─── */}
        <div className="border border-border-brand bg-white p-4">
          <div className="flex items-center gap-2 mb-3">
            <Tag size={18} className="text-gold" />
            <span className="font-body text-[14px] font-medium text-text-main">
              Code promo
            </span>
          </div>

          {promoApplique ? (
            <div className="flex items-center justify-between p-3 bg-primary-light">
              <div className="flex items-center gap-2">
                <Check size={16} className="text-primary-brand" />
                <span className="font-body text-[13px] text-primary-brand">
                  {promoCode} (-{promoPourcentage}%)
                </span>
              </div>
              <button
                onClick={() => {
                  setPromoApplique(false)
                  setPromoCode("")
                  setPromoPourcentage(0)
                  setCodePromo("")
                }}
                className="font-body text-[11px] text-primary-brand underline"
              >
                Retirer
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={codePromo}
                onChange={(e) => setCodePromo(e.target.value.toUpperCase())}
                placeholder="Entrez votre code"
                className="flex-1 border border-border-brand px-3 py-2.5 font-body text-[13px] focus:border-gold outline-none"
              />
              <button
                onClick={handleAppliquerPromo}
                disabled={promoLoading || !codePromo.trim()}
                className="px-4 py-2.5 bg-gold font-body text-xs uppercase tracking-wider text-white disabled:opacity-50"
              >
                {promoLoading ? "…" : "OK"}
              </button>
            </div>
          )}
          {promoErreur && (
            <p className="mt-2 font-body text-[12px] text-danger">{promoErreur}</p>
          )}
        </div>

        {/* ─── Section 4: Paiement ─── */}
        <div className="border border-border-brand bg-white p-4">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={18} className="text-primary-brand" />
            <span className="font-body text-[14px] font-medium text-text-main">
              Paiement
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {methodes.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethode(m.id)}
                className={`flex items-center justify-center gap-2 p-3 border transition-colors ${
                  methode === m.id
                    ? "border-primary-brand bg-primary-light"
                    : "border-border-brand hover:border-gold"
                }`}
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: m.color }}
                />
                <span className="font-body text-[12px] text-text-main">{m.label}</span>
                {methode === m.id && (
                  <Check size={14} className="text-primary-brand ml-auto" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Récapitulatif ─── */}
        <div className="border border-gold bg-gold-light p-4">
          <div className="space-y-2">
            <div className="flex justify-between font-body text-[13px]">
              <span className="text-text-mid">Sous-total</span>
              <span className="text-text-main">{formatPrix(totalPrix)}</span>
            </div>
            {promoApplique && (
              <div className="flex justify-between font-body text-[13px] text-primary-brand">
                <span>Réduction</span>
                <span>-{formatPrix(reduction)}</span>
              </div>
            )}
            <div className="flex justify-between font-body text-[13px]">
              <span className="text-text-mid">Livraison</span>
              <span className={livraisonGratuite ? "text-primary-brand" : "text-text-main"}>
                {livraisonGratuite ? "Gratuite" : formatPrix(fraisLivraison)}
              </span>
            </div>
            <div className="pt-2 border-t border-gold/30 flex justify-between">
              <span className="font-body text-[12px] uppercase tracking-wider text-text-muted-brand">
                Total
              </span>
              <span className="font-display text-[22px] text-primary-brand">
                {formatPrix(totalFinal)}
              </span>
            </div>
          </div>
        </div>

        {/* Erreur */}
        {erreur && (
          <div className="flex items-center gap-2 p-3 bg-danger/10 text-danger">
            <AlertCircle size={16} />
            <span className="font-body text-[13px]">{erreur}</span>
          </div>
        )}
      </div>

      {/* ─── Bouton fixe en bas ─── */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-border-brand safe-area-pb">
        <button
          onClick={handleInitierPaiement}
          disabled={loading || !methode}
          className="w-full flex items-center justify-center gap-2 py-4 bg-primary-brand font-body text-xs uppercase tracking-widest text-white disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              <Lock size={14} />
              Payer {formatPrix(totalFinal)}
            </>
          )}
        </button>
        <p className="mt-2 text-center font-body text-[10px] text-text-muted-brand">
          Paiement sécurisé via Jeko Africa
        </p>
      </div>

      {/* ─── Modale de confirmation ─── */}
      {showConfirmation && (
        <div 
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirmation-title"
        >
          <div className="w-full max-w-md bg-white animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border-brand px-4 py-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-primary-brand" aria-hidden="true" />
                <h2 id="confirmation-title" className="font-display text-[18px] text-text-main">
                  Confirmer la commande
                </h2>
              </div>
              <button
                onClick={() => setShowConfirmation(false)}
                className="p-1 hover:bg-muted rounded-full"
                aria-label="Fermer la confirmation"
              >
                <X size={20} className="text-text-muted-brand" />
              </button>
            </div>

            {/* Récapitulatif */}
            <div className="p-4 space-y-4">
              {/* Articles */}
              <div>
                <p className="font-body text-[11px] uppercase tracking-wider text-text-muted-brand mb-2">
                  {totalArticles} article{totalArticles > 1 ? "s" : ""}
                </p>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between font-body text-[13px]">
                      <span className="text-text-main truncate max-w-50">
                        {item.quantite}x {item.nom}
                      </span>
                      <span className="text-text-mid">{formatPrix(item.prix * item.quantite)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Détails */}
              <div className="border-t border-border-brand pt-3 space-y-2">
                <div className="flex justify-between font-body text-[13px]">
                  <span className="text-text-mid">Sous-total</span>
                  <span className="text-text-main">{formatPrix(totalPrix)}</span>
                </div>
                {promoApplique && (
                  <div className="flex justify-between font-body text-[13px] text-primary-brand">
                    <span>Réduction ({promoCode})</span>
                    <span>-{formatPrix(reduction)}</span>
                  </div>
                )}
                <div className="flex justify-between font-body text-[13px]">
                  <span className="text-text-mid">Livraison ({zoneInfo?.nom})</span>
                  <span className={livraisonGratuite ? "text-primary-brand" : "text-text-main"}>
                    {livraisonGratuite ? "Gratuite" : formatPrix(fraisLivraison)}
                  </span>
                </div>
                <div className="flex justify-between font-body text-[13px]">
                  <span className="text-text-mid">Paiement</span>
                  <span className="text-text-main">
                    {methodes.find((m) => m.id === methode)?.label}
                  </span>
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-gold pt-3 flex justify-between items-center">
                <span className="font-body text-[12px] uppercase tracking-wider text-text-muted-brand">
                  Total à payer
                </span>
                <span className="font-display text-[26px] text-primary-brand">
                  {formatPrix(totalFinal)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-border-brand space-y-2">
              <button
                ref={confirmButtonRef}
                onClick={handleConfirmerPaiement}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-4 bg-primary-brand font-body text-xs uppercase tracking-widest text-white"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" aria-label="Chargement en cours" />
                ) : (
                  <>
                    <Check size={16} aria-hidden="true" />
                    Confirmer et payer
                  </>
                )}
              </button>
              <button
                onClick={() => setShowConfirmation(false)}
                disabled={loading}
                className="w-full py-3 font-body text-[13px] text-text-mid hover:text-text-main"
              >
                Modifier ma commande
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
