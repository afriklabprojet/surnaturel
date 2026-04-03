"use client"

import { useState, useEffect, useCallback } from "react"
import { BadgeCheck, Search, Loader2, ChevronLeft, ChevronRight, ShieldCheck, UserCheck, XCircle } from "lucide-react"

interface UserItem {
  id: string
  nom: string
  prenom: string
  email: string
  photoUrl: string | null
  role: string
  verificationStatus: string
  createdAt: string
  nbRdv: number
  nbCommandes: number
  nbPosts: number
}

const STATUS_LABELS: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  AUCUNE: { label: "Non vérifié", bg: "bg-border-brand", text: "text-text-muted-brand", icon: XCircle },
  MEMBRE_VERIFIE: { label: "Membre vérifié", bg: "bg-primary-light", text: "text-primary-brand", icon: UserCheck },
  PROFESSIONNEL_SANTE: { label: "Professionnel santé", bg: "bg-gold-light", text: "text-gold-dark", icon: ShieldCheck },
}

function Avatar({ user, size = 36 }: { user: { prenom: string; nom: string; photoUrl: string | null }; size?: number }) {
  const initials = `${user.prenom?.[0] ?? ""}${user.nom?.[0] ?? ""}`.toUpperCase()
  if (user.photoUrl) {
    return <img src={user.photoUrl} alt="" className="rounded-full object-cover" style={{ width: size, height: size }} />
  }
  return (
    <div className="flex items-center justify-center rounded-full bg-primary-brand text-white font-body font-medium" style={{ width: size, height: size, fontSize: size * 0.34 }}>
      {initials}
    </div>
  )
}

export default function PageAdminVerification() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filtreStatut, setFiltreStatut] = useState("all")
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  const limit = 20

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (search) params.set("search", search)
      if (filtreStatut !== "all") params.set("statut", filtreStatut)
      const res = await fetch(`/api/admin/verification?${params}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
        setTotal(data.total)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [page, search, filtreStatut])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  async function changeStatus(userId: string, verificationStatus: string) {
    setActionLoading((p) => ({ ...p, [userId]: true }))
    try {
      const res = await fetch("/api/admin/verification", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, verificationStatus }),
      })
      if (res.ok) {
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, verificationStatus } : u))
      }
    } catch { /* ignore */ }
    setActionLoading((p) => ({ ...p, [userId]: false }))
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
            placeholder="Rechercher un utilisateur…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-3 py-2 border border-border-brand font-body text-[13px] bg-white focus:outline-none focus:border-primary-brand"
          />
        </div>

        <div className="flex items-center gap-2">
          {["all", "AUCUNE", "MEMBRE_VERIFIE", "PROFESSIONNEL_SANTE"].map((s) => (
            <button
              key={s}
              onClick={() => { setFiltreStatut(s); setPage(1) }}
              className={`px-2.5 py-1 font-body text-xs uppercase tracking-widest border transition-colors ${
                filtreStatut === s ? "border-primary-brand bg-primary-light text-primary-brand" : "border-border-brand text-text-muted-brand hover:text-text-mid"
              }`}
            >
              {s === "all" ? "Tous" : STATUS_LABELS[s]?.label}
            </button>
          ))}
        </div>

        <span className="ml-auto font-body text-[12px] text-text-muted-brand">{total} utilisateur{total > 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-100">
          <Loader2 className="h-8 w-8 animate-spin text-primary-brand" />
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {users.map((u) => {
              const status = STATUS_LABELS[u.verificationStatus] || STATUS_LABELS.AUCUNE
              return (
                <div key={u.id} className="bg-white border border-border-brand p-4">
                  <div className="flex items-start gap-3">
                    <Avatar user={u} size={40} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-body text-[13px] font-medium text-text-main truncate">{u.prenom} {u.nom}</p>
                        <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 text-xs ${status.bg} ${status.text}`}>
                          <status.icon size={10} />
                        </span>
                      </div>
                      <p className="font-body text-xs text-text-muted-brand truncate">{u.email}</p>
                      <p className="font-body text-xs text-text-muted-brand mt-1">{u.nbRdv} RDV · {u.nbCommandes} cmd · {u.nbPosts} posts</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border-brand">
                    {u.verificationStatus !== "MEMBRE_VERIFIE" && (
                      <button onClick={() => changeStatus(u.id, "MEMBRE_VERIFIE")} disabled={actionLoading[u.id]} className="flex-1 py-2 text-xs uppercase tracking-widest bg-primary-brand text-white disabled:opacity-50">Vérifier</button>
                    )}
                    {u.verificationStatus !== "PROFESSIONNEL_SANTE" && u.role !== "CLIENT" && (
                      <button onClick={() => changeStatus(u.id, "PROFESSIONNEL_SANTE")} disabled={actionLoading[u.id]} className="flex-1 py-2 text-xs uppercase tracking-widest bg-gold text-white disabled:opacity-50">Pro santé</button>
                    )}
                    {u.verificationStatus !== "AUCUNE" && (
                      <button onClick={() => changeStatus(u.id, "AUCUNE")} disabled={actionLoading[u.id]} className="flex-1 py-2 text-xs uppercase tracking-widest border border-border-brand text-text-muted-brand disabled:opacity-50">Retirer</button>
                    )}
                  </div>
                </div>
              )
            })}
            {users.length === 0 && (
              <div className="bg-white border border-border-brand p-8 text-center">
                <BadgeCheck className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-text-muted-brand font-body">Aucun utilisateur</p>
              </div>
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white border border-border-brand overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
              <thead className="bg-bg-page">
                <tr>
                  <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-widest text-text-muted-brand font-medium">Utilisateur</th>
                  <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-widest text-text-muted-brand font-medium">Rôle</th>
                  <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-widest text-text-muted-brand font-medium">Activité</th>
                  <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-widest text-text-muted-brand font-medium">Statut</th>
                  <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-widest text-text-muted-brand font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const status = STATUS_LABELS[u.verificationStatus] || STATUS_LABELS.AUCUNE
                  return (
                    <tr key={u.id} className="border-t border-border-brand hover:bg-bg-page">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar user={u} size={32} />
                          <div>
                            <p className="font-body text-[13px] font-medium text-text-main">{u.prenom} {u.nom}</p>
                            <p className="font-body text-xs text-text-muted-brand">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-body text-[12px] text-text-mid">{u.role}</td>
                      <td className="px-4 py-3">
                        <div className="font-body text-xs text-text-muted-brand space-y-0.5">
                          <p>{u.nbRdv} RDV · {u.nbCommandes} cmd · {u.nbPosts} posts</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 font-body text-xs uppercase tracking-widest ${status.bg} ${status.text}`}>
                          <status.icon size={12} /> {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {u.verificationStatus !== "MEMBRE_VERIFIE" && (
                            <button
                              onClick={() => changeStatus(u.id, "MEMBRE_VERIFIE")}
                              disabled={actionLoading[u.id]}
                              className="px-2 py-1 font-body text-xs uppercase tracking-widest border border-primary-brand text-primary-brand hover:bg-primary-light transition-colors disabled:opacity-50"
                            >
                              Vérifier
                            </button>
                          )}
                          {u.verificationStatus !== "PROFESSIONNEL_SANTE" && u.role !== "CLIENT" && (
                            <button
                              onClick={() => changeStatus(u.id, "PROFESSIONNEL_SANTE")}
                              disabled={actionLoading[u.id]}
                              className="px-2 py-1 font-body text-xs uppercase tracking-widest border border-gold text-gold-dark hover:bg-gold-light transition-colors disabled:opacity-50"
                            >
                              Pro santé
                            </button>
                          )}
                          {u.verificationStatus !== "AUCUNE" && (
                            <button
                              onClick={() => changeStatus(u.id, "AUCUNE")}
                              disabled={actionLoading[u.id]}
                              className="px-2 py-1 font-body text-xs uppercase tracking-widest border border-border-brand text-text-muted-brand hover:bg-bg-page transition-colors disabled:opacity-50"
                            >
                              Retirer
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center font-body text-[13px] text-text-muted-brand">Aucun utilisateur trouvé</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          </div>
        </>
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
