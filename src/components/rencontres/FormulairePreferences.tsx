"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Save, Users, Heart, Church, BadgeCheck, Sparkles, Filter } from "lucide-react"

const INTENTIONS = [
  {
    value: "AMITIE",
    label: "Amitié",
    description: "Rencontres amicales, échanges",
    icon: Users,
    gradient: "from-sky-400 to-cyan-500",
    light: "bg-sky-50 border-sky-200 text-sky-700",
    active: "border-sky-400 bg-sky-50",
  },
  {
    value: "RELATION_SERIEUSE",
    label: "Relation sérieuse",
    description: "Cherche une relation stable",
    icon: Heart,
    gradient: "from-pink-500 to-rose-500",
    light: "bg-pink-50 border-pink-200 text-pink-700",
    active: "border-pink-400 bg-pink-50",
  },
  {
    value: "MARIAGE",
    label: "Mariage",
    description: "Cherche un/une partenaire de vie",
    icon: Church,
    gradient: "from-violet-500 to-purple-600",
    light: "bg-violet-50 border-violet-200 text-violet-700",
    active: "border-violet-400 bg-violet-50",
  },
] as const

type Intention = (typeof INTENTIONS)[number]["value"]

interface Preferences {
  intention: Intention
  ageMin: number
  ageMax: number
  distanceKm: number
  actif: boolean
  filtreVerifie: boolean
  filtreIntention: boolean
  filtreInterets: boolean
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
  const [filtreVerifie, setFiltreVerifie] = useState(initial?.filtreVerifie ?? false)
  const [filtreIntention, setFiltreIntention] = useState(initial?.filtreIntention ?? false)
  const [filtreInterets, setFiltreInterets] = useState(initial?.filtreInterets ?? false)
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
        body: JSON.stringify({ intention, ageMin, ageMax, distanceKm, actif, filtreVerifie, filtreIntention, filtreInterets }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? "Erreur serveur")
      }

      toast.success("Préférences enregistrées")
      onSaved({ intention, ageMin, ageMax, distanceKm, actif, filtreVerifie, filtreIntention, filtreInterets })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur inattendue")
    } finally {
      setSaving(false)
    }
  }

  const currentIntention = INTENTIONS.find((i) => i.value === intention)!

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Intention */}
      <div className="space-y-3">
        <label className="font-semibold text-text-main text-sm">Je cherche…</label>
        <div className="grid gap-2.5 lg:grid-cols-3">
          {INTENTIONS.map((opt) => {
            const Icon = opt.icon
            const selected = intention === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setIntention(opt.value)}
                className={`flex items-center gap-4 p-4 lg:flex-col lg:items-center lg:text-center lg:gap-3 lg:py-6 rounded-2xl border-2 text-left transition-all ${
                  selected
                    ? `${opt.active} shadow-md`
                    : "border-border-brand hover:border-gray-300 bg-white"
                }`}
              >
                {/* Icône avec gradient */}
                <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${opt.gradient} flex items-center justify-center shrink-0 shadow-sm`}>
                  <Icon size={20} className="text-white" />
                </div>
                <div className="flex-1 lg:flex-none">
                  <p className="font-semibold text-sm text-text-main">{opt.label}</p>
                  <p className="text-xs text-text-muted-brand">{opt.description}</p>
                </div>
                {/* Radio visuel */}
                <div
                  className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors lg:hidden ${
                    selected ? `border-current bg-linear-to-br ${opt.gradient}` : "border-gray-300"
                  }`}
                  style={selected ? { borderColor: "transparent" } : {}}
                >
                  {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Tranche d'âge */}
        <div className="p-4 rounded-2xl border border-border-brand bg-white space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-text-main text-sm">Tranche d&apos;âge</label>
            <span className="text-sm font-bold text-primary-brand">
              {ageMin} – {ageMax} ans
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-muted-brand w-8">Min</span>
              <input
                type="range"
                min={18}
                max={ageMax}
                value={ageMin}
                onChange={(e) => setAgeMin(Number(e.target.value))}
                className="flex-1 accent-pink-500 h-1.5"
              />
              <span className="text-xs font-medium text-text-main w-8 text-right">{ageMin}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-muted-brand w-8">Max</span>
              <input
                type="range"
                min={ageMin}
                max={99}
                value={ageMax}
                onChange={(e) => setAgeMax(Number(e.target.value))}
                className="flex-1 accent-pink-500 h-1.5"
              />
              <span className="text-xs font-medium text-text-main w-8 text-right">{ageMax}</span>
            </div>
          </div>
        </div>

        {/* Distance */}
        <div className="p-4 rounded-2xl border border-border-brand bg-white space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-text-main text-sm">Distance maximum</label>
            <span className="text-sm font-bold text-primary-brand">{distanceKm} km</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-muted-brand">1 km</span>
            <input
              type="range"
              min={1}
              max={500}
              value={distanceKm}
              onChange={(e) => setDistanceKm(Number(e.target.value))}
              className="flex-1 accent-pink-500 h-1.5"
            />
            <span className="text-xs text-text-muted-brand">500 km</span>
          </div>
        </div>
      </div>

      {/* Filtres avancés */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-text-muted-brand" />
          <label className="font-semibold text-text-main text-sm">Filtres avancés</label>
        </div>
        <div className="space-y-2">
          {/* Filtre profils vérifiés */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-border-brand bg-white">
            <div className="flex items-center gap-2.5">
              <BadgeCheck size={16} className="text-primary-brand" />
              <div>
                <p className="text-sm font-medium text-text-main">Profils vérifiés uniquement</p>
                <p className="text-xs text-text-muted-brand">Ne voir que les membres vérifiés</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={filtreVerifie}
              onClick={() => setFiltreVerifie(!filtreVerifie)}
              className={`relative rounded-full transition-all shrink-0 ${
                filtreVerifie ? "bg-linear-to-r from-pink-500 to-fuchsia-600 shadow-md shadow-pink-200" : "bg-gray-200"
              }`}
              style={{ height: "26px", width: "48px" }}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  filtreVerifie ? "translate-x-5.5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Filtre même intention */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-border-brand bg-white">
            <div className="flex items-center gap-2.5">
              <Heart size={16} className="text-pink-500" />
              <div>
                <p className="text-sm font-medium text-text-main">Même intention</p>
                <p className="text-xs text-text-muted-brand">Ne voir que ceux qui cherchent la même chose</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={filtreIntention}
              onClick={() => setFiltreIntention(!filtreIntention)}
              className={`relative rounded-full transition-all shrink-0 ${
                filtreIntention ? "bg-linear-to-r from-pink-500 to-fuchsia-600 shadow-md shadow-pink-200" : "bg-gray-200"
              }`}
              style={{ height: "26px", width: "48px" }}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  filtreIntention ? "translate-x-5.5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Filtre intérêts communs */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-border-brand bg-white">
            <div className="flex items-center gap-2.5">
              <Sparkles size={16} className="text-amber-500" />
              <div>
                <p className="text-sm font-medium text-text-main">Intérêts en commun</p>
                <p className="text-xs text-text-muted-brand">Au moins un centre d&apos;intérêt partagé</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={filtreInterets}
              onClick={() => setFiltreInterets(!filtreInterets)}
              className={`relative rounded-full transition-all shrink-0 ${
                filtreInterets ? "bg-linear-to-r from-pink-500 to-fuchsia-600 shadow-md shadow-pink-200" : "bg-gray-200"
              }`}
              style={{ height: "26px", width: "48px" }}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  filtreInterets ? "translate-x-5.5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Statut actif */}
      <div className="flex items-center justify-between p-4 rounded-2xl border border-border-brand bg-white">
        <div>
          <p className="font-semibold text-sm text-text-main">Mode rencontres actif</p>
          <p className="text-xs text-text-muted-brand mt-0.5">
            {actif ? "Votre profil est visible dans les découvertes" : "Vous n'apparaissez plus dans les découvertes"}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={actif}
          onClick={() => setActif(!actif)}
          className={`relative w-12 h-6.5 rounded-full transition-all shrink-0 ${
            actif ? "bg-linear-to-r from-pink-500 to-fuchsia-600 shadow-md shadow-pink-200" : "bg-gray-200"
          }`}
          style={{ height: "26px", width: "48px" }}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              actif ? "translate-x-5.5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Bouton enregistrer */}
      <button
        type="submit"
        disabled={saving}
        className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-semibold text-white transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0 bg-linear-to-br ${currentIntention.gradient}`}
      >
        <Save size={17} />
        {saving ? "Enregistrement…" : "Enregistrer mes préférences"}
      </button>
    </form>
  )
}
