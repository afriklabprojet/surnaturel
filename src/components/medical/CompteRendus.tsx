"use client"

import { useState, useEffect } from "react"
import { FileText, Eye, AlertTriangle, RefreshCw } from "lucide-react"

// ── Types ────────────────────────────────────────────────────────────────────

interface CompteRendu {
  id: string
  contenu: string
  type: "GENERALE" | "SUIVI" | "ALERTE"
  auteur?: string
  createdAt: string
}

// ── Constantes ───────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  GENERALE: { label: "Général",   bg: "bg-gray-100",  text: "text-gray-700",  icon: FileText      },
  SUIVI:    { label: "Suivi",     bg: "bg-blue-100",  text: "text-blue-700",  icon: Eye           },
  ALERTE:   { label: "Alerte",    bg: "bg-red-100",   text: "text-red-700",   icon: AlertTriangle },
}

const fmtDL = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })

// ── Composant principal ───────────────────────────────────────────────────────

export default function CompteRendus() {
  const [comptes, setComptes] = useState<CompteRendu[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>("TOUS")

  function charger() {
    setLoading(true)
    setError(null)
    fetch("/api/medical/comptes-rendus")
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => setComptes(d.comptes || []))
      .catch(() => setError("Impossible de charger les comptes-rendus"))
      .finally(() => setLoading(false))
  }

  useEffect(() => { charger() }, [])

  const filtres = filterType === "TOUS" ? comptes : comptes.filter(c => c.type === filterType)

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-brand border-t-transparent" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary-brand" />
          <h2 className="font-display text-[20px] text-primary-brand">Comptes-rendus médicaux</h2>
        </div>
        <button onClick={charger} className="flex items-center gap-2 border border-border-brand px-3 py-2 text-[13px] hover:bg-gray-50">
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      {/* Info */}
      <div className="border border-blue-200 bg-blue-50 p-3 text-[13px] text-blue-700">
        Ces comptes-rendus ont été partagés avec vous par votre sage-femme après consultation.
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 p-3 text-[13px] text-red-700">{error}</div>
      )}

      {/* Filtres */}
      {comptes.length > 0 && (
        <div className="flex gap-2">
          {["TOUS", "GENERALE", "SUIVI", "ALERTE"].map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`rounded px-3 py-1.5 text-[12px] transition-colors ${filterType === t ? "bg-primary-brand text-white" : "border border-border-brand text-text-mid hover:bg-gray-50"}`}>
              {t === "TOUS" ? "Tous" : TYPE_CONFIG[t as keyof typeof TYPE_CONFIG]?.label ?? t}
              {t !== "TOUS" && <span className="ml-1 text-[10px] opacity-70">({comptes.filter(c => c.type === t).length})</span>}
            </button>
          ))}
        </div>
      )}

      {/* Liste */}
      {filtres.length === 0 ? (
        <div className="py-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-text-muted-brand/30" />
          <p className="mt-4 font-medium text-text-mid">Aucun compte-rendu disponible</p>
          <p className="mt-2 text-[13px] text-text-muted-brand">
            Vos comptes-rendus apparaîtront ici une fois partagés par votre praticienne.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtres.map(cr => {
            const cfg = TYPE_CONFIG[cr.type] ?? TYPE_CONFIG.GENERALE
            const Icon = cfg.icon
            return (
              <div key={cr.id} className={`border p-4 ${cr.type === "ALERTE" ? "border-red-300 bg-red-50/50" : "border-border-brand bg-white"}`}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <span className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[12px] font-medium ${cfg.bg} ${cfg.text}`}>
                    <Icon size={12} /> {cfg.label}
                  </span>
                  <div className="text-[12px] text-text-muted-brand">
                    {cr.auteur && <span className="font-medium">{cr.auteur} · </span>}
                    {fmtDL(cr.createdAt)}
                  </div>
                </div>
                <p className="text-[14px] leading-relaxed text-text-main whitespace-pre-wrap">{cr.contenu}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
