"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Plus, X, Loader2, Eye, ChevronLeft, ChevronRight, Trash2, ImageIcon, Video, Type, Check } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import Image from "next/image"
import BadgeVerification from "@/components/ui/BadgeVerification"

/* ━━━━━━━━━━ Types ━━━━━━━━━━ */

interface StoryAuteur {
  id: string
  nom: string
  prenom: string
  pseudo?: string | null
  photoUrl: string | null
  role?: string
  statutProfil?: string | null
  verificationStatus?: string | null
}

interface StoryData {
  id: string
  type: "TEXTE" | "IMAGE" | "VIDEO"
  contenu: string | null
  mediaUrl: string | null
  couleurFond: string | null
  visibilite: "PUBLIC" | "CONNEXIONS"
  viewers: string[]
  auteur: StoryAuteur
  createdAt: string
  expiresAt: string
}

interface StoryGroupe {
  auteur: StoryAuteur
  stories: StoryData[]
  hasUnseen: boolean
}

interface ViewerData {
  id: string
  nom: string
  prenom: string
  pseudo: string | null
  photoUrl: string | null
}

/* ━━━━━━━━━━ Palette de couleurs pour stories textuelles ━━━━━━━━━━ */

const COULEURS_STORY = [
  "#2D7A1F", // primary-brand
  "#B8972A", // gold
  "#1a1a2e", // sombre
  "#e94560", // rose
  "#0f3460", // bleu nuit
  "#16213e", // marine
  "#533483", // violet
  "#2c3e50", // ardoise
]

/* ━━━━━━━━━━ Avatar Helper ━━━━━━━━━━ */

function StoryAvatar({ user, size = 56 }: { user: StoryAuteur; size?: number }) {
  const initiales = `${user.prenom?.[0] ?? ""}${user.nom?.[0] ?? ""}`.toUpperCase()
  return user.photoUrl ? (
    <Image
      src={user.photoUrl}
      alt={`Photo de ${user.prenom} ${user.nom}`}
      width={size}
      height={size}
      className="rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className="flex items-center justify-center rounded-full bg-primary-brand text-white font-body text-[13px] font-medium"
      style={{ width: size, height: size }}
    >
      {initiales}
    </div>
  )
}

/* ━━━━━━━━━━ Modal de création ━━━━━━━━━━ */

function ModalCreation({ onClose, onCreated }: { onClose: () => void; onCreated: (story: StoryData) => void }) {
  const [mode, setMode] = useState<"TEXTE" | "IMAGE" | "VIDEO">("TEXTE")
  const [contenu, setContenu] = useState("")
  const [couleur, setCouleur] = useState(COULEURS_STORY[0])
  const [mediaUrl, setMediaUrl] = useState("")
  const [uploading, setUploading] = useState(false)
  const [visibilite, setVisibilite] = useState<"PUBLIC" | "CONNEXIONS">("PUBLIC")
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      if (mode !== "VIDEO") {
        // Images : upload serveur + compression Sharp (A15)
        const formData = new FormData()
        formData.append("file", file)
        formData.append("folder", "surnaturel-de-dieu/stories")
        const res = await fetch("/api/upload/signe", { method: "POST", body: formData })
        if (res.ok) {
          const data: { secureUrl: string } = await res.json()
          setMediaUrl(data.secureUrl)
        }
      } else {
        // Vidéos : signature uniquement, upload direct Cloudinary (pas de compression serveur)
        const sigRes = await fetch("/api/upload/signe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder: "surnaturel-de-dieu/stories", resourceType: "video" }),
        })
        if (!sigRes.ok) throw new Error("Erreur de signature upload")
        const { signature, timestamp, apiKey, cloudName, folder } = await sigRes.json()

        const formData = new FormData()
        formData.append("file", file)
        formData.append("api_key", apiKey)
        formData.append("timestamp", String(timestamp))
        formData.append("signature_algorithm", "SHA256")
        formData.append("signature", signature)
        formData.append("folder", folder)
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
          { method: "POST", body: formData }
        )
        if (res.ok) {
          const data = await res.json()
          setMediaUrl(data.secure_url)
        }
      }
    } finally {
      setUploading(false)
    }
  }

  async function handlePublier() {
    setLoading(true)
    try {
      const body: Record<string, string> = { type: mode, visibilite }
      if (mode === "TEXTE") {
        body.contenu = contenu
        body.couleurFond = couleur
      } else {
        body.mediaUrl = mediaUrl
        if (contenu.trim()) body.contenu = contenu
      }
      const res = await fetch("/api/communaute/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const story = await res.json()
        onCreated(story)
        onClose()
      }
    } finally {
      setLoading(false)
    }
  }

  const canPublier =
    mode === "TEXTE" ? contenu.trim().length > 0 : mediaUrl.length > 0

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="relative w-full max-w-md mx-4 bg-white border border-border-brand shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-brand px-5 py-3">
          <h3 className="font-display text-[16px] font-light text-text-main">Nouvelle story</h3>
          <button onClick={onClose} className="p-1 text-text-muted-brand hover:text-text-main transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Mode selector */}
        <div className="flex border-b border-border-brand">
          {([
            { value: "TEXTE" as const, icon: Type, label: "Texte" },
            { value: "IMAGE" as const, icon: ImageIcon, label: "Image" },
            { value: "VIDEO" as const, icon: Video, label: "Vidéo" },
          ]).map((m) => (
            <button
              key={m.value}
              onClick={() => { setMode(m.value); setMediaUrl(""); setContenu("") }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 font-body text-xs font-medium uppercase tracking-widest transition-colors ${
                mode === m.value ? "text-primary-brand border-b-2 border-primary-brand" : "text-text-muted-brand hover:text-text-mid"
              }`}
            >
              <m.icon size={14} />
              {m.label}
            </button>
          ))}
        </div>

        {/* Contenu */}
        <div className="p-5 space-y-4">
          {/* Aperçu */}
          <div className="relative w-full aspect-9/16 max-h-80 overflow-hidden border border-border-brand mx-auto" style={{ maxWidth: 200 }}>
            {mode === "TEXTE" && (
              <div
                className="absolute inset-0 flex items-center justify-center p-4"
                style={{ backgroundColor: couleur }}
              >
                <p className="font-display text-[14px] text-white text-center leading-relaxed wrap-break-word">
                  {contenu || "Aperçu de votre story…"}
                </p>
              </div>
            )}
            {mode === "IMAGE" && mediaUrl ? (
              <Image src={mediaUrl} alt="Aperçu de la story" fill className="object-cover" />
            ) : mode === "IMAGE" && (
              <div className="absolute inset-0 flex items-center justify-center bg-bg-page">
                <ImageIcon size={32} className="text-border-brand" />
              </div>
            )}
            {mode === "VIDEO" && mediaUrl ? (
              <video src={mediaUrl} className="absolute inset-0 w-full h-full object-cover" muted autoPlay loop />
            ) : mode === "VIDEO" && (
              <div className="absolute inset-0 flex items-center justify-center bg-bg-page">
                <Video size={32} className="text-border-brand" />
              </div>
            )}
          </div>

          {/* Texte input */}
          {mode === "TEXTE" && (
            <>
              <textarea
                value={contenu}
                onChange={(e) => setContenu(e.target.value)}
                placeholder="Écrivez votre story…"
                maxLength={500}
                rows={3}
                className="w-full border border-border-brand bg-bg-page px-3 py-2 font-body text-[13px] text-text-main placeholder:text-text-muted-brand focus:border-gold focus:outline-none transition-colors resize-none"
              />
              <div className="flex flex-wrap gap-2">
                {COULEURS_STORY.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCouleur(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${couleur === c ? "border-gold scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </>
          )}

          {/* Upload média */}
          {(mode === "IMAGE" || mode === "VIDEO") && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept={mode === "IMAGE" ? "image/*" : "video/*"}
                onChange={handleUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 border border-border-brand bg-bg-page px-4 py-3 font-body text-[12px] text-text-mid hover:border-gold transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <><Loader2 size={14} className="animate-spin" /> Upload en cours…</>
                ) : (
                  <>{mode === "IMAGE" ? <ImageIcon size={14} /> : <Video size={14} />} Choisir {mode === "IMAGE" ? "une image" : "une vidéo (max 15s)"}</>
                )}
              </button>
              {mediaUrl && (
                <textarea
                  value={contenu}
                  onChange={(e) => setContenu(e.target.value)}
                  placeholder="Légende (optionnel)…"
                  maxLength={200}
                  rows={2}
                  className="w-full border border-border-brand bg-bg-page px-3 py-2 font-body text-[12px] text-text-main placeholder:text-text-muted-brand focus:border-gold focus:outline-none transition-colors resize-none"
                />
              )}
            </>
          )}

          {/* Visibilité */}
          <div className="flex items-center gap-3">
            <span className="font-body text-xs text-text-muted-brand">Visibilité :</span>
            {(["PUBLIC", "CONNEXIONS"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVisibilite(v)}
                className={`px-3 py-1 font-body text-xs uppercase tracking-widest border transition-colors ${
                  visibilite === v ? "border-primary-brand bg-primary-brand text-white" : "border-border-brand text-text-mid hover:border-gold"
                }`}
              >
                {v === "PUBLIC" ? "Public" : "Connexions"}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border-brand px-5 py-3 flex justify-end">
          <button
            onClick={handlePublier}
            disabled={!canPublier || loading}
            className="flex items-center gap-2 bg-primary-brand px-5 py-2 font-body text-xs font-medium uppercase tracking-[0.15em] text-white hover:bg-primary-dark transition-colors disabled:opacity-40"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            Publier
          </button>
        </div>
      </div>
    </div>
  )
}

/* ━━━━━━━━━━ Lecteur plein écran ━━━━━━━━━━ */

function LecteurStory({
  groupes,
  startIndex,
  currentUserId,
  onClose,
  onViewed,
}: {
  groupes: StoryGroupe[]
  startIndex: number
  currentUserId: string
  onClose: () => void
  onViewed: (storyId: string) => void
}) {
  const [groupeIdx, setGroupeIdx] = useState(startIndex)
  const [storyIdx, setStoryIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const [showViewers, setShowViewers] = useState(false)
  const [viewers, setViewers] = useState<ViewerData[]>([])
  const [loadingViewers, setLoadingViewers] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const DURATION = 5000 // 5 secondes par story

  const groupe = groupes[groupeIdx]
  const story = groupe?.stories[storyIdx]
  const isOwnStory = groupe?.auteur.id === currentUserId

  // Progress bar + auto-avance
  useEffect(() => {
    if (!story || showViewers) return
    setProgress(0)
    const start = Date.now()
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start
      const pct = Math.min(100, (elapsed / DURATION) * 100)
      setProgress(pct)
      if (pct >= 100) nextStory()
    }, 50)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupeIdx, storyIdx, showViewers])

  // Marquer comme vue
  useEffect(() => {
    if (!story) return
    if (!story.viewers.includes(currentUserId)) {
      onViewed(story.id)
      fetch(`/api/communaute/stories/${story.id}/vue`, { method: "POST" })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id])

  function nextStory() {
    if (timerRef.current) clearInterval(timerRef.current)
    if (storyIdx < groupe.stories.length - 1) {
      setStoryIdx(storyIdx + 1)
    } else if (groupeIdx < groupes.length - 1) {
      setGroupeIdx(groupeIdx + 1)
      setStoryIdx(0)
    } else {
      onClose()
    }
  }

  function prevStory() {
    if (timerRef.current) clearInterval(timerRef.current)
    if (storyIdx > 0) {
      setStoryIdx(storyIdx - 1)
    } else if (groupeIdx > 0) {
      setGroupeIdx(groupeIdx - 1)
      const prevGroupe = groupes[groupeIdx - 1]
      setStoryIdx(prevGroupe.stories.length - 1)
    }
  }

  async function handleShowViewers() {
    if (!isOwnStory || !story) return
    setShowViewers(true)
    setLoadingViewers(true)
    try {
      const res = await fetch(`/api/communaute/stories/${story.id}/vue`)
      if (res.ok) {
        const data = await res.json()
        setViewers(data.viewers)
      }
    } finally {
      setLoadingViewers(false)
    }
  }

  async function handleDeleteStory() {
    if (!story) return
    await fetch(`/api/communaute/stories/${story.id}`, { method: "DELETE" })
    if (groupe.stories.length === 1) {
      if (groupes.length === 1) {
        onClose()
      } else {
        setGroupeIdx(Math.min(groupeIdx, groupes.length - 2))
        setStoryIdx(0)
      }
    } else {
      setStoryIdx(Math.max(0, storyIdx - 1))
    }
  }

  if (!story) return null

  return (
    <div className="fixed inset-0 z-70 bg-black flex items-center justify-center">
      {/* Zones de navigation (clic gauche/droite) */}
      <div className="absolute inset-0 flex">
        <button onClick={prevStory} className="w-1/3 h-full cursor-pointer" aria-label="Précédent" />
        <div className="w-1/3 h-full" />
        <button onClick={nextStory} className="w-1/3 h-full cursor-pointer" aria-label="Suivant" />
      </div>

      {/* Contenu central */}
      <div className="relative w-full max-w-105 h-full max-h-screen flex flex-col">
        {/* Barre de progression segmentée */}
        <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 px-3 pt-2">
          {groupe.stories.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/30 overflow-hidden">
              <div
                className="h-full bg-white transition-all"
                style={{
                  width: i < storyIdx ? "100%" : i === storyIdx ? `${progress}%` : "0%",
                  transition: i === storyIdx ? "none" : undefined,
                }}
              />
            </div>
          ))}
        </div>

        {/* Header — auteur + fermer */}
        <div className="absolute top-4 left-0 right-0 z-10 flex items-center justify-between px-4 pt-2">
          <div className="flex items-center gap-2.5">
            <StoryAvatar user={groupe.auteur} size={36} />
            <div>
              <p className="font-body text-[13px] font-medium text-white drop-shadow-sm">
                {groupe.auteur.prenom} {groupe.auteur.nom}
                <BadgeVerification status={groupe.auteur.verificationStatus} size={12} className="ml-1" />
              </p>
              <p className="font-body text-xs text-white/70">
                {formatDistanceToNow(new Date(story.createdAt), { addSuffix: true, locale: fr })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOwnStory && (
              <button onClick={handleDeleteStory} className="p-1.5 text-white/70 hover:text-white transition-colors">
                <Trash2 size={18} />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 text-white/70 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Contenu de la story */}
        <div className="flex-1 flex items-center justify-center">
          {story.type === "TEXTE" && (
            <div
              className="absolute inset-0 flex items-center justify-center p-8"
              style={{ backgroundColor: story.couleurFond || "#2D7A1F" }}
            >
              <p className="font-display text-[22px] text-white text-center leading-relaxed wrap-break-word max-w-full">
                {story.contenu}
              </p>
            </div>
          )}
          {story.type === "IMAGE" && story.mediaUrl && (
            <Image src={story.mediaUrl} alt={story.contenu || "Story image"} fill className="object-contain" />
          )}
          {story.type === "VIDEO" && story.mediaUrl && (
            <video
              src={story.mediaUrl}
              className="absolute inset-0 w-full h-full object-contain"
              autoPlay
              muted
              playsInline
            />
          )}
          {/* Légende overlay pour image/vidéo */}
          {story.type !== "TEXTE" && story.contenu && (
            <div className="absolute bottom-20 left-0 right-0 z-10 px-6">
              <p className="font-body text-[13px] text-white text-center drop-shadow-lg bg-black/40 px-3 py-2">
                {story.contenu}
              </p>
            </div>
          )}
        </div>

        {/* Footer — compteur de vues (auteur uniquement) */}
        {isOwnStory && (
          <div className="absolute bottom-4 left-0 right-0 z-10 flex justify-center">
            <button
              onClick={handleShowViewers}
              className="flex items-center gap-1.5 px-4 py-2 bg-black/40 text-white font-body text-xs hover:bg-black/60 transition-colors"
            >
              <Eye size={14} />
              {story.viewers.length} vue{story.viewers.length !== 1 ? "s" : ""}
            </button>
          </div>
        )}
      </div>

      {/* Flèches navigation desktop */}
      <button
        onClick={prevStory}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-10 w-10 items-center justify-center bg-black/40 text-white hover:bg-black/60 transition-colors rounded-full"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        onClick={nextStory}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-10 w-10 items-center justify-center bg-black/40 text-white hover:bg-black/60 transition-colors rounded-full"
      >
        <ChevronRight size={22} />
      </button>

      {/* Panel viewers */}
      {showViewers && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-30 w-full max-w-105 bg-white border-t border-border-brand max-h-[40vh] overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-brand">
            <span className="font-display text-[14px] text-text-main">Vues ({viewers.length})</span>
            <button onClick={() => setShowViewers(false)} className="text-text-muted-brand hover:text-text-main">
              <X size={16} />
            </button>
          </div>
          {loadingViewers ? (
            <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-gold" /></div>
          ) : viewers.length === 0 ? (
            <p className="px-4 py-6 text-center font-body text-[12px] text-text-muted-brand">Aucune vue pour le moment</p>
          ) : (
            <div className="divide-y divide-border-brand">
              {viewers.map((v) => (
                <div key={v.id} className="flex items-center gap-3 px-4 py-2.5">
                  {v.photoUrl ? (
                    <Image src={v.photoUrl} alt={`Photo de ${v.prenom} ${v.nom}`} width={32} height={32} className="rounded-full object-cover" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-brand text-white font-body text-xs">
                      {v.prenom[0]}{v.nom[0]}
                    </div>
                  )}
                  <span className="font-body text-[12px] text-text-main">{v.prenom} {v.nom}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ━━━━━━━━━━ Bandeau principal (export) ━━━━━━━━━━ */

export default function StoriesBandeau({ currentUserId }: { currentUserId: string }) {
  const [groupes, setGroupes] = useState<StoryGroupe[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const fetchStories = useCallback(async () => {
    try {
      const res = await fetch("/api/communaute/stories")
      if (res.ok) {
        const data = await res.json()
        setGroupes(data.groupes)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStories()
  }, [fetchStories])

  function handleCreated(story: StoryData) {
    setGroupes((prev) => {
      const existing = prev.find((g) => g.auteur.id === currentUserId)
      if (existing) {
        return prev.map((g) =>
          g.auteur.id === currentUserId
            ? { ...g, stories: [story, ...g.stories] }
            : g
        )
      }
      return [{ auteur: story.auteur, stories: [story], hasUnseen: false }, ...prev]
    })
  }

  function handleViewed(storyId: string) {
    setGroupes((prev) =>
      prev.map((g) => ({
        ...g,
        stories: g.stories.map((s) =>
          s.id === storyId && !s.viewers.includes(currentUserId)
            ? { ...s, viewers: [...s.viewers, currentUserId] }
            : s
        ),
      }))
    )
  }

  const myGroupeIndex = groupes.findIndex((g) => g.auteur.id === currentUserId)
  const hasOwnStories = myGroupeIndex >= 0 && groupes[myGroupeIndex].stories.length > 0

  if (loading) {
    return (
      <div className="bg-white border border-border-brand px-4 py-3">
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 animate-pulse">
              <div className="h-15 w-15 rounded-full bg-border-brand" />
              <div className="h-2 w-12 bg-bg-page" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white border border-border-brand px-4 py-3">
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
          {/* Bouton ajouter / ma story */}
          <button
            onClick={() => hasOwnStories ? setViewerIndex(myGroupeIndex) : setShowModal(true)}
            className="flex flex-col items-center gap-1.5 shrink-0"
          >
            <div className="relative">
              {hasOwnStories ? (
                <div className="p-0.5 rounded-full bg-linear-to-br from-primary-brand to-gold">
                  <div className="bg-white rounded-full p-0.5">
                    <StoryAvatar user={groupes[myGroupeIndex].auteur} size={52} />
                  </div>
                </div>
              ) : (
                <div className="flex h-15 w-15 items-center justify-center rounded-full border-2 border-dashed border-border-brand bg-bg-page">
                  <Plus size={22} className="text-text-muted-brand" />
                </div>
              )}
              {!hasOwnStories && (
                <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary-brand text-white">
                  <Plus size={10} />
                </div>
              )}
            </div>
            <span className="font-body text-xs text-text-muted-brand truncate max-w-16">
              {hasOwnStories ? "Ma story" : "Ajouter"}
            </span>
          </button>

          {/* Stories des autres */}
          {groupes.map((groupe, idx) => {
            if (groupe.auteur.id === currentUserId) return null
            return (
              <button
                key={groupe.auteur.id}
                onClick={() => setViewerIndex(idx)}
                className="flex flex-col items-center gap-1.5 shrink-0"
              >
                <div className={`p-0.5 rounded-full ${groupe.hasUnseen ? "bg-linear-to-br from-primary-brand to-gold" : "bg-border-brand"}`}>
                  <div className="bg-white rounded-full p-0.5">
                    <StoryAvatar user={groupe.auteur} size={52} />
                  </div>
                </div>
                <span className="font-body text-xs text-text-muted-brand truncate max-w-16">
                  {groupe.auteur.prenom}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Modal de création */}
      {showModal && (
        <ModalCreation onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}

      {/* Lecteur plein écran */}
      {viewerIndex !== null && groupes.length > 0 && (
        <LecteurStory
          groupes={groupes}
          startIndex={viewerIndex}
          currentUserId={currentUserId}
          onClose={() => setViewerIndex(null)}
          onViewed={handleViewed}
        />
      )}
    </>
  )
}
