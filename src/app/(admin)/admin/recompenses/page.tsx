"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Trash2, Pencil, Gift, Star, Package, Percent, Sparkles, X } from "lucide-react"
import { toast } from "sonner"
import { useConfirm } from "@/components/ui/confirm-dialog"

interface Recompense {
  id: string
  nom: string
  description: string
  pointsRequis: number
  type: "REDUCTION" | "SOIN_GRATUIT" | "PRODUIT" | "EXPERIENCE" | "AUTRE"
  valeur: number | null
  imageUrl: string | null
  stock: number | null
  actif: boolean
  createdAt: string
  _count?: { echanges: number }
}

interface Stats {
  totalRecompenses: number
  actives: number
  totalEchanges: number
  pointsDepenses: number
}

const TYPE_LABELS: Record<string, { label: string; icon: typeof Gift }> = {
  REDUCTION: { label: "Réduction", icon: Percent },
  SOIN_GRATUIT: { label: "Soin gratuit", icon: Sparkles },
  PRODUIT: { label: "Produit", icon: Package },
  EXPERIENCE: { label: "Expérience", icon: Star },
  AUTRE: { label: "Autre", icon: Gift },
}

export default function PageAdminRecompenses() {
  const [recompenses, setRecompenses] = useState<Recompense[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const confirm = useConfirm()

  const [form, setForm] = useState({
    nom: "",
    description: "",
    pointsRequis: 100,
    type: "REDUCTION" as Recompense["type"],
    valeur: "",
    imageUrl: "",
    stock: "",
    actif: true,
  })

  const loadRecompenses = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/recompenses")
      if (res.ok) {
        const data = await res.json()
        setRecompenses(data.recompenses)
        setStats(data.stats)
      }
    } catch {
      toast.error("Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRecompenses()
  }, [loadRecompenses])

  function resetForm() {
    setForm({
      nom: "",
      description: "",
      pointsRequis: 100,
      type: "REDUCTION",
      valeur: "",
      imageUrl: "",
      stock: "",
      actif: true,
    })
    setEditingId(null)
    setShowForm(false)
  }

  function editRecompense(r: Recompense) {
    setForm({
      nom: r.nom,
      description: r.description,
      pointsRequis: r.pointsRequis,
      type: r.type,
      valeur: r.valeur?.toString() || "",
      imageUrl: r.imageUrl || "",
      stock: r.stock?.toString() || "",
      actif: r.actif,
    })
    setEditingId(r.id)
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const body = {
      nom: form.nom.trim(),
      description: form.description.trim(),
      pointsRequis: form.pointsRequis,
      type: form.type,
      valeur: form.valeur ? parseInt(form.valeur) : null,
      imageUrl: form.imageUrl.trim() || null,
      stock: form.stock ? parseInt(form.stock) : null,
      actif: form.actif,
    }

    try {
      const url = editingId ? `/api/admin/recompenses/${editingId}` : "/api/admin/recompenses"
      const method = editingId ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast.success(editingId ? "Récompense modifiée" : "Récompense créée")
        loadRecompenses()
        resetForm()
      } else {
        const data = await res.json()
        toast.error(data.error || "Erreur")
      }
    } catch {
      toast.error("Erreur réseau")
    }
  }

  async function handleDelete(id: string, nom: string) {
    const ok = await confirm({
      title: "Supprimer cette récompense ?",
      description: `La récompense "${nom}" sera définitivement supprimée.`,
      variant: "danger",
      confirmLabel: "Supprimer",
    })
    if (!ok) return

    try {
      const res = await fetch(`/api/admin/recompenses/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Récompense supprimée")
        loadRecompenses()
      } else {
        const data = await res.json()
        toast.error(data.error || "Erreur lors de la suppression")
      }
    } catch {
      toast.error("Erreur réseau")
    }
  }

  async function handleToggleActif(id: string, actif: boolean) {
    try {
      const res = await fetch(`/api/admin/recompenses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actif: !actif }),
      })
      if (res.ok) {
        toast.success(actif ? "Récompense désactivée" : "Récompense activée")
        loadRecompenses()
      }
    } catch {
      toast.error("Erreur")
    }
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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-[28px] font-light text-text-main">
            Catalogue Récompenses
          </h1>
          <p className="mt-1 font-body text-[14px] text-text-mid">
            Gérez les récompenses du programme de fidélité
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 bg-primary-brand px-5 py-3 font-body text-xs uppercase tracking-[0.15em] text-white transition-colors hover:bg-primary-dark"
        >
          <Plus size={16} />
          Nouvelle récompense
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="border border-border-brand bg-white p-4">
            <div className="flex items-center gap-3">
              <Gift className="h-5 w-5 text-primary-brand" />
              <div>
                <p className="font-body text-[24px] font-medium text-text-main">
                  {stats.totalRecompenses}
                </p>
                <p className="font-body text-[12px] text-text-muted-brand">Récompenses</p>
              </div>
            </div>
          </div>
          <div className="border border-border-brand bg-white p-4">
            <div className="flex items-center gap-3">
              <Star className="h-5 w-5 text-gold" />
              <div>
                <p className="font-body text-[24px] font-medium text-text-main">
                  {stats.actives}
                </p>
                <p className="font-body text-[12px] text-text-muted-brand">Actives</p>
              </div>
            </div>
          </div>
          <div className="border border-border-brand bg-white p-4">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-body text-[24px] font-medium text-text-main">
                  {stats.totalEchanges}
                </p>
                <p className="font-body text-[12px] text-text-muted-brand">Échanges</p>
              </div>
            </div>
          </div>
          <div className="border border-border-brand bg-white p-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <div>
                <p className="font-body text-[24px] font-medium text-text-main">
                  {stats.pointsDepenses.toLocaleString()}
                </p>
                <p className="font-body text-[12px] text-text-muted-brand">Points échangés</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire */}
      {showForm && (
        <div className="border border-border-brand bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-[20px] font-light">
              {editingId ? "Modifier la récompense" : "Créer une récompense"}
            </h2>
            <button onClick={resetForm} className="p-2 text-text-muted-brand hover:text-text-main">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block font-body text-[13px] text-text-mid">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                placeholder="ex: Gommage corps offert"
                className="w-full border border-border-brand px-4 py-3 font-body text-[14px] focus:border-primary-brand focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-2 block font-body text-[13px] text-text-mid">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as Recompense["type"] })}
                className="w-full border border-border-brand px-4 py-3 font-body text-[14px] focus:border-primary-brand focus:outline-none"
                required
              >
                {Object.entries(TYPE_LABELS).map(([key, { label }]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-2 block font-body text-[13px] text-text-mid">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Décrivez cette récompense..."
                rows={3}
                className="w-full border border-border-brand px-4 py-3 font-body text-[14px] focus:border-primary-brand focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-2 block font-body text-[13px] text-text-mid">
                Points requis <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.pointsRequis}
                onChange={(e) => setForm({ ...form, pointsRequis: parseInt(e.target.value) || 0 })}
                min="1"
                className="w-full border border-border-brand px-4 py-3 font-body text-[14px] focus:border-primary-brand focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-2 block font-body text-[13px] text-text-mid">
                Valeur (% ou F CFA)
              </label>
              <input
                type="number"
                value={form.valeur}
                onChange={(e) => setForm({ ...form, valeur: e.target.value })}
                placeholder="ex: 15 pour 15%"
                min="0"
                className="w-full border border-border-brand px-4 py-3 font-body text-[14px] focus:border-primary-brand focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block font-body text-[13px] text-text-mid">
                Stock disponible
              </label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                placeholder="Illimité si vide"
                min="0"
                className="w-full border border-border-brand px-4 py-3 font-body text-[14px] focus:border-primary-brand focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block font-body text-[13px] text-text-mid">
                URL de l&apos;image
              </label>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://..."
                className="w-full border border-border-brand px-4 py-3 font-body text-[14px] focus:border-primary-brand focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.actif}
                  onChange={(e) => setForm({ ...form, actif: e.target.checked })}
                  className="h-5 w-5 accent-primary-brand"
                />
                <span className="font-body text-[14px] text-text-main">Récompense active</span>
              </label>
            </div>

            <div className="flex gap-4 sm:col-span-2">
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

      {/* Liste des récompenses */}
      {recompenses.length === 0 ? (
        <div className="border border-dashed border-border-brand bg-white p-12 text-center">
          <Gift className="mx-auto h-12 w-12 text-text-muted-brand" />
          <p className="mt-4 font-display text-[18px] text-text-mid">
            Aucune récompense créée
          </p>
          <p className="mt-2 font-body text-[14px] text-text-muted-brand">
            Créez votre première récompense pour le programme de fidélité
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recompenses.map((r) => {
            const TypeIcon = TYPE_LABELS[r.type]?.icon || Gift
            return (
              <div
                key={r.id}
                className={`border bg-white transition-shadow hover:shadow-md ${
                  r.actif ? "border-border-brand" : "border-text-muted-brand/30 opacity-60"
                }`}
              >
                {/* Image ou placeholder */}
                <div className="relative aspect-2/1 bg-primary-light/20">
                  {r.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.imageUrl}
                      alt={r.nom}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <TypeIcon className="h-12 w-12 text-primary-brand/30" />
                    </div>
                  )}
                  {/* Badge type */}
                  <span className="absolute left-3 top-3 bg-white/90 px-2 py-1 font-body text-xs uppercase tracking-wider text-text-mid">
                    {TYPE_LABELS[r.type]?.label}
                  </span>
                  {/* Badge inactif */}
                  {!r.actif && (
                    <span className="absolute right-3 top-3 bg-red-100 px-2 py-1 font-body text-xs uppercase tracking-wider text-red-600">
                      Inactif
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-display text-[18px] font-medium text-text-main">
                    {r.nom}
                  </h3>
                  <p className="mt-1 line-clamp-2 font-body text-[13px] text-text-mid">
                    {r.description}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-border-brand pt-4">
                    <div>
                      <p className="font-display text-[24px] font-medium text-gold">
                        {r.pointsRequis.toLocaleString()}
                      </p>
                      <p className="font-body text-xs uppercase tracking-wider text-text-muted-brand">
                        points
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-body text-[13px] text-text-mid">
                        Stock: {r.stock === null ? "∞" : r.stock}
                      </p>
                      <p className="font-body text-[12px] text-text-muted-brand">
                        {r._count?.echanges || 0} échange(s)
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => editRecompense(r)}
                      className="flex flex-1 items-center justify-center gap-2 border border-border-brand py-2 font-body text-xs uppercase tracking-wider text-text-mid transition-colors hover:bg-gray-50"
                    >
                      <Pencil size={14} />
                      Modifier
                    </button>
                    <button
                      onClick={() => handleToggleActif(r.id, r.actif)}
                      className={`flex-1 py-2 font-body text-xs uppercase tracking-wider transition-colors ${
                        r.actif
                          ? "border border-orange-200 text-orange-600 hover:bg-orange-50"
                          : "border border-primary-brand text-primary-brand hover:bg-primary-light"
                      }`}
                    >
                      {r.actif ? "Désactiver" : "Activer"}
                    </button>
                    <button
                      onClick={() => handleDelete(r.id, r.nom)}
                      className="flex items-center justify-center border border-red-200 px-3 py-2 text-red-500 transition-colors hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
