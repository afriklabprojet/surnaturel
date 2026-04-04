"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Save } from "lucide-react"

const INTENTIONS = [
  { value: "AMITIE", label: "Amitié", description: "Rencontres amicales, échanges" },
  { value: "RELATION_SERIEUSE", label: "Relation sérieuse", description: "Cherche une relation stable" },
  { value: "MARIAGE", label: "Mariage", description: "Cherche un/une partenaire de vie" },
] as const

type Intention = (typeof INTENTIONS)[number]["value"]

interface Preferences {
  intention: Intention
  ageMin: number
  ageMax: number
  distanceKm: number
  actif: boolean
}

interface FormulairePreferencesProps {
  initial: Preferences | null
  onSaved: (prefs: Preferences) => void
}

export default function FormulairePreferences({
  initial,
  onSaved,
}: FormulairePreferencesProps) {
  const [intention, setIntention] = useState<Intention>(
    initial?.intention ?? "RELATION_SERIEUSE"
  )
  const [ageMin, setAgeMin] = useState(initial?.ageMin ?? 18)
  const [ageMax, setAgeMax] = useState(initial?.ageMax ?? 50)
  const [distanceKm, setDistanceKm] = useState(initial?.distanceKm ?? 50)
  const [actif, setActif] = useState(initial?.actif ?? true)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (ageMin > ageMax) {
      toast.error("L'âge minimum doit être inférieur à l'âge maximum")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/rencontres/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intention, ageMin, ageMax, distanceKm, actif }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? "Erreur serveur")
      }

      toast.success("Préférences enregistrées")
      onSaved({ intention, ageMin, ageMax, distanceKm, actif })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur inattendue")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Intention */}
      <div className="space-y-2">
        <label className="font-medium text-text-main text-sm">Je cherche…</label>
        <div className="grid gap-2">
          {INTENTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setIntention(opt.value)}
              className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-colors ${
                intention === opt.value
                  ? "border-primary-brand bg-primary-light"
                  : "border-border-brand hover:border-primary-brand/40"
              }`}
            >
              <div
                className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 ${
                  intention === opt.value
                    ? "border-primary-brand bg-primary-brand"
                    : "border-gray-300"
                }`}
              />
              <div>
                <p className="font-medium text-sm text-text-main">{opt.label}</p>
                <p className="text-xs text-text-muted-brand">{opt.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tranche d'âge */}
      <div className="space-y-2">
        <label className="font-medium text-text-main text-sm">
          Tranche d&apos;âge : {ageMin} – {ageMax} ans
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={18}
            max={ageMax}
            value={ageMin}
            onChange={(e) => setAgeMin(Number(e.target.value))}
            className="flex-1 accent-primary-brand"
          />
          <input
            type="range"
            min={ageMin}
            max={99}
            value={ageMax}
            onChange={(e) => setAgeMax(Number(e.target.value))}
            className="flex-1 accent-primary-brand"
          />
        </div>
      </div>

      {/* Distance */}
      <div className="space-y-2">
        <label className="font-medium text-text-main text-sm">
          Distance max : {distanceKm} km
        </label>
        <input
          type="range"
          min={1}
          max={500}
          value={distanceKm}
          onChange={(e) => setDistanceKm(Number(e.target.value))}
          className="w-full accent-primary-brand"
        />
      </div>

      {/* Statut actif */}
      <div className="flex items-center justify-between p-3 rounded-xl border border-border-brand">
        <div>
          <p className="font-medium text-sm text-text-main">Mode rencontres actif</p>
          <p className="text-xs text-text-muted-brand">
            Désactivez pour ne plus apparaître dans les découvertes
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={actif}
          onClick={() => setActif(!actif)}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            actif ? "bg-primary-brand" : "bg-gray-200"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              actif ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary-brand text-white font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
      >
        <Save size={16} />
        {saving ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  )
}
