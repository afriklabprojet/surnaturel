"use client"

import { useState, useEffect, useCallback } from "react"
import { UsersRound, Plus, Search, Loader2, Trash2, Edit, Eye, Users, Newspaper, CalendarDays, ChevronLeft, ChevronRight, X, Shield, Crown } from "lucide-react"

interface GroupeItem {
  id: string
  nom: string
  slug: string
  description: string | null
  imageUrl: string | null
  visibilite: string
  nbMembres: number
  nbPosts: number
  nbEvenements: number
  createdAt: string
}

interface GroupeDetail {
  id: string
  nom: string
  slug: string
  description: string | null
  imageUrl: string | null
  visibilite: string
  regles: string | null
  nbPosts: number
  nbEvenements: number
  membres: { id: string; role: string; approuve: boolean; createdAt: string; user: { id: string; nom: string; prenom: string; email: string; photoUrl: string | null } }[]
  questions: { id: string; texte: string; ordre: number }[]
}

const VISIBILITE_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  PUBLIC: { label: "Public", bg: "bg-primary-light", text: "text-primary-brand" },
  PRIVE: { label: "Privé", bg: "bg-gold-light", text: "text-gold-dark" },
  SECRET: { label: "Secret", bg: "bg-red-50", text: "text-red-600" },
}

const ROLE_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  ADMIN: { label: "Admin", icon: Crown },
  MODERATEUR: { label: "Modérateur", icon: Shield },
  MEMBRE: { label: "Membre", icon: Users },
}

function Avatar({ user, size = 32 }: { user: { prenom: string; nom: string; photoUrl?: string | null }; size?: number }) {
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

export default function PageAdminGroupes() {
  const [groupes, setGroupes] = useState<GroupeItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filtreVisibilite, setFiltreVisibilite] = useState("all")
  const [showCreate, setShowCreate] = useState(false)
  const [detail, setDetail] = useState<GroupeDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ nom: "", description: "", visibilite: "PUBLIC", regles: "" })
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  const limit = 20

  const fetchGroupes = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (search) params.set("search", search)
      if (filtreVisibilite !== "all") params.set("visibilite", filtreVisibilite)
      const res = await fetch(`/api/admin/groupes?${params}`)
      if (res.ok) {
        const data = await res.json()
        setGroupes(data.groupes)
        setTotal(data.total)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [page, search, filtreVisibilite])

  useEffect(() => { fetchGroupes() }, [fetchGroupes])

  async function creerGroupe(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/admin/groupes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setShowCreate(false)
        setForm({ nom: "", description: "", visibilite: "PUBLIC", regles: "" })
        fetchGroupes()
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  async function supprimerGroupe(id: string) {
    if (!confirm("Supprimer ce groupe et tout son contenu ?")) return
    setActionLoading((p) => ({ ...p, [id]: true }))
    try {
      const res = await fetch(`/api/admin/groupes/${id}`, { method: "DELETE" })
      if (res.ok) {
        setGroupes((prev) => prev.filter((g) => g.id !== id))
        setTotal((t) => t - 1)
        if (detail?.id === id) setDetail(null)
      }
    } catch { /* ignore */ }
    setActionLoading((p) => ({ ...p, [id]: false }))
  }

  async function voirDetail(id: string) {
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/admin/groupes/${id}`)
      if (res.ok) setDetail(await res.json())
    } catch { /* ignore */ }
    setDetailLoading(false)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      {/* Barre d'actions */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-brand" />
          <input
            type="text"
            placeholder="Rechercher un groupe…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-3 py-2 border border-border-brand font-body text-[13px] bg-white focus:outline-none focus:border-primary-brand"
          />
        </div>

        <div className="flex items-center gap-2">
          {["all", "PUBLIC", "PRIVE", "SECRET"].map((v) => (
            <button
              key={v}
              onClick={() => { setFiltreVisibilite(v); setPage(1) }}
              className={`px-2.5 py-1 font-body text-[10px] uppercase tracking-widest border transition-colors ${
                filtreVisibilite === v ? "border-primary-brand bg-primary-light text-primary-brand" : "border-border-brand text-text-muted-brand hover:text-text-mid"
              }`}
            >
              {v === "all" ? "Tous" : VISIBILITE_LABELS[v]?.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-primary-brand text-white font-body text-[11px] uppercase tracking-widest hover:bg-primary-dark transition-colors"
        >
          <Plus size={14} /> Créer un groupe
        </button>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center min-h-100">
          <Loader2 className="h-8 w-8 animate-spin text-primary-brand" />
        </div>
      ) : groupes.length === 0 ? (
        <div className="border border-border-brand bg-white p-12 text-center">
          <UsersRound size={36} className="mx-auto text-gold mb-2" />
          <p className="font-body text-[14px] text-text-muted-brand">Aucun groupe</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groupes.map((g) => {
            const vis = VISIBILITE_LABELS[g.visibilite]
            return (
              <div key={g.id} className="border border-border-brand bg-white overflow-hidden">
                {/* Image header */}
                <div className="h-24 bg-linear-to-br from-primary-brand/10 to-gold/10 flex items-center justify-center">
                  {g.imageUrl ? (
                    <img src={g.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UsersRound size={32} className="text-primary-brand/30" />
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-display text-[16px] font-light text-text-main truncate">{g.nom}</h3>
                    <span className={`shrink-0 px-2 py-0.5 font-body text-[9px] uppercase tracking-widest ${vis?.bg} ${vis?.text}`}>
                      {vis?.label}
                    </span>
                  </div>

                  {g.description && (
                    <p className="font-body text-[12px] text-text-muted-brand mb-3 line-clamp-2">{g.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-text-muted-brand font-body text-[11px] mb-3">
                    <span className="flex items-center gap-1"><Users size={12} /> {g.nbMembres}</span>
                    <span className="flex items-center gap-1"><Newspaper size={12} /> {g.nbPosts}</span>
                    <span className="flex items-center gap-1"><CalendarDays size={12} /> {g.nbEvenements}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => voirDetail(g.id)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-border-brand font-body text-[10px] uppercase tracking-widest text-text-mid hover:bg-bg-page transition-colors"
                    >
                      <Eye size={12} /> Détails
                    </button>
                    <button
                      onClick={() => supprimerGroupe(g.id)}
                      disabled={actionLoading[g.id]}
                      className="p-1.5 border border-border-brand hover:bg-red-50 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
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

      {/* Modal Création */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false) }}>
          <div className="bg-white max-w-lg w-full mx-4 border border-border-brand p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-[20px] font-light text-text-main">Nouveau groupe</h2>
              <button onClick={() => setShowCreate(false)}><X size={18} className="text-text-muted-brand" /></button>
            </div>
            <form onSubmit={creerGroupe} className="space-y-4">
              <div>
                <label className="font-body text-[11px] uppercase tracking-widest text-text-muted-brand block mb-1">Nom</label>
                <input type="text" required value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} className="w-full px-3 py-2 border border-border-brand font-body text-[13px] focus:outline-none focus:border-primary-brand" />
              </div>
              <div>
                <label className="font-body text-[11px] uppercase tracking-widest text-text-muted-brand block mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-border-brand font-body text-[13px] focus:outline-none focus:border-primary-brand resize-none" />
              </div>
              <div>
                <label className="font-body text-[11px] uppercase tracking-widest text-text-muted-brand block mb-1">Visibilité</label>
                <select value={form.visibilite} onChange={(e) => setForm((f) => ({ ...f, visibilite: e.target.value }))} className="w-full px-3 py-2 border border-border-brand font-body text-[13px] focus:outline-none focus:border-primary-brand">
                  <option value="PUBLIC">Public</option>
                  <option value="PRIVE">Privé</option>
                  <option value="SECRET">Secret</option>
                </select>
              </div>
              <div>
                <label className="font-body text-[11px] uppercase tracking-widest text-text-muted-brand block mb-1">Règles</label>
                <textarea value={form.regles} onChange={(e) => setForm((f) => ({ ...f, regles: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-border-brand font-body text-[13px] focus:outline-none focus:border-primary-brand resize-none" />
              </div>
              <button type="submit" disabled={saving} className="w-full py-2.5 bg-primary-brand text-white font-body text-[11px] uppercase tracking-widest hover:bg-primary-dark transition-colors disabled:opacity-50">
                {saving ? "Création…" : "Créer le groupe"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Détail */}
      {(detail || detailLoading) && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) { setDetail(null) } }}>
          <div className="bg-white max-w-2xl w-full mx-4 border border-border-brand max-h-[80vh] overflow-y-auto">
            {detailLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary-brand" />
              </div>
            ) : detail && (
              <>
                <div className="p-6 border-b border-border-brand">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-display text-[20px] font-light text-text-main">{detail.nom}</h2>
                      <p className="font-body text-[12px] text-text-muted-brand mt-1">
                        {detail.membres.length} membres · {detail.nbPosts} posts · {detail.nbEvenements} événements
                      </p>
                    </div>
                    <button onClick={() => setDetail(null)}><X size={18} className="text-text-muted-brand" /></button>
                  </div>
                  {detail.description && (
                    <p className="font-body text-[13px] text-text-mid mt-3">{detail.description}</p>
                  )}
                  {detail.regles && (
                    <div className="mt-3 p-3 bg-bg-page border border-border-brand">
                      <p className="font-body text-[10px] uppercase tracking-widest text-text-muted-brand mb-1">Règles</p>
                      <p className="font-body text-[12px] text-text-mid whitespace-pre-line">{detail.regles}</p>
                    </div>
                  )}
                </div>

                {/* Questions d'adhésion */}
                {detail.questions.length > 0 && (
                  <div className="p-6 border-b border-border-brand">
                    <h3 className="font-body text-[11px] uppercase tracking-widest text-text-muted-brand mb-3">Questions d&apos;adhésion</h3>
                    <div className="space-y-2">
                      {detail.questions.map((q, i) => (
                        <p key={q.id} className="font-body text-[13px] text-text-mid">{i + 1}. {q.texte}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Membres */}
                <div className="p-6">
                  <h3 className="font-body text-[11px] uppercase tracking-widest text-text-muted-brand mb-3">Membres ({detail.membres.length})</h3>
                  <div className="divide-y divide-border-brand max-h-64 overflow-y-auto">
                    {detail.membres.map((m) => {
                      const roleInfo = ROLE_LABELS[m.role] || ROLE_LABELS.MEMBRE
                      return (
                        <div key={m.id} className="flex items-center gap-3 py-2">
                          <Avatar user={m.user} size={28} />
                          <div className="flex-1 min-w-0">
                            <p className="font-body text-[13px] text-text-main truncate">{m.user.prenom} {m.user.nom}</p>
                          </div>
                          <span className="flex items-center gap-1 font-body text-[10px] uppercase tracking-widest text-text-muted-brand">
                            <roleInfo.icon size={12} /> {roleInfo.label}
                          </span>
                          {!m.approuve && (
                            <span className="px-2 py-0.5 font-body text-[9px] uppercase tracking-widest bg-gold-light text-gold-dark">En attente</span>
                          )}
                        </div>
                      )
                    })}
                    {detail.membres.length === 0 && (
                      <p className="py-4 font-body text-[13px] text-text-muted-brand text-center">Aucun membre</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
