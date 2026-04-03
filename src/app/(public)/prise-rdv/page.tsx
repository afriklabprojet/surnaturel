"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { toast } from "sonner"
import {
  CheckCircle,
  Clock,
  Calendar,
  Loader2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Stethoscope,
  Phone,
  CreditCard,
  Shield,
} from "lucide-react"
import { formatPrix, formatDate } from "@/lib/utils"
import { getIcon } from "@/lib/icon-map"
import CalendrierRDV from "@/components/rdv/CalendrierRDV"
import SectionTag from "@/components/ui/SectionTag"

interface SoinItem {
  id: string
  slug: string
  nom: string
  description: string
  prix: number
  duree: number
  categorie: string
  icon?: string | null
  badge?: string | null
}

export default function PagePriseRDV() {
  return (
    <Suspense>
      <PriseRDVContent />
    </Suspense>
  )
}

function PriseRDVContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status: authStatus } = useSession()

  // État du stepper
  const [etape, setEtape] = useState(1)
  const [soinsData, setSoinsData] = useState<SoinItem[]>([])
  const [soinSelectionne, setSoinSelectionne] = useState<SoinItem | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedHeure, setSelectedHeure] = useState<number | null>(null)
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState("")
  // Étape 4 : acompte
  const [rdvId, setRdvId] = useState<string | null>(null)
  const [telephone, setTelephone] = useState("")
  const [methode, setMethode] = useState<string | null>(null)
  const [methodes, setMethodes] = useState<{ id: string; label: string; color: string }[]>([])
  const [loadingPaiement, setLoadingPaiement] = useState(false)

  const [montantAcompte, setMontantAcompte] = useState(2000)
  const [creneauxMatin, setCreneauxMatin] = useState<number[] | undefined>(undefined)
  const [creneauxApresMidi, setCreneauxApresMidi] = useState<number[] | undefined>(undefined)

  // Charger le montant d'acompte depuis la config (défaut : 2 000 F CFA)
  useEffect(() => {
    fetch("/api/config/booking_montant_acompte")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (typeof d?.valeur === "number") setMontantAcompte(d.valeur) })
      .catch(() => {})
    fetch("/api/config/booking_creneaux_matin")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (Array.isArray(d?.valeur)) setCreneauxMatin(d.valeur) })
      .catch(() => {})
    fetch("/api/config/booking_creneaux_apres_midi")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (Array.isArray(d?.valeur)) setCreneauxApresMidi(d.valeur) })
      .catch(() => {})
  }, [])

  // Charger les soins depuis l'API + restaurer la sélection depuis les URL params
  useEffect(() => {
    fetch("/api/soins")
      .then(r => r.json())
      .then(d => {
        const soins = d.soins || []
        setSoinsData(soins)

        const soinParam = searchParams.get("soin")
        const dateParam = searchParams.get("date")
        const heureParam = searchParams.get("heure")

        if (soinParam) {
          const found = soins.find((s: SoinItem) => s.slug === soinParam)
          if (found) {
            setSoinSelectionne(found)
            // Si date + heure sont dans l'URL (retour après connexion), aller à l'étape 3
            if (dateParam && heureParam) {
              const h = parseInt(heureParam, 10)
              if (!isNaN(h)) {
                setSelectedDate(dateParam)
                setSelectedHeure(h)
                setEtape(3)
              } else {
                setEtape(2)
              }
            } else {
              setEtape(2)
            }
          }
        }
      })
      .catch(() => {})
  }, [searchParams])

  const etapes = [
    { numero: 1, label: "Choisir un soin" },
    { numero: 2, label: "Date & Heure" },
    { numero: 3, label: "Récapitulatif" },
    { numero: 4, label: "Paiement" },
  ]

  function handleSelectSoin(soin: SoinItem) {
    setSoinSelectionne(soin)
    setSelectedDate(null)
    setSelectedHeure(null)
  }

  function allerEtape2() {
    if (soinSelectionne) setEtape(2)
  }

  function allerEtape3() {
    if (selectedDate && selectedHeure !== null) setEtape(3)
  }

  async function handleConfirmer() {
    if (!soinSelectionne || !selectedDate || selectedHeure === null) return

    // Rediriger vers connexion si pas de session (en conservant toute la sélection)
    if (!session) {
      const callbackUrl = `/prise-rdv?soin=${soinSelectionne.slug}&date=${selectedDate}&heure=${selectedHeure}`
      router.push(`/connexion?callbackUrl=${encodeURIComponent(callbackUrl)}`)
      return
    }

    setErreur("")
    setLoading(true)
    try {
      const mRes = await fetch("/api/config/methodes_paiement")
      const mData = await mRes.json()
      setMethodes(mData.valeur || [])
    } catch {
      // Continuer même sans méthodes
    } finally {
      setLoading(false)
    }
    setEtape(4)
  }

  async function handlePayerAcompte() {
    if (!soinSelectionne || !selectedDate || selectedHeure === null || !methode) return
    setErreur("")
    setLoadingPaiement(true)

    const dateHeure = `${selectedDate}T${String(selectedHeure).padStart(2, "0")}:00:00.000Z`

    try {
      const res = await fetch("/api/rdv/reserver-et-payer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          soinId: soinSelectionne.id,
          dateHeure,
          notes: notes || undefined,
          montant: montantAcompte,
          methode,
          telephone: telephone || undefined,
        }),
      })

      if (res.ok) {
        const data: { redirectUrl: string } = await res.json()
        window.location.href = data.redirectUrl
        return
      }

      const data: { error?: string } = await res.json()
      setErreur(data.error ?? "Le paiement n'a pas abouti. Vérifiez vos informations et réessayez.")
    } catch {
      setErreur("Impossible de contacter le serveur.")
    } finally {
      setLoadingPaiement(false)
    }
  }

  async function handleReserverSansAcompte() {
    if (!soinSelectionne || !selectedDate || selectedHeure === null) return
    setErreur("")
    setLoading(true)
    const dateHeure = `${selectedDate}T${String(selectedHeure).padStart(2, "0")}:00:00.000Z`
    try {
      const res = await fetch("/api/rdv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          soinId: soinSelectionne.id,
          dateHeure,
          notes: notes || undefined,
        }),
      })
      if (res.status === 201) {
        toast.success("Rendez-vous réservé avec succès !")
        router.push("/mes-rdv?nouveau=ok")
        return
      }
      const data: { error?: string } = await res.json()
      setErreur(data.error ?? "Une erreur est survenue.")
    } catch {
      setErreur("Impossible de contacter le serveur.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    {/* Hero */}
    <section className="relative overflow-hidden bg-linear-to-br from-primary-brand via-primary-brand/95 to-primary-dark px-6 py-20 sm:py-24 lg:px-10">
      <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-gold/10 blur-3xl" />
      <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 60px, rgba(255,255,255,0.1) 60px, rgba(255,255,255,0.1) 61px)" }} />
      <div className="relative mx-auto max-w-4xl text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center border border-gold/30 bg-gold/10">
          <Calendar size={24} className="text-gold" />
        </div>
        <span className="inline-block bg-gold/20 px-4 py-1.5 font-body text-xs uppercase tracking-[0.2em] text-gold border border-gold/30">
          Réservation
        </span>
        <h1 className="mt-6 font-display text-4xl font-light text-white sm:text-5xl lg:text-6xl">
          Prendre <em className="text-gold italic">rendez-vous</em>
        </h1>
        <p className="mt-5 font-body text-[15px] font-light leading-relaxed text-white/75">
          Réservez votre soin en 3 étapes simples
        </p>
        <div className="mx-auto mt-6 h-px w-16 bg-gold/40" />
      </div>
    </section>

    <section className="mx-auto max-w-4xl px-6 py-16 sm:py-20 lg:px-10">
      <div className="mb-14" />

      {/* Stepper */}
      <div className="mb-12">
        <div className="flex items-center justify-center">
          {etapes.map((e, i) => (
            <div key={e.numero} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center font-body text-[12px] font-medium transition-colors duration-300 ${
                    etape > e.numero
                      ? "bg-primary-brand text-white"
                      : etape === e.numero
                        ? "border-2 border-gold bg-white text-gold"
                        : "border border-border-brand bg-white text-text-muted-brand"
                  }`}
                >
                  {etape > e.numero ? (
                    <CheckCircle size={16} />
                  ) : (
                    e.numero
                  )}
                </div>
                <span
                  className={`mt-2 hidden font-body text-xs font-medium uppercase tracking-widest sm:block ${
                    etape >= e.numero ? "text-gold" : "text-text-muted-brand"
                  }`}
                >
                  {e.label}
                </span>
              </div>
              {i < etapes.length - 1 && (
                <div
                  className={`mx-3 h-px w-12 sm:w-20 ${
                    etape > e.numero ? "bg-primary-brand" : "bg-border-brand"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ─── Étape 1 : Choisir un soin ──────────────────────────── */}
      {etape === 1 && (
        <div>
          <h2 className="mb-6 font-display text-2xl font-light text-text-main">
            Sélectionnez votre soin
          </h2>
          {/* Bandeau connexion pour visiteurs non connectés */}
          {authStatus !== "loading" && !session && (
            <div className="mb-6 flex flex-col gap-3 border border-gold/30 bg-gold-light/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2">
                <AlertCircle size={15} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
                <p className="font-body text-[12px] text-text-mid">
                  Votre sélection sera conservée.{" "}
                  <strong className="text-text-main">Une connexion vous sera demandée avant la confirmation.</strong>
                </p>
              </div>
              <Link
                href={`/connexion?callbackUrl=${encodeURIComponent("/prise-rdv")}`}
                className="shrink-0 font-body text-[11px] font-medium uppercase tracking-[0.12em] text-primary-brand underline-offset-2 hover:underline"
              >
                Se connecter maintenant
              </Link>
            </div>
          )}          <div className="grid gap-3 sm:grid-cols-2">
            {soinsData.map((soin) => {
              const Icon = getIcon(soin.icon)
              const isSelected = soinSelectionne?.slug === soin.slug
              return (
                <button
                  key={soin.slug}
                  onClick={() => handleSelectSoin(soin)}
                  className={`flex items-start gap-4 border-2 p-5 text-left transition-all duration-300 ${
                    isSelected
                      ? "border-gold bg-gold-light/30"
                      : "border-border-brand bg-white hover:border-gold/40"
                  }`}
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center ${
                      isSelected ? "bg-gold text-white" : "bg-gold-light text-gold"
                    }`}
                  >
                    <Icon size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-base font-light text-text-main">
                      {soin.nom}
                    </h3>
                    <div className="mt-1 flex items-center gap-3 font-body text-[12px] text-text-muted-brand">
                      <span className="flex items-center gap-1">
                        <Clock size={13} />
                        {soin.duree} min
                      </span>
                      <span className="font-medium text-gold">
                        {formatPrix(soin.prix)}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle
                      size={18}
                      className="shrink-0 text-gold"
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Notice acompte */}
          <div className="mt-6 flex items-start gap-3 border border-gold/40 bg-gold-light/30 px-4 py-3">
            <Shield size={14} className="mt-0.5 shrink-0 text-gold" />
            <p className="font-body text-[12px] text-text-mid">
              Un acompte de{" "}
              <strong className="font-medium text-text-main">{formatPrix(montantAcompte)}</strong>{" "}
              vous sera demandé lors de la confirmation pour sécuriser votre créneau.
            </p>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={allerEtape2}
              disabled={!soinSelectionne}
              className="flex items-center gap-2 bg-primary-brand px-7 py-3.5 font-body text-xs font-medium uppercase tracking-[0.15em] text-white transition-colors duration-300 hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continuer
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ─── Étape 2 : Date & Heure ─────────────────────────────── */}
      {etape === 2 && soinSelectionne && (
        <div>
          <h2 className="mb-2 font-display text-2xl font-light text-text-main">
            Choisissez la date et l&apos;heure
          </h2>
          <p className="mb-6 font-body text-sm text-text-muted-brand">
            Soin sélectionné :{" "}
            <span className="font-medium text-gold">
              {soinSelectionne.nom}
            </span>
          </p>

          <CalendrierRDV
            soinId={soinSelectionne.slug}
            selectedDate={selectedDate}
            selectedHeure={selectedHeure}
            onSelectDate={setSelectedDate}
            onSelectHeure={setSelectedHeure}
            creneauxMatin={creneauxMatin}
            creneauxApresMidi={creneauxApresMidi}
          />

          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => setEtape(1)}
              className="flex items-center gap-2 border border-border-brand px-5 py-2.5 font-body text-xs font-medium uppercase tracking-widest text-text-mid transition-colors duration-300 hover:bg-bg-page"
            >
              <ArrowLeft size={14} />
              Retour
            </button>
            <button
              onClick={allerEtape3}
              disabled={!selectedDate || selectedHeure === null}
              className="flex items-center gap-2 bg-primary-brand px-7 py-3.5 font-body text-xs font-medium uppercase tracking-[0.15em] text-white transition-colors duration-300 hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continuer
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ─── Étape 3 : Confirmation ──────────────────────────────── */}
      {etape === 3 && soinSelectionne && selectedDate && selectedHeure !== null && (
        <div>
          <h2 className="mb-6 font-display text-2xl font-light text-text-main">
            Confirmez votre rendez-vous
          </h2>

          {/* Récapitulatif */}
          <div className="border border-border-brand bg-white p-7">
            <h3 className="mb-5 flex items-center gap-2 font-display text-lg font-light text-text-main">
              <Stethoscope size={18} className="text-gold" />
              Récapitulatif
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="font-body text-xs font-medium uppercase tracking-[0.15em] text-text-muted-brand">
                  Soin
                </p>
                <p className="mt-1 font-body text-sm font-medium text-text-main">
                  {soinSelectionne.nom}
                </p>
              </div>
              <div>
                <p className="font-body text-xs font-medium uppercase tracking-[0.15em] text-text-muted-brand">
                  Durée
                </p>
                <p className="mt-1 flex items-center gap-1 font-body text-sm font-medium text-text-main">
                  <Clock size={13} className="text-text-muted-brand" />
                  {soinSelectionne.duree} minutes
                </p>
              </div>
              <div>
                <p className="font-body text-xs font-medium uppercase tracking-[0.15em] text-text-muted-brand">
                  Date
                </p>
                <p className="mt-1 flex items-center gap-1 font-body text-sm font-medium text-text-main">
                  <Calendar size={13} className="text-text-muted-brand" />
                  {formatDate(new Date(selectedDate + "T12:00:00"))}
                </p>
              </div>
              <div>
                <p className="font-body text-xs font-medium uppercase tracking-[0.15em] text-text-muted-brand">
                  Heure
                </p>
                <p className="mt-1 font-body text-sm font-medium text-text-main">
                  {String(selectedHeure).padStart(2, "0")}:00
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="font-body text-xs font-medium uppercase tracking-[0.15em] text-text-muted-brand">
                  Prix
                </p>
                <p className="mt-1 font-display text-2xl font-light text-gold">
                  {formatPrix(soinSelectionne.prix)}
                </p>
              </div>
            </div>
          </div>

          {/* Notes optionnelles */}
          <div className="mt-6">
            <label
              htmlFor="notes"
              className="mb-1.5 block font-body text-[12px] font-medium text-text-main"
            >
              Notes <span className="font-normal text-text-muted-brand">(optionnel)</span>
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Informations complémentaires, allergies, préférences…"
              className="w-full border border-border-brand bg-white px-4 py-3 font-body text-sm text-text-main outline-none transition-colors duration-300 placeholder:text-text-muted-brand/60 focus:border-gold"
            />
          </div>

          {/* Bloc connexion — visible uniquement si non connecté */}
          {authStatus === "unauthenticated" && soinSelectionne && selectedDate && selectedHeure !== null && (
            <div className="mt-6 border border-primary-brand/30 bg-primary-light/20 p-6">
              <div className="flex items-start gap-3">
                <Shield size={20} className="mt-0.5 shrink-0 text-primary-brand" />
                <div className="flex-1">
                  <p className="font-body text-[14px] font-medium text-primary-brand">
                    Connexion requise pour confirmer
                  </p>
                  <p className="mt-1 font-body text-[12px] text-text-mid">
                    Votre soin, date et heure sont sauvegardés. Connectez-vous pour finaliser votre réservation.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href={`/connexion?callbackUrl=${encodeURIComponent(`/prise-rdv?soin=${soinSelectionne.slug}&date=${selectedDate}&heure=${selectedHeure}`)}`}
                      className="inline-flex items-center gap-2 bg-primary-brand px-5 py-2.5 font-body text-xs font-medium uppercase tracking-[0.15em] text-white transition-colors hover:bg-primary-dark"
                    >
                      Se connecter
                      <ArrowRight size={13} />
                    </Link>
                    <Link
                      href={`/inscription?callbackUrl=${encodeURIComponent(`/prise-rdv?soin=${soinSelectionne.slug}&date=${selectedDate}&heure=${selectedHeure}`)}`}
                      className="inline-flex items-center gap-2 border border-primary-brand px-5 py-2.5 font-body text-xs font-medium uppercase tracking-[0.15em] text-primary-brand transition-colors hover:bg-primary-light/40"
                    >
                      Créer un compte
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {erreur && (
            <div className="mt-4 flex items-center gap-2 border border-red-200 bg-red-50 px-4 py-3 font-body text-[12px] text-danger">
              <AlertCircle size={14} className="shrink-0" />
              {erreur}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => setEtape(2)}
              className="flex items-center gap-2 border border-border-brand px-5 py-2.5 font-body text-xs font-medium uppercase tracking-widest text-text-mid transition-colors duration-300 hover:bg-bg-page"
            >
              <ArrowLeft size={14} />
              Retour
            </button>
            {authStatus !== "unauthenticated" && (
              <button
                onClick={handleConfirmer}
                disabled={loading || authStatus === "loading"}
                className="flex items-center gap-2 bg-primary-brand px-7 py-3.5 font-body text-xs font-medium uppercase tracking-[0.15em] text-white transition-colors duration-300 hover:bg-primary-dark disabled:opacity-60"
              >
                {loading || authStatus === "loading" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CreditCard size={16} />
                )}
                {loading ? "Chargement…" : "Procéder au paiement"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── Étape 4 : Paiement acompte ──────────────────────────── */}
      {etape === 4 && soinSelectionne && (
        <div>
          <h2 className="mb-2 font-display text-2xl font-light text-text-main">
            Payer l&apos;acompte pour confirmer
          </h2>
          <p className="mb-6 font-body text-sm text-text-muted-brand">
            Réglez un acompte de <span className="font-medium text-gold">{formatPrix(montantAcompte)}</span> pour
            valider définitivement votre créneau.
            Le reste ({formatPrix(soinSelectionne.prix - montantAcompte)}) sera à régler sur place.
          </p>

          {/* Avantages acompte */}
          <div className="mb-8 grid gap-3 sm:grid-cols-3">
            <div className="flex items-start gap-3 border border-border-brand bg-white p-4">
              <Shield size={18} className="mt-0.5 shrink-0 text-gold" />
              <div>
                <p className="font-body text-[12px] font-medium text-text-main">Créneau garanti</p>
                <p className="font-body text-xs text-text-muted-brand">Votre place est réservée</p>
              </div>
            </div>
            <div className="flex items-start gap-3 border border-border-brand bg-white p-4">
              <CreditCard size={18} className="mt-0.5 shrink-0 text-gold" />
              <div>
                <p className="font-body text-[12px] font-medium text-text-main">Paiement sécurisé</p>
                <p className="font-body text-xs text-text-muted-brand">Via Mobile Money</p>
              </div>
            </div>
            <div className="flex items-start gap-3 border border-border-brand bg-white p-4">
              <Phone size={18} className="mt-0.5 shrink-0 text-gold" />
              <div>
                <p className="font-body text-[12px] font-medium text-text-main">Rappel SMS</p>
                <p className="font-body text-xs text-text-muted-brand">La veille de votre RDV</p>
              </div>
            </div>
          </div>

          {/* Téléphone pour rappel SMS */}
          <div className="mb-6">
            <label
              htmlFor="telephone"
              className="mb-1.5 block font-body text-[12px] font-medium text-text-main"
            >
              Numéro de téléphone <span className="font-normal text-text-muted-brand">(pour le rappel SMS)</span>
            </label>
            <input
              id="telephone"
              type="tel"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              placeholder="07 XX XX XX XX"
              className="w-full border border-border-brand bg-white px-4 py-3 font-body text-sm text-text-main outline-none transition-colors duration-300 placeholder:text-text-muted-brand/60 focus:border-gold"
            />
            <p className="mt-1 font-body text-xs text-text-muted-brand">
              Vous recevrez un SMS de rappel la veille de votre rendez-vous.
            </p>
          </div>

          {/* Méthodes de paiement */}
          <div className="mb-6">
            <p className="mb-3 font-body text-[12px] font-medium text-text-main">
              Choisissez votre moyen de paiement
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {methodes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethode(m.id)}
                  className={`flex items-center justify-center gap-2 border-2 px-4 py-3 font-body text-[12px] font-medium transition-all duration-300 ${
                    methode === m.id
                      ? "border-gold bg-gold-light/30 text-gold"
                      : "border-border-brand bg-white text-text-mid hover:border-gold/40"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Récap montant */}
          <div className="mb-6 border border-border-brand bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="font-body text-sm text-text-mid">Acompte à payer</span>
              <span className="font-display text-2xl font-light text-gold">
                {formatPrix(montantAcompte)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-border-brand pt-2">
              <span className="font-body text-[12px] text-text-muted-brand">Reste à régler sur place</span>
              <span className="font-body text-sm text-text-mid">
                {formatPrix(soinSelectionne.prix - montantAcompte)}
              </span>
            </div>
          </div>

          {erreur && (
            <div className="mb-4 flex items-center gap-2 border border-red-200 bg-red-50 px-4 py-3 font-body text-[12px] text-danger">
              <AlertCircle size={14} className="shrink-0" />
              {erreur}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={handleReserverSansAcompte}
              disabled={loading}
              className="font-body text-xs text-text-muted-brand underline transition-colors duration-300 hover:text-text-mid disabled:opacity-50"
            >
              {loading ? "Réservation en cours…" : "Réserver sans payer l'acompte"}
            </button>
            <button
              onClick={handlePayerAcompte}
              disabled={!methode || loadingPaiement}
              className="flex items-center gap-2 bg-gold px-7 py-3.5 font-body text-xs font-medium uppercase tracking-[0.15em] text-white transition-colors duration-300 hover:bg-gold-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingPaiement ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CreditCard size={16} />
              )}
              {loadingPaiement ? "Paiement en cours…" : `Payer ${formatPrix(montantAcompte)}`}
            </button>
          </div>
        </div>
      )}
    </section>
    </>
  )
}
