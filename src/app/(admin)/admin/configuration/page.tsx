"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Settings, Copy, Check, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useConfirm } from "@/components/ui/confirm-dialog"

interface ConfigItem {
  id: string
  cle: string
  valeur: string
  valeurParsed: unknown
}

const emptyForm = { cle: "", valeur: "" }

export default function AdminConfigPage() {
  const [configs, setConfigs] = useState<ConfigItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState<string | null>(null)
  const confirm = useConfirm()

  const fetchData = async () => {
    setLoading(true)
    const res = await fetch("/api/admin/config")
    const data = await res.json()
    setConfigs(data.configs || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const openNew = () => {
    setEditing(null)
    setForm(emptyForm)
    setError("")
    setModalOpen(true)
  }

  const openEdit = (c: ConfigItem) => {
    setEditing(c.cle)
    setForm({
      cle: c.cle,
      valeur: typeof c.valeurParsed === "string" ? c.valeur : JSON.stringify(c.valeurParsed, null, 2),
    })
    setError("")
    setModalOpen(true)
  }

  const handleCopy = (cle: string) => {
    navigator.clipboard.writeText(cle)
    setCopied(cle)
    setTimeout(() => setCopied(null), 1500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    // Validate JSON
    let valeurToSend: string = form.valeur
    try {
      JSON.parse(form.valeur)
    } catch {
      // If not valid JSON, store as-is (simple string)
      valeurToSend = form.valeur
    }

    if (editing) {
      const res = await fetch(`/api/admin/config/${encodeURIComponent(editing)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valeur: valeurToSend }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Erreur")
        setSaving(false)
        return
      }
    } else {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cle: form.cle, valeur: valeurToSend }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Erreur")
        setSaving(false)
        return
      }
    }

    setModalOpen(false)
    fetchData()
    setSaving(false)
  }

  const handleDelete = async (cle: string) => {
    const ok = await confirm({
      title: "Supprimer la configuration",
      description: `Supprimer la clé "${cle}" ? Cette action est irréversible.`,
      confirmLabel: "Supprimer",
      variant: "danger",
    })
    if (!ok) return
    await fetch(`/api/admin/config/${encodeURIComponent(cle)}`, { method: "DELETE" })
    fetchData()
  }

  const formatPreview = (c: ConfigItem) => {
    if (typeof c.valeurParsed === "string") return c.valeurParsed
    if (typeof c.valeurParsed === "object" && c.valeurParsed !== null) {
      const str = JSON.stringify(c.valeurParsed)
      return str.length > 80 ? str.slice(0, 80) + "…" : str
    }
    return String(c.valeur)
  }

  return (
    <div className="space-y-6">
      {/* Warning banner */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-body text-sm font-semibold text-amber-800">Zone technique — à manipuler avec précaution</p>
          <p className="font-body text-xs text-amber-700 mt-0.5">
            Ces clés pilotent le comportement de l&apos;application. Une valeur incorrecte peut provoquer des erreurs.
            Modifiez uniquement les clés que vous connaissez.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="font-body text-sm text-gray-500">{configs.length} configuration(s)</p>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-primary-brand text-white text-sm font-body hover:bg-primary-dark transition-colors">
          <Plus className="h-4 w-4" /> Nouvelle clé
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="h-6 w-6 border-4 border-primary-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : configs.length === 0 ? (
        <p className="text-center text-gray-500 py-8 font-body">Aucune configuration</p>
      ) : (
        <div className="space-y-2">
          {configs.map((c) => (
            <div key={c.id} className="bg-white border border-border-brand p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-gold shrink-0" />
                    <code className="text-sm font-mono text-primary-brand font-semibold">{c.cle}</code>
                    <button onClick={() => handleCopy(c.cle)} className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors">
                      {copied === c.cle ? <Check className="h-3 w-3 text-primary-brand" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 font-mono mt-1 pl-6 break-all">{formatPreview(c)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => openEdit(c)} className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(c.cle)} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
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
              {editing ? `Modifier : ${editing}` : "Nouvelle configuration"}
            </h3>
            {error && <p className="text-sm text-red-600 mb-3 font-body">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editing && (
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 font-body mb-1">Clé</label>
                  <input required value={form.cle} onChange={(e) => setForm({ ...form, cle: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary-brand" placeholder="ex: bandeau_promo" />
                </div>
              )}
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 font-body mb-1">Valeur (JSON ou texte)</label>
                <textarea
                  required
                  rows={10}
                  value={form.valeur}
                  onChange={(e) => setForm({ ...form, valeur: e.target.value })}
                  className="w-full border border-border-brand px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary-brand"
                  placeholder='{"actif": true, "code": "BIENVENUE10"}'
                />
                <p className="text-xs text-gray-400 font-body mt-1">Entrez du JSON valide ou du texte simple</p>
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
