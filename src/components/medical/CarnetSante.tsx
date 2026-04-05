"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Loader2, Plus, Trash2, ChevronLeft, ChevronRight,
  BookHeart, Moon, Droplets, Zap, Heart, BarChart3,
  Share2, Lock, X, Check, Smile, Frown, Meh,
  TrendingUp, ChevronDown,
} from "lucide-react"
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts"

// ─── Types ───────────────────────────────────────────────────────

interface EntreeCarnet {
  id: string
  date: string
  humeur: number | null
  energie: number | null
  sommeil: number | null
  hydratation: number | null
  symptomes: string | null // JSON
  cycleMenstruel: boolean
  jourCycle: number | null
  fluxCycle: string | null
  notes: string | null
  partageAvecPraticien: boolean
  tags: string | null // JSON
  createdAt: string
}

// ─── Constantes ───────────────────────────────────────────────────

const HUMEURS = [
  { val: 1, label: "Très mauvaise", emoji: "😫", color: "bg-red-100 border-red-400 text-red-800" },
  { val: 2, label: "Mauvaise", emoji: "😔", color: "bg-orange-100 border-orange-400 text-orange-700" },
  { val: 3, label: "Neutre", emoji: "😐", color: "bg-yellow-100 border-yellow-400 text-yellow-700" },
  { val: 4, label: "Bonne", emoji: "🙂", color: "bg-green-100 border-green-400 text-green-700" },
  { val: 5, label: "Excellente", emoji: "😄", color: "bg-emerald-100 border-emerald-500 text-emerald-800" },
]

const ENERGIES = [
  { val: 1, label: "Épuisée", bars: 1 },
  { val: 2, label: "Fatiguée", bars: 2 },
  { val: 3, label: "Correcte", bars: 3 },
  { val: 4, label: "Bonne", bars: 4 },
  { val: 5, label: "Pleine d'énergie", bars: 5 },
]

const SYMPTOMES_LISTE = [
  "Fatigue", "Maux de tête", "Douleurs lombaires", "Nausées",
  "Ballonnements", "Anxiété", "Insomnie", "Douleurs articulaires",
  "Irritabilité", "Vertiges",
]

const TAGS_LISTE = [
  "Après un soin", "Jour de RDV", "Stress au travail",
  "Bonne journée", "Période difficile", "Activité physique",
  "Sortie", "Repos",
]

const FLUX_OPTIONS = [
  { val: "leger", label: "Léger" },
  { val: "moyen", label: "Moyen" },
  { val: "abondant", label: "Abondant" },
]

// ─── Helpers ──────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function humeureColor(humeur: number | null): string {
  if (!humeur) return "bg-gray-100"
  if (humeur === 5) return "bg-emerald-400"
  if (humeur === 4) return "bg-green-300"
  if (humeur === 3) return "bg-yellow-300"
  if (humeur === 2) return "bg-orange-300"
  return "bg-red-300"
}

function parseJSON<T>(val: string | null, fallback: T): T {
  if (!val) return fallback
  try { return JSON.parse(val) as T } catch { return fallback }
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-")
  return `${day}/${month}/${year}`
}

// ─── Mini calendrier 30 jours ─────────────────────────────────────

function CalendrierMini({
  entrees,
  selectedDate,
  onSelectDate,
}: {
  entrees: EntreeCarnet[]
  selectedDate: string
  onSelectDate: (d: string) => void
}) {
  const [offset, setOffset] = useState(0) // semaines en arrière

  const days = useMemo(() => {
    const result: { date: string; inMonth: boolean }[] = []
    const today = new Date()
    // 35 jours en arrière jusqu'à aujourd'hui + offset (par semaine)
    for (let i = 34 - offset * 7; i >= -offset * 7; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      result.push({ date: d.toISOString().slice(0, 10), inMonth: true })
    }
    return result
  }, [offset])

  const byDate = useMemo(() => {
    const m: Record<string, EntreeCarnet> = {}
    for (const e of entrees) m[e.date] = e
    return m
  }, [entrees])

  return (
    <div className="border border-border-brand bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-body text-[11px] uppercase tracking-widest text-text-muted-brand">
          Calendrier 5 semaines
        </p>
        <div className="flex gap-1">
          <button
            onClick={() => setOffset((o) => Math.min(o + 1, 8))}
            className="flex h-7 w-7 items-center justify-center border border-border-brand hover:bg-bg-page"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            onClick={() => setOffset((o) => Math.max(o - 1, 0))}
            disabled={offset === 0}
            className="flex h-7 w-7 items-center justify-center border border-border-brand hover:bg-bg-page disabled:opacity-40"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Jours de la semaine */}
      <div className="mb-1 grid grid-cols-7 gap-0.5">
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
          <div key={i} className="text-center font-body text-[9px] uppercase tracking-widest text-text-muted-brand py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Grille jours */}
      <div className="grid grid-cols-7 gap-0.5">
        {/* Alignement premier jour */}
        {Array.from({ length: (new Date(days[0].date).getDay() + 6) % 7 }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map(({ date }) => {
          const entree = byDate[date]
          const isToday = date === todayStr()
          const isSelected = date === selectedDate
          const isFuture = date > todayStr()
          return (
            <button
              key={date}
              title={formatDate(date)}
              disabled={isFuture}
              onClick={() => onSelectDate(date)}
              className={`relative flex h-8 w-full items-center justify-center rounded-sm text-[10px] font-medium transition-all
                ${isFuture ? "opacity-20 cursor-not-allowed" : "cursor-pointer hover:ring-1 hover:ring-primary-brand"}
                ${isSelected ? "ring-2 ring-primary-brand" : ""}
                ${isToday ? "ring-1 ring-gold" : ""}
                ${entree ? humeureColor(entree.humeur) : "bg-gray-50 text-gray-400"}
              `}
            >
              <span className={entree ? "text-gray-800" : ""}>{date.slice(8)}</span>
              {entree?.cycleMenstruel && (
                <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-pink-500" />
              )}
              {entree?.partageAvecPraticien && (
                <span className="absolute top-0.5 right-0.5 h-1 w-1 rounded-full bg-primary-brand" />
              )}
            </button>
          )
        })}
      </div>

      {/* Légende */}
      <div className="mt-3 flex flex-wrap gap-3">
        {[
          { color: "bg-emerald-400", label: "Excellente humeur" },
          { color: "bg-yellow-300", label: "Neutre" },
          { color: "bg-red-300", label: "Mauvaise humeur" },
          { color: "bg-gray-50 border border-gray-200", label: "Pas d'entrée" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1">
            <div className={`h-3 w-3 rounded-sm ${color}`} />
            <span className="font-body text-[9px] text-text-muted-brand">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1">
          <div className="h-1 w-3 rounded-full bg-pink-500" />
          <span className="font-body text-[9px] text-text-muted-brand">Cycle</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-primary-brand" />
          <span className="font-body text-[9px] text-text-muted-brand">Partagé</span>
        </div>
      </div>
    </div>
  )
}

// ─── Graphique tendances ──────────────────────────────────────────

function GraphiqueTendances({ entrees }: { entrees: EntreeCarnet[] }) {
  const [periode, setPeriode] = useState<7 | 30>(30)
  const data = useMemo(() => {
    const sorted = [...entrees]
      .filter((e) => e.humeur || e.energie)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-periode)
    return sorted.map((e) => ({
      date: `${e.date.slice(8)}/${e.date.slice(5, 7)}`,
      humeur: e.humeur,
      energie: e.energie,
      sommeil: e.sommeil,
    }))
  }, [entrees, periode])

  if (data.length < 2) {
    return (
      <div className="border border-border-brand bg-white p-6 text-center">
        <BarChart3 size={32} className="mx-auto text-text-muted-brand opacity-50" />
        <p className="mt-2 font-body text-xs text-text-muted-brand">
          Minimum 2 entrées pour afficher les tendances
        </p>
      </div>
    )
  }

  return (
    <div className="border border-border-brand bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-gold" />
          <p className="font-body text-[12px] uppercase tracking-widest text-text-mid">
            Tendances bien-être
          </p>
        </div>
        <div className="flex gap-1">
          {([7, 30] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriode(p)}
              className={`px-3 py-1 font-body text-[10px] uppercase tracking-wider transition-colors ${
                periode === p
                  ? "bg-primary-brand text-white"
                  : "border border-border-brand text-text-mid hover:bg-bg-page"
              }`}
            >
              {p}j
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} />
          <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 9 }} />
          <Tooltip
            formatter={(value: number, name: string) => [
              value,
              name === "humeur" ? "Humeur" : name === "energie" ? "Énergie" : "Sommeil",
            ]}
            contentStyle={{ fontSize: 11, border: "1px solid #e5e7eb" }}
          />
          <Legend
            formatter={(val) => (val === "humeur" ? "Humeur" : val === "energie" ? "Énergie" : "Sommeil (h)")}
            wrapperStyle={{ fontSize: 10 }}
          />
          <Line type="monotone" dataKey="humeur" stroke="#2D7A1F" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="energie" stroke="#C8991A" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────

const FORM_DEFAULTS = {
  date: todayStr(),
  humeur: null as number | null,
  energie: null as number | null,
  sommeil: null as number | null,
  hydratation: null as number | null,
  symptomes: [] as string[],
  cycleMenstruel: false,
  jourCycle: null as number | null,
  fluxCycle: null as string | null,
  notes: "",
  partageAvecPraticien: false,
  tags: [] as string[],
}

export default function CarnetSante() {
  const [entrees, setEntrees] = useState<EntreeCarnet[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [showTendances, setShowTendances] = useState(false)
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [form, setForm] = useState({ ...FORM_DEFAULTS })

  const fetchEntrees = useCallback(async () => {
    try {
      const res = await fetch("/api/medical/carnet?limit=90")
      if (res.ok) {
        const data = await res.json()
        setEntrees(data.entrees)
      }
    } catch {
      setError("Erreur de chargement du carnet")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchEntrees() }, [fetchEntrees])

  // Quand on sélectionne une date dans le calendrier, ouvrir le formulaire pré-rempli
  const byDate = useMemo(() => {
    const m: Record<string, EntreeCarnet> = {}
    for (const e of entrees) m[e.date] = e
    return m
  }, [entrees])

  function openFormForDate(date: string) {
    const existing = byDate[date]
    if (existing) {
      setForm({
        date,
        humeur: existing.humeur,
        energie: existing.energie,
        sommeil: existing.sommeil,
        hydratation: existing.hydratation,
        symptomes: parseJSON<string[]>(existing.symptomes, []),
        cycleMenstruel: existing.cycleMenstruel,
        jourCycle: existing.jourCycle,
        fluxCycle: existing.fluxCycle,
        notes: existing.notes ?? "",
        partageAvecPraticien: existing.partageAvecPraticien,
        tags: parseJSON<string[]>(existing.tags, []),
      })
    } else {
      setForm({ ...FORM_DEFAULTS, date })
    }
    setSelectedDate(date)
    setShowForm(true)
  }

  async function handleSave() {
    setError("")
    setSuccess("")
    setSaving(true)
    try {
      const res = await fetch("/api/medical/carnet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          sommeil: form.sommeil !== null ? Number(form.sommeil) : null,
        }),
      })
      if (res.ok) {
        setSuccess("Entrée enregistrée")
        setShowForm(false)
        fetchEntrees()
        setTimeout(() => setSuccess(""), 3000)
      } else {
        const d = await res.json()
        setError(d.error ?? "Erreur lors de l'enregistrement")
      }
    } catch {
      setError("Erreur de connexion")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      const res = await fetch(`/api/medical/carnet?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        setEntrees((prev) => prev.filter((e) => e.id !== id))
      }
    } catch {
      setError("Erreur lors de la suppression")
    } finally {
      setDeleting(null)
    }
  }

  const entreeAujourdhui = byDate[todayStr()]
  const scoreMoyen = useMemo(() => {
    const with_humeur = entrees.filter((e) => e.humeur)
    if (!with_humeur.length) return null
    const sum = with_humeur.slice(0, 7).reduce((acc, e) => acc + (e.humeur ?? 0), 0)
    return (sum / Math.min(7, with_humeur.length)).toFixed(1)
  }, [entrees])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-primary-brand" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BookHeart size={20} className="text-primary-brand" />
            <h2 className="font-display text-xl font-light text-text-main">Mon Carnet de Bien-être</h2>
          </div>
          <p className="mt-1 font-body text-xs text-text-muted-brand">
            Journal quotidien confidentiel · {entrees.length} entrée{entrees.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTendances((v) => !v)}
            className="flex items-center gap-2 border border-border-brand px-4 py-2 font-body text-[11px] uppercase tracking-wider text-text-mid hover:bg-bg-page transition-colors"
          >
            <BarChart3 size={14} />
            Tendances
          </button>
          <button
            onClick={() => openFormForDate(todayStr())}
            className="flex items-center gap-2 bg-primary-brand px-4 py-2 font-body text-[11px] uppercase tracking-wider text-white hover:bg-primary-dark transition-colors"
          >
            <Plus size={14} />
            {entreeAujourdhui ? "Modifier aujourd'hui" : "Ajouter aujourd'hui"}
          </button>
        </div>
      </div>

      {/* Alertes */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-3 font-body text-xs text-red-700">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 p-3 font-body text-xs text-green-700 flex items-center gap-2">
          <Check size={14} /> {success}
        </div>
      )}

      {/* Score 7 jours */}
      {scoreMoyen && (
        <div className="grid grid-cols-3 gap-3">
          <div className="border border-border-brand bg-white p-4 text-center">
            <p className="font-body text-[10px] uppercase tracking-widest text-text-muted-brand">Humeur moy. 7j</p>
            <p className="mt-1 font-display text-3xl font-light text-primary-brand">{scoreMoyen}</p>
            <p className="font-body text-[10px] text-text-muted-brand">/ 5</p>
          </div>
          <div className="border border-border-brand bg-white p-4 text-center">
            <p className="font-body text-[10px] uppercase tracking-widest text-text-muted-brand">Entrées ce mois</p>
            <p className="mt-1 font-display text-3xl font-light text-gold">
              {entrees.filter((e) => e.date.startsWith(todayStr().slice(0, 7))).length}
            </p>
            <p className="font-body text-[10px] text-text-muted-brand">/ {new Date(parseInt(todayStr().slice(0,4)), parseInt(todayStr().slice(5,7)), 0).getDate()} jours</p>
          </div>
          <div className="border border-border-brand bg-white p-4 text-center">
            <p className="font-body text-[10px] uppercase tracking-widest text-text-muted-brand">Partagés praticienne</p>
            <p className="mt-1 font-display text-3xl font-light text-blue-600">
              {entrees.filter((e) => e.partageAvecPraticien).length}
            </p>
            <p className="font-body text-[10px] text-text-muted-brand">entrées</p>
          </div>
        </div>
      )}

      {/* Graphique tendances */}
      {showTendances && <GraphiqueTendances entrees={entrees} />}

      {/* Calendrier */}
      <CalendrierMini
        entrees={entrees}
        selectedDate={selectedDate}
        onSelectDate={openFormForDate}
      />

      {/* Formulaire d'entrée */}
      {showForm && (
        <div className="border-2 border-primary-brand bg-white p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-light text-text-main">
                Entrée du {formatDate(form.date)}
              </h3>
              <p className="font-body text-[11px] text-text-muted-brand flex items-center gap-1">
                <Lock size={10} />
                Données chiffrées et privées
              </p>
            </div>
            <button onClick={() => setShowForm(false)} className="p-1 hover:text-text-main text-text-muted-brand">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-6">
            {/* Date */}
            <div>
              <label className="font-body text-[11px] uppercase tracking-widest text-text-muted-brand">
                Date
              </label>
              <input
                type="date"
                max={todayStr()}
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="mt-1 block w-full border border-border-brand px-3 py-2 font-body text-sm focus:border-primary-brand focus:outline-none"
              />
            </div>

            {/* Humeur */}
            <div>
              <label className="font-body text-[11px] uppercase tracking-widest text-text-muted-brand flex items-center gap-2">
                <Smile size={13} /> Humeur du jour
              </label>
              <div className="mt-2 flex gap-2 flex-wrap">
                {HUMEURS.map((h) => (
                  <button
                    key={h.val}
                    onClick={() => setForm((f) => ({ ...f, humeur: f.humeur === h.val ? null : h.val }))}
                    className={`flex flex-col items-center gap-1 border px-3 py-2 transition-all ${
                      form.humeur === h.val
                        ? h.color + " ring-2 ring-offset-1 ring-current"
                        : "border-border-brand hover:bg-bg-page"
                    }`}
                    title={h.label}
                  >
                    <span className="text-lg">{h.emoji}</span>
                    <span className="font-body text-[9px]">{h.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Énergie */}
            <div>
              <label className="font-body text-[11px] uppercase tracking-widest text-text-muted-brand flex items-center gap-2">
                <Zap size={13} /> Niveau d&apos;énergie
              </label>
              <div className="mt-2 flex gap-2 flex-wrap">
                {ENERGIES.map((e) => (
                  <button
                    key={e.val}
                    onClick={() => setForm((f) => ({ ...f, energie: f.energie === e.val ? null : e.val }))}
                    className={`flex flex-col items-center gap-1 border px-3 py-2 transition-all ${
                      form.energie === e.val
                        ? "border-gold bg-yellow-50 ring-2 ring-gold/50"
                        : "border-border-brand hover:bg-bg-page"
                    }`}
                    title={e.label}
                  >
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-3 w-1.5 ${i < e.bars ? "bg-gold" : "bg-gray-200"}`}
                        />
                      ))}
                    </div>
                    <span className="font-body text-[9px]">{e.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sommeil & Hydratation */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="font-body text-[11px] uppercase tracking-widest text-text-muted-brand flex items-center gap-2">
                  <Moon size={13} /> Sommeil (heures)
                </label>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={12}
                    step={0.5}
                    value={form.sommeil ?? 0}
                    onChange={(e) => setForm((f) => ({ ...f, sommeil: parseFloat(e.target.value) || null }))}
                    className="w-full accent-primary-brand"
                  />
                  <span className="w-12 text-right font-display text-lg font-light text-text-main">
                    {form.sommeil ?? "—"}h
                  </span>
                </div>
              </div>
              <div>
                <label className="font-body text-[11px] uppercase tracking-widest text-text-muted-brand flex items-center gap-2">
                  <Droplets size={13} /> Hydratation (verres)
                </label>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex flex-wrap gap-1">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setForm((f) => ({ ...f, hydratation: f.hydratation === i + 1 ? null : i + 1 }))}
                        className={`h-6 w-6 font-body text-[10px] transition-colors ${
                          (form.hydratation ?? 0) > i
                            ? "bg-blue-400 text-white"
                            : "bg-gray-100 text-gray-400 hover:bg-blue-100"
                        }`}
                        title={`${i + 1} verre${i > 0 ? "s" : ""}`}
                      >
                        💧
                      </button>
                    ))}
                  </div>
                  <span className="font-body text-sm text-text-mid">{form.hydratation ?? 0}</span>
                </div>
              </div>
            </div>

            {/* Symptômes */}
            <div>
              <label className="font-body text-[11px] uppercase tracking-widest text-text-muted-brand">
                Symptômes (optionnel)
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {SYMPTOMES_LISTE.map((s) => (
                  <button
                    key={s}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        symptomes: f.symptomes.includes(s)
                          ? f.symptomes.filter((x) => x !== s)
                          : [...f.symptomes, s],
                      }))
                    }
                    className={`border px-2.5 py-1 font-body text-[11px] transition-colors ${
                      form.symptomes.includes(s)
                        ? "border-red-300 bg-red-50 text-red-700"
                        : "border-border-brand text-text-muted-brand hover:bg-bg-page"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Cycle menstruel */}
            <div className="border border-pink-100 bg-pink-50/30 p-4">
              <div className="flex items-center gap-3">
                <Heart size={14} className="text-pink-400" />
                <label className="font-body text-[11px] uppercase tracking-widest text-text-muted-brand">
                  Cycle menstruel
                </label>
                <button
                  onClick={() => setForm((f) => ({ ...f, cycleMenstruel: !f.cycleMenstruel }))}
                  className={`ml-auto h-5 w-10 rounded-full transition-colors ${
                    form.cycleMenstruel ? "bg-pink-400" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`block h-4 w-4 rounded-full bg-white shadow transition-transform mx-0.5 ${
                      form.cycleMenstruel ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              {form.cycleMenstruel && (
                <div className="mt-3 flex gap-4">
                  <div>
                    <label className="font-body text-[10px] text-text-muted-brand">Jour du cycle</label>
                    <input
                      type="number"
                      min={1}
                      max={45}
                      value={form.jourCycle ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, jourCycle: parseInt(e.target.value) || null }))}
                      placeholder="ex: 5"
                      className="mt-1 block w-20 border border-border-brand px-2 py-1 font-body text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-body text-[10px] text-text-muted-brand">Flux</label>
                    <div className="mt-1 flex gap-1">
                      {FLUX_OPTIONS.map((opt) => (
                        <button
                          key={opt.val}
                          onClick={() =>
                            setForm((f) => ({ ...f, fluxCycle: f.fluxCycle === opt.val ? null : opt.val }))
                          }
                          className={`border px-2 py-1 font-body text-[10px] transition-colors ${
                            form.fluxCycle === opt.val
                              ? "border-pink-400 bg-pink-100 text-pink-700"
                              : "border-border-brand hover:bg-bg-page"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="font-body text-[11px] uppercase tracking-widest text-text-muted-brand">
                Tags
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {TAGS_LISTE.map((tag) => (
                  <button
                    key={tag}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        tags: f.tags.includes(tag)
                          ? f.tags.filter((x) => x !== tag)
                          : [...f.tags, tag],
                      }))
                    }
                    className={`border px-2.5 py-1 font-body text-[11px] transition-colors ${
                      form.tags.includes(tag)
                        ? "border-primary-brand bg-primary-light/20 text-primary-brand"
                        : "border-border-brand text-text-muted-brand hover:bg-bg-page"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes libres */}
            <div>
              <label className="font-body text-[11px] uppercase tracking-widest text-text-muted-brand flex items-center gap-2">
                <Lock size={11} className="text-gold" />
                Notes personnelles (chiffrées)
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Comment vous sentez-vous ? Qu'est-ce qui vous a marquée aujourd'hui ?"
                rows={3}
                maxLength={2000}
                className="mt-1 w-full border border-border-brand px-3 py-2 font-body text-sm focus:border-primary-brand focus:outline-none resize-none"
              />
              <p className="mt-0.5 text-right font-body text-[10px] text-text-muted-brand">
                {form.notes.length}/2000
              </p>
            </div>

            {/* Partage praticienne */}
            <div className="flex items-center justify-between border border-blue-100 bg-blue-50/30 p-4">
              <div className="flex items-center gap-3">
                <Share2 size={16} className="text-blue-500" />
                <div>
                  <p className="font-body text-[12px] font-medium text-text-main">
                    Partager avec ma praticienne
                  </p>
                  <p className="font-body text-[10px] text-text-muted-brand">
                    Votre sage-femme pourra consulter cette entrée avant votre prochain RDV
                  </p>
                </div>
              </div>
              <button
                onClick={() => setForm((f) => ({ ...f, partageAvecPraticien: !f.partageAvecPraticien }))}
                className={`h-6 w-12 rounded-full transition-colors ${
                  form.partageAvecPraticien ? "bg-primary-brand" : "bg-gray-200"
                }`}
              >
                <span
                  className={`block h-5 w-5 rounded-full bg-white shadow transition-transform mx-0.5 ${
                    form.partageAvecPraticien ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-primary-brand px-6 py-2.5 font-body text-[11px] uppercase tracking-wider text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                Enregistrer
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="border border-border-brand px-6 py-2.5 font-body text-[11px] uppercase tracking-wider text-text-mid hover:bg-bg-page transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste des entrées récentes */}
      <div className="space-y-2">
        <p className="font-body text-[11px] uppercase tracking-widest text-text-muted-brand">
          Entrées récentes
        </p>
        {entrees.length === 0 ? (
          <div className="border border-border-brand bg-white p-8 text-center">
            <BookHeart size={32} className="mx-auto text-text-muted-brand opacity-40" />
            <p className="mt-3 font-display text-lg font-light text-text-muted-brand">
              Votre carnet est vide
            </p>
            <p className="mt-1 font-body text-xs text-text-muted-brand">
              Commencez par ajouter l&apos;entrée d&apos;aujourd&apos;hui
            </p>
            <button
              onClick={() => openFormForDate(todayStr())}
              className="mt-4 bg-primary-brand px-5 py-2 font-body text-[11px] uppercase tracking-wider text-white hover:bg-primary-dark"
            >
              Première entrée
            </button>
          </div>
        ) : (
          entrees.slice(0, 10).map((e) => {
            const humeurInfo = HUMEURS.find((h) => h.val === e.humeur)
            const tags = parseJSON<string[]>(e.tags, [])
            const symptomes = parseJSON<string[]>(e.symptomes, [])
            return (
              <div
                key={e.id}
                className="flex items-start justify-between border border-border-brand bg-white p-4 hover:border-primary-brand/40 transition-colors cursor-pointer group"
                onClick={() => openFormForDate(e.date)}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center text-xl ${humeureColor(e.humeur)}`}>
                    {humeurInfo?.emoji ?? "📋"}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-body text-sm font-medium text-text-main">{formatDate(e.date)}</p>
                      {e.date === todayStr() && (
                        <span className="bg-primary-brand/10 px-1.5 py-0.5 font-body text-[9px] uppercase tracking-wider text-primary-brand">
                          Aujourd&apos;hui
                        </span>
                      )}
                      {e.partageAvecPraticien && (
                        <span className="flex items-center gap-1 text-blue-500" title="Partagé avec la praticienne">
                          <Share2 size={10} />
                          <span className="font-body text-[9px]">Partagé</span>
                        </span>
                      )}
                      {e.cycleMenstruel && (
                        <Heart size={12} className="text-pink-400" />
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-text-muted-brand">
                      {e.humeur && <span>Humeur {e.humeur}/5</span>}
                      {e.energie && <span>· Énergie {e.energie}/5</span>}
                      {e.sommeil && <span>· Sommeil {e.sommeil}h</span>}
                      {e.hydratation && <span>· {e.hydratation} verres</span>}
                    </div>
                    {(tags.length > 0 || symptomes.length > 0) && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {tags.map((t) => (
                          <span key={t} className="border border-primary-brand/20 bg-primary-light/10 px-1.5 py-0.5 font-body text-[9px] text-primary-brand">
                            {t}
                          </span>
                        ))}
                        {symptomes.map((s) => (
                          <span key={s} className="border border-red-200 bg-red-50 px-1.5 py-0.5 font-body text-[9px] text-red-600">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={(ev) => { ev.stopPropagation(); handleDelete(e.id) }}
                  disabled={deleting === e.id}
                  className="ml-4 shrink-0 p-1 text-text-muted-brand opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500"
                >
                  {deleting === e.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
