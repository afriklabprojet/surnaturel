"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  CheckCircle,
  Clock,
  Calendar,
  Loader2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Stethoscope,
} from "lucide-react"
import { SOINS_DATA, type SoinMock } from "@/lib/soins-data"
import { formatPrix, formatDate } from "@/lib/utils"
import CalendrierRDV from "@/components/rdv/CalendrierRDV"
import SectionTag from "@/components/ui/SectionTag"

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

  // État du stepper
  const [etape, setEtape] = useState(1)
  const [soinSelectionne, setSoinSelectionne] = useState<SoinMock | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedHeure, setSelectedHeure] = useState<number | null>(null)
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState("")

  // Pré-sélection via ?soin=
  useEffect(() => {
    const soinParam = searchParams.get("soin")
    if (soinParam) {
      const found = SOINS_DATA.find((s) => s.slug === soinParam)
      if (found) {
        setSoinSelectionne(found)
        setEtape(2)
      }
    }
  }, [searchParams])

  const etapes = [
    { numero: 1, label: "Choisir un soin" },
    { numero: 2, label: "Date & Heure" },
    { numero: 3, label: "Confirmation" },
  ]

  function handleSelectSoin(soin: SoinMock) {
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
    setErreur("")
    setLoading(true)

    const dateHeure = `${selectedDate}T${String(selectedHeure).padStart(2, "0")}:00:00.000Z`

    try {
      const res = await fetch("/api/rdv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          soinId: soinSelectionne.slug,
          dateHeure,
          notes: notes || undefined,
        }),
      })

      if (res.status === 201) {
        router.push("/mes-rdv?nouveau=ok")
        return
      }

      if (res.status === 401) {
        router.push(`/connexion?callbackUrl=${encodeURIComponent("/prise-rdv?soin=" + soinSelectionne.slug)}`)
        return
      }

      const data: { error?: string } = await res.json()
      setErreur(data.error ?? "Une erreur est survenue.")
    } catch {
      setErreur("Impossible de contacter le serveur. Veuillez réessayer.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-16 sm:py-20 lg:px-10">
      {/* En-tête */}
      <div className="mb-14 text-center">
        <SectionTag>Réservation</SectionTag>
        <h1 className="mt-4 font-display text-4xl font-light text-text-main sm:text-5xl">
          Prendre <em className="text-primary-brand">rendez-vous</em>
        </h1>
        <p className="mt-4 font-body text-sm leading-relaxed text-text-mid">
          Réservez votre soin en 3 étapes simples
        </p>
      </div>

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
                  className={`mt-2 hidden font-body text-[10px] font-medium uppercase tracking-widest sm:block ${
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
          <div className="grid gap-3 sm:grid-cols-2">
            {SOINS_DATA.map((soin) => {
              const Icon = soin.icon
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

          <div className="mt-8 flex justify-end">
            <button
              onClick={allerEtape2}
              disabled={!soinSelectionne}
              className="flex items-center gap-2 bg-primary-brand px-7 py-3.5 font-body text-[11px] font-medium uppercase tracking-[0.15em] text-white transition-colors duration-300 hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
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
          />

          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => setEtape(1)}
              className="flex items-center gap-2 border border-border-brand px-5 py-2.5 font-body text-[11px] font-medium uppercase tracking-widest text-text-mid transition-colors duration-300 hover:bg-bg-page"
            >
              <ArrowLeft size={14} />
              Retour
            </button>
            <button
              onClick={allerEtape3}
              disabled={!selectedDate || selectedHeure === null}
              className="flex items-center gap-2 bg-primary-brand px-7 py-3.5 font-body text-[11px] font-medium uppercase tracking-[0.15em] text-white transition-colors duration-300 hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
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
                <p className="font-body text-[10px] font-medium uppercase tracking-[0.15em] text-text-muted-brand">
                  Soin
                </p>
                <p className="mt-1 font-body text-sm font-medium text-text-main">
                  {soinSelectionne.nom}
                </p>
              </div>
              <div>
                <p className="font-body text-[10px] font-medium uppercase tracking-[0.15em] text-text-muted-brand">
                  Durée
                </p>
                <p className="mt-1 flex items-center gap-1 font-body text-sm font-medium text-text-main">
                  <Clock size={13} className="text-text-muted-brand" />
                  {soinSelectionne.duree} minutes
                </p>
              </div>
              <div>
                <p className="font-body text-[10px] font-medium uppercase tracking-[0.15em] text-text-muted-brand">
                  Date
                </p>
                <p className="mt-1 flex items-center gap-1 font-body text-sm font-medium text-text-main">
                  <Calendar size={13} className="text-text-muted-brand" />
                  {formatDate(new Date(selectedDate + "T12:00:00"))}
                </p>
              </div>
              <div>
                <p className="font-body text-[10px] font-medium uppercase tracking-[0.15em] text-text-muted-brand">
                  Heure
                </p>
                <p className="mt-1 font-body text-sm font-medium text-text-main">
                  {String(selectedHeure).padStart(2, "0")}:00
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="font-body text-[10px] font-medium uppercase tracking-[0.15em] text-text-muted-brand">
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

          {/* Info connexion */}
          <div className="mt-4 border border-border-brand bg-gold-light/30 px-5 py-3 font-body text-[12px] text-gold">
            Vous devez être connecté(e) pour confirmer. Si vous n&apos;avez pas de
            compte, vous serez redirigé(e) vers la page de connexion.
          </div>

          {erreur && (
            <div className="mt-4 flex items-center gap-2 border border-red-200 bg-red-50 px-4 py-3 font-body text-[12px] text-danger">
              <AlertCircle size={14} className="shrink-0" />
              {erreur}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => setEtape(2)}
              className="flex items-center gap-2 border border-border-brand px-5 py-2.5 font-body text-[11px] font-medium uppercase tracking-widest text-text-mid transition-colors duration-300 hover:bg-bg-page"
            >
              <ArrowLeft size={14} />
              Retour
            </button>
            <button
              onClick={handleConfirmer}
              disabled={loading}
              className="flex items-center gap-2 bg-primary-brand px-7 py-3.5 font-body text-[11px] font-medium uppercase tracking-[0.15em] text-white transition-colors duration-300 hover:bg-primary-dark disabled:opacity-60"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle size={16} />
              )}
              {loading ? "Réservation en cours…" : "Confirmer le rendez-vous"}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
