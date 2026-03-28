"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Trash2, Pencil, Video, Check, X, Eye, EyeOff, Star, Play } from "lucide-react"
import { toast } from "sonner"
import { useConfirm } from "@/components/ui/confirm-dialog"

interface TemoignageVideo {
  id: string
  titre: string
  clientNom: string
  soinNom: string | null
  videoUrl: string
  thumbnailUrl: string | null
  duree: number | null
  description: string | null
  consentementClient: boolean
  approuve: boolean
  vedette: boolean
  ordre: number
  createdAt: string
}

interface Stats {
  total: number
  approuvees: number
  vedettes: number
}

// Extraire l'ID YouTube d'une URL
function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : null
}

// Générer la miniature YouTube
function getYouTubeThumbnail(url: string): string | null {
  const id = getYouTubeId(url)
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null
}

export default function PageAdminVideos() {
  const [videos, setVideos] = useState<TemoignageVideo[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const confirm = useConfirm()

  const [form, setForm] = useState({
    titre: "",
    clientNom: "",
    soinNom: "",
    videoUrl: "",
    thumbnailUrl: "",
    duree: "",
    description: "",
    consentementClient: false,
    approuve: false,
    vedette: false,
    ordre: 0,
  })

  const loadVideos = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/videos")
      if (res.ok) {
        const data = await res.json()
        setVideos(data.videos)
        setStats(data.stats)
      }
    } catch {
      toast.error("Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadVideos()
  }, [loadVideos])

  function resetForm() {
    setForm({
      titre: "",
      clientNom: "",
      soinNom: "",
      videoUrl: "",
      thumbnailUrl: "",
      duree: "",
      description: "",
      consentementClient: false,
      approuve: false,
      vedette: false,
      ordre: 0,
    })
    setEditingId(null)
    setShowForm(false)
  }

  function editVideo(v: TemoignageVideo) {
    setForm({
      titre: v.titre,
      clientNom: v.clientNom,
      soinNom: v.soinNom || "",
      videoUrl: v.videoUrl,
      thumbnailUrl: v.thumbnailUrl || "",
      duree: v.duree?.toString() || "",
      description: v.description || "",
      consentementClient: v.consentementClient,
      approuve: v.approuve,
      vedette: v.vedette,
      ordre: v.ordre,
    })
    setEditingId(v.id)
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const body = {
      titre: form.titre.trim(),
      clientNom: form.clientNom.trim(),
      soinNom: form.soinNom.trim() || null,
      videoUrl: form.videoUrl.trim(),
      thumbnailUrl: form.thumbnailUrl.trim() || null,
      duree: form.duree ? parseInt(form.duree) : null,
      description: form.description.trim() || null,
      consentementClient: form.consentementClient,
      approuve: form.approuve,
      vedette: form.vedette,
      ordre: form.ordre,
    }

    try {
      const url = editingId ? `/api/admin/videos/${editingId}` : "/api/admin/videos"
      const method = editingId ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast.success(editingId ? "Vidéo modifiée" : "Vidéo ajoutée")
        loadVideos()
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
      title: "Supprimer cette vidéo ?",
      description: `Le témoignage "${titre}" sera définitivement supprimé.`,
      variant: "danger",
      confirmLabel: "Supprimer",
    })
    if (!ok) return

    try {
      const res = await fetch(`/api/admin/videos/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Vidéo supprimée")
        loadVideos()
      } else {
        toast.error("Erreur lors de la suppression")
      }
    } catch {
      toast.error("Erreur réseau")
    }
  }

  async function handleToggle(id: string, field: "approuve" | "vedette", value: boolean) {
    try {
      const res = await fetch(`/api/admin/videos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: !value }),
      })
      if (res.ok) {
        toast.success(
          field === "approuve"
            ? value ? "Vidéo masquée" : "Vidéo approuvée"
            : value ? "Vidéo retirée de la une" : "Vidéo mise en vedette"
        )
        loadVideos()
      }
    } catch {
      toast.error("Erreur")
    }
  }

  function formatDuration(seconds: number | null): string {
    if (!seconds) return ""
    const min = Math.floor(seconds / 60)
    const sec = seconds % 60
    return `${min}:${sec.toString().padStart(2, "0")}`
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
            Témoignages Vidéo
          </h1>
          <p className="mt-1 font-body text-[14px] text-text-mid">
            Gérez les vidéos de vos clientes satisfaites
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 bg-primary-brand px-5 py-3 font-body text-[11px] uppercase tracking-[0.15em] text-white transition-colors hover:bg-primary-dark"
        >
          <Plus size={16} />
          Ajouter une vidéo
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="border border-border-brand bg-white p-4">
            <div className="flex items-center gap-3">
              <Video className="h-5 w-5 text-primary-brand" />
              <div>
                <p className="font-body text-[24px] font-medium text-text-main">
                  {stats.total}
                </p>
                <p className="font-body text-[12px] text-text-muted-brand">Total vidéos</p>
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
              <Star className="h-5 w-5 text-gold" />
              <div>
                <p className="font-body text-[24px] font-medium text-text-main">
                  {stats.vedettes}
                </p>
                <p className="font-body text-[12px] text-text-muted-brand">Vedettes</p>
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
              {editingId ? "Modifier le témoignage" : "Ajouter un témoignage vidéo"}
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
                placeholder="ex: Témoignage de Marie"
                className="w-full border border-border-brand px-4 py-3 font-body text-[14px] focus:border-primary-brand focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-2 block font-body text-[13px] text-text-mid">
                Prénom cliente <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.clientNom}
                onChange={(e) => setForm({ ...form, clientNom: e.target.value })}
                placeholder="ex: Marie"
                className="w-full border border-border-brand px-4 py-3 font-body text-[14px] focus:border-primary-brand focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-2 block font-body text-[13px] text-text-mid">
                Soin concerné
              </label>
              <input
                type="text"
                value={form.soinNom}
                onChange={(e) => setForm({ ...form, soinNom: e.target.value })}
                placeholder="ex: Hammam Royal"
                className="w-full border border-border-brand px-4 py-3 font-body text-[14px] focus:border-primary-brand focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block font-body text-[13px] text-text-mid">
                Durée (secondes)
              </label>
              <input
                type="number"
                value={form.duree}
                onChange={(e) => setForm({ ...form, duree: e.target.value })}
                placeholder="ex: 90"
                min="0"
                className="w-full border border-border-brand px-4 py-3 font-body text-[14px] focus:border-primary-brand focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-2 block font-body text-[13px] text-text-mid">
                URL vidéo (YouTube, Vimeo...) <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={form.videoUrl}
                onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full border border-border-brand px-4 py-3 font-body text-[14px] focus:border-primary-brand focus:outline-none"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-2 block font-body text-[13px] text-text-mid">
                URL miniature personnalisée
              </label>
              <input
                type="url"
                value={form.thumbnailUrl}
                onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
                placeholder="https://... (laissez vide pour utiliser la miniature YouTube)"
                className="w-full border border-border-brand px-4 py-3 font-body text-[14px] focus:border-primary-brand focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-2 block font-body text-[13px] text-text-mid">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Contexte ou citation du témoignage..."
                rows={2}
                className="w-full border border-border-brand px-4 py-3 font-body text-[14px] focus:border-primary-brand focus:outline-none"
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
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.vedette}
                  onChange={(e) => setForm({ ...form, vedette: e.target.checked })}
                  className="h-5 w-5 accent-gold"
                />
                <span className="font-body text-[14px] text-text-main">
                  Mettre en vedette (page d&apos;accueil)
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

      {/* Liste des vidéos */}
      {videos.length === 0 ? (
        <div className="border border-dashed border-border-brand bg-white p-12 text-center">
          <Video className="mx-auto h-12 w-12 text-text-muted-brand" />
          <p className="mt-4 font-display text-[18px] text-text-mid">
            Aucun témoignage vidéo
          </p>
          <p className="mt-2 font-body text-[14px] text-text-muted-brand">
            Ajoutez votre premier témoignage vidéo de cliente
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((v) => {
            const thumbnail = v.thumbnailUrl || getYouTubeThumbnail(v.videoUrl)
            return (
              <div
                key={v.id}
                className={`border bg-white transition-shadow hover:shadow-md ${
                  v.approuve ? "border-border-brand" : "border-orange-200"
                } ${v.vedette ? "ring-2 ring-gold" : ""}`}
              >
                {/* Thumbnail */}
                <div
                  className="relative aspect-video cursor-pointer bg-gray-100"
                  onClick={() => setPreviewUrl(v.videoUrl)}
                >
                  {thumbnail && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumbnail}
                      alt={v.titre}
                      className="h-full w-full object-cover"
                    />
                  )}
                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity hover:bg-black/50">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90">
                      <Play className="ml-1 h-6 w-6 text-primary-brand" fill="currentColor" />
                    </div>
                  </div>
                  {/* Badges */}
                  <div className="absolute right-2 top-2 flex gap-1">
                    {v.vedette && (
                      <span className="bg-gold px-2 py-1 font-body text-[9px] uppercase text-white">
                        Vedette
                      </span>
                    )}
                    {!v.approuve && (
                      <span className="bg-orange-500 px-2 py-1 font-body text-[9px] uppercase text-white">
                        Masqué
                      </span>
                    )}
                    {!v.consentementClient && (
                      <span className="bg-red-500 px-2 py-1 font-body text-[9px] uppercase text-white">
                        Sans consentement
                      </span>
                    )}
                  </div>
                  {/* Duration */}
                  {v.duree && (
                    <span className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 font-body text-[11px] text-white">
                      {formatDuration(v.duree)}
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-display text-[16px] font-medium text-text-main line-clamp-1">
                    {v.titre}
                  </h3>
                  <p className="mt-1 font-body text-[12px] text-primary-brand">
                    {v.clientNom} {v.soinNom && `— ${v.soinNom}`}
                  </p>
                  {v.description && (
                    <p className="mt-2 line-clamp-2 font-body text-[12px] text-text-muted-brand">
                      {v.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => editVideo(v)}
                      className="flex flex-1 items-center justify-center gap-2 border border-border-brand py-2 font-body text-[11px] uppercase tracking-wider text-text-mid transition-colors hover:bg-gray-50"
                    >
                      <Pencil size={14} />
                      Modifier
                    </button>
                    <button
                      onClick={() => handleToggle(v.id, "vedette", v.vedette)}
                      className={`flex items-center justify-center border px-3 py-2 transition-colors ${
                        v.vedette
                          ? "border-gold bg-gold/10 text-gold"
                          : "border-border-brand text-text-muted-brand hover:bg-gray-50"
                      }`}
                      title={v.vedette ? "Retirer de la une" : "Mettre en vedette"}
                    >
                      <Star size={14} fill={v.vedette ? "currentColor" : "none"} />
                    </button>
                    <button
                      onClick={() => handleToggle(v.id, "approuve", v.approuve)}
                      className={`flex items-center justify-center border px-3 py-2 transition-colors ${
                        v.approuve
                          ? "border-orange-200 text-orange-600 hover:bg-orange-50"
                          : "border-primary-brand text-primary-brand hover:bg-primary-light"
                      }`}
                      title={v.approuve ? "Masquer" : "Approuver"}
                    >
                      {v.approuve ? <EyeOff size={14} /> : <Check size={14} />}
                    </button>
                    <button
                      onClick={() => handleDelete(v.id, v.titre)}
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

      {/* Modal preview vidéo */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <button
            onClick={() => setPreviewUrl(null)}
            className="absolute right-4 top-4 text-white/80 hover:text-white"
          >
            <X size={32} />
          </button>
          <div
            className="aspect-video w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={previewUrl.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
              className="h-full w-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  )
}
