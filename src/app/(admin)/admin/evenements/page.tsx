"use client"

import { useState, useEffect, useCallback } from "react"
import { CalendarDays, Plus, MapPin, Users, Loader2, Trash2, Edit, ChevronLeft, ChevronRight, X, Clock } from "lucide-react"

interface EvenementItem {
  id: string
  titre: string
  description: string
  imageUrl: string | null
  lieu: string | null
  dateDebut: string
  dateFin: string | null
  maxParticipants: number | null
  nbParticipants: number
  createur: string
  groupe: string | null
  createdAt: string
}

function formatDateFr(iso: string) {
  return new Date(iso).toLocaleDateString("fr", { weekday: "short", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

export default function PageAdminEvenements() {
  const [evenements, setEvenements] = useState<EvenementItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [periode, setPeriode] = useState("aVenir")
  const [showCreate, setShowCreate] = useState(false)
  const [editItem, setEditItem] = useState<EvenementItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ titre: "", description: "", lieu: "", dateDebut: "", dateFin: "", maxParticipants: "" })
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  const limit = 20

  const fetchEvenements = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit), periode })
      const res = await fetch(`/api/admin/evenements?${params}`)
      if (res.ok) {
        const data = await res.json()
        setEvenements(data.evenements)
        setTotal(data.total)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [page, periode])

  useEffect(() => { fetchEvenements() }, [fetchEvenements])

  function openCreate() {
    setForm({ titre: "", description: "", lieu: "", dateDebut: "", dateFin: "", maxParticipants: "" })
    setEditItem(null)
    setShowCreate(true)
  }

  function openEdit(e: EvenementItem) {
    setForm({
      titre: e.titre,
      description: e.description,
      lieu: e.lieu || "",
      dateDebut: e.dateDebut.slice(0, 16),
      dateFin: e.dateFin?.slice(0, 16) || "",
      maxParticipants: e.maxParticipants?.toString() || "",
    })
    setEditItem(e)
    setShowCreate(true)
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        titre: form.titre,
        description: form.description,
        dateDebut: form.dateDebut,
      }
      if (form.lieu) body.lieu = form.lieu
      if (form.dateFin) body.dateFin = form.dateFin
      if (form.maxParticipants) body.maxParticipants = Number(form.maxParticipants)

      const url = editItem ? `/api/admin/evenements/${editItem.id}` : "/api/admin/evenements"
      const res = await fetch(url, {
        method: editItem ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setShowCreate(false)
        setEditItem(null)
        fetchEvenements()
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  async function supprimer(id: string) {
    if (!confirm("Supprimer cet événement ?")) return
    setActionLoading((p) => ({ ...p, [id]: true }))
    try {
      const res = await fetch(`/api/admin/evenements/${id}`, { method: "DELETE" })
      if (res.ok) {
        setEvenements((prev) => prev.filter((e) => e.id !== id))
        setTotal((t) => t - 1)
      }
    } catch { /* ignore */ }
    setActionLoading((p) => ({ ...p, [id]: false }))
  }

  const totalPages = Math.ceil(total / limit)
  const isPast = (d: string) => new Date(d) < new Date()

  return (
    <div className="space-y-6">
      {/* Barre d'actions */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          {[
            { key: "aVenir", label: "À venir" },
            { key: "passes", label: "Passés" },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => { setPeriode(p.key); setPage(1) }}
              className={`px-2.5 py-1 font-body text-xs uppercase tracking-widest border transition-colors ${
                periode === p.key ? "border-primary-brand bg-primary-light text-primary-brand" : "border-border-brand text-text-muted-brand hover:text-text-mid"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <span className="font-body text-[12px] text-text-muted-brand">{total} événement{total > 1 ? "s" : ""}</span>

        <button
          onClick={openCreate}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-primary-brand text-white font-body text-xs uppercase tracking-widest hover:bg-primary-dark transition-colors"
        >
          <Plus size={14} /> Nouvel événement
        </button>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center min-h-100">
          <Loader2 className="h-8 w-8 animate-spin text-primary-brand" />
        </div>
      ) : evenements.length === 0 ? (
        <div className="border border-border-brand bg-white p-12 text-center">
          <CalendarDays size={36} className="mx-auto text-gold mb-2" />
          <p className="font-body text-[14px] text-text-muted-brand">Aucun événement {periode === "aVenir" ? "à venir" : "passé"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {evenements.map((e) => (
            <div key={e.id} className={`border border-border-brand bg-white p-5 ${isPast(e.dateDebut) ? "opacity-70" : ""}`}>
              <div className="flex items-start gap-4">
                {/* Date badge */}
                <div className="shrink-0 w-14 text-center border border-border-brand p-1.5">
                  <p className="font-display text-[20px] text-primary-brand leading-none">{new Date(e.dateDebut).getDate()}</p>
                  <p className="font-body text-[9px] uppercase tracking-widest text-text-muted-brand">{new Date(e.dateDebut).toLocaleDateString("fr", { month: "short" })}</p>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-[16px] font-light text-text-main">{e.titre}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1 font-body text-xs text-text-muted-brand">
                    <span className="flex items-center gap-1"><Clock size={12} /> {formatDateFr(e.dateDebut)}</span>
                    {e.lieu && <span className="flex items-center gap-1"><MapPin size={12} /> {e.lieu}</span>}
                    <span className="flex items-center gap-1"><Users size={12} /> {e.nbParticipants}{e.maxParticipants ? ` / ${e.maxParticipants}` : ""}</span>
                    {e.groupe && <span className="px-2 py-0.5 bg-primary-light text-primary-brand text-[9px] uppercase tracking-widest">{e.groupe}</span>}
                  </div>
                  <p className="font-body text-[12px] text-text-mid mt-2 line-clamp-2">{e.description}</p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(e)} className="p-2 hover:bg-bg-page transition-colors" title="Modifier">
                    <Edit size={16} className="text-text-muted-brand" />
                  </button>
                  <button onClick={() => supprimer(e.id)} disabled={actionLoading[e.id]} className="p-2 hover:bg-red-50 transition-colors" title="Supprimer">
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
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

      {/* Modal Création / Édition */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) { setShowCreate(false); setEditItem(null) } }}>
          <div className="bg-white max-w-lg w-full mx-4 border border-border-brand p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-[20px] font-light text-text-main">{editItem ? "Modifier l'événement" : "Nouvel événement"}</h2>
              <button onClick={() => { setShowCreate(false); setEditItem(null) }}><X size={18} className="text-text-muted-brand" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="font-body text-xs uppercase tracking-widest text-text-muted-brand block mb-1">Titre</label>
                <input type="text" required value={form.titre} onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))} className="w-full px-3 py-2 border border-border-brand font-body text-[13px] focus:outline-none focus:border-primary-brand" />
              </div>
              <div>
                <label className="font-body text-xs uppercase tracking-widest text-text-muted-brand block mb-1">Description</label>
                <textarea required value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-border-brand font-body text-[13px] focus:outline-none focus:border-primary-brand resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-body text-xs uppercase tracking-widest text-text-muted-brand block mb-1">Date début</label>
                  <input type="datetime-local" required value={form.dateDebut} onChange={(e) => setForm((f) => ({ ...f, dateDebut: e.target.value }))} className="w-full px-3 py-2 border border-border-brand font-body text-[13px] focus:outline-none focus:border-primary-brand" />
                </div>
                <div>
                  <label className="font-body text-xs uppercase tracking-widest text-text-muted-brand block mb-1">Date fin</label>
                  <input type="datetime-local" value={form.dateFin} onChange={(e) => setForm((f) => ({ ...f, dateFin: e.target.value }))} className="w-full px-3 py-2 border border-border-brand font-body text-[13px] focus:outline-none focus:border-primary-brand" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-body text-xs uppercase tracking-widest text-text-muted-brand block mb-1">Lieu</label>
                  <input type="text" value={form.lieu} onChange={(e) => setForm((f) => ({ ...f, lieu: e.target.value }))} className="w-full px-3 py-2 border border-border-brand font-body text-[13px] focus:outline-none focus:border-primary-brand" />
                </div>
                <div>
                  <label className="font-body text-xs uppercase tracking-widest text-text-muted-brand block mb-1">Max participants</label>
                  <input type="number" min="1" value={form.maxParticipants} onChange={(e) => setForm((f) => ({ ...f, maxParticipants: e.target.value }))} className="w-full px-3 py-2 border border-border-brand font-body text-[13px] focus:outline-none focus:border-primary-brand" />
                </div>
              </div>
              <button type="submit" disabled={saving} className="w-full py-2.5 bg-primary-brand text-white font-body text-xs uppercase tracking-widest hover:bg-primary-dark transition-colors disabled:opacity-50">
                {saving ? "Enregistrement…" : editItem ? "Mettre à jour" : "Créer l'événement"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
