"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
  ShieldCheck,
  MapPin,
  Phone,
  X,
} from "lucide-react"
import { formatPrix } from "@/lib/utils"
import { useCart } from "@/lib/cart-context"

// ─── Types ───────────────────────────────────────────────────────

interface Methode {
  id: string
  label: string
  color: string
}

// ─── Component ───────────────────────────────────────────────────

export default function PageCheckout() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const codePromo = searchParams.get("promo") || undefined
  const zoneId = searchParams.get("zone") || undefined
  const { items, totalPrix } = useCart()
  const [methodes, setMethodes] = useState<Methode[]>([])
  const [methode, setMethode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState("")
  const [promoReduction, setPromoReduction] = useState(0)
  const [promoPourcentage, setPromoPourcentage] = useState(0)
  const [fraisLivraison, setFraisLivraison] = useState(0)
  const [zoneNom, setZoneNom] = useState<string | null>(null)
  const [livraisonGratuite, setLivraisonGratuite] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const confirmBtnRef = useRef<HTMLButtonElement>(null)

  // ─── Adresse de livraison ─────────────────────────────────────
  const [nomDestinataire, setNomDestinataire] = useState("")
  const [adresseLivraison, setAdresseLivraison] = useState("")
  const [telephoneLivraison, setTelephoneLivraison] = useState("")
  const [adresseErreur, setAdresseErreur] = useState("")

  useEffect(() => {
    if (showConfirmation) confirmBtnRef.current?.focus()
  }, [showConfirmation])

  // Pré-remplir depuis le profil
  useEffect(() => {
    fetch("/api/profil")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setNomDestinataire(`${d.prenom ?? ""} ${d.nom ?? ""}`.trim())
          setTelephoneLivraison(d.telephone ?? "")
        }
      })
      .catch(() => {})
  }, [])

  const totalFinal = totalPrix - promoReduction + fraisLivraison

  useEffect(() => {
    fetch("/api/config/methodes_paiement")
      .then(r => r.json())
      .then(d => setMethodes(d.valeur || []))
      .catch(() => {})
  }, [])

  // Charger les frais de livraison
  useEffect(() => {
    fetch("/api/boutique/livraison", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zoneId: zoneId || "abidjan", montantCommande: totalPrix }),
    })
      .then(r => r.json())
      .then(d => {
        setFraisLivraison(d.frais || 0)
        setLivraisonGratuite(d.gratuit || false)
        setZoneNom(d.zone?.nom || null)
      })
      .catch(() => {
        setFraisLivraison(0)
        setLivraisonGratuite(true)
      })
  }, [zoneId, totalPrix])

  useEffect(() => {
    if (!codePromo) return
    fetch("/api/boutique/promo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: codePromo }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.pourcentage) {
          setPromoPourcentage(d.pourcentage)
          setPromoReduction(Math.round(totalPrix * d.pourcentage / 100))
        }
      })
      .catch(() => {})
  }, [codePromo, totalPrix])

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
          className="mt-8 flex items-center gap-2 px-6 py-3 bg-primary-brand font-body text-xs uppercase tracking-widest text-white transition-colors duration-200 hover:bg-primary-dark"
        >
          <ArrowLeft size={14} />
          Voir la boutique
        </Link>
      </section>
    )
  }

  function handleShowConfirmation() {
    if (!nomDestinataire.trim() || !adresseLivraison.trim()) {
      setAdresseErreur("Veuillez renseigner le nom et l\u2019adresse de livraison.")
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }
    if (!methode) {
      setErreur("Veuillez s\u00e9lectionner un mode de paiement.")
      return
    }
    setAdresseErreur("")
    setErreur("")
    setShowConfirmation(true)
  }

  async function handlePayer() {
    setShowConfirmation(false)
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
          codePromo,
          zoneId,
          fraisLivraison,
          nomDestinataire: nomDestinataire.trim(),
          adresseLivraison: adresseLivraison.trim(),
          ...(telephoneLivraison.trim() && { telephoneLivraison: telephoneLivraison.trim() }),
        }),
      })

      if (!commandeRes.ok) {
        const data: { error?: string } = await commandeRes.json()
        setErreur(data.error ?? "Impossible de créer votre commande. Vérifiez votre panier et réessayez.")
        setLoading(false)
        return
      }

      const { commandeId }: { commandeId: string } = await commandeRes.json()

      // 2. Initier le paiement Jeko (montant lu depuis la base côté serveur)
      const paiementRes = await fetch("/api/paiement/initier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commandeId,
          methode,
        }),
      })

      if (!paiementRes.ok) {
        const data: { error?: string } = await paiementRes.json()
        setErreur(data.error ?? "Le paiement n'a pas pu démarrer. Réessayez dans quelques instants.")
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
        {/* ─── Colonne gauche — Adresse + Paiement ─── */}
        <div className="lg:col-span-2 space-y-6">

          {/* ─── Bloc Adresse de livraison ─── */}
          <div className="border border-border-brand bg-white p-6 lg:p-8">
            <p className="font-body text-xs uppercase tracking-[0.15em] text-gold flex items-center gap-3">
              <span className="w-8 h-px bg-gold" />
              Adresse de livraison
              <span className="w-8 h-px bg-gold" />
            </p>

            <div className="mt-6 space-y-4">
              {/* Nom destinataire */}
              <div>
                <label
                  htmlFor="nom-destinataire"
                  className="block font-body text-[11px] uppercase tracking-[0.12em] text-text-muted-brand mb-2"
                >
                  Nom complet du destinataire <span className="text-danger">*</span>
                </label>
                <input
                  id="nom-destinataire"
                  type="text"
                  value={nomDestinataire}
                  onChange={(e) => setNomDestinataire(e.target.value)}
                  placeholder="Ex : Kouadio Marie"
                  className="w-full border border-border-brand px-4 py-3 font-body text-[13px] text-text-main outline-none focus:border-gold transition-colors duration-200 placeholder:text-text-muted-brand"
                />
              </div>

              {/* Adresse précise */}
              <div>
                <label
                  htmlFor="adresse-livraison"
                  className="block font-body text-[11px] uppercase tracking-[0.12em] text-text-muted-brand mb-2"
                >
                  <MapPin size={11} className="inline mr-1 mb-0.5" />
                  Adresse précise (quartier, rue, point de repère) <span className="text-danger">*</span>
                </label>
                <textarea
                  id="adresse-livraison"
                  value={adresseLivraison}
                  onChange={(e) => setAdresseLivraison(e.target.value)}
                  placeholder={"Ex : Cocody Riviera 3, rue des Bougainvillées\nImmeuble vert, 2e étage, appt. 12"}
                  rows={3}
                  className="w-full resize-none border border-border-brand px-4 py-3 font-body text-[13px] text-text-main outline-none focus:border-gold transition-colors duration-200 placeholder:text-text-muted-brand"
                />
              </div>

              {/* Téléphone livraison */}
              <div>
                <label
                  htmlFor="tel-livraison"
                  className="block font-body text-[11px] uppercase tracking-[0.12em] text-text-muted-brand mb-2"
                >
                  <Phone size={11} className="inline mr-1 mb-0.5" />
                  Téléphone pour le livreur
                </label>
                <input
                  id="tel-livraison"
                  type="tel"
                  value={telephoneLivraison}
                  onChange={(e) => setTelephoneLivraison(e.target.value)}
                  placeholder="07 00 00 00 00"
                  className="w-full border border-border-brand px-4 py-3 font-body text-[13px] text-text-main outline-none focus:border-gold transition-colors duration-200 placeholder:text-text-muted-brand"
                />
              </div>

              {/* Erreur adresse */}
              {adresseErreur && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200">
                  <AlertCircle size={16} className="shrink-0 text-danger" />
                  <span className="font-body text-[12px] text-danger">{adresseErreur}</span>
                </div>
              )}
            </div>
          </div>

          {/* ─── Bloc Paiement ─── */}
          <div className="border border-border-brand bg-white p-6 lg:p-8">
            {/* Tag */}
            <p className="font-body text-xs uppercase tracking-[0.15em] text-gold flex items-center gap-3">
              <span className="w-8 h-px bg-gold" />
              Choisissez votre méthode
              <span className="w-8 h-px bg-gold" />
            </p>

            {/* Grille méthodes */}
            <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
              {methodes.map((m) => {
                const logoMap: Record<string, string> = {
                  wave: "/logos/wave.svg",
                  orange: "/logos/orange-money.svg",
                  mtn: "/logos/mtn.svg",
                  moov: "/logos/moov.svg",
                  djamo: "/logos/djamo.svg",
                }
                const logoSrc = logoMap[m.id]
                return (
                  <button
                    key={m.id}
                    onClick={() => setMethode(m.id)}
                    className={`flex flex-col items-center gap-3 p-5 border-2 transition-all duration-200 ${
                      methode === m.id
                        ? "border-primary-brand bg-primary-light"
                        : "border-border-brand bg-white hover:border-gold"
                    }`}
                  >
                    {logoSrc ? (
                      <Image
                        src={logoSrc}
                        alt={m.label}
                        width={40}
                        height={40}
                        className="h-10 w-10 object-contain"
                      />
                    ) : (
                      <div
                        className="flex h-10 w-10 items-center justify-center"
                        style={{ backgroundColor: m.color + "20" }}
                      >
                        <span
                          className="font-body text-[14px] font-medium"
                          style={{ color: m.color }}
                        >
                          {m.label.charAt(0)}
                        </span>
                      </div>
                    )}
                    <span className="font-body text-[13px] text-text-main">
                      {m.label}
                    </span>
                    {methode === m.id && (
                      <Check size={16} className="text-primary-brand" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Erreur */}
            {erreur && (
              <div className="mt-6 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200">
                <AlertCircle size={16} className="shrink-0 text-danger" />
                <span className="font-body text-[12px] text-danger">{erreur}</span>
              </div>
            )}

            {/* Bouton payer — desktop */}
            <button
              onClick={handleShowConfirmation}
              disabled={!methode || loading}
              className="mt-8 hidden lg:flex w-full items-center justify-center gap-2 py-4 bg-primary-brand font-body text-xs uppercase tracking-widest text-white transition-colors duration-200 hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Traitement en cours…
                </>
              ) : (
                <>
                  Payer {formatPrix(totalFinal)} F CFA
                  <ArrowRight size={14} />
                </>
              )}
            </button>

            {/* Mentions sécurité */}
            <div className="mt-6 hidden lg:flex items-center justify-center gap-2 text-center">
              <Lock size={12} className="text-text-muted-brand" />
              <span className="font-body text-xs text-text-muted-brand">
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
                    <p className="mt-0.5 font-body text-xs text-text-muted-brand">
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
            {promoReduction > 0 && (
              <div className="mt-2 flex items-center justify-between">
                <span className="font-body text-[12px] text-primary-brand">
                  Promo −{promoPourcentage}%
                </span>
                <span className="font-body text-[12px] font-medium text-primary-brand">
                  −{formatPrix(promoReduction)}
                </span>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between">
              <span className="font-body text-[12px] text-text-muted-brand">
                Livraison{zoneNom ? ` (${zoneNom})` : ""}
              </span>
              {livraisonGratuite ? (
                <span className="font-body text-[12px] text-primary-brand">Gratuite</span>
              ) : (
                <span className="font-display text-[14px] text-text-main">
                  {formatPrix(fraisLivraison)}
                </span>
              )}
            </div>

            {/* Total */}
            <div className="mt-4 pt-4 border-t border-border-brand">
              <div className="flex items-center justify-between">
                <span className="font-body text-[12px] uppercase tracking-widest text-text-muted-brand">
                  Total
                </span>
                <span className="font-display text-[24px] font-normal text-primary-brand">
                  {formatPrix(totalFinal)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Sticky pay bar — mobile uniquement ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border-brand bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0))] lg:hidden">
        {erreur && (
          <p className="mb-2 text-center font-body text-[11px] text-danger">{erreur}</p>
        )}
        <button
          onClick={handleShowConfirmation}
          disabled={!methode || loading}
          className="flex w-full items-center justify-center gap-2 py-4 bg-primary-brand font-body text-xs uppercase tracking-widest text-white transition-colors duration-200 hover:bg-primary-dark disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirmation-checkout-title"
        >
          <div className="w-full max-w-md bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border-brand px-5 py-4">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-primary-brand" aria-hidden="true" />
                <h2 id="confirmation-checkout-title" className="font-display text-[20px] font-light text-text-main">
                  Confirmer la commande
                </h2>
              </div>
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex h-9 w-9 items-center justify-center text-text-muted-brand hover:text-text-main"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Articles */}
            <div className="max-h-44 overflow-y-auto divide-y divide-border-brand px-5 py-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 font-body text-[13px]">
                  <span className="truncate max-w-50 text-text-main">
                    {item.quantite}× {item.nom}
                  </span>
                  <span className="ml-4 shrink-0 text-text-mid">
                    {formatPrix(item.prix * item.quantite)}
                  </span>
                </div>
              ))}
            </div>

            {/* Détails */}
            <div className="border-t border-border-brand px-5 py-4 space-y-2">
              <div className="flex justify-between font-body text-[13px]">
                <span className="text-text-mid">Sous-total</span>
                <span className="text-text-main">{formatPrix(totalPrix)}</span>
              </div>
              {promoReduction > 0 && (
                <div className="flex justify-between font-body text-[13px] text-primary-brand">
                  <span>Réduction −{promoPourcentage}%</span>
                  <span>−{formatPrix(promoReduction)}</span>
                </div>
              )}
              <div className="flex justify-between font-body text-[13px]">
                <span className="text-text-mid">Livraison{zoneNom ? ` (${zoneNom})` : ""}</span>
                {livraisonGratuite ? (
                  <span className="text-primary-brand">Gratuite</span>
                ) : (
                  <span className="text-text-main">{formatPrix(fraisLivraison)}</span>
                )}
              </div>
              <div className="flex justify-between font-body text-[13px]">
                <span className="text-text-mid">Paiement</span>
                <span className="text-text-main">
                  {methodes.find((m) => m.id === methode)?.label}
                </span>
              </div>
              {nomDestinataire && (
                <div className="flex justify-between font-body text-[13px]">
                  <span className="text-text-mid shrink-0 mr-3">Destinataire</span>
                  <span className="text-text-main text-right">{nomDestinataire}</span>
                </div>
              )}
              {adresseLivraison && (
                <div className="flex justify-between font-body text-[12px]">
                  <span className="text-text-muted-brand shrink-0 mr-3">Adresse</span>
                  <span className="text-text-main text-right whitespace-pre-line">{adresseLivraison}</span>
                </div>
              )}
            </div>

            {/* Total + actions */}
            <div className="border-t border-gold px-5 py-4">
              <div className="flex items-center justify-between mb-4">
                <span className="font-body text-[11px] uppercase tracking-widest text-text-muted-brand">
                  Total à payer
                </span>
                <span className="font-display text-[26px] font-normal text-primary-brand">
                  {formatPrix(totalFinal)}
                </span>
              </div>
              <button
                ref={confirmBtnRef}
                onClick={handlePayer}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 py-4 bg-primary-brand font-body text-xs uppercase tracking-widest text-white transition-colors duration-200 hover:bg-primary-dark disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Check size={15} aria-hidden="true" />
                    Confirmer et payer
                  </>
                )}
              </button>
              <button
                onClick={() => setShowConfirmation(false)}
                disabled={loading}
                className="mt-2 w-full py-2.5 font-body text-[13px] text-text-mid hover:text-text-main transition-colors"
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
