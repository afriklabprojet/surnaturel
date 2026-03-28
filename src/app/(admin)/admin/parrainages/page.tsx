"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Loader2, ChevronLeft, ChevronRight, Gift, Trash2, UserPlus, Check, Clock } from "lucide-react"

interface Parrainage {
  id: string
  code: string
  statut: string
  createdAt: string
  parrain: { id: string; nom: string; prenom: string; email: string; photoUrl: string | null }
  filleul: { id: string; nom: string; prenom: string; email: string; photoUrl: string | null } | null
}

const STATUT_MAP: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  EN_ATTENTE: { label: "En attente", bg: "bg-border-brand", text: "text-text-muted-brand", icon: Clock },
  ACTIF: { label: "Actif", bg: "bg-primary-light", text: "text-primary-brand", icon: UserPlus },
  RECOMPENSE_ACCORDEE: { label: "Récompensé", bg: "bg-gold-light", text: "text-gold-dark", icon: Check },
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

export default function PageAdminParrainages() {
  const [items, setItems] = useState<Parrainage[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filtreStatut, setFiltreStatut] = useState("all")
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  const limit = 20

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (search) params.set("search", search)
      if (filtreStatut !== "all") params.set("statut", filtreStatut)
      const res = await fetch(`/api/admin/parrainages?${params}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data.parrainages)
        setTotal(data.total)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [page, search, filtreStatut])

  useEffect(() => { fetchData() }, [fetchData])

  async function changeStatut(id: string, statut: string) {
    setActionLoading((p) => ({ ...p, [id]: true }))
    try {
      const res = await fetch(`/api/admin/parrainages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut }),
      })
      if (res.ok) {
        setItems((prev) => prev.map((i) => i.id === id ? { ...i, statut } : i))
      }
    } catch { /* ignore */ }
    setActionLoading((p) => ({ ...p, [id]: false }))
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce parrainage ?")) return
    setActionLoading((p) => ({ ...p, [id]: true }))
    try {
      const res = await fetch(`/api/admin/parrainages/${id}`, { method: "DELETE" })
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id))
        setTotal((t) => t - 1)
      }
    } catch { /* ignore */ }
    setActionLoading((p) => ({ ...p, [id]: false }))
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
            placeholder="Rechercher un parrain…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-3 py-2 border border-border-brand font-body text-[13px] bg-white focus:outline-none focus:border-primary-brand"
          />
        </div>

        <div className="flex items-center gap-2">
          {["all", "EN_ATTENTE", "ACTIF", "RECOMPENSE_ACCORDEE"].map((s) => (
            <button
              key={s}
              onClick={() => { setFiltreStatut(s); setPage(1) }}
              className={`px-2.5 py-1 font-body text-[10px] uppercase tracking-widest border transition-colors ${
                filtreStatut === s ? "border-primary-brand bg-primary-light text-primary-brand" : "border-border-brand text-text-muted-brand hover:text-text-mid"
              }`}
            >
              {s === "all" ? "Tous" : STATUT_MAP[s]?.label}
            </button>
          ))}
        </div>

        <span className="ml-auto font-body text-[12px] text-text-muted-brand">{total} parrainage{total > 1 ? "s" : ""}</span>
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
                  <th className="text-left px-4 py-3 font-body text-[11px] uppercase tracking-widest text-text-muted-brand font-medium">Parrain</th>
                  <th className="text-left px-4 py-3 font-body text-[11px] uppercase tracking-widest text-text-muted-brand font-medium">Filleul</th>
                  <th className="text-left px-4 py-3 font-body text-[11px] uppercase tracking-widest text-text-muted-brand font-medium">Code</th>
                  <th className="text-left px-4 py-3 font-body text-[11px] uppercase tracking-widest text-text-muted-brand font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-body text-[11px] uppercase tracking-widest text-text-muted-brand font-medium">Statut</th>
                  <th className="text-left px-4 py-3 font-body text-[11px] uppercase tracking-widest text-text-muted-brand font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => {
                  const s = STATUT_MAP[p.statut] || STATUT_MAP.EN_ATTENTE
                  return (
                    <tr key={p.id} className="border-t border-border-brand hover:bg-bg-page">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar user={p.parrain} />
                          <div>
                            <p className="font-body text-[13px] font-medium text-text-main">{p.parrain.prenom} {p.parrain.nom}</p>
                            <p className="font-body text-[11px] text-text-muted-brand">{p.parrain.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {p.filleul ? (
                          <div className="flex items-center gap-2">
                            <Avatar user={p.filleul} />
                            <p className="font-body text-[13px] text-text-main">{p.filleul.prenom} {p.filleul.nom}</p>
                          </div>
                        ) : (
                          <span className="font-body text-[12px] text-text-muted-brand italic">Aucun filleul</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <code className="font-mono text-[12px] text-text-mid bg-bg-page px-1.5 py-0.5">{p.code}</code>
                      </td>
                      <td className="px-4 py-3 font-body text-[12px] text-text-muted-brand">
                        {new Date(p.createdAt).toLocaleDateString("fr")}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 font-body text-[10px] uppercase tracking-widest ${s.bg} ${s.text}`}>
                          <s.icon size={12} /> {s.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {p.statut === "EN_ATTENTE" && p.filleul && (
                            <button
                              onClick={() => changeStatut(p.id, "ACTIF")}
                              disabled={actionLoading[p.id]}
                              className="px-2 py-1 font-body text-[10px] uppercase tracking-widest border border-primary-brand text-primary-brand hover:bg-primary-light transition-colors disabled:opacity-50"
                            >
                              Activer
                            </button>
                          )}
                          {p.statut === "ACTIF" && (
                            <button
                              onClick={() => changeStatut(p.id, "RECOMPENSE_ACCORDEE")}
                              disabled={actionLoading[p.id]}
                              className="px-2 py-1 font-body text-[10px] uppercase tracking-widest border border-gold text-gold-dark hover:bg-gold-light transition-colors disabled:opacity-50"
                            >
                              Récompenser
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(p.id)}
                            disabled={actionLoading[p.id]}
                            className="p-1 text-text-muted-brand hover:text-red-500 transition-colors disabled:opacity-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center font-body text-[13px] text-text-muted-brand">Aucun parrainage trouvé</td>
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
    </div>
  )
}
