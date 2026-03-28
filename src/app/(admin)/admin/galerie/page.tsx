"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Trash2, Pencil, Image, Check, X, Eye, EyeOff, ArrowUpDown } from "lucide-react"
import { toast } from "sonner"
import { useConfirm } from "@/components/ui/confirm-dialog"

interface GaleriePhoto {
  id: string
  titre: string
  description: string | null
  soinNom: string
  imageAvantUrl: string
  imageApresUrl: string
  consentementClient: boolean
  approuve: boolean
  ordre: number
  createdAt: string
}

interface Stats {
  total: number
  approuvees: number
  enAttente: number
}

export default function PageAdminGalerie() {
  const [photos, setPhotos] = useState<GaleriePhoto[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [previewPhoto, setPreviewPhoto] = useState<GaleriePhoto | null>(null)
  const confirm = useConfirm()

  const [form, setForm] = useState({
    titre: "",
    description: "",
    soinNom: "",
    imageAvantUrl: "",
    imageApresUrl: "",
    consentementClient: false,
    approuve: false,
    ordre: 0,
  })

  const loadPhotos = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/galerie")
      if (res.ok) {
        const data = await res.json()
        setPhotos(data.photos)
        setStats(data.stats)
      }
    } catch {
      toast.error("Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPhotos()
  }, [loadPhotos])

  function resetForm() {
    setForm({
      titre: "",
      description: "",
      soinNom: "",
      imageAvantUrl: "",
      imageApresUrl: "",
      consentementClient: false,
      approuve: false,
      ordre: 0,
    })
    setEditingId(null)
    setShowForm(false)
  }

  function editPhoto(p: GaleriePhoto) {
    setForm({
      titre: p.titre,
      description: p.description || "",
      soinNom: p.soinNom,
      imageAvantUrl: p.imageAvantUrl,
      imageApresUrl: p.imageApresUrl,
      consentementClient: p.consentementClient,
      approuve: p.approuve,
      ordre: p.ordre,
    })
    setEditingId(p.id)
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const body = {
      titre: form.titre.trim(),
      description: form.description.trim() || null,
      soinNom: form.soinNom.trim(),
      imageAvantUrl: form.imageAvantUrl.trim(),
      imageApresUrl: form.imageApresUrl.trim(),
      consentementClient: form.consentementClient,
      approuve: form.approuve,
      ordre: form.ordre,
    }

    try {
      const url = editingId ? `/api/admin/galerie/${editingId}` : "/api/admin/galerie"
      const method = editingId ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast.success(editingId ? "Photo modifiée" : "Photo ajoutée")
        loadPhotos()
        resetForm()
      } else {
        const data = await res.json()
        toast.error(data.error || "Erreur")
      }
    } catch {
      toast.error("Erreur réseau")
    }
  }

  async function handleDelete(id: string, titre: string) {
    const ok = await confirm({
      title: "Supprimer cette photo ?",
      description: `La photo "${titre}" sera définitivement supprimée.`,
      variant: "danger",
      confirmLabel: "Supprimer",
    })
    if (!ok) return

    try {
      const res = await fetch(`/api/admin/galerie/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Photo supprimée")
        loadPhotos()
      } else {
        toast.error("Erreur lors de la suppression")
      }
    } catch {
      toast.error("Erreur réseau")
    }
  }

  async function handleToggleApprouve(id: string, approuve: boolean) {
    try {
      const res = await fetch(`/api/admin/galerie/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approuve: !approuve }),
      })
      if (res.ok) {
        toast.success(approuve ? "Photo masquée" : "Photo approuvée")
        loadPhotos()
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
            Galerie Avant/Après
          </h1>
          <p className="mt-1 font-body text-[14px] text-text-mid">
            Gérez les photos de transformation
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 bg-primary-brand px-5 py-3 font-body text-[11px] uppercase tracking-[0.15em] text-white transition-colors hover:bg-primary-dark"
        >
          <Plus size={16} />
          Ajouter une photo
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="border border-border-brand bg-white p-4">
            <div className="flex items-center gap-3">
              <Image className="h-5 w-5 text-primary-brand" />
              <div>
                <p className="font-body text-[24px] font-medium text-text-main">
                  {stats.total}
                </p>
                <p className="font-body text-[12px] text-text-muted-brand">Total photos</p>
              </div>
            </div>
          </div>
          <div className="border border-border-brand bg-white p-4">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-primary-brand" />
              <div>
                <p className="font-body text-[24px] font-medium text-text-main">
                  {stats.approuvees}
                </p>
                <p className="font-body text-[12px] text-text-muted-brand">Visibles</p>
              </div>
            </div>
          </div>
          <div className="border border-border-brand bg-white p-4">
            <div className="flex items-center gap-3">
              <EyeOff className="h-5 w-5 text-orange-500" />
              <div>
                <p className="font-body text-[24px] font-medium text-text-main">
                  {stats.enAttente}
                </p>
                <p className="font-body text-[12px] text-text-muted-brand">En attente</p>
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
              {editingId ? "Modifier la photo" : "Ajouter une transformation"}
            </h2>
            <button onClick={resetForm} className="p-2 text-text-muted-brand hover:text-text-main">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block font-body text-[13px] text-text-mid">
                Titre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.titre}
                onChange={(e) => setForm({ ...form, titre: e.target.value })}
                placeholder="ex: Résultat gommage corps"
                className="w-full border border-border-brand px-4 py-3 font-body text-[14px] focus:border-primary-brand focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-2 block font-body text-[13px] text-text-mid">
                Soin concerné <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.soinNom}
                onChange={(e) => setForm({ ...form, soinNom: e.target.value })}
                placeholder="ex: Gommage Corps"
                className="w-full border border-border-brand px-4 py-3 font-body text-[14px] focus:border-primary-brand focus:outline-none"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-2 block font-body text-[13px] text-text-mid">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Contexte ou détails sur cette transformation..."
                rows={2}
                className="w-full border border-border-brand px-4 py-3 font-body text-[14px] focus:border-primary-brand focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block font-body text-[13px] text-text-mid">
                URL image AVANT <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={form.imageAvantUrl}
                onChange={(e) => setForm({ ...form, imageAvantUrl: e.target.value })}
                placeholder="https://..."
                className="w-full border border-border-brand px-4 py-3 font-body text-[14px] focus:border-primary-brand focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-2 block font-body text-[13px] text-text-mid">
                URL image APRÈS <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={form.imageApresUrl}
                onChange={(e) => setForm({ ...form, imageApresUrl: e.target.value })}
                placeholder="https://..."
                className="w-full border border-border-brand px-4 py-3 font-body text-[14px] focus:border-primary-brand focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-2 block font-body text-[13px] text-text-mid">
                Ordre d&apos;affichage
              </label>
              <input
                type="number"
                value={form.ordre}
                onChange={(e) => setForm({ ...form, ordre: parseInt(e.target.value) || 0 })}
                min="0"
                className="w-full border border-border-brand px-4 py-3 font-body text-[14px] focus:border-primary-brand focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-3">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.consentementClient}
                  onChange={(e) => setForm({ ...form, consentementClient: e.target.checked })}
                  className="h-5 w-5 accent-primary-brand"
                />
                <span className="font-body text-[14px] text-text-main">
                  Consentement client obtenu
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.approuve}
                  onChange={(e) => setForm({ ...form, approuve: e.target.checked })}
                  className="h-5 w-5 accent-primary-brand"
                />
                <span className="font-body text-[14px] text-text-main">
                  Visible sur le site
                </span>
              </label>
            </div>

            <div className="flex gap-4 sm:col-span-2">
              <button
                type="submit"
                className="bg-primary-brand px-6 py-3 font-body text-[11px] uppercase tracking-[0.15em] text-white transition-colors hover:bg-primary-dark"
              >
                {editingId ? "Modifier" : "Ajouter"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="border border-border-brand px-6 py-3 font-body text-[11px] uppercase tracking-[0.15em] text-text-mid transition-colors hover:bg-gray-50"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des photos */}
      {photos.length === 0 ? (
        <div className="border border-dashed border-border-brand bg-white p-12 text-center">
          <Image className="mx-auto h-12 w-12 text-text-muted-brand" />
          <p className="mt-4 font-display text-[18px] text-text-mid">
            Aucune photo dans la galerie
          </p>
          <p className="mt-2 font-body text-[14px] text-text-muted-brand">
            Ajoutez votre première transformation avant/après
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((p) => (
            <div
              key={p.id}
              className={`border bg-white transition-shadow hover:shadow-md ${
                p.approuve ? "border-border-brand" : "border-orange-200"
              }`}
            >
              {/* Images avant/après */}
              <div className="relative grid grid-cols-2">
                <div className="relative aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.imageAvantUrl}
                    alt="Avant"
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 font-body text-[10px] uppercase text-white">
                    Avant
                  </span>
                </div>
                <div className="relative aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.imageApresUrl}
                    alt="Après"
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 bg-primary-brand/80 px-2 py-1 font-body text-[10px] uppercase text-white">
                    Après
                  </span>
                </div>
                {/* Badge statut */}
                <div className="absolute right-2 top-2 flex gap-1">
                  {!p.consentementClient && (
                    <span className="bg-red-500 px-2 py-1 font-body text-[9px] uppercase text-white">
                      Sans consentement
                    </span>
                  )}
                  {!p.approuve && (
                    <span className="bg-orange-500 px-2 py-1 font-body text-[9px] uppercase text-white">
                      Masqué
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-display text-[16px] font-medium text-text-main line-clamp-1">
                  {p.titre}
                </h3>
                <p className="mt-1 font-body text-[12px] text-primary-brand">
                  {p.soinNom}
                </p>
                {p.description && (
                  <p className="mt-2 line-clamp-2 font-body text-[12px] text-text-muted-brand">
                    {p.description}
                  </p>
                )}

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setPreviewPhoto(p)}
                    className="flex flex-1 items-center justify-center gap-2 border border-border-brand py-2 font-body text-[11px] uppercase tracking-wider text-text-mid transition-colors hover:bg-gray-50"
                  >
                    <Eye size={14} />
                    Aperçu
                  </button>
                  <button
                    onClick={() => editPhoto(p)}
                    className="flex items-center justify-center border border-border-brand px-3 py-2 text-text-mid transition-colors hover:bg-gray-50"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleToggleApprouve(p.id, p.approuve)}
                    className={`flex items-center justify-center border px-3 py-2 transition-colors ${
                      p.approuve
                        ? "border-orange-200 text-orange-600 hover:bg-orange-50"
                        : "border-primary-brand text-primary-brand hover:bg-primary-light"
                    }`}
                  >
                    {p.approuve ? <EyeOff size={14} /> : <Check size={14} />}
                  </button>
                  <button
                    onClick={() => handleDelete(p.id, p.titre)}
                    className="flex items-center justify-center border border-red-200 px-3 py-2 text-red-500 transition-colors hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal aperçu */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl overflow-auto bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute right-4 top-4 z-10 bg-white/90 p-2"
            >
              <X size={20} />
            </button>
            <div className="grid sm:grid-cols-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewPhoto.imageAvantUrl}
                alt="Avant"
                className="w-full"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewPhoto.imageApresUrl}
                alt="Après"
                className="w-full"
              />
            </div>
            <div className="p-6">
              <h3 className="font-display text-[20px] font-medium text-text-main">
                {previewPhoto.titre}
              </h3>
              <p className="mt-1 font-body text-[13px] text-primary-brand">
                {previewPhoto.soinNom}
              </p>
              {previewPhoto.description && (
                <p className="mt-3 font-body text-[14px] text-text-mid">
                  {previewPhoto.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
