"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Loader2, ChevronLeft, ChevronRight, Stethoscope, Edit, X, Save } from "lucide-react"

interface ProfilDetail {
  id: string
  specialite: string | null
  numeroOrdre: string | null
  joursDisponibilite: string[]
  horairesDisponibilite: string | null
  languesConsultation: string[]
}

interface UserPro {
  id: string
  nom: string
  prenom: string
  email: string
  photoUrl: string | null
  role: string
  profilDetail: ProfilDetail | null
}

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]

function Avatar({ user, size = 32 }: { user: { prenom: string; nom: string; photoUrl: string | null }; size?: number }) {
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

export default function PageAdminProfessionnels() {
  const [users, setUsers] = useState<UserPro[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<UserPro | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    specialite: "",
    numeroOrdre: "",
    joursDisponibilite: [] as string[],
    horairesDisponibilite: "",
    languesConsultation: [] as string[],
    langueInput: "",
  })

  const limit = 20

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (search) params.set("search", search)
      const res = await fetch(`/api/admin/professionnels?${params}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
        setTotal(data.total)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [page, search])

  useEffect(() => { fetchData() }, [fetchData])

  function openEdit(u: UserPro) {
    setEditing(u)
    const p = u.profilDetail
    setForm({
      specialite: p?.specialite || "",
      numeroOrdre: p?.numeroOrdre || "",
      joursDisponibilite: p?.joursDisponibilite || [],
      horairesDisponibilite: p?.horairesDisponibilite || "",
      languesConsultation: p?.languesConsultation || [],
      langueInput: "",
    })
  }

  async function handleSave() {
    if (!editing) return
    setSaving(true)
    try {
      const res = await fetch("/api/admin/professionnels", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editing.id,
          specialite: form.specialite || undefined,
          numeroOrdre: form.numeroOrdre || undefined,
          joursDisponibilite: form.joursDisponibilite,
          horairesDisponibilite: form.horairesDisponibilite || undefined,
          languesConsultation: form.languesConsultation,
        }),
      })
      if (res.ok) {
        setEditing(null)
        fetchData()
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  function toggleJour(j: string) {
    setForm((f) => ({
      ...f,
      joursDisponibilite: f.joursDisponibilite.includes(j)
        ? f.joursDisponibilite.filter((d) => d !== j)
        : [...f.joursDisponibilite, j],
    }))
  }

  function addLangue() {
    const l = form.langueInput.trim()
    if (l && !form.languesConsultation.includes(l)) {
      setForm((f) => ({ ...f, languesConsultation: [...f.languesConsultation, l], langueInput: "" }))
    }
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
            placeholder="Rechercher un professionnel…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-3 py-2 border border-border-brand font-body text-[13px] bg-white focus:outline-none focus:border-primary-brand"
          />
        </div>
        <span className="ml-auto font-body text-[12px] text-text-muted-brand">{total} professionnel{total > 1 ? "s" : ""}</span>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex items-center justify-center min-h-100">
          <Loader2 className="h-8 w-8 animate-spin text-primary-brand" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((u) => {
            const p = u.profilDetail
            return (
              <div key={u.id} className="bg-white border border-border-brand p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar user={u} />
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-[14px] font-medium text-text-main truncate">{u.prenom} {u.nom}</p>
                    <p className="font-body text-[11px] text-text-muted-brand">{u.role}</p>
                  </div>
                  <button onClick={() => openEdit(u)} className="p-1.5 text-text-muted-brand hover:text-primary-brand transition-colors">
                    <Edit size={16} />
                  </button>
                </div>

                {p?.specialite && (
                  <p className="font-body text-[12px] text-text-mid"><Stethoscope size={12} className="inline mr-1" /> {p.specialite}</p>
                )}
                {p?.joursDisponibilite && p.joursDisponibilite.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {p.joursDisponibilite.map((j) => (
                      <span key={j} className="px-1.5 py-0.5 font-body text-[10px] uppercase tracking-widest bg-primary-light text-primary-brand">{j.slice(0, 3)}</span>
                    ))}
                  </div>
                )}
                {p?.horairesDisponibilite && (
                  <p className="font-body text-[11px] text-text-muted-brand">Horaires : {p.horairesDisponibilite}</p>
                )}
                {p?.languesConsultation && p.languesConsultation.length > 0 && (
                  <p className="font-body text-[11px] text-text-muted-brand">Langues : {p.languesConsultation.join(", ")}</p>
                )}
                {!p && (
                  <p className="font-body text-[11px] text-text-muted-brand italic">Profil professionnel non renseigné</p>
                )}
              </div>
            )
          })}
          {users.length === 0 && (
            <p className="col-span-full text-center font-body text-[13px] text-text-muted-brand py-8">Aucun professionnel trouvé</p>
          )}
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

      {/* Modal édition */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-white border border-border-brand w-full max-w-lg p-6 space-y-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-[18px] font-light text-text-main">
                Profil — {editing.prenom} {editing.nom}
              </h3>
              <button onClick={() => setEditing(null)} className="text-text-muted-brand hover:text-text-mid"><X size={20} /></button>
            </div>

            <div>
              <label className="font-body text-[11px] uppercase tracking-widest text-text-muted-brand">Spécialité</label>
              <input
                type="text"
                value={form.specialite}
                onChange={(e) => setForm({ ...form, specialite: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-border-brand font-body text-[13px] focus:outline-none focus:border-primary-brand"
                placeholder="Ex: Sage-femme, Naturopathe…"
              />
            </div>

            <div>
              <label className="font-body text-[11px] uppercase tracking-widest text-text-muted-brand">N° Ordre</label>
              <input
                type="text"
                value={form.numeroOrdre}
                onChange={(e) => setForm({ ...form, numeroOrdre: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-border-brand font-body text-[13px] focus:outline-none focus:border-primary-brand"
              />
            </div>

            <div>
              <label className="font-body text-[11px] uppercase tracking-widest text-text-muted-brand">Jours de disponibilité</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {JOURS.map((j) => (
                  <button
                    key={j}
                    type="button"
                    onClick={() => toggleJour(j)}
                    className={`px-2 py-1 font-body text-[11px] border transition-colors ${
                      form.joursDisponibilite.includes(j)
                        ? "border-primary-brand bg-primary-light text-primary-brand"
                        : "border-border-brand text-text-muted-brand hover:text-text-mid"
                    }`}
                  >
                    {j}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-body text-[11px] uppercase tracking-widest text-text-muted-brand">Horaires</label>
              <input
                type="text"
                value={form.horairesDisponibilite}
                onChange={(e) => setForm({ ...form, horairesDisponibilite: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-border-brand font-body text-[13px] focus:outline-none focus:border-primary-brand"
                placeholder="Ex: 09:00 - 17:00"
              />
            </div>

            <div>
              <label className="font-body text-[11px] uppercase tracking-widest text-text-muted-brand">Langues de consultation</label>
              <div className="flex flex-wrap gap-1 mt-1">
                {form.languesConsultation.map((l) => (
                  <span key={l} className="inline-flex items-center gap-1 px-2 py-0.5 font-body text-[11px] bg-bg-page text-text-mid border border-border-brand">
                    {l}
                    <button type="button" onClick={() => setForm((f) => ({ ...f, languesConsultation: f.languesConsultation.filter((x) => x !== l) }))} className="text-text-muted-brand hover:text-red-500">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  value={form.langueInput}
                  onChange={(e) => setForm({ ...form, langueInput: e.target.value })}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLangue() } }}
                  className="flex-1 px-3 py-2 border border-border-brand font-body text-[13px] focus:outline-none focus:border-primary-brand"
                  placeholder="Ajouter une langue"
                />
                <button type="button" onClick={addLangue} className="px-3 py-2 border border-border-brand font-body text-[11px] text-text-muted-brand hover:bg-bg-page transition-colors">+</button>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-2 bg-primary-brand text-white font-body text-[11px] uppercase tracking-widest hover:bg-primary-brand/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Enregistrer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
