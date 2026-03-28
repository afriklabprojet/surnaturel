"use client"

import { useState, useEffect, useCallback } from "react"
import {
  UsersRound, Plus, Search, Loader2, Trash2, Eye, Users, Newspaper, CalendarDays,
  ChevronLeft, ChevronRight, X, Shield, Crown, Download, Edit, Save,
  UserMinus, CheckCircle2, XCircle, Megaphone, MessageSquare,
} from "lucide-react"

/* ── Types ── */

interface GroupeItem {
  id: string
  nom: string
  slug: string
  description: string | null
  imageUrl: string | null
  visibilite: string
  regles: string | null
  nbMembres: number
  nbPosts: number
  nbEvenements: number
  createdAt: string
}

interface MembreDetail {
  id: string
  role: string
  approuve: boolean
  createdAt: string
  user: { id: string; nom: string; prenom: string; email: string; photoUrl: string | null }
}

interface DemandeAdhesion {
  membreId: string
  user: { id: string; nom: string; prenom: string; email: string; photoUrl: string | null }
  createdAt: string
  reponses: { question: string; reponse: string }[]
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
  membres: MembreDetail[]
  questions: { id: string; texte: string; ordre: number }[]
  demandesEnAttente: DemandeAdhesion[]
}

type DetailTab = "infos" | "membres" | "demandes" | "annonce"

const VISIBILITE_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  PUBLIC: { label: "Public", bg: "bg-primary-light", text: "text-primary-brand" },
  PRIVE: { label: "Privé", bg: "bg-gold-light", text: "text-gold-dark" },
  SECRET: { label: "Secret", bg: "bg-red-50", text: "text-red-600" },
}

const ROLE_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  ADMIN: { label: "Admin", icon: Crown, color: "text-red-500" },
  MODERATEUR: { label: "Modérateur", icon: Shield, color: "text-blue-500" },
  MEMBRE: { label: "Membre", icon: Users, color: "text-text-muted-brand" },
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

/* ━━━━━━━━━━ Page ━━━━━━━━━━ */

export default function PageAdminGroupes() {
  const [groupes, setGroupes] = useState<GroupeItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filtreVisibilite, setFiltreVisibilite] = useState("all")
  const [exporting, setExporting] = useState(false)

  // Modals
  const [showCreate, setShowCreate] = useState(false)
  const [detail, setDetail] = useState<GroupeDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailTab, setDetailTab] = useState<DetailTab>("infos")

  // Create form
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ nom: "", description: "", visibilite: "PUBLIC", regles: "" })

  // Edit mode
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ nom: "", description: "", visibilite: "", regles: "" })

  // Actions
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  const [actionMsg, setActionMsg] = useState("")
  const [annonceText, setAnnonceText] = useState("")

  const limit = 20

  /* ── Fetch ── */

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

  /* ── Actions ── */

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
    setDetailTab("infos")
    setEditing(false)
    setActionMsg("")
    setAnnonceText("")
    try {
      const res = await fetch(`/api/admin/groupes/${id}`)
      if (res.ok) {
        const data = await res.json()
        setDetail(data)
        setEditForm({
          nom: data.nom || "",
          description: data.description || "",
          visibilite: data.visibilite || "PUBLIC",
          regles: data.regles || "",
        })
      }
    } catch { /* ignore */ }
    setDetailLoading(false)
  }

  async function sauvegarderEdit() {
    if (!detail) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/groupes/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })
      if (res.ok) {
        setEditing(false)
        voirDetail(detail.id)
        fetchGroupes()
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  async function actionMembre(groupeId: string, action: string, membreId: string, extra?: Record<string, string>) {
    setActionLoading((p) => ({ ...p, [membreId]: true }))
    try {
      const res = await fetch(`/api/admin/groupes/${groupeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, membreId, ...extra }),
      })
      if (res.ok) {
        const data = await res.json()
        setActionMsg(data.message || "Action effectuée")
        setTimeout(() => setActionMsg(""), 2000)
        voirDetail(groupeId)
      }
    } catch { /* ignore */ }
    setActionLoading((p) => ({ ...p, [membreId]: false }))
  }

  async function publierAnnonce() {
    if (!detail || !annonceText.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/groupes/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "annonce", contenu: annonceText }),
      })
      if (res.ok) {
        setAnnonceText("")
        setActionMsg("Annonce publiée !")
        setTimeout(() => setActionMsg(""), 2000)
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch("/api/admin/export?type=groupes")
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `groupes-${new Date().toISOString().split("T")[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch { /* ignore */ }
    setExporting(false)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-[22px] font-light text-text-main">Groupes communautaires</h1>
          <p className="font-body text-[12px] text-text-muted-brand mt-0.5">{total} groupe{total > 1 ? "s" : ""} — Gestion, modération, adhésions</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2 border border-border-brand font-body text-[11px] uppercase tracking-widest hover:bg-bg-page transition-colors disabled:opacity-50"
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Exporter CSV
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-brand text-white font-body text-[11px] uppercase tracking-widest hover:bg-primary-brand/90 transition-colors"
          >
            <Plus size={14} /> Créer
          </button>
        </div>
      </div>

      {/* ── Filtres ── */}
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
        <div className="flex items-center gap-1">
          {(["all", "PUBLIC", "PRIVE", "SECRET"] as const).map((v) => (
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
      </div>

      {/* ── Grille des groupes ── */}
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {groupes.map((g) => {
            const vis = VISIBILITE_LABELS[g.visibilite]
            return (
              <div key={g.id} className="border border-border-brand bg-white overflow-hidden group">
                {/* Image header */}
                <div className="h-24 bg-linear-to-br from-primary-brand/10 to-gold/10 flex items-center justify-center">
                  {g.imageUrl ? (
                    <img src={g.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UsersRound size={32} className="text-primary-brand/30" />
                  )}
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-[16px] font-light text-text-main truncate">{g.nom}</h3>
                    <span className={`shrink-0 px-2 py-0.5 font-body text-[9px] uppercase tracking-widest ${vis?.bg} ${vis?.text}`}>
                      {vis?.label}
                    </span>
                  </div>

                  {g.description && (
                    <p className="font-body text-[12px] text-text-muted-brand line-clamp-2">{g.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-text-muted-brand font-body text-[11px]">
                    <span className="flex items-center gap-1"><Users size={12} /> {g.nbMembres}</span>
                    <span className="flex items-center gap-1"><Newspaper size={12} /> {g.nbPosts}</span>
                    <span className="flex items-center gap-1"><CalendarDays size={12} /> {g.nbEvenements}</span>
                    <span className="ml-auto text-[10px]">{new Date(g.createdAt).toLocaleDateString("fr")}</span>
                  </div>

                  <div className="flex items-center gap-1 pt-1">
                    <button
                      onClick={() => voirDetail(g.id)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-border-brand font-body text-[10px] uppercase tracking-widest text-text-mid hover:text-primary-brand hover:border-primary-brand transition-colors"
                    >
                      <Eye size={12} /> Gérer
                    </button>
                    <button
                      onClick={() => supprimerGroupe(g.id)}
                      disabled={actionLoading[g.id]}
                      className="p-1.5 border border-border-brand hover:bg-red-50 hover:border-red-200 transition-colors"
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

      {/* ── Pagination ── */}
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

      {/* ━━━━━━━━━━ Modal : Création ━━━━━━━━━━ */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false) }}>
          <div className="bg-white max-w-lg w-full border border-border-brand p-6">
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
              <button type="submit" disabled={saving} className="w-full py-2.5 bg-primary-brand text-white font-body text-[11px] uppercase tracking-widest hover:bg-primary-brand/90 transition-colors disabled:opacity-50">
                {saving ? "Création…" : "Créer le groupe"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━ Modal : Détail / Gestion complète ━━━━━━━━━━ */}
      {(detail || detailLoading) && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) { setDetail(null); setEditing(false) } }}>
          <div className="bg-white max-w-3xl w-full border border-border-brand max-h-[85vh] overflow-y-auto">
            {detailLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary-brand" />
              </div>
            ) : detail && (
              <>
                {/* Header */}
                <div className="p-6 border-b border-border-brand">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-display text-[20px] font-light text-text-main">{detail.nom}</h2>
                      <p className="font-body text-[12px] text-text-muted-brand mt-0.5">
                        {detail.membres.filter((m) => m.approuve).length} membres · {detail.nbPosts} posts · {detail.nbEvenements} événements
                        {detail.demandesEnAttente.length > 0 && (
                          <span className="ml-2 px-1.5 py-0.5 bg-gold-light text-gold-dark text-[10px] uppercase tracking-widest">{detail.demandesEnAttente.length} demande{detail.demandesEnAttente.length > 1 ? "s" : ""}</span>
                        )}
                      </p>
                    </div>
                    <button onClick={() => { setDetail(null); setEditing(false) }}><X size={18} className="text-text-muted-brand" /></button>
                  </div>

                  {/* Onglets */}
                  <div className="flex gap-1 mt-4 border-b border-border-brand -mb-px">
                    {([
                      { key: "infos" as DetailTab, label: "Infos", icon: Eye },
                      { key: "membres" as DetailTab, label: `Membres (${detail.membres.filter((m) => m.approuve).length})`, icon: Users },
                      { key: "demandes" as DetailTab, label: `Demandes (${detail.demandesEnAttente.length})`, icon: MessageSquare },
                      { key: "annonce" as DetailTab, label: "Annonce", icon: Megaphone },
                    ]).map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setDetailTab(t.key)}
                        className={`flex items-center gap-1.5 px-3 py-2 font-body text-[11px] uppercase tracking-widest border-b-2 transition-colors ${
                          detailTab === t.key
                            ? "border-primary-brand text-primary-brand"
                            : "border-transparent text-text-muted-brand hover:text-text-mid"
                        }`}
                      >
                        <t.icon size={13} /> {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action feedback */}
                {actionMsg && (
                  <div className="mx-6 mt-4 px-3 py-2 bg-green-50 border border-green-200 font-body text-[12px] text-green-700">{actionMsg}</div>
                )}

                {/* ── Onglet : Infos ── */}
                {detailTab === "infos" && (
                  <div className="p-6 space-y-4">
                    {!editing ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 font-body text-[10px] uppercase tracking-widest ${VISIBILITE_LABELS[detail.visibilite]?.bg} ${VISIBILITE_LABELS[detail.visibilite]?.text}`}>
                            {VISIBILITE_LABELS[detail.visibilite]?.label}
                          </span>
                          <button
                            onClick={() => setEditing(true)}
                            className="flex items-center gap-1 px-3 py-1.5 border border-border-brand font-body text-[10px] uppercase tracking-widest text-text-muted-brand hover:text-primary-brand hover:border-primary-brand transition-colors"
                          >
                            <Edit size={12} /> Modifier
                          </button>
                        </div>

                        {detail.description && (
                          <div>
                            <p className="font-body text-[10px] uppercase tracking-widest text-text-muted-brand mb-1">Description</p>
                            <p className="font-body text-[13px] text-text-mid">{detail.description}</p>
                          </div>
                        )}

                        {detail.regles && (
                          <div className="p-3 bg-bg-page border border-border-brand">
                            <p className="font-body text-[10px] uppercase tracking-widest text-text-muted-brand mb-1">Règles</p>
                            <p className="font-body text-[12px] text-text-mid whitespace-pre-line">{detail.regles}</p>
                          </div>
                        )}

                        {detail.questions.length > 0 && (
                          <div>
                            <p className="font-body text-[10px] uppercase tracking-widest text-text-muted-brand mb-2">Questions d&apos;adhésion</p>
                            <div className="space-y-1">
                              {detail.questions.map((q, i) => (
                                <p key={q.id} className="font-body text-[13px] text-text-mid">{i + 1}. {q.texte}</p>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      /* Mode édition */
                      <div className="space-y-4">
                        <div>
                          <label className="font-body text-[11px] uppercase tracking-widest text-text-muted-brand block mb-1">Nom</label>
                          <input type="text" value={editForm.nom} onChange={(e) => setEditForm((f) => ({ ...f, nom: e.target.value }))} className="w-full px-3 py-2 border border-border-brand font-body text-[13px] focus:outline-none focus:border-primary-brand" />
                        </div>
                        <div>
                          <label className="font-body text-[11px] uppercase tracking-widest text-text-muted-brand block mb-1">Description</label>
                          <textarea value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-border-brand font-body text-[13px] focus:outline-none focus:border-primary-brand resize-none" />
                        </div>
                        <div>
                          <label className="font-body text-[11px] uppercase tracking-widest text-text-muted-brand block mb-1">Visibilité</label>
                          <select value={editForm.visibilite} onChange={(e) => setEditForm((f) => ({ ...f, visibilite: e.target.value }))} className="w-full px-3 py-2 border border-border-brand font-body text-[13px] focus:outline-none focus:border-primary-brand">
                            <option value="PUBLIC">Public</option>
                            <option value="PRIVE">Privé</option>
                            <option value="SECRET">Secret</option>
                          </select>
                        </div>
                        <div>
                          <label className="font-body text-[11px] uppercase tracking-widest text-text-muted-brand block mb-1">Règles</label>
                          <textarea value={editForm.regles} onChange={(e) => setEditForm((f) => ({ ...f, regles: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-border-brand font-body text-[13px] focus:outline-none focus:border-primary-brand resize-none" />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={sauvegarderEdit}
                            disabled={saving}
                            className="flex-1 py-2 bg-primary-brand text-white font-body text-[11px] uppercase tracking-widest hover:bg-primary-brand/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                          >
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Sauvegarder
                          </button>
                          <button
                            onClick={() => setEditing(false)}
                            className="px-4 py-2 border border-border-brand font-body text-[11px] uppercase tracking-widest text-text-muted-brand hover:bg-bg-page transition-colors"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Onglet : Membres ── */}
                {detailTab === "membres" && (
                  <div className="p-6">
                    <div className="divide-y divide-border-brand max-h-96 overflow-y-auto">
                      {detail.membres.filter((m) => m.approuve).map((m) => {
                        const roleInfo = ROLE_LABELS[m.role] || ROLE_LABELS.MEMBRE
                        const RoleIcon = roleInfo.icon
                        return (
                          <div key={m.id} className="flex items-center gap-3 py-3">
                            <Avatar user={m.user} size={32} />
                            <div className="flex-1 min-w-0">
                              <p className="font-body text-[13px] text-text-main truncate">{m.user.prenom} {m.user.nom}</p>
                              <p className="font-body text-[11px] text-text-muted-brand">{m.user.email}</p>
                            </div>

                            {/* Changer le rôle */}
                            <select
                              value={m.role}
                              onChange={(e) => actionMembre(detail.id, "changeRole", m.id, { role: e.target.value })}
                              disabled={actionLoading[m.id]}
                              className="px-2 py-1 border border-border-brand font-body text-[10px] uppercase tracking-widest bg-white focus:outline-none focus:border-primary-brand"
                            >
                              <option value="ADMIN">Admin</option>
                              <option value="MODERATEUR">Modérateur</option>
                              <option value="MEMBRE">Membre</option>
                            </select>

                            {/* Exclure */}
                            <button
                              onClick={() => {
                                if (confirm(`Exclure ${m.user.prenom} ${m.user.nom} du groupe ?`)) {
                                  actionMembre(detail.id, "kick", m.id)
                                }
                              }}
                              disabled={actionLoading[m.id]}
                              className="p-1.5 border border-border-brand hover:bg-red-50 hover:border-red-200 transition-colors"
                              title="Exclure"
                            >
                              <UserMinus size={14} className="text-red-500" />
                            </button>
                          </div>
                        )
                      })}
                      {detail.membres.filter((m) => m.approuve).length === 0 && (
                        <p className="py-6 font-body text-[13px] text-text-muted-brand text-center">Aucun membre</p>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Onglet : Demandes d'adhésion ── */}
                {detailTab === "demandes" && (
                  <div className="p-6">
                    {detail.demandesEnAttente.length === 0 ? (
                      <p className="py-6 font-body text-[13px] text-text-muted-brand text-center">Aucune demande en attente</p>
                    ) : (
                      <div className="space-y-4">
                        {detail.demandesEnAttente.map((d) => (
                          <div key={d.membreId} className="border border-border-brand p-4 space-y-3">
                            <div className="flex items-center gap-3">
                              <Avatar user={d.user} size={32} />
                              <div className="flex-1 min-w-0">
                                <p className="font-body text-[13px] font-medium text-text-main">{d.user.prenom} {d.user.nom}</p>
                                <p className="font-body text-[11px] text-text-muted-brand">{d.user.email} · {new Date(d.createdAt).toLocaleDateString("fr")}</p>
                              </div>
                            </div>

                            {/* Réponses aux questions */}
                            {d.reponses.length > 0 && (
                              <div className="space-y-2 bg-bg-page p-3 border border-border-brand">
                                {d.reponses.map((r, i) => (
                                  <div key={i}>
                                    <p className="font-body text-[10px] uppercase tracking-widest text-text-muted-brand">{r.question}</p>
                                    <p className="font-body text-[13px] text-text-mid mt-0.5">{r.reponse}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => actionMembre(detail.id, "approuver", d.membreId)}
                                disabled={actionLoading[d.membreId]}
                                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-green-600 text-white font-body text-[10px] uppercase tracking-widest hover:bg-green-700 disabled:opacity-50 transition-colors"
                              >
                                {actionLoading[d.membreId] ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Approuver
                              </button>
                              <button
                                onClick={() => actionMembre(detail.id, "refuser", d.membreId)}
                                disabled={actionLoading[d.membreId]}
                                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-500 text-white font-body text-[10px] uppercase tracking-widest hover:bg-red-600 disabled:opacity-50 transition-colors"
                              >
                                {actionLoading[d.membreId] ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />} Refuser
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Onglet : Annonce ── */}
                {detailTab === "annonce" && (
                  <div className="p-6 space-y-4">
                    <p className="font-body text-[12px] text-text-muted-brand">
                      Publiez une annonce visible par tous les membres du groupe. L&apos;annonce sera épinglée et enverra une notification.
                    </p>
                    <textarea
                      value={annonceText}
                      onChange={(e) => setAnnonceText(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-border-brand font-body text-[13px] focus:outline-none focus:border-primary-brand resize-none"
                      placeholder="Contenu de l'annonce…"
                    />
                    <button
                      onClick={publierAnnonce}
                      disabled={saving || !annonceText.trim()}
                      className="w-full py-2 bg-primary-brand text-white font-body text-[11px] uppercase tracking-widest hover:bg-primary-brand/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Megaphone size={14} />} Publier l&apos;annonce
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
