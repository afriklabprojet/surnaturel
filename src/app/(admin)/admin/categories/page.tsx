"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2, Save, Tag, ShoppingBag, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Categorie {
  label: string
  value: string
}

type Section = "soins" | "produits" | "faq"

const sections: { key: Section; label: string; icon: React.ElementType; configKey: string; info: string }[] = [
  { key: "soins", label: "Catégories de soins", icon: Tag, configKey: "categories_soins", info: "Utilisées pour filtrer les soins sur le site et dans l'admin. La valeur « TOUS » est ajoutée automatiquement." },
  { key: "produits", label: "Catégories de produits", icon: ShoppingBag, configKey: "categories_produit", info: "Utilisées pour filtrer les produits dans la boutique." },
  { key: "faq", label: "Catégories de FAQ", icon: HelpCircle, configKey: "categories_faq", info: "Utilisées pour classer les questions fréquentes." },
]

export default function AdminCategoriesPage() {
  const [data, setData] = useState<Record<Section, Categorie[]>>({
    soins: [],
    produits: [],
    faq: [],
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<Section | null>(null)
  const [success, setSuccess] = useState<Section | null>(null)

  const fetchAll = async () => {
    setLoading(true)
    const results = await Promise.all(
      sections.map(async (s) => {
        const res = await fetch(`/api/config/${s.configKey}`)
        if (!res.ok) return { key: s.key, cats: [] }
        const json = await res.json()
        let cats: Categorie[] = []
        try {
          const parsed = typeof json.valeur === "string" ? JSON.parse(json.valeur) : json.valeur
          cats = Array.isArray(parsed) ? parsed.filter((c: Categorie) => c.value !== "TOUS" && c.value !== "all") : []
        } catch { cats = [] }
        return { key: s.key, cats }
      })
    )
    const newData: Record<Section, Categorie[]> = { soins: [], produits: [], faq: [] }
    for (const r of results) newData[r.key] = r.cats
    setData(newData)
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const addCategorie = (section: Section) => {
    setData((prev) => ({
      ...prev,
      [section]: [...prev[section], { label: "", value: "" }],
    }))
  }

  const updateCategorie = (section: Section, index: number, field: "label" | "value", val: string) => {
    setData((prev) => {
      const copy = [...prev[section]]
      copy[index] = { ...copy[index], [field]: val }
      // Auto-generate value from label if value is empty or was auto-generated
      if (field === "label" && (copy[index].value === "" || copy[index].value === autoValue(prev[section][index]?.label || ""))) {
        copy[index].value = autoValue(val)
      }
      return { ...prev, [section]: copy }
    })
  }

  const autoValue = (label: string) =>
    label
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/(^_|_$)+/g, "")

  const removeCategorie = (section: Section, index: number) => {
    setData((prev) => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index),
    }))
  }

  const handleSave = async (section: Section) => {
    const sectionConfig = sections.find((s) => s.key === section)!
    const cats = data[section].filter((c) => c.label.trim() && c.value.trim())

    if (cats.length === 0) return

    setSaving(section)
    setSuccess(null)

    // For soins, prepend "Tous" entry
    let toSave = cats
    if (section === "soins") {
      toSave = [{ label: "Tous", value: "TOUS" }, ...cats]
    }
    if (section === "produits") {
      toSave = [{ value: "all", label: "Tous les produits" }, ...cats]
    }

    const res = await fetch(`/api/admin/config/${encodeURIComponent(sectionConfig.configKey)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ valeur: JSON.stringify(toSave) }),
    })

    setSaving(null)
    if (res.ok) {
      setSuccess(section)
      setTimeout(() => setSuccess(null), 2000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="h-6 w-6 border-4 border-primary-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {sections.map((section) => {
        const Icon = section.icon
        const cats = data[section.key]
        const isSaving = saving === section.key
        const isSuccess = success === section.key

        return (
          <div key={section.key} className="bg-white border border-border-brand p-5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-gold" />
                <h2 className="font-display text-base text-text-main">{section.label}</h2>
                <span className="text-[10px] bg-primary-brand/10 text-primary-brand px-2 py-0.5 font-body">{cats.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => addCategorie(section.key)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border-brand text-gray-600 hover:bg-bg-page font-body transition-colors"
                >
                  <Plus className="h-3 w-3" /> Ajouter
                </button>
                <button
                  onClick={() => handleSave(section.key)}
                  disabled={isSaving}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-body transition-colors",
                    isSuccess
                      ? "bg-primary-brand/10 text-primary-brand"
                      : "bg-primary-brand text-white hover:bg-primary-dark disabled:opacity-50"
                  )}
                >
                  <Save className="h-3 w-3" />
                  {isSaving ? "Enregistrement…" : isSuccess ? "Enregistré ✓" : "Enregistrer"}
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400 font-body mb-4">{section.info}</p>

            {cats.length === 0 ? (
              <p className="text-sm text-gray-400 font-body text-center py-4">Aucune catégorie. Cliquez sur « Ajouter » pour commencer.</p>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_1fr_40px] gap-2 text-[10px] uppercase tracking-widest text-gray-400 font-body px-1">
                  <span>Label (affiché)</span>
                  <span>Valeur (technique)</span>
                  <span />
                </div>
                {cats.map((cat, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_40px] gap-2 items-center">
                    <input
                      value={cat.label}
                      onChange={(e) => updateCategorie(section.key, i, "label", e.target.value)}
                      placeholder="Ex: Hammam"
                      className="border border-border-brand px-3 py-1.5 text-sm font-body focus:outline-none focus:border-primary-brand"
                    />
                    <input
                      value={cat.value}
                      onChange={(e) => updateCategorie(section.key, i, "value", e.target.value)}
                      placeholder="Ex: HAMMAM"
                      className="border border-border-brand px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-primary-brand"
                    />
                    <button
                      onClick={() => removeCategorie(section.key, i)}
                      className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
