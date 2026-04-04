"use client"

import { useState, useRef, useEffect, type FormEvent } from "react"
import Image from "next/image"
import { Loader2, Send, ImageIcon, Video, LinkIcon, X } from "lucide-react"
import { Avatar, timeAgo } from "./AvatarCommunaute"
import { MentionTextarea } from "./MentionTextarea"
import type { Auteur, PostData, MentionUser } from "./types"

export function NouveauPost({
  user,
  onPost,
  repostData,
  onCancelRepost,
}: {
  user: Auteur
  onPost: (post: PostData) => void
  repostData?: PostData | null
  onCancelRepost?: () => void
}) {
  const [contenu, setContenu] = useState("")
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [videoUrl, setVideoUrl] = useState("")
  const [lienUrl, setLienUrl] = useState("")
  const [mediaType, setMediaType] = useState<"" | "image" | "video" | "lien">("")
  const [uploading, setUploading] = useState(false)
  const [mentionIds, setMentionIds] = useState<string[]>([])
  const [draftRestored, setDraftRestored] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const DRAFT_KEY = "communaute-draft"

  // Restaurer le brouillon au montage (seulement si pas un repost en cours)
  useEffect(() => {
    if (repostData) return
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved && saved.length > 1) {
        setContenu(saved)
        setDraftRestored(true)
        setTimeout(() => setDraftRestored(false), 3000)
      }
    } catch { /* localStorage indisponible */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sauvegarder brouillon à chaque frappe (débouncé 300ms)
  useEffect(() => {
    if (repostData) return
    const timer = setTimeout(() => {
      try {
        if (contenu.trim()) localStorage.setItem(DRAFT_KEY, contenu)
        else localStorage.removeItem(DRAFT_KEY)
      } catch { /* ignore */ }
    }, 300)
    return () => clearTimeout(timer)
  }, [contenu, repostData])

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    try {
      const newUrls: string[] = []
      for (const file of Array.from(files).slice(0, 4 - images.length)) {
        // Upload serveur + compression Sharp (A15)
        const formData = new FormData()
        formData.append("file", file)
        formData.append("folder", "surnaturel-de-dieu/communaute")
        const res = await fetch("/api/upload/signe", { method: "POST", body: formData })
        if (!res.ok) throw new Error("Échec upload image")
        const data: { secureUrl: string } = await res.json()
        if (data.secureUrl) newUrls.push(data.secureUrl)
      }
      setImages((prev) => [...prev, ...newUrls].slice(0, 4))
      setMediaType("image")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  function removeImage(idx: number) {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== idx)
      if (next.length === 0) setMediaType("")
      return next
    })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!contenu.trim() || loading) return
    setLoading(true)
    try {
      const body: Record<string, unknown> = { contenu: contenu.trim() }
      if (mediaType === "image" && images.length > 0) {
        body.images = images
        body.imageUrl = images[0]
      }
      if (mediaType === "video" && videoUrl.trim()) body.videoUrl = videoUrl.trim()
      if (mediaType === "lien" && lienUrl.trim()) body.lienUrl = lienUrl.trim()
      if (repostData) {
        body.partageDeId = repostData.id
        body.commentairePartage = contenu.trim()
      }
      if (mentionIds.length > 0) body.mentions = mentionIds
      const res = await fetch("/api/communaute/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const post = await res.json()
        onPost(post)
        try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
        setContenu("")
        setImages([])
        setVideoUrl("")
        setLienUrl("")
        setMediaType("")
        setMentionIds([])
        onCancelRepost?.()
      }
    } finally {
      setLoading(false)
    }
  }

  const charCount = contenu.length
  const charColor = charCount > 1800 ? "text-danger" : charCount > 1500 ? "text-amber-500" : "text-text-muted-brand"

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white shadow-sm ring-1 ring-border-brand p-5">
      <div className="flex gap-3">
        <Avatar user={user} size={44} />
        <div className="flex-1">
          <MentionTextarea
            value={contenu}
            onChange={setContenu}
            onMentionSelect={(u: MentionUser) =>
              setMentionIds((prev) => (prev.includes(u.id) ? prev : [...prev, u.id]))
            }
            placeholder={
              repostData
                ? "Ajouter un commentaire à votre partage..."
                : "Partagez quelque chose avec la communauté..."
            }
            rows={3}
            maxLength={2000}
            className="w-full resize-none rounded-xl bg-bg-page border-0 ring-1 ring-border-brand px-4 py-3 font-body text-[13px] text-text-main placeholder:text-text-muted-brand focus:ring-2 focus:ring-gold/40 focus:outline-none transition-all"
          />
          {draftRestored && (
            <p className="mt-1 text-[11px] text-text-muted-brand italic">
              Brouillon restauré
            </p>
          )}

          {/* Prévisualisation repost */}
          {repostData && (
            <div className="mt-2 border border-border-brand bg-bg-page p-3 relative">
              <button
                type="button"
                onClick={onCancelRepost}
                className="absolute top-2 right-2 p-1 text-text-muted-brand hover:text-danger transition-colors"
              >
                <X size={14} />
              </button>
              <div className="flex items-center gap-2 mb-2">
                <Avatar user={repostData.auteur} size={24} />
                <span className="font-body text-xs font-medium text-text-main">
                  {repostData.auteur.prenom} {repostData.auteur.nom}
                </span>
                <span className="font-body text-xs text-text-muted-brand">{timeAgo(repostData.createdAt)}</span>
              </div>
              <p className="font-body text-[12px] text-text-mid line-clamp-3">{repostData.contenu}</p>
              {repostData.images?.length > 0 && (
                <Image
                  src={repostData.images[0]}
                  alt={`Photo par ${repostData.auteur.prenom}`}
                  width={128}
                  height={80}
                  className="mt-2 h-20 w-32 object-cover border border-border-brand"
                  unoptimized
                />
              )}
            </div>
          )}

          {/* Prévisualisation images */}
          {images.length > 0 && (
            <div className="mt-2 flex gap-2 flex-wrap">
              {images.map((url, i) => (
                <div key={i} className="relative group w-20 h-20">
                  <Image src={url} alt={`Aperçu image ${i + 1}`} width={80} height={80} className="w-full h-full object-cover rounded-lg border border-border-brand" unoptimized />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-danger text-white rounded-full flex items-center justify-center opacity-100"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              {images.length < 4 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-lg border border-dashed border-border-brand flex items-center justify-center text-text-muted-brand hover:border-gold hover:text-gold transition-colors"
                >
                  <ImageIcon size={18} />
                </button>
              )}
            </div>
          )}

          {/* URL vidéo / lien */}
          {mediaType && mediaType !== "image" && (
            <div className="mt-2 flex items-center gap-2">
              <input
                value={mediaType === "video" ? videoUrl : lienUrl}
                onChange={(e) => {
                  if (mediaType === "video") setVideoUrl(e.target.value)
                  else setLienUrl(e.target.value)
                }}
                placeholder={mediaType === "video" ? "URL de la vidéo..." : "URL du lien..."}
                className="flex-1 rounded-full border border-border-brand bg-bg-page px-3 py-2 font-body text-[12px] text-text-main placeholder:text-text-muted-brand focus:border-gold focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => { setMediaType(""); setVideoUrl(""); setLienUrl("") }}
                className="p-1.5 text-text-muted-brand hover:text-danger transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
              <button
                type="button"
                onClick={() => {
                  if (mediaType === "image") { setMediaType(""); setImages([]) }
                  else { setMediaType("image"); fileInputRef.current?.click() }
                }}
                disabled={uploading}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-body text-xs transition-colors ${mediaType === "image" ? "bg-gold-light text-gold" : "bg-bg-page text-text-muted-brand hover:text-text-mid hover:bg-primary-light"}`}
                title="Images"
              >
                {uploading ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={13} />}
                Photo
              </button>
              <button
                type="button"
                onClick={() => setMediaType(mediaType === "video" ? "" : "video")}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-body text-xs transition-colors ${mediaType === "video" ? "bg-gold-light text-gold" : "bg-bg-page text-text-muted-brand hover:text-text-mid hover:bg-primary-light"}`}
                title="Vidéo"
              >
                <Video size={13} />
                Vidéo
              </button>
              <button
                type="button"
                onClick={() => setMediaType(mediaType === "lien" ? "" : "lien")}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-body text-xs transition-colors ${mediaType === "lien" ? "bg-gold-light text-gold" : "bg-bg-page text-text-muted-brand hover:text-text-mid hover:bg-primary-light"}`}
                title="Lien"
              >
                <LinkIcon size={13} />
                Lien
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className={`font-body text-xs tabular-nums ${charColor}`}>{charCount}/2000</span>
              <button
                type="submit"
                disabled={!contenu.trim() || loading || uploading}
                className="flex items-center gap-1.5 rounded-full bg-primary-brand px-5 py-2 font-body text-xs font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                Publier
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
