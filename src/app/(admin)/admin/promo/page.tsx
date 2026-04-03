"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Trash2, Pencil, Copy, Check, X, Percent, Calendar, Users, Tag, ChevronDown, Gift, ShoppingBag, Star } from "lucide-react"
import { toast } from "sonner"
import { useConfirm } from "@/components/ui/confirm-dialog"
import { formatDate } from "@/lib/utils"

interface CodePromo {
  id: string
  code: string
  description: string | null
  type: "POURCENTAGE" | "MONTANT_FIXE"
  valeur: number
  pourcentage: number | null
  montantMin: number | null
  montantMax: number | null
  usageMax: number | null
  usageActuel: number
  usageParUser: number
  debutValidite: string | null
  finValidite: string | null
  premiereCommande: boolean
  nouveauxClients: boolean
  categoriesProduits: string[]
  produitsExclus: string[]
  cumulable: boolean
  actif: boolean
  createdAt: string
  _count?: { utilisations: number }
}

interface Stats {
  total: number
  actifs: number
  totalUtilisations: number
}

export default function PageAdminPromo() {
  const [codes, setCodes] = useState<CodePromo[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const confirm = useConfirm()

  const [form, setForm] = useState({
    code: "",
    description: "",
    type: "POURCENTAGE" as "POURCENTAGE" | "MONTANT_FIXE",
    valeur: 10,
    montantMin: "",
    montantMax: "",
    usageMax: "",
    usageParUser: "1",
    debutValidite: "",
    finValidite: "",
    premiereCommande: false,
    nouveauxClients: false,
    cumulable: false,
    actif: true,
  })

  const loadCodes = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/promo")
      if (res.ok) {
        const data = await res.json()
        setCodes(data.codesPromo || [])
        setStats(data.stats || null)
      }
    } catch {
      toast.error("Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCodes()
  }, [loadCodes])

  function resetForm() {
    setForm({
      code: "",
      description: "",
      type: "POURCENTAGE",
      valeur: 10,
      montantMin: "",
      montantMax: "",
      usageMax: "",
      usageParUser: "1",
      debutValidite: "",
      finValidite: "",
      premiereCommande: false,
      nouveauxClients: false,
      cumulable: false,
      actif: true,
    })
    setEditingId(null)
    setShowForm(false)
    setShowAdvanced(false)
  }

  function editCode(code: CodePromo) {
    setForm({
      code: code.code,
      description: code.description || "",
      type: code.type || "POURCENTAGE",
      valeur: code.valeur || code.pourcentage || 10,
      montantMin: code.montantMin?.toString() || "",
      montantMax: code.montantMax?.toString() || "",
      usageMax: code.usageMax?.toString() || "",
      usageParUser: code.usageParUser?.toString() || "1",
      debutValidite: code.debutValidite?.slice(0, 16) || "",
      finValidite: code.finValidite?.slice(0, 16) || "",
      premiereCommande: code.premiereCommande || false,
      nouveauxClients: code.nouveauxClients || false,
      cumulable: code.cumulable || false,
      actif: code.actif,
    })
    setEditingId(code.id)
    setShowForm(true)
    if (code.premiereCommande || code.nouveauxClients || code.montantMax || code.cumulable) {
      setShowAdvanced(true)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    const body = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || null,
      type: form.type,
      valeur: form.valeur,
      pourcentage: form.type === "POURCENTAGE" ? form.valeur : undefined,
      montantMin: form.montantMin ? parseFloat(form.montantMin) : null,
      montantMax: form.montantMax ? parseFloat(form.montantMax) : null,
      usageMax: form.usageMax ? parseInt(form.usageMax) : null,
      usageParUser: form.usageParUser ? parseInt(form.usageParUser) : 1,
      debutValidite: form.debutValidite ? new Date(form.debutValidite).toISOString() : null,
      finValidite: form.finValidite ? new Date(form.finValidite).toISOString() : null,
      premiereCommande: form.premiereCommande,
      nouveauxClients: form.nouveauxClients,
      cumulable: form.cumulable,
      actif: form.actif,
    }

    try {
      const url = editingId ? `/api/admin/promo/${editingId}` : "/api/admin/promo"
      const method = editingId ? "PATCH" : "POST"
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast.success(editingId ? "Code modifié" : "Code créé")
        loadCodes()
        resetForm()
      } else {
        const data = await res.json()
        toast.error(data.error || "Erreur")
      }
    } catch {
      toast.error("Erreur réseau")
    }
  }

  async function handleDelete(id: string, code: string) {
    const ok = await confirm({
      title: "Supprimer ce code promo ?",
      description: `Le code "${code}" sera définitivement supprimé.`,
      variant: "danger",
      confirmLabel: "Supprimer",
    })
    if (!ok) return

    try {
      const res = await fetch(`/api/admin/promo/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Code supprimé")
        loadCodes()
      } else {
        toast.error("Erreur lors de la suppression")
      }
    } catch {
      toast.error("Erreur réseau")
    }
  }

  async function handleToggleActif(id: string, actif: boolean) {
    try {
      const res = await fetch(`/api/admin/promo/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actif: !actif }),
      })
      if (res.ok) {
        toast.success(actif ? "Code désactivé" : "Code activé")
        loadCodes()
      }
    } catch {
      toast.error("Erreur")
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  function getStatut(code: CodePromo): { label: string; color: string } {
    const now = new Date()
    if (!code.actif) return { label: "Inactif", color: "text-text-muted-brand" }
    if (code.usageMax && code.usageActuel >= code.usageMax) {
      return { label: "Épuisé", color: "text-red-600" }
    }
    if (code.finValidite && new Date(code.finValidite) < now) {
      return { label: "Expiré", color: "text-orange-600" }
    }
    if (code.debutValidite && new Date(code.debutValidite) > now) {
      return { label: "À venir", color: "text-blue-600" }
    }
    return { label: "Actif", color: "text-primary-brand" }
  }

  function formatReduction(code: CodePromo): string {
    if (code.type === "MONTANT_FIXE") {
      return `${code.valeur.toLocaleString("fr-FR")} F`
    }
    return `${code.valeur}%`
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-brand border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* Stats */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="border border-border-brand bg-white p-4">
            <div className="flex items-center gap-3">
              <Tag className="h-5 w-5 text-primary-brand" />
              <div>
                <p className="font-body text-[24px] font-medium">{stats.total}</p>
                <p className="text-[12px] text-text-muted-brand">Codes promo</p>
              </div>
            </div>
          </div>
          <div className="border border-border-brand bg-white p-4">
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-body text-[24px] font-medium">{stats.actifs}</p>
                <p className="text-[12px] text-text-muted-brand">Actifs</p>
              </div>
            </div>
          </div>
          <div className="border border-border-brand bg-white p-4">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-5 w-5 text-gold" />
              <div>
                <p className="font-body text-[24px] font-medium">{stats.totalUtilisations}</p>
                <p className="text-[12px] text-text-muted-brand">Utilisations totales</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-[28px] font-light text-text-main">
            Codes Promo
          </h1>
          <p className="mt-1 font-body text-[14px] text-text-mid">
            Gérez vos campagnes promotionnelles
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 bg-primary-brand px-5 py-3 font-body text-xs uppercase tracking-[0.15em] text-white transition-colors hover:bg-primary-dark"
        >
          <Plus size={16} />
          Nouveau code
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="border border-border-brand bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-[20px] font-light">
              {editingId ? "Modifier le code" : "Créer un code promo"}
            </h2>
            <button onClick={resetForm} className="p-2 text-text-muted-brand hover:text-text-main">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block font-body text-[13px] text-text-mid">
                  Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="ex: NOEL2026"
                  disabled={!!editingId}
                  className="w-full border border-border-brand px-4 py-3 font-body text-[14px] uppercase focus:border-primary-brand focus:outline-none disabled:bg-gray-100"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block font-body text-[13px] text-text-mid">
                  Type de réduction
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as "POURCENTAGE" | "MONTANT_FIXE" })}
                  className="w-full border border-border-brand px-4 py-3 font-body text-[14px] focus:border-primary-brand focus:outline-none"
                >
                  <option value="POURCENTAGE">Pourcentage (%)</option>
                  <option value="MONTANT_FIXE">Montant fixe (F CFA)</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block font-body text-[13px] text-text-mid">
                  Valeur de réduction <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={form.valeur}
                    onChange={(e) => setForm({ ...form, valeur: parseInt(e.target.value) || 0 })}
                    min="1"
                    max={form.type === "POURCENTAGE" ? 100 : undefined}
                    className="w-full border border-border-brand px-4 py-3 pr-16 font-body text-[14px] focus:border-primary-brand focus:outline-none"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted-brand">
                    {form.type === "POURCENTAGE" ? "%" : "F CFA"}
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-2 block font-body text-[13px] text-text-mid">
                  Montant minimum panier
                </label>
                <input
                  type="number"
                  value={form.montantMin}
                  onChange={(e) => setForm({ ...form, montantMin: e.target.value })}
                  placeholder="Optionnel"
                  min="0"
                  className="w-full border border-border-brand px-4 py-3 font-body text-[14px] focus:border-primary-brand focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block font-body text-[13px] text-text-mid">
                  Description
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="ex: Offre spéciale fêtes de fin d'année"
                  className="w-full border border-border-brand px-4 py-3 font-body text-[14px] focus:border-primary-brand focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block font-body text-[13px] text-text-mid">
                  Utilisations max. (total)
                </label>
                <input
                  type="number"
                  value={form.usageMax}
                  onChange={(e) => setForm({ ...form, usageMax: e.target.value })}
                  placeholder="Illimité si vide"
                  min="1"
                  className="w-full border border-border-brand px-4 py-3 font-body text-[14px] focus:border-primary-brand focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block font-body text-[13px] text-text-mid">
                  Utilisations par client
                </label>
                <input
                  type="number"
                  value={form.usageParUser}
                  onChange={(e) => setForm({ ...form, usageParUser: e.target.value })}
                  placeholder="1"
                  min="1"
                  className="w-full border border-border-brand px-4 py-3 font-body text-[14px] focus:border-primary-brand focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block font-body text-[13px] text-text-mid">
                  Début de validité
                </label>
                <input
                  type="datetime-local"
                  value={form.debutValidite}
                  onChange={(e) => setForm({ ...form, debutValidite: e.target.value })}
                  className="w-full border border-border-brand px-4 py-3 font-body text-[14px] focus:border-primary-brand focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block font-body text-[13px] text-text-mid">
                  Fin de validité
                </label>
                <input
                  type="datetime-local"
                  value={form.finValidite}
                  onChange={(e) => setForm({ ...form, finValidite: e.target.value })}
                  className="w-full border border-border-brand px-4 py-3 font-body text-[14px] focus:border-primary-brand focus:outline-none"
                />
              </div>
            </div>

            {/* Options avancées */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-[13px] text-primary-brand"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
              Options avancées
            </button>

            {showAdvanced && (
              <div className="grid gap-6 border-t border-border-brand pt-6 sm:grid-cols-2">
                {form.type === "POURCENTAGE" && (
                  <div>
                    <label className="mb-2 block font-body text-[13px] text-text-mid">
                      Réduction max. (plafond)
                    </label>
                    <input
                      type="number"
                      value={form.montantMax}
                      onChange={(e) => setForm({ ...form, montantMax: e.target.value })}
                      placeholder="ex: 5000 F CFA max"
                      min="0"
                      className="w-full border border-border-brand px-4 py-3 font-body text-[14px] focus:border-primary-brand focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-text-muted-brand">
                      Limite la réduction même si le % donnerait plus
                    </p>
                  </div>
                )}

                <div className="space-y-3 sm:col-span-2">
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={form.premiereCommande}
                      onChange={(e) => setForm({ ...form, premiereCommande: e.target.checked })}
                      className="h-5 w-5 accent-primary-brand"
                    />
                    <div>
                      <span className="font-body text-[14px] text-text-main flex items-center gap-2">
                        <Gift size={16} className="text-gold" />
                        Première commande uniquement
                      </span>
                      <p className="text-xs text-text-muted-brand">
                        Valide uniquement pour les clients n'ayant jamais commandé
                      </p>
                    </div>
                  </label>

                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={form.nouveauxClients}
                      onChange={(e) => setForm({ ...form, nouveauxClients: e.target.checked })}
                      className="h-5 w-5 accent-primary-brand"
                    />
                    <div>
                      <span className="font-body text-[14px] text-text-main flex items-center gap-2">
                        <Star size={16} className="text-gold" />
                        Nouveaux clients (&lt; 30 jours)
                      </span>
                      <p className="text-xs text-text-muted-brand">
                        Réservé aux clients inscrits depuis moins de 30 jours
                      </p>
                    </div>
                  </label>

                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={form.cumulable}
                      onChange={(e) => setForm({ ...form, cumulable: e.target.checked })}
                      className="h-5 w-5 accent-primary-brand"
                    />
                    <div>
                      <span className="font-body text-[14px] text-text-main">
                        Cumulable avec d'autres codes
                      </span>
                      <p className="text-xs text-text-muted-brand">
                        Peut être combiné avec d'autres codes promo
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 border-t border-border-brand pt-6">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.actif}
                  onChange={(e) => setForm({ ...form, actif: e.target.checked })}
                  className="h-5 w-5 accent-primary-brand"
                />
                <span className="font-body text-[14px] text-text-main">
                  Code actif
                </span>
              </label>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-primary-brand px-6 py-3 font-body text-xs uppercase tracking-[0.15em] text-white transition-colors hover:bg-primary-dark"
              >
                {editingId ? "Modifier" : "Créer"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="border border-border-brand px-6 py-3 font-body text-xs uppercase tracking-[0.15em] text-text-mid transition-colors hover:bg-gray-50"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des codes */}
      {codes.length === 0 ? (
        <div className="border border-dashed border-border-brand bg-white p-12 text-center">
          <Tag size={40} className="mx-auto text-text-muted-brand" />
          <p className="mt-4 font-body text-[14px] text-text-mid">
            Aucun code promo créé
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-primary-brand underline"
          >
            Créer votre premier code
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {codes.map((code) => {
              const statut = getStatut(code)
              return (
                <div key={code.id} className="border border-border-brand bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium text-primary-brand">{code.code}</span>
                      <button onClick={() => copyCode(code.code)} className="text-text-muted-brand">
                        {copiedCode === code.code ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <button
                      onClick={() => handleToggleActif(code.id, code.actif)}
                      className={`text-xs font-medium ${statut.color}`}
                    >
                      {statut.label}
                    </button>
                  </div>
                  {code.description && (
                    <p className="mt-1 text-xs text-text-muted-brand">{code.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-4">
                    <span className="inline-flex items-center gap-1 font-medium text-gold">
                      {code.type === "MONTANT_FIXE" ? formatReduction(code) : <><Percent size={14} />{code.valeur || code.pourcentage}%</>}
                    </span>
                    {code.usageMax && (
                      <span className="flex items-center gap-1 text-xs text-text-mid"><Users size={12} />{code.usageActuel}/{code.usageMax}</span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {code.premiereCommande && <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700"><Gift size={10} />1ère</span>}
                    {code.nouveauxClients && <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700"><Star size={10} />Nouveaux</span>}
                    {code.cumulable && <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">Cumulable</span>}
                  </div>
                  <div className="mt-3 flex items-center gap-2 border-t border-border-brand pt-3">
                    <button onClick={() => editCode(code)} className="flex-1 py-2 text-xs font-medium uppercase tracking-widest bg-primary-brand text-white">Modifier</button>
                    <button onClick={() => handleDelete(code.id, code.code)} className="p-2 text-red-600 hover:bg-red-50"><Trash2 size={16} /></button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border-brand">
                <th className="p-4 text-left font-body text-xs uppercase tracking-wider text-text-muted-brand">
                  Code
                </th>
                <th className="p-4 text-left font-body text-xs uppercase tracking-wider text-text-muted-brand">
                  Réduction
                </th>
                <th className="hidden p-4 text-left font-body text-xs uppercase tracking-wider text-text-muted-brand md:table-cell">
                  Conditions
                </th>
                <th className="hidden p-4 text-left font-body text-xs uppercase tracking-wider text-text-muted-brand lg:table-cell">
                  Validité
                </th>
                <th className="p-4 text-left font-body text-xs uppercase tracking-wider text-text-muted-brand">
                  Statut
                </th>
                <th className="p-4 text-right font-body text-xs uppercase tracking-wider text-text-muted-brand">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {codes.map((code) => {
                const statut = getStatut(code)
                return (
                  <tr key={code.id} className="border-b border-border-brand hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-primary-brand">
                          {code.code}
                        </span>
                        <button
                          onClick={() => copyCode(code.code)}
                          className="text-text-muted-brand hover:text-text-main"
                          title="Copier"
                        >
                          {copiedCode === code.code ? (
                            <Check size={14} className="text-green-600" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                      {code.description && (
                        <p className="mt-1 text-[12px] text-text-muted-brand">
                          {code.description}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 font-medium text-gold">
                        {code.type === "MONTANT_FIXE" ? (
                          <>{formatReduction(code)}</>
                        ) : (
                          <>
                            <Percent size={14} />
                            {code.valeur || code.pourcentage}%
                          </>
                        )}
                      </span>
                      {code.montantMax && code.type === "POURCENTAGE" && (
                        <p className="text-xs text-text-muted-brand">
                          max {code.montantMax.toLocaleString("fr-FR")} F
                        </p>
                      )}
                    </td>
                    <td className="hidden p-4 md:table-cell">
                      <div className="space-y-1 text-[13px] text-text-mid">
                        {code.montantMin && (
                          <div>Min. {code.montantMin.toLocaleString("fr-FR")} F</div>
                        )}
                        {code.usageMax && (
                          <div className="flex items-center gap-1">
                            <Users size={12} />
                            {code.usageActuel}/{code.usageMax}
                          </div>
                        )}
                        {code.usageParUser > 1 && (
                          <div className="text-xs">{code.usageParUser}x/client</div>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {code.premiereCommande && (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                            <Gift size={10} /> 1ère commande
                          </span>
                        )}
                        {code.nouveauxClients && (
                          <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                            <Star size={10} /> Nouveaux
                          </span>
                        )}
                        {code.cumulable && (
                          <span className="inline-flex rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">
                            Cumulable
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="hidden p-4 lg:table-cell">
                      <div className="space-y-1 text-[12px] text-text-mid">
                        {code.debutValidite && (
                          <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            Du {formatDate(new Date(code.debutValidite))}
                          </div>
                        )}
                        {code.finValidite && (
                          <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            Au {formatDate(new Date(code.finValidite))}
                          </div>
                        )}
                        {!code.debutValidite && !code.finValidite && (
                          <span className="text-text-muted-brand">Illimité</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleActif(code.id, code.actif)}
                        className={`font-body text-[12px] font-medium ${statut.color}`}
                      >
                        {statut.label}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => editCode(code)}
                          className="p-2 text-text-muted-brand transition-colors hover:text-primary-brand"
                          title="Modifier"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(code.id, code.code)}
                          className="p-2 text-text-muted-brand transition-colors hover:text-red-600"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </>
      )}

      {/* Stats */}
      {codes.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="border border-border-brand bg-white p-4">
            <p className="font-body text-xs uppercase tracking-wider text-text-muted-brand">
              Codes actifs
            </p>
            <p className="mt-2 font-display text-[28px] text-primary-brand">
              {codes.filter((c) => c.actif).length}
            </p>
          </div>
          <div className="border border-border-brand bg-white p-4">
            <p className="font-body text-xs uppercase tracking-wider text-text-muted-brand">
              Utilisations totales
            </p>
            <p className="mt-2 font-display text-[28px] text-gold">
              {codes.reduce((acc, c) => acc + c.usageActuel, 0)}
            </p>
          </div>
          <div className="border border-border-brand bg-white p-4">
            <p className="font-body text-xs uppercase tracking-wider text-text-muted-brand">
              Réduction moyenne
            </p>
            <p className="mt-2 font-display text-[28px] text-text-main">
              {Math.round(codes.filter(c => c.type === "POURCENTAGE").reduce((acc, c) => acc + (c.valeur || c.pourcentage || 0), 0) / (codes.filter(c => c.type === "POURCENTAGE").length || 1))}%
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
