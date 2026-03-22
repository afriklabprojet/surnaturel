"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Loader2, Plus, Trash2, Activity, Weight, Thermometer, Heart,
  TrendingUp, X, BarChart3, AlertTriangle,
} from "lucide-react"
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts"

interface Mesure {
  id: string
  type: string
  valeur: string
  unite: string | null
  commentaire: string | null
  createdAt: string
}

const TYPES = [
  { value: "POIDS", label: "Poids", icon: Weight, unite: "kg", color: "text-blue-600", chartColor: "#2563eb", seuils: { min: 40, max: 150 } },
  { value: "TENSION_ARTERIELLE", label: "Tension artérielle", icon: Heart, unite: "mmHg", color: "text-red-600", chartColor: "#dc2626", seuils: { min: 9, max: 14 } },
  { value: "TEMPERATURE", label: "Température", icon: Thermometer, unite: "°C", color: "text-orange-600", chartColor: "#ea580c", seuils: { min: 35.5, max: 38 } },
  { value: "GLYCEMIE", label: "Glycémie", icon: Activity, unite: "g/L", color: "text-purple-600", chartColor: "#9333ea", seuils: { min: 0.7, max: 1.26 } },
  { value: "TOUR_DE_TAILLE", label: "Tour de taille", icon: TrendingUp, unite: "cm", color: "text-green-700", chartColor: "#15803d", seuils: null },
  { value: "FREQUENCE_CARDIAQUE", label: "Fréquence cardiaque", icon: Heart, unite: "bpm", color: "text-pink-600", chartColor: "#db2777", seuils: { min: 50, max: 100 } },
  { value: "AUTRE", label: "Autre", icon: Activity, unite: "", color: "text-text-mid", chartColor: "#6b7280", seuils: null },
] as const

function getTypeInfo(type: string) {
  return TYPES.find((t) => t.value === type) ?? TYPES[TYPES.length - 1]
}

function checkAlerte(type: string, valeur: string): string | null {
  const info = getTypeInfo(type)
  if (!info.seuils) return null
  const num = parseFloat(valeur.replace(",", "."))
  if (isNaN(num)) return null
  if (num > info.seuils.max) return `Valeur élevée (seuil : ${info.seuils.max} ${info.unite})`
  if (num < info.seuils.min) return `Valeur basse (seuil : ${info.seuils.min} ${info.unite})`
  return null
}

export default function MesuresSante() {
  const [mesures, setMesures] = useState<Mesure[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showChart, setShowChart] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [filterType, setFilterType] = useState("")

  const [form, setForm] = useState({
    type: "POIDS",
    valeur: "",
    unite: "kg",
    commentaire: "",
  })

  const fetchMesures = useCallback(async () => {
    try {
      const url = filterType
        ? `/api/medical/mesures?type=${filterType}&limit=100`
        : "/api/medical/mesures?limit=100"
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setMesures(data.mesures)
      }
    } catch {
      setError("Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }, [filterType])

  useEffect(() => {
    setLoading(true)
    fetchMesures()
  }, [fetchMesures])

  // Données pour le graphique
  const chartData = useMemo(() => {
    const type = filterType || "POIDS"
    return mesures
      .filter((m) => m.type === type)
      .map((m) => ({
        date: new Date(m.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
        valeur: parseFloat(m.valeur.replace(",", ".")),
      }))
      .reverse()
  }, [mesures, filterType])

  // Alertes de mesures anormales
  const alertes = useMemo(() => {
    if (mesures.length === 0) return []
    const dernières = new Map<string, Mesure>()
    for (const m of mesures) {
      if (!dernières.has(m.type)) dernières.set(m.type, m)
    }
    return Array.from(dernières.values())
      .map((m) => ({ ...m, alerte: checkAlerte(m.type, m.valeur) }))
      .filter((m) => m.alerte !== null)
  }, [mesures])

  function handleTypeChange(type: string) {
    const info = getTypeInfo(type)
    setForm((p) => ({ ...p, type, unite: info.unite }))
  }

  async function handleAdd() {
    if (!form.valeur.trim()) return
    setSaving(true)
    setError("")

    try {
      const res = await fetch("/api/medical/mesures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          valeur: form.valeur.trim(),
          unite: form.unite || undefined,
          commentaire: form.commentaire.trim() || undefined,
        }),
      })

      if (res.ok) {
        setForm({ type: "POIDS", valeur: "", unite: "kg", commentaire: "" })
        setShowForm(false)
        await fetchMesures()
      } else {
        const data = await res.json()
        setError(data.error ?? "Erreur")
      }
    } catch {
      setError("Erreur réseau")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/medical/mesures?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        setMesures((p) => p.filter((m) => m.id !== id))
      }
    } catch {
      /* silent */
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={22} className="animate-spin text-gold" />
      </div>
    )
  }

  const chartTypeInfo = getTypeInfo(filterType || "POIDS")

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 px-4 py-3 font-body text-[13px] text-red-800">{error}</div>
      )}

      {/* Alertes mesures anormales */}
      {alertes.length > 0 && (
        <div className="space-y-2">
          {alertes.map((a) => {
            const info = getTypeInfo(a.type)
            return (
              <div key={a.id} className="flex items-center gap-3 border border-orange-300 bg-orange-50 px-4 py-3">
                <AlertTriangle size={16} className="shrink-0 text-orange-600" />
                <div className="flex-1">
                  <span className="font-body text-[13px] font-medium text-orange-900">{info.label} : {a.valeur} {a.unite}</span>
                  <span className="ml-2 font-body text-[12px] text-orange-700">— {a.alerte}</span>
                </div>
                <a
                  href="/prise-rdv"
                  className="shrink-0 font-body text-[11px] font-medium uppercase tracking-widest text-orange-700 underline hover:text-orange-900"
                >
                  Prendre RDV
                </a>
              </div>
            )
          })}
        </div>
      )}

      {/* Filtres & boutons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-border-brand bg-white px-3 py-2 font-body text-[13px] text-text-main outline-none focus:border-gold"
          >
            <option value="">Tous les types</option>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          {mesures.length > 1 && (
            <button
              onClick={() => setShowChart(!showChart)}
              className={`flex items-center gap-1.5 border px-3 py-2 font-body text-[12px] transition-colors ${
                showChart ? "border-gold bg-gold/10 text-gold" : "border-border-brand text-text-muted-brand hover:border-gold hover:text-gold"
              }`}
            >
              <BarChart3 size={14} />
              Graphique
            </button>
          )}
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary-brand px-4 py-2 font-body text-[12px] uppercase tracking-widest text-white transition-colors hover:bg-primary-dark"
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? "Fermer" : "Nouvelle mesure"}
        </button>
      </div>

      {/* Graphique d'évolution */}
      {showChart && chartData.length >= 2 && (
        <div className="border border-border-brand border-t-2 border-t-gold bg-white p-5">
          <p className="mb-4 font-body text-[10px] font-medium uppercase tracking-[0.15em] text-text-muted-brand">
            Évolution — {chartTypeInfo.label} ({chartTypeInfo.unite})
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e3dc" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#8a8880" }} />
              <YAxis tick={{ fontSize: 11, fill: "#8a8880" }} />
              <Tooltip
                contentStyle={{ border: "1px solid #d4d1c7", fontSize: 13, fontFamily: "var(--font-body)" }}
                formatter={(value: unknown) => [`${value} ${chartTypeInfo.unite}`, chartTypeInfo.label]}
              />
              <Line
                type="monotone"
                dataKey="valeur"
                stroke={chartTypeInfo.chartColor}
                strokeWidth={2}
                dot={{ fill: chartTypeInfo.chartColor, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {showChart && chartData.length < 2 && (
        <div className="border border-border-brand bg-white p-5 text-center">
          <p className="font-body text-[13px] text-text-muted-brand">
            Ajoutez au moins 2 mesures de type « {chartTypeInfo.label} » pour voir le graphique.
          </p>
        </div>
      )}

      {/* Formulaire d'ajout */}
      {showForm && (
        <div className="border border-border-brand border-t-2 border-t-gold bg-white p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block font-body text-[10px] font-medium uppercase tracking-[0.15em] text-text-muted-brand">
                Type
              </label>
              <select
                value={form.type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full border border-border-brand bg-bg-page px-3 py-2.5 font-body text-[13px] text-text-main outline-none focus:border-gold"
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block font-body text-[10px] font-medium uppercase tracking-[0.15em] text-text-muted-brand">
                Valeur <span className="text-red-800">*</span>
              </label>
              <input
                type="text"
                value={form.valeur}
                onChange={(e) => setForm((p) => ({ ...p, valeur: e.target.value }))}
                placeholder="72.5"
                className="w-full border border-border-brand bg-bg-page px-3 py-2.5 font-body text-[13px] text-text-main outline-none placeholder:text-text-muted-brand/60 focus:border-gold"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-body text-[10px] font-medium uppercase tracking-[0.15em] text-text-muted-brand">
                Unité
              </label>
              <input
                type="text"
                value={form.unite}
                onChange={(e) => setForm((p) => ({ ...p, unite: e.target.value }))}
                className="w-full border border-border-brand bg-bg-page px-3 py-2.5 font-body text-[13px] text-text-main outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-body text-[10px] font-medium uppercase tracking-[0.15em] text-text-muted-brand">
                Commentaire
              </label>
              <input
                type="text"
                value={form.commentaire}
                onChange={(e) => setForm((p) => ({ ...p, commentaire: e.target.value }))}
                placeholder="À jeun, après effort…"
                className="w-full border border-border-brand bg-bg-page px-3 py-2.5 font-body text-[13px] text-text-main outline-none placeholder:text-text-muted-brand/60 focus:border-gold"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleAdd}
              disabled={saving || !form.valeur.trim()}
              className="flex items-center gap-2 bg-primary-brand px-5 py-2.5 font-body text-[12px] uppercase tracking-widest text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Enregistrer
            </button>
          </div>
        </div>
      )}

      {/* Liste des mesures */}
      {mesures.length === 0 ? (
        <div className="border border-border-brand bg-white py-12 text-center">
          <Activity size={28} className="mx-auto text-border-brand" />
          <p className="mt-4 font-body text-[13px] font-light text-text-muted-brand">
            Aucune mesure enregistrée
          </p>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 inline-flex items-center gap-2 bg-primary-brand px-5 py-2.5 font-body text-[12px] uppercase tracking-widest text-white transition-colors hover:bg-primary-dark"
            >
              <Plus size={14} />
              Ajouter ma première mesure
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {mesures.map((m) => {
            const info = getTypeInfo(m.type)
            const Icon = info.icon
            return (
              <div
                key={m.id}
                className="flex items-center gap-4 border border-border-brand bg-white px-4 py-3 transition-colors hover:bg-bg-page"
              >
                <Icon size={18} className={`shrink-0 ${info.color}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-[18px] font-light text-text-main">
                      {m.valeur}
                    </span>
                    {m.unite && (
                      <span className="font-body text-[12px] text-text-muted-brand">{m.unite}</span>
                    )}
                    <span className="font-body text-[11px] font-medium uppercase tracking-widest text-text-mid">
                      {info.label}
                    </span>
                  </div>
                  {m.commentaire && (
                    <p className="mt-0.5 truncate font-body text-[12px] font-light text-text-muted-brand">
                      {m.commentaire}
                    </p>
                  )}
                </div>
                <span className="shrink-0 font-body text-[11px] text-text-muted-brand">
                  {new Date(m.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <button
                  onClick={() => handleDelete(m.id)}
                  className="shrink-0 p-1 text-text-muted-brand transition-colors hover:text-red-600"
                  title="Supprimer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
