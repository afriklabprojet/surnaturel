"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Loader2, ChevronLeft, ChevronRight, Coins, Plus, X } from "lucide-react"

interface HistEntry { id: string; points: number; raison: string; type: string; createdAt: string }
interface PointsItem {
  id: string
  total: number
  user: { id: string; nom: string; prenom: string; email: string; photoUrl: string | null }
  historique: HistEntry[]
}

const TYPE_LABELS: Record<string, string> = {
  GAIN_RDV: "RDV",
  GAIN_COMMANDE: "Commande",
  GAIN_PARRAINAGE: "Parrainage",
  GAIN_AVIS: "Avis",
  DEPOT_RECOMPENSE: "Récompense",
}

function Avatar({ user, size = 28 }: { user: { prenom: string; nom: string; photoUrl: string | null }; size?: number }) {
  const initials = `${user.prenom?.[0] ?? ""}${user.nom?.[0] ?? ""}`.toUpperCase()
  if (user.photoUrl) {
    return <img src={user.photoUrl} alt="" className="rounded-full object-cover" style={{ width: size, height: size }} />
  }
  return (
    <div className="flex items-center justify-center rounded-full bg-primary-brand text-white font-body font-medium" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials}
    </div>
  )
}

export default function PageAdminFidelite() {
  const [items, setItems] = useState<PointsItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showAjuster, setShowAjuster] = useState(false)
  const [saving, setSaving] = useState(false)
  const [detail, setDetail] = useState<PointsItem | null>(null)
  const [form, setForm] = useState({ userId: "", points: 0, raison: "", type: "GAIN_RDV" })

  const limit = 20

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (search) params.set("search", search)
      const res = await fetch(`/api/admin/fidelite?${params}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data.points)
        setTotal(data.total)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [page, search])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleAjuster() {
    if (!form.userId || !form.raison) return
    setSaving(true)
    try {
      const res = await fetch("/api/admin/fidelite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, points: Number(form.points) }),
      })
      if (res.ok) {
        setShowAjuster(false)
        setForm({ userId: "", points: 0, raison: "", type: "GAIN_RDV" })
        fetchData()
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-brand" />
          <input
            type="text"
            placeholder="Rechercher un client…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-3 py-2 border border-border-brand font-body text-[13px] bg-white focus:outline-none focus:border-primary-brand"
          />
        </div>

        <button
          onClick={() => setShowAjuster(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary-brand text-white font-body text-[11px] uppercase tracking-widest hover:bg-primary-brand/90 transition-colors"
        >
          <Plus size={14} /> Ajuster points
        </button>

        <span className="ml-auto font-body text-[12px] text-text-muted-brand">{total} compte{total > 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-100">
          <Loader2 className="h-8 w-8 animate-spin text-primary-brand" />
        </div>
      ) : (
        <div className="bg-white border border-border-brand overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-page">
                <tr>
                  <th className="text-left px-4 py-3 font-body text-[11px] uppercase tracking-widest text-text-muted-brand font-medium">Client</th>
                  <th className="text-left px-4 py-3 font-body text-[11px] uppercase tracking-widest text-text-muted-brand font-medium">Total points</th>
                  <th className="text-left px-4 py-3 font-body text-[11px] uppercase tracking-widest text-text-muted-brand font-medium">Derniers mouvements</th>
                  <th className="text-left px-4 py-3 font-body text-[11px] uppercase tracking-widest text-text-muted-brand font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="border-t border-border-brand hover:bg-bg-page">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar user={p.user} />
                        <div>
                          <p className="font-body text-[13px] font-medium text-text-main">{p.user.prenom} {p.user.nom}</p>
                          <p className="font-body text-[11px] text-text-muted-brand">{p.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 font-body text-[14px] font-semibold text-gold-dark">
                        <Coins size={14} /> {p.total}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {p.historique.slice(0, 3).map((h) => (
                          <p key={h.id} className="font-body text-[11px] text-text-muted-brand">
                            <span className={h.points >= 0 ? "text-emerald-600" : "text-red-500"}>{h.points >= 0 ? "+" : ""}{h.points}</span>
                            {" · "}{TYPE_LABELS[h.type] || h.type}{" · "}{h.raison}
                          </p>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setForm({ userId: p.user.id, points: 0, raison: "", type: "GAIN_RDV" })
                            setShowAjuster(true)
                          }}
                          className="px-2 py-1 font-body text-[10px] uppercase tracking-widest border border-primary-brand text-primary-brand hover:bg-primary-light transition-colors"
                        >
                          Ajuster
                        </button>
                        <button
                          onClick={() => setDetail(p)}
                          className="px-2 py-1 font-body text-[10px] uppercase tracking-widest border border-border-brand text-text-muted-brand hover:bg-bg-page transition-colors"
                        >
                          Historique
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center font-body text-[13px] text-text-muted-brand">Aucun compte fidélité trouvé</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="flex items-center gap-1 px-3 py-1.5 font-body text-[11px] uppercase tracking-widest border border-border-brand hover:bg-bg-page disabled:opacity-40 transition-colors">
            <ChevronLeft size={14} /> Préc.
          </button>
          <span className="font-body text-[12px] text-text-muted-brand">{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="flex items-center gap-1 px-3 py-1.5 font-body text-[11px] uppercase tracking-widest border border-border-brand hover:bg-bg-page disabled:opacity-40 transition-colors">
            Suiv. <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Modal Ajuster */}
      {showAjuster && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => setShowAjuster(false)}>
          <div className="bg-white border border-border-brand w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-[18px] font-light text-text-main">Ajuster les points</h3>
              <button onClick={() => setShowAjuster(false)} className="text-text-muted-brand hover:text-text-mid"><X size={20} /></button>
            </div>

            {!form.userId && (
              <div>
                <label className="font-body text-[11px] uppercase tracking-widest text-text-muted-brand">ID Utilisateur</label>
                <input
                  type="text"
                  value={form.userId}
                  onChange={(e) => setForm({ ...form, userId: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-border-brand font-body text-[13px] focus:outline-none focus:border-primary-brand"
                  placeholder="ID de l'utilisateur"
                />
              </div>
            )}

            <div>
              <label className="font-body text-[11px] uppercase tracking-widest text-text-muted-brand">Points (négatif pour retrait)</label>
              <input
                type="number"
                value={form.points}
                onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 border border-border-brand font-body text-[13px] focus:outline-none focus:border-primary-brand"
              />
            </div>

            <div>
              <label className="font-body text-[11px] uppercase tracking-widest text-text-muted-brand">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-border-brand font-body text-[13px] focus:outline-none focus:border-primary-brand bg-white"
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>

            <div>
              <label className="font-body text-[11px] uppercase tracking-widest text-text-muted-brand">Raison</label>
              <input
                type="text"
                value={form.raison}
                onChange={(e) => setForm({ ...form, raison: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-border-brand font-body text-[13px] focus:outline-none focus:border-primary-brand"
                placeholder="Motif de l'ajustement"
              />
            </div>

            <button
              onClick={handleAjuster}
              disabled={saving || !form.userId || !form.raison}
              className="w-full py-2 bg-primary-brand text-white font-body text-[11px] uppercase tracking-widest hover:bg-primary-brand/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />} Valider
            </button>
          </div>
        </div>
      )}

      {/* Modal Historique */}
      {detail && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div className="bg-white border border-border-brand w-full max-w-lg p-6 space-y-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-[18px] font-light text-text-main">
                Historique — {detail.user.prenom} {detail.user.nom}
              </h3>
              <button onClick={() => setDetail(null)} className="text-text-muted-brand hover:text-text-mid"><X size={20} /></button>
            </div>
            <p className="font-body text-[13px] text-text-mid">Total : <strong>{detail.total}</strong> points</p>
            <div className="space-y-2">
              {detail.historique.map((h) => (
                <div key={h.id} className="flex items-center justify-between px-3 py-2 border border-border-brand">
                  <div>
                    <p className="font-body text-[13px] text-text-main">{h.raison}</p>
                    <p className="font-body text-[11px] text-text-muted-brand">{TYPE_LABELS[h.type] || h.type} · {new Date(h.createdAt).toLocaleDateString("fr")}</p>
                  </div>
                  <span className={`font-body text-[14px] font-semibold ${h.points >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {h.points >= 0 ? "+" : ""}{h.points}
                  </span>
                </div>
              ))}
              {detail.historique.length === 0 && (
                <p className="font-body text-[13px] text-text-muted-brand text-center py-4">Aucun historique</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
