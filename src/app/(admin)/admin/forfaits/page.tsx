"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Tag } from "lucide-react"
import { formatPrix } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface Soin { id: string; nom: string }
interface Forfait {
  id: string
  nom: string
  description: string
  prixTotal: number
  prixForfait: number
  economie: number
  badge: string | null
  actif: boolean
  ordre: number
  soins: Soin[]
}

const emptyForm = {
  nom: "", description: "", prixTotal: "", prixForfait: "", economie: "", badge: "", ordre: "0", soinIds: [] as string[],
}

export default function AdminForfaitsPage() {
  const [forfaits, setForfaits] = useState<Forfait[]>([])
  const [soinsDisponibles, setSoinsDisponibles] = useState<Soin[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const fetchData = async () => {
    setLoading(true)
    const [fRes, sRes] = await Promise.all([
      fetch("/api/admin/forfaits"),
      fetch("/api/admin/soins"),
    ])
    const fData = await fRes.json()
    const sData = await sRes.json()
    setForfaits(fData.forfaits || [])
    setSoinsDisponibles(sData.soins || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const openNew = () => {
    setEditing(null)
    setForm(emptyForm)
    setError("")
    setModalOpen(true)
  }

  const openEdit = (f: Forfait) => {
    setEditing(f.id)
    setForm({
      nom: f.nom,
      description: f.description,
      prixTotal: String(f.prixTotal),
      prixForfait: String(f.prixForfait),
      economie: String(f.economie),
      badge: f.badge || "",
      ordre: String(f.ordre),
      soinIds: f.soins.map((s) => s.id),
    })
    setError("")
    setModalOpen(true)
  }

  const toggleSoin = (id: string) => {
    setForm((prev) => ({
      ...prev,
      soinIds: prev.soinIds.includes(id)
        ? prev.soinIds.filter((s) => s !== id)
        : [...prev.soinIds, id],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    const body = {
      nom: form.nom,
      description: form.description,
      prixTotal: Number(form.prixTotal),
      prixForfait: Number(form.prixForfait),
      economie: Number(form.economie),
      badge: form.badge || null,
      ordre: Number(form.ordre),
      soinIds: form.soinIds,
    }

    const url = editing ? `/api/admin/forfaits/${editing}` : "/api/admin/forfaits"
    const method = editing ? "PATCH" : "POST"

    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Erreur")
      setSaving(false)
      return
    }

    setModalOpen(false)
    fetchData()
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce forfait ?")) return
    await fetch(`/api/admin/forfaits/${id}`, { method: "DELETE" })
    fetchData()
  }

  const toggleActif = async (f: Forfait) => {
    await fetch(`/api/admin/forfaits/${f.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actif: !f.actif }),
    })
    fetchData()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="font-body text-sm text-gray-500">{forfaits.length} forfait(s)</p>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-primary-brand text-white text-sm font-body hover:bg-primary-dark transition-colors">
          <Plus className="h-4 w-4" /> Nouveau forfait
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="h-6 w-6 border-4 border-primary-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : forfaits.length === 0 ? (
        <p className="text-center text-gray-500 py-8 font-body">Aucun forfait</p>
      ) : (
        <div className="space-y-3">
          {forfaits.map((f) => (
            <div key={f.id} className={cn("bg-white border border-border-brand p-4", !f.actif && "opacity-60")}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-base text-text-main">{f.nom}</h3>
                    {f.badge && (
                      <span className="text-xs uppercase tracking-widest px-2 py-0.5 bg-gold/10 text-gold font-body flex items-center gap-1">
                        <Tag className="h-3 w-3" /> {f.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 font-body mt-1">{f.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm font-body">
                    <span className="text-gray-400 line-through">{formatPrix(f.prixTotal)}</span>
                    <span className="font-semibold text-primary-brand">{formatPrix(f.prixForfait)}</span>
                    <span className="text-gold">-{formatPrix(f.economie)}</span>
                  </div>
                  {f.soins.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {f.soins.map((s) => (
                        <span key={s.id} className="text-xs px-2 py-0.5 bg-primary-brand/10 text-primary-brand font-body">{s.nom}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => openEdit(f)} className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => toggleActif(f)} className={cn("px-2 py-1 text-xs font-medium font-body", f.actif ? "bg-primary-brand/10 text-primary-brand" : "bg-gray-100 text-gray-500")}>
                    {f.actif ? "Actif" : "Inactif"}
                  </button>
                  <button onClick={() => handleDelete(f.id)} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white p-6 w-full max-w-lg mx-4 shadow-xl max-h-[90vh] overflow-y-auto border border-border-brand">
            <h3 className="font-display text-lg text-text-main mb-4">
              {editing ? "Modifier le forfait" : "Nouveau forfait"}
            </h3>
            {error && <p className="text-sm text-red-600 mb-3 font-body">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 font-body mb-1">Nom</label>
                <input required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 font-body mb-1">Description</label>
                <textarea required rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 font-body mb-1">Prix total</label>
                  <input required type="number" min="0" value={form.prixTotal} onChange={(e) => setForm({ ...form, prixTotal: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 font-body mb-1">Prix forfait</label>
                  <input required type="number" min="0" value={form.prixForfait} onChange={(e) => setForm({ ...form, prixForfait: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 font-body mb-1">Économie</label>
                  <input required type="number" min="0" value={form.economie} onChange={(e) => setForm({ ...form, economie: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 font-body mb-1">Badge</label>
                  <input value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" placeholder="Ex: POPULAIRE" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 font-body mb-1">Ordre</label>
                  <input type="number" value={form.ordre} onChange={(e) => setForm({ ...form, ordre: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 font-body mb-2">Soins inclus</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-border-brand p-2">
                  {soinsDisponibles.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 text-sm font-body cursor-pointer">
                      <input type="checkbox" checked={form.soinIds.includes(s.id)} onChange={() => toggleSoin(s.id)} className="accent-primary-brand" />
                      {s.nom}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm border border-border-brand text-gray-500 hover:bg-bg-page font-body transition-colors">Annuler</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-primary-brand text-white hover:bg-primary-dark disabled:opacity-50 font-body transition-colors">
                  {saving ? "Enregistrement…" : editing ? "Modifier" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
