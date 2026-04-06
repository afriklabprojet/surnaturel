"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowLeft, Plus, X, GripVertical, Camera, ImageIcon } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"

interface Photo {
  id: string
  url: string
  ordre: number
}

const MAX_PHOTOS = 6

export default function PagePhotosRencontre() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void fetchPhotos()
  }, [])

  async function fetchPhotos() {
    try {
      const res = await fetch("/api/rencontres/photos")
      if (!res.ok) throw new Error()
      const data = (await res.json()) as { photos: Photo[] }
      setPhotos(data.photos)
    } catch {
      toast.error("Impossible de charger les photos")
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset input
    e.target.value = ""

    if (!file.type.startsWith("image/")) {
      toast.error("Seules les images sont autorisées")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image trop lourde (max 10 Mo)")
      return
    }
    if (photos.length >= MAX_PHOTOS) {
      toast.error(`Maximum ${MAX_PHOTOS} photos`)
      return
    }

    setUploading(true)
    try {
      // 1. Upload vers Cloudinary via l'API signée
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "surnaturel-de-dieu/profils")

      const uploadRes = await fetch("/api/upload/signe", {
        method: "POST",
        body: formData,
      })

      if (!uploadRes.ok) {
        const err = (await uploadRes.json().catch(() => ({}))) as { error?: string }
        throw new Error(err.error ?? "Erreur d'upload")
      }

      const { url } = (await uploadRes.json()) as { url: string }

      // 2. Enregistrer dans la galerie rencontres
      const saveRes = await fetch("/api/rencontres/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })

      if (!saveRes.ok) {
        const err = (await saveRes.json().catch(() => ({}))) as { error?: string }
        throw new Error(err.error ?? "Erreur de sauvegarde")
      }

      const photo = (await saveRes.json()) as Photo
      setPhotos((prev) => [...prev, photo])
      toast.success("Photo ajoutée")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur inattendue")
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(photoId: string) {
    if (!confirm("Supprimer cette photo ?")) return
    try {
      const res = await fetch(`/api/rencontres/photos/${photoId}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setPhotos((prev) => prev.filter((p) => p.id !== photoId))
      toast.success("Photo supprimée")
    } catch {
      toast.error("Erreur lors de la suppression")
    }
  }

  async function handleDragEnd() {
    if (dragIndex === null || dragOverIndex === null || dragIndex === dragOverIndex) {
      setDragIndex(null)
      setDragOverIndex(null)
      return
    }

    const reordered = [...photos]
    const [moved] = reordered.splice(dragIndex, 1)
    reordered.splice(dragOverIndex, 0, moved)
    setPhotos(reordered)
    setDragIndex(null)
    setDragOverIndex(null)

    // Sauvegarder l'ordre
    try {
      await fetch("/api/rencontres/photos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoIds: reordered.map((p) => p.id) }),
      })
    } catch {
      toast.error("Erreur lors de la réorganisation")
      void fetchPhotos()
    }
  }

  return (
    <div className="max-w-lg lg:max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/communaute/rencontres/preferences"
          className="p-1.5 rounded-full text-text-muted-brand hover:bg-bg-page transition-colors"
          aria-label="Retour"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-heading text-xl font-semibold text-text-main flex items-center gap-2">
            <Camera size={20} className="text-pink-500" />
            Mes photos
          </h1>
          <p className="text-sm text-text-muted-brand">
            {photos.length}/{MAX_PHOTOS} photos — La première photo est votre photo principale
          </p>
        </div>
      </div>

      {/* Conseil */}
      <div className="flex items-start gap-3 p-3 rounded-xl bg-pink-50 border border-pink-100">
        <ImageIcon size={18} className="text-pink-500 shrink-0 mt-0.5" />
        <div className="text-xs text-pink-700 space-y-0.5">
          <p className="font-medium">Conseils pour de meilleures rencontres</p>
          <p>Ajoutez des photos récentes, bien éclairées, où votre visage est visible. Les profils avec 3+ photos reçoivent 5x plus de likes.</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="aspect-3/4 rounded-xl bg-bg-page animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Grille de photos */}
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className={`relative aspect-3/4 rounded-xl overflow-hidden border-2 transition-all ${
                  index === 0 ? "border-pink-400 shadow-md shadow-pink-100" : "border-border-brand"
                } ${dragOverIndex === index ? "scale-105 border-primary-brand" : ""}`}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => { e.preventDefault(); setDragOverIndex(index) }}
                onDragEnd={handleDragEnd}
              >
                <Image
                  src={photo.url}
                  alt={`Photo ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 33vw, 200px"
                />

                {/* Badge photo principale */}
                {index === 0 && (
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-500 text-white shadow">
                    Principale
                  </span>
                )}

                {/* Bouton supprimer */}
                <button
                  onClick={() => handleDelete(photo.id)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                  aria-label="Supprimer"
                >
                  <X size={12} />
                </button>

                {/* Grip pour réordonner */}
                <div className="absolute bottom-1.5 left-1.5 p-1 rounded bg-black/40 text-white cursor-grab active:cursor-grabbing">
                  <GripVertical size={12} />
                </div>
              </div>
            ))}

            {/* Bouton ajouter */}
            {photos.length < MAX_PHOTOS && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="aspect-3/4 rounded-xl border-2 border-dashed border-gray-300 hover:border-pink-400 flex flex-col items-center justify-center gap-2 text-text-muted-brand hover:text-pink-500 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <div className="w-8 h-8 rounded-full border-2 border-pink-400 border-t-transparent animate-spin" />
                ) : (
                  <>
                    <Plus size={24} />
                    <span className="text-xs font-medium">Ajouter</span>
                  </>
                )}
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
        </>
      )}
    </div>
  )
}
