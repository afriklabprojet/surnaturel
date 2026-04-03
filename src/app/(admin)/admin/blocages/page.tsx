"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Loader2, ChevronLeft, ChevronRight, Ban, ArrowRight, Unlock } from "lucide-react"

interface BlocageItem {
  id: string
  createdAt: string
  bloqueur: { id: string; nom: string; prenom: string; email: string; photoUrl: string | null }
  bloque: { id: string; nom: string; prenom: string; email: string; photoUrl: string | null }
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

export default function PageAdminBlocages() {
  const [items, setItems] = useState<BlocageItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  const limit = 20

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (search) params.set("search", search)
      const res = await fetch(`/api/admin/blocages?${params}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data.blocages)
        setTotal(data.total)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [page, search])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleDebloquer(id: string) {
    if (!confirm("Débloquer cette relation ?")) return
    setActionLoading((p) => ({ ...p, [id]: true }))
    try {
      const res = await fetch(`/api/admin/blocages?id=${encodeURIComponent(id)}`, { method: "DELETE" })
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
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-3 py-2 border border-border-brand font-body text-[13px] bg-white focus:outline-none focus:border-primary-brand"
          />
        </div>
        <span className="ml-auto font-body text-[12px] text-text-muted-brand">{total} blocage{total > 1 ? "s" : ""}</span>
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
                  <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-widest text-text-muted-brand font-medium">Bloqueur</th>
                  <th className="text-center px-4 py-3 font-body text-xs uppercase tracking-widest text-text-muted-brand font-medium"></th>
                  <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-widest text-text-muted-brand font-medium">Bloqué</th>
                  <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-widest text-text-muted-brand font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-widest text-text-muted-brand font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((b) => (
                  <tr key={b.id} className="border-t border-border-brand hover:bg-bg-page">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar user={b.bloqueur} />
                        <div>
                          <p className="font-body text-[13px] font-medium text-text-main">{b.bloqueur.prenom} {b.bloqueur.nom}</p>
                          <p className="font-body text-xs text-text-muted-brand">{b.bloqueur.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Ban size={16} className="text-red-400 mx-auto" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar user={b.bloque} />
                        <div>
                          <p className="font-body text-[13px] font-medium text-text-main">{b.bloque.prenom} {b.bloque.nom}</p>
                          <p className="font-body text-xs text-text-muted-brand">{b.bloque.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-body text-[12px] text-text-muted-brand">
                      {new Date(b.createdAt).toLocaleDateString("fr")}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDebloquer(b.id)}
                        disabled={actionLoading[b.id]}
                        className="flex items-center gap-1 px-2 py-1 font-body text-xs uppercase tracking-widest border border-primary-brand text-primary-brand hover:bg-primary-light transition-colors disabled:opacity-50"
                      >
                        <Unlock size={12} /> Débloquer
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center font-body text-[13px] text-text-muted-brand">Aucun blocage</td>
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
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="flex items-center gap-1 px-3 py-1.5 font-body text-xs uppercase tracking-widest border border-border-brand hover:bg-bg-page disabled:opacity-40 transition-colors">
            <ChevronLeft size={14} /> Préc.
          </button>
          <span className="font-body text-[12px] text-text-muted-brand">{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="flex items-center gap-1 px-3 py-1.5 font-body text-xs uppercase tracking-widest border border-border-brand hover:bg-bg-page disabled:opacity-40 transition-colors">
            Suiv. <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
