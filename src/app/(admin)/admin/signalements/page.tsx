"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2, AlertTriangle, CheckCircle, XCircle, Trash2, Eye } from "lucide-react"

interface Signalement {
  id: string
  raison: string
  description: string | null
  statut: string
  noteAdmin: string | null
  createdAt: string
  auteur: { id: string; prenom: string; nom: string; email: string }
  post: { id: string; contenu: string } | null
  commentaire: { id: string; contenu: string } | null
}

const STATUT_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  EN_ATTENTE: { bg: "bg-orange-50", text: "text-orange-800", label: "En attente" },
  EN_COURS: { bg: "bg-blue-50", text: "text-blue-800", label: "En cours" },
  RESOLU: { bg: "bg-green-50", text: "text-green-800", label: "Résolu" },
  REJETE: { bg: "bg-red-50", text: "text-red-800", label: "Rejeté" },
}

export default function AdminSignalements() {
  const [signalements, setSignalements] = useState<Signalement[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [filter, setFilter] = useState("")

  const fetchSignalements = useCallback(async () => {
    try {
      const url = filter ? `/api/communaute/signalements?statut=${filter}` : "/api/communaute/signalements"
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setSignalements(data.signalements ?? [])
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    setLoading(true)
    fetchSignalements()
  }, [fetchSignalements])

  async function traiter(id: string, statut: string, action?: string) {
    setProcessing(id)
    try {
      await fetch("/api/communaute/signalements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signalementId: id, statut, action }),
      })
      await fetchSignalements()
    } catch {
      /* silent */
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-gold" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[28px] font-light text-text-main">Signalements</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-border-brand bg-white px-3 py-2 font-body text-[13px] outline-none focus:border-gold"
        >
          <option value="">Tous</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="EN_COURS">En cours</option>
          <option value="RESOLU">Résolus</option>
          <option value="REJETE">Rejetés</option>
        </select>
      </div>

      {signalements.length === 0 && (
        <div className="py-16 text-center">
          <CheckCircle size={36} className="mx-auto text-primary-brand/40" />
          <p className="mt-3 font-body text-[14px] text-text-muted-brand">Aucun signalement</p>
        </div>
      )}

      <div className="space-y-3">
        {signalements.map((s) => {
          const badge = STATUT_COLORS[s.statut] ?? STATUT_COLORS.EN_ATTENTE
          const isWaiting = s.statut === "EN_ATTENTE"
          const busy = processing === s.id
          return (
            <div key={s.id} className="border border-border-brand bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle size={14} className="shrink-0 text-orange-500" />
                    <span className="font-body text-[13px] font-medium text-text-main">{s.raison}</span>
                    <span className={`px-2 py-0.5 font-body text-xs ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </span>
                  </div>
                  {s.description && (
                    <p className="font-body text-[12px] text-text-mid mb-2">{s.description}</p>
                  )}
                  <div className="font-body text-xs text-text-muted-brand">
                    Par {s.auteur.prenom} {s.auteur.nom} · {new Date(s.createdAt).toLocaleDateString("fr", { day: "numeric", month: "short", year: "numeric" })}
                  </div>

                  {/* Contenu signalé */}
                  {s.post && (
                    <div className="mt-3 border-l-2 border-gold/30 pl-3 font-body text-[12px] text-text-mid">
                      <span className="text-xs uppercase tracking-wider text-text-muted-brand">Post signalé :</span>
                      <p className="mt-1 line-clamp-2">{s.post.contenu}</p>
                    </div>
                  )}
                  {s.commentaire && (
                    <div className="mt-3 border-l-2 border-gold/30 pl-3 font-body text-[12px] text-text-mid">
                      <span className="text-xs uppercase tracking-wider text-text-muted-brand">Commentaire signalé :</span>
                      <p className="mt-1 line-clamp-2">{s.commentaire.contenu}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {isWaiting && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      disabled={busy}
                      onClick={() => traiter(s.id, "REJETE")}
                      className="flex items-center gap-1 border border-border-brand px-3 py-1.5 font-body text-xs text-text-mid hover:border-red-300 hover:text-red-700 transition-colors disabled:opacity-50"
                    >
                      <XCircle size={13} /> Rejeter
                    </button>
                    {s.post && (
                      <button
                        disabled={busy}
                        onClick={() => traiter(s.id, "RESOLU", "supprimer_post")}
                        className="flex items-center gap-1 border border-red-300 bg-red-50 px-3 py-1.5 font-body text-xs text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={13} /> Supprimer le post
                      </button>
                    )}
                    {s.commentaire && (
                      <button
                        disabled={busy}
                        onClick={() => traiter(s.id, "RESOLU", "supprimer_commentaire")}
                        className="flex items-center gap-1 border border-red-300 bg-red-50 px-3 py-1.5 font-body text-xs text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={13} /> Supprimer
                      </button>
                    )}
                    <button
                      disabled={busy}
                      onClick={() => traiter(s.id, "RESOLU")}
                      className="flex items-center gap-1 bg-primary-brand px-3 py-1.5 font-body text-xs text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
                    >
                      {busy ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />} Résolu
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
