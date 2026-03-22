"use client"

import { useEffect, useState, useRef } from "react"
import { Plus, Pencil, Trash2, ImageIcon, Upload } from "lucide-react"
import { formatPrix } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface Soin {
  id: string
  nom: string
  description: string
  prix: number
  duree: number
  categorie: string
  imageUrl: string | null
  actif: boolean
}

const categories = [
  "HAMMAM", "GOMMAGE", "AMINCISSANT", "VISAGE",
  "POST_ACCOUCHEMENT", "CONSEIL_ESTHETIQUE", "SAGE_FEMME",
]

const categorieLabels: Record<string, string> = {
  HAMMAM: "Hammam",
  GOMMAGE: "Gommage",
  AMINCISSANT: "Amincissant",
  VISAGE: "Visage",
  POST_ACCOUCHEMENT: "Post-accouchement",
  CONSEIL_ESTHETIQUE: "Conseil esthétique",
  SAGE_FEMME: "Sage-femme",
}

const emptyForm = {
  nom: "", description: "", prix: "", duree: "", categorie: "HAMMAM", imageUrl: "",
}

export default function AdminSoinsPage() {
  const [soins, setSoins] = useState<Soin[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchSoins = async () => {
    setLoading(true)
    const res = await fetch("/api/admin/soins")
    const data = await res.json()
    setSoins(data.soins)
    setLoading(false)
  }

  useEffect(() => { fetchSoins() }, [])

  const openNew = () => {
    setEditing(null)
    setForm(emptyForm)
    setError("")
    setModalOpen(true)
  }

  const openEdit = (soin: Soin) => {
    setEditing(soin.id)
    setForm({
      nom: soin.nom,
      description: soin.description,
      prix: String(soin.prix),
      duree: String(soin.duree),
      categorie: soin.categorie,
      imageUrl: soin.imageUrl || "",
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
      setForm((f) => ({ ...f, imageUrl: data.url }))
    }
    setUploading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    const body = {
      nom: form.nom,
      description: form.description,
      prix: Number(form.prix),
      duree: Number(form.duree),
      categorie: form.categorie,
      imageUrl: form.imageUrl || null,
    }

    const url = editing ? `/api/admin/soins/${editing}` : "/api/admin/soins"
    const method = editing ? "PATCH" : "POST"

    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Erreur")
      setSaving(false)
      return
    }

    setModalOpen(false)
    fetchSoins()
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce soin ?")) return
    await fetch(`/api/admin/soins/${id}`, { method: "DELETE" })
    fetchSoins()
  }

  const toggleActif = async (soin: Soin) => {
    await fetch(`/api/admin/soins/${soin.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actif: !soin.actif }),
    })
    fetchSoins()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="font-body text-sm text-gray-500">{soins.length} soin(s)</p>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-primary-brand text-white text-sm font-body hover:bg-primary-dark transition-colors">
          <Plus className="h-4 w-4" /> Nouveau soin
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex items-center justify-center h-32">
            <div className="h-6 w-6 border-4 border-primary-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : soins.length === 0 ? (
          <p className="col-span-full text-center text-gray-500 py-8 font-body">Aucun soin</p>
        ) : (
          soins.map((soin) => (
            <div key={soin.id} className={cn("bg-white border border-border-brand overflow-hidden", !soin.actif && "opacity-60")}>
              {soin.imageUrl ? (
                <img src={soin.imageUrl} alt={soin.nom} className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-bg-page flex items-center justify-center">
                  <ImageIcon className="h-10 w-10 text-gold" />
                </div>
              )}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base text-text-main">{soin.nom}</h3>
                  <span className="text-[10px] uppercase tracking-[0.1em] px-2 py-0.5 bg-primary-brand/10 text-primary-brand font-body">
                    {categorieLabels[soin.categorie] || soin.categorie}
                  </span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 font-body">{soin.description}</p>
                <div className="flex items-center justify-between text-sm font-body">
                  <span className="font-semibold text-primary-brand">{formatPrix(soin.prix)}</span>
                  <span className="text-gray-500">{soin.duree} min</span>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-border-brand">
                  <button onClick={() => openEdit(soin)} className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => toggleActif(soin)} className={cn("px-2 py-1 text-xs font-medium font-body", soin.actif ? "bg-primary-brand/10 text-primary-brand" : "bg-gray-100 text-gray-500")}>
                    {soin.actif ? "Actif" : "Inactif"}
                  </button>
                  <button onClick={() => handleDelete(soin.id)} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 transition-colors ml-auto">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white p-6 w-full max-w-lg mx-4 shadow-xl max-h-[90vh] overflow-y-auto border border-border-brand">
            <h3 className="font-display text-lg text-text-main mb-4">
              {editing ? "Modifier le soin" : "Nouveau soin"}
            </h3>
            {error && <p className="text-sm text-red-600 mb-3 font-body">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-[0.1em] text-gray-500 font-body mb-1">Nom</label>
                <input required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-[0.1em] text-gray-500 font-body mb-1">Description</label>
                <textarea required rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.1em] text-gray-500 font-body mb-1">Prix (FCFA)</label>
                  <input required type="number" min="0" value={form.prix} onChange={(e) => setForm({ ...form, prix: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.1em] text-gray-500 font-body mb-1">Durée (min)</label>
                  <input required type="number" min="1" value={form.duree} onChange={(e) => setForm({ ...form, duree: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-[0.1em] text-gray-500 font-body mb-1">Catégorie</label>
                <select required value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand">
                  {categories.map((c) => <option key={c} value={c}>{categorieLabels[c]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-[0.1em] text-gray-500 font-body mb-1">Image</label>
                <div className="flex items-center gap-2">
                  <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="flex-1 border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" placeholder="URL Cloudinary…" />
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="px-3 py-2 border border-border-brand text-sm font-body hover:bg-bg-page transition-colors disabled:opacity-50">
                    <Upload className="h-4 w-4" />
                  </button>
                </div>
                {uploading && <p className="text-xs text-gold mt-1 font-body">Téléversement en cours…</p>}
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
