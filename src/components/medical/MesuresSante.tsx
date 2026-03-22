"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Loader2, Plus, Trash2, Activity, Weight, Thermometer, Heart,
  TrendingUp, X,
} from "lucide-react"

interface Mesure {
  id: string
  type: string
  valeur: string
  unite: string | null
  commentaire: string | null
  createdAt: string
}

const TYPES = [
  { value: "POIDS", label: "Poids", icon: Weight, unite: "kg", color: "text-blue-600" },
  { value: "TENSION_ARTERIELLE", label: "Tension artérielle", icon: Heart, unite: "mmHg", color: "text-red-600" },
  { value: "TEMPERATURE", label: "Température", icon: Thermometer, unite: "°C", color: "text-orange-600" },
  { value: "GLYCEMIE", label: "Glycémie", icon: Activity, unite: "g/L", color: "text-purple-600" },
  { value: "TOUR_DE_TAILLE", label: "Tour de taille", icon: TrendingUp, unite: "cm", color: "text-green-700" },
  { value: "FREQUENCE_CARDIAQUE", label: "Fréquence cardiaque", icon: Heart, unite: "bpm", color: "text-pink-600" },
  { value: "AUTRE", label: "Autre", icon: Activity, unite: "", color: "text-text-mid" },
] as const

function getTypeInfo(type: string) {
  return TYPES.find((t) => t.value === type) ?? TYPES[TYPES.length - 1]
}

export default function MesuresSante() {
  const [mesures, setMesures] = useState<Mesure[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
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

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 px-4 py-3 font-body text-[13px] text-red-800">{error}</div>
      )}

      {/* Filtres & bouton ajouter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
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

        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary-brand px-4 py-2 font-body text-[12px] uppercase tracking-[0.1em] text-white transition-colors hover:bg-primary-dark"
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? "Fermer" : "Nouvelle mesure"}
        </button>
      </div>

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
              className="flex items-center gap-2 bg-primary-brand px-5 py-2.5 font-body text-[12px] uppercase tracking-[0.1em] text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
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
              className="mt-4 inline-flex items-center gap-2 bg-primary-brand px-5 py-2.5 font-body text-[12px] uppercase tracking-[0.1em] text-white transition-colors hover:bg-primary-dark"
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
                    <span className="font-body text-[11px] font-medium uppercase tracking-[0.1em] text-text-mid">
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
