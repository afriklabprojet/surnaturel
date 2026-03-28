"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface FaqItem {
  id: string
  question: string
  reponse: string
  categorie: string
  actif: boolean
  ordre: number
}

interface CatItem {
  label: string
  value: string
}

const emptyForm = { question: "", reponse: "", categorie: "", ordre: "0" }

export default function AdminFaqPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>([])
  const [categories, setCategories] = useState<CatItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [filtre, setFiltre] = useState("")

  const fetchData = async () => {
    setLoading(true)
    const [faqRes, catRes] = await Promise.all([
      fetch("/api/admin/faq"),
      fetch("/api/config/categories_faq"),
    ])
    const faqData = await faqRes.json()
    setFaqs(faqData.faqs || [])
    if (catRes.ok) {
      const catData = await catRes.json()
      try {
        const parsed = typeof catData.valeur === "string" ? JSON.parse(catData.valeur) : catData.valeur
        if (Array.isArray(parsed)) setCategories(parsed)
      } catch { /* keep empty */ }
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const getCategorieLabel = (value: string) => {
    const cat = categories.find((c) => c.value === value)
    return cat?.label || value
  }

  const openNew = () => {
    setEditing(null)
    setForm(emptyForm)
    setError("")
    setModalOpen(true)
  }

  const openEdit = (f: FaqItem) => {
    setEditing(f.id)
    setForm({
      question: f.question,
      reponse: f.reponse,
      categorie: f.categorie,
      ordre: String(f.ordre),
    })
    setError("")
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    const body = {
      question: form.question,
      reponse: form.reponse,
      categorie: form.categorie,
      ordre: Number(form.ordre),
    }

    const url = editing ? `/api/admin/faq/${editing}` : "/api/admin/faq"
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
    if (!confirm("Supprimer cette FAQ ?")) return
    await fetch(`/api/admin/faq/${id}`, { method: "DELETE" })
    fetchData()
  }

  const toggleActif = async (f: FaqItem) => {
    await fetch(`/api/admin/faq/${f.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actif: !f.actif }),
    })
    fetchData()
  }

  const filtered = filtre ? faqs.filter((f) => f.categorie === filtre) : faqs

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <p className="font-body text-sm text-gray-500">{faqs.length} FAQ</p>
          <select
            value={filtre}
            onChange={(e) => setFiltre(e.target.value)}
            className="text-sm border border-border-brand px-2 py-1 font-body focus:outline-none focus:border-primary-brand"
          >
            <option value="">Toutes les catégories</option>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-primary-brand text-white text-sm font-body hover:bg-primary-dark transition-colors">
          <Plus className="h-4 w-4" /> Nouvelle FAQ
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="h-6 w-6 border-4 border-primary-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-500 py-8 font-body">Aucune FAQ</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((f) => (
            <div key={f.id} className={cn("bg-white border border-border-brand p-4", !f.actif && "opacity-60")}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-gold shrink-0" />
                    <h3 className="font-display text-sm text-text-main">{f.question}</h3>
                  </div>
                  <p className="text-sm text-gray-500 font-body mt-1 pl-6">{f.reponse}</p>
                  <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 bg-primary-brand/10 text-primary-brand font-body mt-2 inline-block ml-6">
                    {getCategorieLabel(f.categorie)}
                  </span>
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
              {editing ? "Modifier la FAQ" : "Nouvelle FAQ"}
            </h3>
            {error && <p className="text-sm text-red-600 mb-3 font-body">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-body mb-1">Question</label>
                <input required value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-body mb-1">Réponse</label>
                <textarea required rows={4} value={form.reponse} onChange={(e) => setForm({ ...form, reponse: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-body mb-1">Catégorie</label>
                  <select required value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand">
                    <option value="">Sélectionner…</option>
                    {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-body mb-1">Ordre</label>
                  <input type="number" value={form.ordre} onChange={(e) => setForm({ ...form, ordre: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" />
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
