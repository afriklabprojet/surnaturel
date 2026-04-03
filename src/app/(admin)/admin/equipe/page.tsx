"use client"

import { useEffect, useState, useRef } from "react"
import { Plus, Pencil, Trash2, Upload, UserCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Membre {
  id: string
  nom: string
  role: string
  description: string
  photoUrl: string | null
  actif: boolean
  ordre: number
}

const emptyForm = { nom: "", role: "", description: "", photoUrl: "", ordre: "0" }

export default function AdminEquipePage() {
  const [membres, setMembres] = useState<Membre[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchData = async () => {
    setLoading(true)
    const res = await fetch("/api/admin/equipe")
    const data = await res.json()
    setMembres(data.membres || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const openNew = () => {
    setEditing(null)
    setForm(emptyForm)
    setError("")
    setModalOpen(true)
  }

  const openEdit = (m: Membre) => {
    setEditing(m.id)
    setForm({
      nom: m.nom,
      role: m.role,
      description: m.description,
      photoUrl: m.photoUrl || "",
      ordre: String(m.ordre),
    })
    setError("")
    setModalOpen(true)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/upload", { method: "POST", body: fd })
    if (res.ok) {
      const data = await res.json()
      setForm((f) => ({ ...f, photoUrl: data.url }))
    }
    setUploading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    const body = {
      nom: form.nom,
      role: form.role,
      description: form.description,
      photoUrl: form.photoUrl || null,
      ordre: Number(form.ordre),
    }

    const url = editing ? `/api/admin/equipe/${editing}` : "/api/admin/equipe"
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
    if (!confirm("Supprimer ce membre ?")) return
    await fetch(`/api/admin/equipe/${id}`, { method: "DELETE" })
    fetchData()
  }

  const toggleActif = async (m: Membre) => {
    await fetch(`/api/admin/equipe/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actif: !m.actif }),
    })
    fetchData()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="font-body text-sm text-gray-500">{membres.length} membre(s)</p>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-primary-brand text-white text-sm font-body hover:bg-primary-dark transition-colors">
          <Plus className="h-4 w-4" /> Nouveau membre
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="h-6 w-6 border-4 border-primary-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : membres.length === 0 ? (
        <p className="text-center text-gray-500 py-8 font-body">Aucun membre</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {membres.map((m) => (
            <div key={m.id} className={cn("bg-white border border-border-brand overflow-hidden", !m.actif && "opacity-60")}>
              {m.photoUrl ? (
                <img src={m.photoUrl} alt={m.nom} className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-bg-page flex items-center justify-center">
                  <UserCircle className="h-12 w-12 text-gold" />
                </div>
              )}
              <div className="p-4 space-y-2">
                <h3 className="font-display text-base text-text-main">{m.nom}</h3>
                <span className="text-xs uppercase tracking-widest px-2 py-0.5 bg-gold/10 text-gold font-body inline-block">{m.role}</span>
                <p className="text-sm text-gray-500 line-clamp-2 font-body">{m.description}</p>
                <div className="flex items-center gap-2 pt-2 border-t border-border-brand">
                  <button onClick={() => openEdit(m)} className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => toggleActif(m)} className={cn("px-2 py-1 text-xs font-medium font-body", m.actif ? "bg-primary-brand/10 text-primary-brand" : "bg-gray-100 text-gray-500")}>
                    {m.actif ? "Actif" : "Inactif"}
                  </button>
                  <button onClick={() => handleDelete(m.id)} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 transition-colors ml-auto">
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
              {editing ? "Modifier le membre" : "Nouveau membre"}
            </h3>
            {error && <p className="text-sm text-red-600 mb-3 font-body">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 font-body mb-1">Nom</label>
                <input required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 font-body mb-1">Rôle</label>
                <input required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 font-body mb-1">Description</label>
                <textarea required rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 font-body mb-1">Photo</label>
                <div className="flex items-center gap-2">
                  <input value={form.photoUrl} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} className="flex-1 border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" placeholder="URL Cloudinary…" />
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="px-3 py-2 border border-border-brand text-sm font-body hover:bg-bg-page transition-colors disabled:opacity-50">
                    <Upload className="h-4 w-4" />
                  </button>
                </div>
                {uploading && <p className="text-xs text-gold mt-1 font-body">Téléversement en cours…</p>}
                {form.photoUrl && !uploading && (
                  <div className="mt-2">
                    <img src={form.photoUrl} alt="Aperçu" className="h-24 w-24 object-cover border border-border-brand" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 font-body mb-1">Ordre</label>
                <input type="number" value={form.ordre} onChange={(e) => setForm({ ...form, ordre: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" />
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
