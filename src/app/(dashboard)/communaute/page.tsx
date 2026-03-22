"use client"

import { useState, useEffect, useCallback, useRef, FormEvent } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  Loader2,
  MessageCircle,
  Send,
  Trash2,
  ChevronDown,
  ImageIcon,
  X,
  Bookmark,
  BookmarkCheck,
  Flag,
  LinkIcon,
  FileText,
  Video,
  MoreHorizontal,
  ExternalLink,
  Repeat2,
  Pin,
  PinOff,
  AtSign,
} from "lucide-react"
import { getPusherClient, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher"
import StoriesBandeau from "@/components/stories/StoriesBandeau"
import BadgeVerification from "@/components/ui/BadgeVerification"

/* ━━━━━━━━━━ Types ━━━━━━━━━━ */

interface Auteur {
  id: string
  nom: string
  prenom: string
  pseudo?: string | null
  photoUrl: string | null
  statutProfil?: string | null
  verificationStatus?: string | null
}

interface CommentaireData {
  id: string
  contenu: string
  createdAt: string
  auteur: Auteur
}

type ReactionType = "JAIME" | "SOUTIEN" | "ENCOURAGEMENT" | "BRAVO" | "INSPIRATION"

interface PartageDeData {
  id: string
  contenu: string
  imageUrl: string | null
  images: string[]
  videoUrl: string | null
  lienUrl: string | null
  format: string
  auteur: Auteur
  createdAt: string
  _count: { commentaires: number; reactions: number }
}

interface PostData {
  id: string
  contenu: string
  imageUrl: string | null
  images: string[]
  videoUrl: string | null
  lienUrl: string | null
  lienTitre: string | null
  lienDescription: string | null
  lienImage: string | null
  documentUrl: string | null
  documentNom: string | null
  format: string
  hashtags: string[]
  epingle: boolean
  createdAt: string
  auteur: Auteur
  commentaires: CommentaireData[]
  userReaction: ReactionType | null
  reactionCounts: Record<string, number>
  reactionsCount: number
  commentairesCount: number
  partagesCount: number
  saved: boolean
  partageDeId: string | null
  commentairePartage: string | null
  partageDe: PartageDeData | null
}

interface MentionUser {
  id: string
  nom: string
  prenom: string
  pseudo?: string | null
  photoUrl: string | null
}

/* ━━━━━━━━━━ Constants ━━━━━━━━━━ */

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: "JAIME", emoji: "👍", label: "J'aime" },
  { type: "SOUTIEN", emoji: "❤️", label: "Soutien" },
  { type: "ENCOURAGEMENT", emoji: "💪", label: "Courage" },
  { type: "BRAVO", emoji: "👏", label: "Bravo" },
  { type: "INSPIRATION", emoji: "✨", label: "Inspiration" },
]

/* ━━━━━━━━━━ Helpers ━━━━━━━━━━ */

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}j`
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  })
}

function Avatar({ user, size = 40 }: { user: Auteur; size?: number }) {
  const initials = `${user.prenom?.[0] ?? ""}${user.nom?.[0] ?? ""}`.toUpperCase()
  if (user.photoUrl) {
    return (
      <img
        src={user.photoUrl}
        alt=""
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className="flex items-center justify-center rounded-full bg-primary-brand text-white font-body font-medium"
      style={{ width: size, height: size, fontSize: size * 0.32 }}
    >
      {initials}
    </div>
  )
}

/* ━━━━━━━━━━ Textarea avec @mentions ━━━━━━━━━━ */

function MentionTextarea({
  value,
  onChange,
  onMentionSelect,
  placeholder,
  maxLength,
  rows,
  className,
}: {
  value: string
  onChange: (val: string) => void
  onMentionSelect?: (user: MentionUser) => void
  placeholder?: string
  maxLength?: number
  rows?: number
  className?: string
}) {
  const [suggestions, setSuggestions] = useState<MentionUser[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState("")
  const [cursorPos, setCursorPos] = useState(0)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const fetchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)

  function detectMention(text: string, cursor: number) {
    const before = text.slice(0, cursor)
    const match = before.match(/@([a-zA-ZÀ-ÿ0-9_]*)$/)
    if (match) {
      return match[1]
    }
    return null
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newValue = e.target.value
    const cursor = e.target.selectionStart || 0
    onChange(newValue)
    setCursorPos(cursor)

    const query = detectMention(newValue, cursor)
    if (query !== null && query.length >= 1) {
      setMentionQuery(query)
      setSelectedIdx(0)
      clearTimeout(fetchTimeout.current)
      fetchTimeout.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/communaute/mentions?q=${encodeURIComponent(query)}`)
          if (res.ok) {
            const data = await res.json()
            setSuggestions(data.users || [])
            setShowSuggestions((data.users || []).length > 0)
          }
        } catch {
          setShowSuggestions(false)
        }
      }, 200)
    } else {
      setShowSuggestions(false)
      setSuggestions([])
    }
  }

  function insertMention(user: MentionUser) {
    const before = value.slice(0, cursorPos)
    const after = value.slice(cursorPos)
    const mentionStart = before.lastIndexOf("@")
    const pseudo = user.pseudo || `${user.prenom}${user.nom}`.replace(/\s/g, "")
    const newText = before.slice(0, mentionStart) + `@${pseudo} ` + after
    onChange(newText)
    setShowSuggestions(false)
    setSuggestions([])
    onMentionSelect?.(user)
    // Re-focus textarea
    setTimeout(() => {
      const newPos = mentionStart + pseudo.length + 2
      textareaRef.current?.setSelectionRange(newPos, newPos)
      textareaRef.current?.focus()
    }, 0)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showSuggestions || suggestions.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIdx((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter" && showSuggestions) {
      e.preventDefault()
      insertMention(suggestions[selectedIdx])
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
    }
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className={className}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-48 overflow-y-auto border border-border-brand bg-white shadow-lg"
        >
          {suggestions.map((user, i) => (
            <button
              key={user.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); insertMention(user) }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                i === selectedIdx ? "bg-bg-page" : "hover:bg-bg-page"
              }`}
            >
              <Avatar user={user} size={28} />
              <div className="min-w-0 flex-1">
                <p className="font-body text-[12px] font-medium text-text-main truncate">
                  {user.prenom} {user.nom}
                </p>
                {user.pseudo && (
                  <p className="font-body text-[10px] text-text-muted-brand">@{user.pseudo}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ━━━━━━━━━━ Sélecteur de réactions ━━━━━━━━━━ */

function ReactionPicker({
  userReaction,
  reactionCounts,
  reactionsCount,
  onReact,
}: {
  userReaction: ReactionType | null
  reactionCounts: Record<string, number>
  reactionsCount: number
  onReact: (type: ReactionType) => void
}) {
  const [showPicker, setShowPicker] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const currentReaction = REACTIONS.find((r) => r.type === userReaction)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false)
      }
    }
    if (showPicker) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showPicker])

  function handleMouseEnter() {
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setShowPicker(true), 300)
  }

  function handleMouseLeave() {
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setShowPicker(false), 400)
  }

  const topReactions = Object.entries(reactionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([type]) => REACTIONS.find((r) => r.type === type)?.emoji)
    .filter(Boolean)

  return (
    <div className="relative flex-1" ref={pickerRef}>
      <button
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => onReact(userReaction ?? "JAIME")}
        className={`flex w-full items-center justify-center gap-2 py-2.5 font-body text-[12px] font-medium transition-colors ${
          userReaction ? "text-gold" : "text-text-muted-brand hover:text-gold"
        }`}
      >
        <span className="text-[15px]">{currentReaction?.emoji ?? "👍"}</span>
        {currentReaction?.label ?? "Réagir"}
      </button>

      {reactionsCount > 0 && (
        <div className="absolute -top-7 left-2 flex items-center gap-1 px-2 py-0.5 bg-white border border-border-brand rounded-full shadow-sm pointer-events-none">
          {topReactions.map((emoji, i) => (
            <span key={i} className="text-[12px]">{emoji}</span>
          ))}
          <span className="font-body text-[10px] text-text-muted-brand ml-0.5">{reactionsCount}</span>
        </div>
      )}

      {showPicker && (
        <div
          onMouseEnter={() => clearTimeout(timeoutRef.current)}
          onMouseLeave={handleMouseLeave}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex items-center gap-1 px-2 py-1.5 bg-white border border-border-brand shadow-lg rounded-full z-20"
        >
          {REACTIONS.map((r) => (
            <button
              key={r.type}
              onClick={() => { onReact(r.type); setShowPicker(false) }}
              title={r.label}
              className={`px-1.5 py-0.5 rounded-full transition-transform hover:scale-125 ${
                userReaction === r.type ? "bg-gold-light" : ""
              }`}
            >
              <span className="text-[20px]">{r.emoji}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ━━━━━━━━━━ Média du post ━━━━━━━━━━ */

function PostMedia({ post }: { post: PostData }) {
  if (post.images?.length > 0) {
    const imgs = post.images
    return (
      <div className="border-t border-border-brand">
        {imgs.length === 1 ? (
          <img src={imgs[0]} alt="" className="w-full max-h-100 object-cover" />
        ) : (
          <div className={`grid gap-0.5 ${imgs.length >= 2 ? "grid-cols-2" : ""}`}>
            {imgs.slice(0, 4).map((url, i) => (
              <div key={i} className={`relative ${imgs.length === 3 && i === 0 ? "col-span-2" : ""}`}>
                <img src={url} alt="" className="w-full h-48 object-cover" />
                {i === 3 && imgs.length > 4 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="font-body text-white text-[18px] font-medium">+{imgs.length - 4}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (post.imageUrl) {
    return (
      <div className="border-t border-border-brand">
        <img src={post.imageUrl} alt="" className="w-full max-h-100 object-cover" />
      </div>
    )
  }

  if (post.videoUrl) {
    return (
      <div className="border-t border-border-brand p-4">
        <video src={post.videoUrl} controls className="w-full max-h-100" />
      </div>
    )
  }

  if (post.lienUrl) {
    let hostname = ""
    try { hostname = new URL(post.lienUrl).hostname } catch { hostname = post.lienUrl }
    return (
      <div className="border-t border-border-brand mx-5 my-3">
        <a href={post.lienUrl} target="_blank" rel="noopener noreferrer" className="block border border-border-brand hover:border-gold transition-colors overflow-hidden">
          {post.lienImage && <img src={post.lienImage} alt="" className="w-full h-40 object-cover" />}
          <div className="p-3">
            {post.lienTitre && <p className="font-body text-[13px] font-medium text-text-main line-clamp-2">{post.lienTitre}</p>}
            {post.lienDescription && <p className="font-body text-[11px] text-text-muted-brand mt-1 line-clamp-2">{post.lienDescription}</p>}
            <div className="flex items-center gap-1 mt-2">
              <ExternalLink size={11} className="text-text-muted-brand" />
              <span className="font-body text-[10px] text-text-muted-brand truncate">{hostname}</span>
            </div>
          </div>
        </a>
      </div>
    )
  }

  if (post.documentUrl) {
    return (
      <div className="border-t border-border-brand mx-5 my-3">
        <a href={post.documentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 border border-border-brand hover:border-gold transition-colors">
          <FileText size={24} className="text-gold shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-body text-[12px] font-medium text-text-main truncate">{post.documentNom || "Document"}</p>
            <p className="font-body text-[10px] text-text-muted-brand">Cliquer pour ouvrir</p>
          </div>
          <ExternalLink size={14} className="text-text-muted-brand shrink-0" />
        </a>
      </div>
    )
  }

  return null
}

/* ━━━━━━━━━━ Nouveau post ━━━━━━━━━━ */

function NouveauPost({
  user, onPost, repostData, onCancelRepost,
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    try {
      const newUrls: string[] = []
      for (const file of Array.from(files).slice(0, 4 - images.length)) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "")
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          { method: "POST", body: formData }
        )
        const data = await res.json()
        if (data.secure_url) newUrls.push(data.secure_url)
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

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-border-brand p-5">
      <div className="flex gap-3">
        <Avatar user={user} size={38} />
        <div className="flex-1">
          <MentionTextarea
            value={contenu}
            onChange={setContenu}
            onMentionSelect={(u) => setMentionIds((prev) => prev.includes(u.id) ? prev : [...prev, u.id])}
            placeholder={repostData ? "Ajouter un commentaire à votre partage..." : "Partagez quelque chose avec la communauté..."}
            rows={3}
            maxLength={2000}
            className="w-full resize-none border border-border-brand bg-bg-page px-4 py-3 font-body text-[13px] text-text-main placeholder:text-text-muted-brand focus:border-gold focus:outline-none transition-colors"
          />

          {/* Prévisualisation du repost */}
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
                <span className="font-body text-[11px] font-medium text-text-main">
                  {repostData.auteur.prenom} {repostData.auteur.nom}
                </span>
                <span className="font-body text-[10px] text-text-muted-brand">{timeAgo(repostData.createdAt)}</span>
              </div>
              <p className="font-body text-[12px] text-text-mid line-clamp-3">{repostData.contenu}</p>
              {repostData.images?.length > 0 && (
                <img src={repostData.images[0]} alt="" className="mt-2 h-20 w-32 object-cover border border-border-brand" />
              )}
            </div>
          )}

          {/* Prévisualisation images uploadées */}
          {images.length > 0 && (
            <div className="mt-2 flex gap-2 flex-wrap">
              {images.map((url, i) => (
                <div key={i} className="relative group w-20 h-20">
                  <img src={url} alt="" className="w-full h-full object-cover border border-border-brand" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-danger text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              {images.length < 4 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 border border-dashed border-border-brand flex items-center justify-center text-text-muted-brand hover:border-gold hover:text-gold transition-colors"
                >
                  <ImageIcon size={18} />
                </button>
              )}
            </div>
          )}

          {/* URL inputs pour vidéo/lien */}
          {mediaType && mediaType !== "image" && (
            <div className="mt-2 flex items-center gap-2">
              <input
                value={mediaType === "video" ? videoUrl : lienUrl}
                onChange={(e) => {
                  if (mediaType === "video") setVideoUrl(e.target.value)
                  else setLienUrl(e.target.value)
                }}
                placeholder={mediaType === "video" ? "URL de la vidéo..." : "URL du lien..."}
                className="flex-1 border border-border-brand bg-bg-page px-3 py-2 font-body text-[12px] text-text-main placeholder:text-text-muted-brand focus:border-gold focus:outline-none transition-colors"
              />
              <button type="button" onClick={() => { setMediaType(""); setVideoUrl(""); setLienUrl("") }} className="p-1.5 text-text-muted-brand hover:text-danger transition-colors">
                <X size={14} />
              </button>
            </div>
          )}

          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => {
                  if (mediaType === "image") { setMediaType(""); setImages([]) }
                  else { setMediaType("image"); fileInputRef.current?.click() }
                }}
                disabled={uploading}
                className={`p-1.5 transition-colors ${mediaType === "image" ? "text-gold" : "text-text-muted-brand hover:text-text-mid"}`}
                title="Images"
              >
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
              </button>
              <button type="button" onClick={() => setMediaType(mediaType === "video" ? "" : "video")} className={`p-1.5 transition-colors ${mediaType === "video" ? "text-gold" : "text-text-muted-brand hover:text-text-mid"}`} title="Vidéo">
                <Video size={16} />
              </button>
              <button type="button" onClick={() => setMediaType(mediaType === "lien" ? "" : "lien")} className={`p-1.5 transition-colors ${mediaType === "lien" ? "text-gold" : "text-text-muted-brand hover:text-text-mid"}`} title="Lien">
                <LinkIcon size={16} />
              </button>
              <span className="font-body text-[10px] text-text-muted-brand ml-2">{contenu.length}/2000</span>
            </div>
            <button
              type="submit"
              disabled={!contenu.trim() || loading || uploading}
              className="flex items-center gap-1.5 bg-primary-brand px-4 py-2 font-body text-[11px] font-medium uppercase tracking-[0.12em] text-white transition-colors hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              Publier
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}

/* ━━━━━━━━━━ Rendu du contenu avec @mentions ━━━━━━━━━━ */

function RenderContenu({ text }: { text: string }) {
  const parts = text.split(/(@[a-zA-ZÀ-ÿ0-9_]+)/g)
  return (
    <p className="font-body text-[13px] text-text-main leading-relaxed whitespace-pre-wrap">
      {parts.map((part, i) =>
        part.startsWith("@") ? (
          <span key={i} className="font-medium text-primary-brand cursor-pointer hover:text-gold transition-colors">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  )
}

/* ━━━━━━━━━━ Commentaire ━━━━━━━━━━ */

function CommentaireItem({ commentaire }: { commentaire: CommentaireData }) {
  return (
    <div className="flex gap-2.5 py-2.5">
      <Avatar user={commentaire.auteur} size={28} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <Link href={`/communaute/profil/${commentaire.auteur.id}`} className="font-body text-[12px] font-medium text-text-main hover:text-gold transition-colors">
            {commentaire.auteur.prenom} {commentaire.auteur.nom}
            <BadgeVerification status={commentaire.auteur.verificationStatus} size={11} className="ml-0.5" />
          </Link>
          <span className="font-body text-[10px] text-text-muted-brand">{timeAgo(commentaire.createdAt)}</span>
        </div>
        <div className="mt-0.5">
          <RenderContenu text={commentaire.contenu} />
        </div>
      </div>
    </div>
  )
}

/* ━━━━━━━━━━ Carte Post ━━━━━━━━━━ */

function CartePost({
  post,
  currentUserId,
  onDelete,
  onReaction,
  onToggleSave,
  onNewComment,
  onShare,
  onTogglePin,
}: {
  post: PostData
  currentUserId: string
  onDelete: (id: string) => void
  onReaction: (postId: string, type: ReactionType) => void
  onToggleSave: (postId: string) => void
  onNewComment: (postId: string, comment: CommentaireData) => void
  onShare: (post: PostData) => void
  onTogglePin: (postId: string) => void
}) {
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [commentMentionIds, setCommentMentionIds] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [allComments, setAllComments] = useState<CommentaireData[]>(post.commentaires)
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentPage, setCommentPage] = useState(1)
  const [totalCommentPages, setTotalCommentPages] = useState(1)
  const menuRef = useRef<HTMLDivElement>(null)

  const isAuteur = post.auteur.id === currentUserId
  const totalComments = post.commentairesCount

  // Sync initial comments from parent
  useEffect(() => {
    if (!commentsLoaded) setAllComments(post.commentaires)
  }, [post.commentaires, commentsLoaded])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false)
    }
    if (showMenu) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showMenu])

  async function loadAllComments() {
    if (commentsLoaded || loadingComments) return
    setLoadingComments(true)
    try {
      const res = await fetch(`/api/communaute/posts/${post.id}/commentaires?limit=20&page=1`)
      if (res.ok) {
        const data = await res.json()
        setAllComments(data.commentaires)
        setTotalCommentPages(data.pages)
        setCommentPage(1)
        setCommentsLoaded(true)
      }
    } finally {
      setLoadingComments(false)
    }
  }

  async function loadMoreComments() {
    if (loadingComments || commentPage >= totalCommentPages) return
    setLoadingComments(true)
    try {
      const nextPage = commentPage + 1
      const res = await fetch(`/api/communaute/posts/${post.id}/commentaires?limit=20&page=${nextPage}`)
      if (res.ok) {
        const data = await res.json()
        setAllComments((prev) => [...prev, ...data.commentaires])
        setCommentPage(nextPage)
        setTotalCommentPages(data.pages)
      }
    } finally {
      setLoadingComments(false)
    }
  }

  function handleToggleComments() {
    const next = !showComments
    setShowComments(next)
    if (next && !commentsLoaded && totalComments > 3) loadAllComments()
  }

  async function handleDelete() {
    if (deleting) return
    setDeleting(true)
    const res = await fetch(`/api/communaute/posts/${post.id}`, { method: "DELETE" })
    if (res.ok) onDelete(post.id)
    setDeleting(false)
  }

  async function handleReport() {
    setShowMenu(false)
    await fetch("/api/communaute/signalements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "POST", cibleId: post.id, raison: "Contenu inapproprié" }),
    })
  }

  async function handleComment(e: FormEvent) {
    e.preventDefault()
    if (!commentText.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/communaute/posts/${post.id}/commentaires`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenu: commentText.trim(), mentions: commentMentionIds }),
      })
      if (res.ok) {
        const comment = await res.json()
        setAllComments((prev) => [...prev, comment])
        onNewComment(post.id, comment)
        setCommentText("")
        setCommentMentionIds([])
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <article className="bg-white border border-border-brand overflow-hidden">
      {/* Badge épinglé */}
      {post.epingle && (
        <div className="flex items-center gap-1.5 px-5 pt-3 pb-0">
          <Pin size={12} className="text-gold" />
          <span className="font-body text-[10px] uppercase tracking-wider text-gold">Publication épinglée</span>
        </div>
      )}

      {/* Indicateur de partage */}
      {post.partageDeId && (
        <div className="flex items-center gap-1.5 px-5 pt-3 pb-0">
          <Repeat2 size={12} className="text-primary-brand" />
          <span className="font-body text-[11px] text-text-muted-brand">
            {post.auteur.prenom} {post.auteur.nom} a partagé
          </span>
        </div>
      )}

      {/* En-tête */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-3">
        <Link href={`/communaute/profil/${post.auteur.id}`}>
          <Avatar user={post.auteur} size={40} />
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/communaute/profil/${post.auteur.id}`} className="font-body text-[13px] font-medium text-text-main hover:text-gold transition-colors truncate block">
            {post.auteur.prenom} {post.auteur.nom}
            <BadgeVerification status={post.auteur.verificationStatus} size={13} className="ml-1" />
            {post.auteur.pseudo && <span className="text-text-muted-brand font-normal ml-1">@{post.auteur.pseudo}</span>}
          </Link>
          <p className="font-body text-[10px] text-text-muted-brand">{timeAgo(post.createdAt)}</p>
        </div>
        <div className="relative" ref={menuRef}>
          <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 text-text-muted-brand hover:text-text-mid transition-colors">
            <MoreHorizontal size={16} />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-border-brand shadow-lg z-20">
              {isAuteur && (
                <button onClick={() => { onTogglePin(post.id); setShowMenu(false) }} className="flex w-full items-center gap-2 px-3 py-2 font-body text-[12px] text-text-mid hover:bg-bg-page transition-colors">
                  {post.epingle ? <PinOff size={13} /> : <Pin size={13} />}
                  {post.epingle ? "Désépingler" : "Épingler"}
                </button>
              )}
              {isAuteur ? (
                <button onClick={handleDelete} disabled={deleting} className="flex w-full items-center gap-2 px-3 py-2 font-body text-[12px] text-danger hover:bg-bg-page transition-colors">
                  {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  Supprimer
                </button>
              ) : (
                <button onClick={handleReport} className="flex w-full items-center gap-2 px-3 py-2 font-body text-[12px] text-text-mid hover:bg-bg-page transition-colors">
                  <Flag size={13} />
                  Signaler
                </button>
              )}
              <button onClick={() => { onToggleSave(post.id); setShowMenu(false) }} className="flex w-full items-center gap-2 px-3 py-2 font-body text-[12px] text-text-mid hover:bg-bg-page transition-colors">
                {post.saved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
                {post.saved ? "Retirer" : "Sauvegarder"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Contenu */}
      <div className="px-5 pb-3">
        <RenderContenu text={post.contenu} />
        {post.hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {post.hashtags.map((tag) => (
              <Link key={tag} href={`/communaute/recherche?q=${encodeURIComponent(tag)}`} className="font-body text-[11px] text-primary-brand hover:text-gold transition-colors">
                {tag}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Média */}
      <PostMedia post={post} />

      {/* Repost embed — publication partagée */}
      {post.partageDe && (
        <div className="mx-5 mb-3 border border-border-brand bg-bg-page overflow-hidden">
          <div className="flex items-center gap-2 px-4 pt-3 pb-2">
            <Link href={`/communaute/profil/${post.partageDe.auteur.id}`}>
              <Avatar user={post.partageDe.auteur} size={28} />
            </Link>
            <div className="min-w-0">
              <Link href={`/communaute/profil/${post.partageDe.auteur.id}`} className="font-body text-[12px] font-medium text-text-main hover:text-gold transition-colors truncate block">
                {post.partageDe.auteur.prenom} {post.partageDe.auteur.nom}
                <BadgeVerification status={post.partageDe.auteur.verificationStatus} size={11} className="ml-0.5" />
              </Link>
              <p className="font-body text-[10px] text-text-muted-brand">{timeAgo(post.partageDe.createdAt)}</p>
            </div>
          </div>
          <div className="px-4 pb-3">
            <RenderContenu text={post.partageDe.contenu} />
          </div>
          {post.partageDe.imageUrl && (
            <div className="relative w-full h-48">
              <Image src={post.partageDe.imageUrl} alt="Média partagé" fill className="object-cover" />
            </div>
          )}
        </div>
      )}

      {/* Compteurs réactions + commentaires + partages */}
      {(post.reactionsCount > 0 || totalComments > 0 || post.partagesCount > 0) && (
        <div className="flex items-center justify-between px-5 py-2 text-text-muted-brand">
          {post.reactionsCount > 0 && (
            <span className="font-body text-[11px]">
              {Object.entries(post.reactionCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([type]) => REACTIONS.find((r) => r.type === type)?.emoji)
                .filter(Boolean)
                .join("")}{" "}
              {post.reactionsCount}
            </span>
          )}
          <div className="flex items-center gap-3 ml-auto">
            {totalComments > 0 && (
              <button onClick={handleToggleComments} className="font-body text-[11px] hover:text-gold transition-colors">
                {totalComments} commentaire{totalComments > 1 ? "s" : ""}
              </button>
            )}
            {post.partagesCount > 0 && (
              <span className="font-body text-[11px]">{post.partagesCount} partage{post.partagesCount > 1 ? "s" : ""}</span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex border-t border-border-brand relative">
        <ReactionPicker
          userReaction={post.userReaction}
          reactionCounts={post.reactionCounts}
          reactionsCount={post.reactionsCount}
          onReact={(type) => onReaction(post.id, type)}
        />
        <button onClick={handleToggleComments} className="flex-1 flex items-center justify-center gap-2 py-2.5 font-body text-[12px] font-medium text-text-muted-brand hover:text-primary-brand transition-colors border-l border-border-brand">
          <MessageCircle size={16} />
          Commenter
        </button>
        <button onClick={() => onShare(post)} className="flex-1 flex items-center justify-center gap-2 py-2.5 font-body text-[12px] font-medium text-text-muted-brand hover:text-primary-brand transition-colors border-l border-border-brand">
          <Repeat2 size={16} />
          Partager
        </button>
        <button onClick={() => onToggleSave(post.id)} className={`flex items-center justify-center gap-2 px-4 py-2.5 font-body text-[12px] font-medium transition-colors border-l border-border-brand ${post.saved ? "text-gold" : "text-text-muted-brand hover:text-gold"}`}>
          {post.saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        </button>
      </div>

      {/* Section des commentaires */}
      {showComments && (
        <div className="border-t border-border-brand px-5 py-3">
          {allComments.length > 0 && (
            <div className="space-y-0 divide-y divide-border-brand mb-3 max-h-100 overflow-y-auto">
              {allComments.map((c) => (
                <CommentaireItem key={c.id} commentaire={c} />
              ))}
            </div>
          )}

          {/* Charger plus de commentaires */}
          {commentsLoaded && commentPage < totalCommentPages && (
            <button
              onClick={loadMoreComments}
              disabled={loadingComments}
              className="flex items-center gap-1.5 mb-3 font-body text-[11px] text-primary-brand hover:text-gold transition-colors"
            >
              {loadingComments ? <Loader2 size={12} className="animate-spin" /> : <ChevronDown size={12} />}
              Voir plus de commentaires
            </button>
          )}

          {loadingComments && !commentsLoaded && (
            <div className="flex justify-center py-2 mb-3">
              <Loader2 size={16} className="animate-spin text-gold" />
            </div>
          )}

          <form onSubmit={handleComment} className="flex gap-2">
            <div className="flex-1">
              <MentionTextarea
                value={commentText}
                onChange={setCommentText}
                onMentionSelect={(u) => setCommentMentionIds((prev) => prev.includes(u.id) ? prev : [...prev, u.id])}
                placeholder="Écrire un commentaire..."
                maxLength={1000}
                rows={1}
                className="border border-border-brand bg-bg-page px-3 py-2 font-body text-[12px] text-text-main placeholder:text-text-muted-brand focus:border-gold focus:outline-none transition-colors w-full resize-none"
              />
            </div>
            <button type="submit" disabled={!commentText.trim() || submitting} className="px-3 py-2 bg-primary-brand text-white transition-colors hover:bg-primary-dark disabled:opacity-40 self-end">
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </form>
        </div>
      )}
    </article>
  )
}

/* ━━━━━━━━━━ Page Feed ━━━━━━━━━━ */

export default function PageCommunaute() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [posts, setPosts] = useState<PostData[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)

  const currentUserId = session?.user?.id ?? ""

  useEffect(() => {
    if (status === "unauthenticated") router.push("/connexion?callbackUrl=/communaute")
  }, [status, router])

  const fetchPosts = useCallback(async (pageNum: number, append = false) => {
    if (append) setLoadingMore(true)
    else setLoading(true)
    try {
      const res = await fetch(`/api/communaute/posts?page=${pageNum}&limit=10`)
      if (res.ok) {
        const data = await res.json()
        setPosts((prev) => (append ? [...prev, ...data.posts] : data.posts))
        setTotalPages(data.pages)
        setPage(data.page)
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    if (status === "authenticated") fetchPosts(1)
  }, [status, fetchPosts])

  // Pusher — temps réel
  useEffect(() => {
    if (status !== "authenticated") return
    try {
      const pusher = getPusherClient()
      const channel = pusher.subscribe(PUSHER_CHANNELS.communaute)

      channel.bind(PUSHER_EVENTS.NOUVEAU_POST, (data: { post: PostData; auteurId: string }) => {
        if (data.auteurId !== currentUserId) {
          setPosts((prev) => {
            if (prev.some((p) => p.id === data.post.id)) return prev
            return [data.post, ...prev]
          })
        }
      })

      channel.bind(PUSHER_EVENTS.NOUVEAU_COMMENTAIRE, (data: { postId: string; commentaire: CommentaireData }) => {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === data.postId
              ? { ...p, commentairesCount: p.commentairesCount + 1 }
              : p
          )
        )
      })

      channel.bind(PUSHER_EVENTS.POST_SUPPRIME, (data: { postId: string }) => {
        setPosts((prev) => prev.filter((p) => p.id !== data.postId))
      })

      return () => {
        channel.unbind_all()
        pusher.unsubscribe(PUSHER_CHANNELS.communaute)
      }
    } catch {
      // Pusher optionnel — pas d'erreur bloquante si non configuré
    }
  }, [status, currentUserId])

  function handleNewPost(post: PostData) {
    setPosts((prev) => [post, ...prev])
  }

  function handleDelete(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id))
  }

  async function handleReaction(postId: string, type: ReactionType) {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p
        const wasReacted = p.userReaction === type
        const newCounts = { ...p.reactionCounts }
        if (p.userReaction && newCounts[p.userReaction]) {
          newCounts[p.userReaction]--
          if (newCounts[p.userReaction] <= 0) delete newCounts[p.userReaction]
        }
        if (!wasReacted) newCounts[type] = (newCounts[type] || 0) + 1
        return {
          ...p,
          userReaction: wasReacted ? null : type,
          reactionCounts: newCounts,
          reactionsCount: p.reactionsCount + (wasReacted ? -1 : p.userReaction ? 0 : 1),
        }
      })
    )
    await fetch(`/api/communaute/posts/${postId}/reaction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    })
  }

  async function handleToggleSave(postId: string) {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, saved: !p.saved } : p)))
    await fetch(`/api/communaute/posts/${postId}/sauvegarder`, { method: "POST" })
  }

  function handleNewComment(postId: string, comment: CommentaireData) {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, commentaires: [...p.commentaires, comment], commentairesCount: p.commentairesCount + 1 }
          : p
      )
    )
  }

  // Repost
  const [repostData, setRepostData] = useState<PostData | null>(null)

  function handleShare(post: PostData) {
    setRepostData(post)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Épingler / Désépingler
  async function handleTogglePin(postId: string) {
    const target = posts.find((p) => p.id === postId)
    if (!target) return
    const newVal = !target.epingle
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, epingle: newVal } : p)))
    await fetch(`/api/communaute/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ epingle: newVal }),
    })
  }

  if (status === "loading" || loading) {
    return (
      <section className="mx-auto max-w-2xl space-y-5">
        {/* Skeleton nouveau post */}
        <div className="bg-white border border-border-brand p-5 animate-pulse">
          <div className="flex gap-3">
            <div className="w-9.5 h-9.5 rounded-full bg-border-brand" />
            <div className="flex-1 space-y-2">
              <div className="h-16 bg-bg-page border border-border-brand" />
              <div className="flex justify-between">
                <div className="flex gap-2">
                  <div className="w-7 h-7 bg-border-brand" />
                  <div className="w-7 h-7 bg-border-brand" />
                  <div className="w-7 h-7 bg-border-brand" />
                </div>
                <div className="w-20 h-8 bg-border-brand" />
              </div>
            </div>
          </div>
        </div>
        {/* Skeleton posts */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-border-brand overflow-hidden animate-pulse">
            <div className="flex items-center gap-3 px-5 pt-5 pb-3">
              <div className="w-10 h-10 rounded-full bg-border-brand" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-32 bg-border-brand" />
                <div className="h-2.5 w-16 bg-bg-page" />
              </div>
            </div>
            <div className="px-5 pb-3 space-y-2">
              <div className="h-3 w-full bg-bg-page" />
              <div className="h-3 w-4/5 bg-bg-page" />
              <div className="h-3 w-3/5 bg-bg-page" />
            </div>
            <div className="h-48 bg-bg-page border-t border-border-brand" />
            <div className="flex border-t border-border-brand">
              <div className="flex-1 py-3 flex justify-center"><div className="h-4 w-16 bg-border-brand" /></div>
              <div className="flex-1 py-3 flex justify-center border-l border-border-brand"><div className="h-4 w-20 bg-border-brand" /></div>
              <div className="px-4 py-3 border-l border-border-brand"><div className="h-4 w-4 bg-border-brand" /></div>
            </div>
          </div>
        ))}
      </section>
    )
  }

  const currentUser: Auteur = {
    id: session!.user.id,
    nom: session!.user.nom ?? "",
    prenom: session!.user.prenom ?? "",
    photoUrl: session!.user.photoUrl ?? null,
  }

  return (
    <section className="mx-auto max-w-2xl space-y-5">
      <StoriesBandeau currentUserId={currentUser.id} />
      <NouveauPost user={currentUser} onPost={handleNewPost} repostData={repostData} onCancelRepost={() => setRepostData(null)} />

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center bg-primary-light mb-4 rounded-full">
            <MessageCircle size={28} className="text-primary-brand" />
          </div>
          <p className="font-display text-[18px] font-light text-text-main">Aucune publication pour l&apos;instant</p>
          <p className="font-body text-[12px] text-text-muted-brand mt-1">Soyez le premier à publier !</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <CartePost
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              onDelete={handleDelete}
              onReaction={handleReaction}
              onToggleSave={handleToggleSave}
              onNewComment={handleNewComment}
              onShare={handleShare}
              onTogglePin={handleTogglePin}
            />
          ))}
          {page < totalPages && (
            <div className="flex justify-center pt-2 pb-4">
              <button
                onClick={() => fetchPosts(page + 1, true)}
                disabled={loadingMore}
                className="flex items-center gap-2 border border-border-brand bg-white px-6 py-2.5 font-body text-[11px] font-medium uppercase tracking-[0.12em] text-text-mid hover:border-gold hover:text-gold transition-colors disabled:opacity-40"
              >
                {loadingMore ? <Loader2 size={14} className="animate-spin" /> : <ChevronDown size={14} />}
                Voir plus
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
