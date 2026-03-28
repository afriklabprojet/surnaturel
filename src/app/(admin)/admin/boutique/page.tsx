"use client"

import { useEffect, useState, useRef } from "react"
import { Plus, Pencil, Trash2, ImageIcon, Upload } from "lucide-react"
import { formatPrix, cn } from "@/lib/utils"
import { useConfirm } from "@/components/ui/confirm-dialog"
import { toast } from "sonner"

interface Produit {
  id: string
  nom: string
  description: string
  descriptionLongue: string | null
  prix: number
  stock: number
  imageUrl: string | null
  categorie: string
  actif: boolean
}

const emptyForm = { nom: "", description: "", descriptionLongue: "", prix: "", stock: "", categorie: "", imageUrl: "", actif: true }

export default function AdminBoutiquePage() {
  const [produits, setProduits] = useState<Produit[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)
  const confirm = useConfirm()

  const fetchProduits = async () => {
    setLoading(true)
    const res = await fetch("/api/admin/produits")
    const data = await res.json()
    setProduits(data.produits)
    setLoading(false)
  }

  useEffect(() => { fetchProduits() }, [])

  const openNew = () => { setEditing(null); setForm(emptyForm); setError(""); setModalOpen(true) }

  const openEdit = (p: Produit) => {
    setEditing(p.id)
    setForm({ nom: p.nom, description: p.description, descriptionLongue: p.descriptionLongue || "", prix: String(p.prix), stock: String(p.stock), categorie: p.categorie, imageUrl: p.imageUrl || "", actif: p.actif })
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
    const body = { nom: form.nom, description: form.description, descriptionLongue: form.descriptionLongue || null, prix: Number(form.prix), stock: Number(form.stock), categorie: form.categorie, imageUrl: form.imageUrl || null, actif: form.actif }
    const url = editing ? `/api/admin/produits/${editing}` : "/api/admin/produits"
    const method = editing ? "PATCH" : "POST"
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    if (!res.ok) { const d = await res.json(); setError(d.error || "Erreur"); setSaving(false); return }
    toast.success(editing ? "Produit mis à jour" : "Produit créé")
    setModalOpen(false); fetchProduits(); setSaving(false)
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: "Supprimer le produit",
      description: "Cette action est irréversible. Le produit sera définitivement supprimé.",
      confirmLabel: "Supprimer",
      variant: "danger",
    })
    if (!confirmed) return
    await fetch(`/api/admin/produits/${id}`, { method: "DELETE" })
    toast.success("Produit supprimé")
    fetchProduits()
  }

  const toggleActif = async (p: Produit) => {
    await fetch(`/api/admin/produits/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actif: !p.actif }),
    })
    fetchProduits()
  }

  const stockBadge = (stock: number) => {
    if (stock === 0) return { cls: "bg-red-100 text-red-700", label: "Rupture" }
    if (stock < 5) return { cls: "bg-gold/10 text-gold", label: `Faible (${stock})` }
    return { cls: "bg-primary-brand/10 text-primary-brand", label: String(stock) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="font-body text-sm text-gray-500">{produits.length} produit(s)</p>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-primary-brand text-white text-sm font-body hover:bg-primary-dark transition-colors">
          <Plus className="h-4 w-4" /> Nouveau produit
        </button>
      </div>

      <div className="bg-white border border-border-brand overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="h-6 w-6 border-4 border-primary-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead className="bg-bg-page">
                <tr>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-widest text-gray-500 font-medium">Produit</th>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-widest text-gray-500 font-medium">Catégorie</th>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-widest text-gray-500 font-medium">Prix</th>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-widest text-gray-500 font-medium">Stock</th>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-widest text-gray-500 font-medium">Statut</th>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-widest text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {produits.map((p) => {
                  const badge = stockBadge(p.stock)
                  return (
                    <tr key={p.id} className={cn("border-t border-border-brand hover:bg-bg-page transition-colors", !p.actif && "opacity-60")}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.nom} className="h-10 w-10 object-cover" />
                          ) : (
                            <div className="h-10 w-10 bg-bg-page flex items-center justify-center"><ImageIcon className="h-5 w-5 text-gold" /></div>
                          )}
                          <span className="font-medium text-text-main">{p.nom}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{p.categorie}</td>
                      <td className="px-4 py-3 text-text-main font-medium">{formatPrix(p.prix)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs font-medium ${badge.cls}`}>{badge.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleActif(p)} className={cn("px-2 py-0.5 text-xs font-medium cursor-pointer", p.actif ? "bg-primary-brand/10 text-primary-brand" : "bg-gray-100 text-gray-500")}>
                          {p.actif ? "Actif" : "Inactif"}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(p)} className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => handleDelete(p.id)} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {produits.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Aucun produit</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white p-6 w-full max-w-lg mx-4 shadow-xl max-h-[90vh] overflow-y-auto border border-border-brand">
            <h3 className="font-display text-lg text-text-main mb-4">{editing ? "Modifier le produit" : "Nouveau produit"}</h3>
            {error && <p className="text-sm text-red-600 mb-3 font-body">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-body mb-1">Nom</label>
                <input required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-body mb-1">Description</label>
                <textarea required rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-body mb-1">Description longue</label>
                <textarea rows={4} value={form.descriptionLongue} onChange={(e) => setForm({ ...form, descriptionLongue: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" placeholder="Description détaillée pour la page produit (optionnel)" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-body mb-1">Prix (FCFA)</label>
                  <input required type="number" min="0" value={form.prix} onChange={(e) => setForm({ ...form, prix: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-body mb-1">Stock</label>
                  <input required type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-body mb-1">Catégorie</label>
                <input required value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" placeholder="Huiles, Crèmes, etc." />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-body mb-1">Image</label>
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
