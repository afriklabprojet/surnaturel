"use client"

import { useState, useEffect, useRef, useCallback, memo } from "react"
import Image from "next/image"
import { Send, Loader2, MessageSquare, Mic, X, Reply, Play, Pause, CornerDownRight, Clock, AlertCircle, RotateCcw, Trash2, ImageIcon, Edit2, Pin, Share2, Search, SmilePlus, Timer, Paperclip, Download, CalendarClock, FileText, FileSpreadsheet, File as FileIcon, Plus, ArrowDown, CheckCheck, Check } from "lucide-react"
import { toast } from "sonner"
import { Avatar, getAvatarStyle } from "@/components/messagerie/ListeConversations"
import { useConfirm } from "@/components/ui/confirm-dialog"
import type { MessageData, Interlocuteur, ReactionData } from "@/types/messages"

// ─── CSS keyframes pour typing dots + waveform ─────────────────
const typingKeyframes = `
@keyframes typingDot {
  0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
  30% { opacity: 1; transform: translateY(-3px); }
}
@keyframes pulse-wave {
  0%, 100% { transform: scaleY(0.4); }
  50% { transform: scaleY(1); }
}
`

// Carte de rétrocompatibilité : anciens types → emoji
const REACTION_LEGACY_MAP: Record<string, string> = {
  JAIME: "❤️",
  SOUTIEN: "🤝",
  ENCOURAGEMENT: "💪",
  BRAVO: "👏",
  INSPIRATION: "✨",
}
// Emojis rapides affichés dans le picker de réactions
const REACTION_QUICK = ["❤️", "😂", "😮", "😢", "🔥", "👍", "👎", "🙏"]
// Emojis rapides (première ligne) + accès au picker complet

// ─── Emoji picker data ──────────────────────────────────────────
const EMOJI_CATEGORIES = [
  { name: "😀", label: "Visages", emojis: ["😀","😁","😂","🤣","😃","😄","😅","😆","😊","😇","🙂","😍","🤩","😘","🥰","😋","😛","😜","🤔","😬","😏","😒","😔","😟","😕","😣","😫","😩","🥺","😢","😭","😤","😠","🤬","😳","😱","😨","🤗","🤭","😶","😐","🙄","😮","🥴","😴","🤢","😷","🤒","😈","👿","💩","👻"] },
  { name: "👋", label: "Mains", emojis: ["👋","🤚","✋","👌","✌️","🤞","🤟","🤘","👈","👉","👆","👇","👍","👎","✊","👊","🤛","🤜","👏","🙌","🙏","💪","✍️","🫀"] },
  { name: "❤️", label: "Cœurs", emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","❤️‍🔥","💔","❣️","💕","💞","💓","💗","💖","💘","💝"] },
  { name: "🎉", label: "Fête", emojis: ["🎉","🎊","🎈","🎁","🎀","🎆","🎇","✨","⭐","🌟","💫","🔥","🌈","☀️","🌙","⚡","🌊","💯","🔔","🥳","🍕","🍔","☕","🍺","🥂","🍾"] },
]

interface FenetreChatProps {
  interlocuteur: Interlocuteur | null
  currentUserId: string
  messages: MessageData[]
  isTyping: boolean
  onSendMessage: (contenu: string, replyToId?: string) => void
  onSendVocal: (file: Blob, duree: number, replyToId?: string) => void
  onReaction: (messageId: string, type: string) => void
  onTyping: (enCours: boolean) => void
  onRetry?: (tempId: string) => void
  onDelete?: (messageId: string) => void
  onSendImage?: (file: File, replyToId?: string) => void
  onEdit?: (messageId: string, nouveauContenu: string) => void
  onPin?: (messageId: string, epingle: boolean) => void
  onForward?: (contenu: string, type: string, contactId: string) => void
  onSendFile?: (file: File, replyToId?: string) => void
  onSendVideo?: (file: File, replyToId?: string) => void
  onSchedule?: (contenu: string, programmeA: Date, replyToId?: string) => void
  onExport?: () => void
  onLoadMore?: () => void
  hasMore?: boolean
  loadingMore?: boolean
  loading: boolean
  presenceEnLigne?: boolean
  derniereVueLe?: string | null
  ephemere?: boolean
  onToggleEphemere?: () => void
  contacts?: { id: string; nom: string; prenom: string; photoUrl: string | null }[]
  pushActive?: boolean
  onTogglePush?: () => void
}

function formatHeureMessage(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("fr", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const oneDay = 86400000

  if (diff < oneDay && date.getDate() === now.getDate()) return "Aujourd\u2019hui"
  if (diff < 2 * oneDay) return "Hier"
  return date.toLocaleDateString("fr", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

function formatDuree(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

function groupReactions(reactions: ReactionData[]) {
  const map: Record<string, number> = {}
  for (const r of reactions) {
    map[r.type] = (map[r.type] || 0) + 1
  }
  return Object.entries(map).map(([type, count]) => ({ type, count }))
}

// Module-level: défini une seule fois, jamais recréé par React
function IconeFichier({ nom }: { nom: string }) {
  const ext = nom.split(".").pop()?.toLowerCase()
  if (ext === "pdf") return <FileText size={18} className="text-danger" />
  if (["xls", "xlsx", "csv"].includes(ext ?? "")) return <FileSpreadsheet size={18} className="text-primary-brand" />
  return <FileIcon size={18} className="text-text-muted-brand" />
}

// Module-level: accepte searchQuery en paramètre — plus de closure stale
function highlightText(text: string, searchQuery: string) {
  if (!searchQuery) return <span className="whitespace-pre-wrap">{text}</span>
  const idx = text.toLowerCase().indexOf(searchQuery.toLowerCase())
  if (idx === -1) return <span className="whitespace-pre-wrap">{text}</span>
  return (
    <span className="whitespace-pre-wrap">
      {text.slice(0, idx)}
      <mark className="bg-gold/30 text-text-main">{text.slice(idx, idx + searchQuery.length)}</mark>
      {text.slice(idx + searchQuery.length)}
    </span>
  )
}

function formatTaille(octets: number): string {
  if (octets < 1024) return `${octets} o`
  if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(0)} Ko`
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`
}

/* ━━━━━━━━━━ Lecteur audio vocal (memoized) ━━━━━━━━━━ */
const LecteurVocal = memo(function LecteurVocal({ url, duree }: { url: string; duree?: number | null }) {
  "use no memo"
  // Forcer MP3 via Cloudinary pour compatibilité universelle (Chrome webm → Safari mp3)
  const audioUrl = url.includes("cloudinary.com") && url.includes("/video/upload/")
    ? url.replace("/video/upload/", "/video/upload/f_mp3/")
    : url

  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [totalDuree, setTotalDuree] = useState(duree || 0)
  const [vitesse, setVitesse] = useState(1)

  // Garde défensive : URL invalide → on n'attache pas les listeners mais on rend un fallback
  const isValid = audioUrl.startsWith("http")

  useEffect(() => {
    if (!isValid) return
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => {
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100)
    }
    const onEnd = () => { setPlaying(false); setProgress(0) }
    const onMeta = () => { if (audio.duration && !duree) setTotalDuree(Math.round(audio.duration)) }
    audio.addEventListener("timeupdate", onTime)
    audio.addEventListener("ended", onEnd)
    audio.addEventListener("loadedmetadata", onMeta)
    return () => { audio.removeEventListener("timeupdate", onTime); audio.removeEventListener("ended", onEnd); audio.removeEventListener("loadedmetadata", onMeta) }
  }, [duree, isValid])

  async function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      try {
        await audio.play()
        setPlaying(true)
      } catch {
        setPlaying(false)
      }
    }
  }

  function setSpeed() {
    const next = vitesse === 1 ? 1.5 : 1
    setVitesse(next)
    if (audioRef.current) audioRef.current.playbackRate = next
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current
    if (!audio || !audio.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    audio.currentTime = ratio * audio.duration
  }

  if (!isValid) return (
    <span className="font-body text-[12px] opacity-75 italic">🎤 Envoi en cours…</span>
  )

  return (
    <div className="flex items-center gap-2 min-w-40">
      <audio ref={audioRef} src={audioUrl} preload="none" />
      <button onClick={togglePlay} className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">
        {playing ? <Pause size={13} /> : <Play size={13} />}
      </button>
      <div className="flex-1 space-y-0.5">
        <div className="h-1.5 bg-white/20 cursor-pointer relative" onClick={handleSeek}>
          <div className="absolute left-0 top-0 h-full bg-white/60 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[9px] opacity-75">{totalDuree ? formatDuree(totalDuree) : "..."}</span>
          <button onClick={setSpeed} className="text-[9px] opacity-75 hover:opacity-100 transition-opacity">{vitesse}x</button>
        </div>
      </div>
    </div>
  )
})

/* ━━━━━━━━━━ ForwardModalBody — liste avec recherche ━━━━━━━━━━ */
function ForwardModalBody({
  contacts,
  onSelect,
}: {
  contacts: { id: string; nom: string; prenom: string; photoUrl: string | null }[]
  onSelect: (contactId: string) => void
}) {
  const [query, setQuery] = useState("")
  const filtered = contacts.filter((c) =>
    `${c.prenom} ${c.nom}`.toLowerCase().includes(query.toLowerCase())
  )
  return (
    <div>
      <div className="px-4 pt-3 pb-2 border-b border-border-brand">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-brand" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher…"
            autoFocus
            className="w-full border border-border-brand bg-bg-page py-2 pl-8 pr-3 font-body text-[12px] outline-none placeholder:text-text-muted-brand/60 focus:border-gold transition-colors"
          />
        </div>
      </div>
      <div className="max-h-56 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="py-6 text-center font-body text-[12px] font-light text-text-muted-brand">Aucun contact trouvé</p>
        ) : filtered.map((contact) => (
          <button
            key={contact.id}
            onClick={() => onSelect(contact.id)}
            className="flex w-full items-center gap-3 px-5 py-3 hover:bg-bg-page transition-colors text-left"
          >
            <Avatar nom={contact.nom} prenom={contact.prenom} size={32} />
            <span className="font-body text-[13px] text-text-main">{contact.prenom} {contact.nom}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ━━━━━━━━━━ Composant principal ━━━━━━━━━━ */
export default function FenetreChat({
  interlocuteur,
  currentUserId,
  messages,
  isTyping,
  onSendMessage,
  onSendVocal,
  onReaction,
  onTyping,
  onRetry,
  onDelete,
  onSendImage,
  onEdit,
  onPin,
  onForward,
  onSendFile,
  onSendVideo,
  onSchedule,
  onLoadMore,
  hasMore,
  loadingMore,
  loading,
  presenceEnLigne,
  derniereVueLe,
  ephemere,
  onToggleEphemere,
  contacts,
  pushActive,
  onTogglePush,
}: FenetreChatProps) {
  const confirm = useConfirm()
  const [saisie, setSaisie] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Citation / réponse
  const [replyTo, setReplyTo] = useState<MessageData | null>(null)

  // Réactions picker
  const [reactionPickerMsg, setReactionPickerMsg] = useState<string | null>(null)

  // Édition d'un message
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")

  // Recherche dans la conversation
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Aperçu image avant envoi
  const [imagePreview, setImagePreview] = useState<{ file: File; url: string } | null>(null)

  // Emoji picker
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
  const [emojiTab, setEmojiTab] = useState(0)

  // Transfert de message
  const [forwardMessage, setForwardMessage] = useState<MessageData | null>(null)

  // Pièce jointe
  const fileJointeRef = useRef<HTMLInputElement>(null)
  const [pieceJointePreview, setPieceJointePreview] = useState<{ file: File; nom: string; taille: number } | null>(null)

  // Vidéo
  const videoInputRef = useRef<HTMLInputElement>(null)
  const [videoPreview, setVideoPreview] = useState<{ file: File; url: string } | null>(null)

  // Message programmé
  const [programmeModalOpen, setProgrammeModalOpen] = useState(false)
  const [programmeDate, setProgrammeDate] = useState("")
  const [programmeHeure, setProgrammeHeure] = useState("")

  // Menu "+" (actions secondaires)
  const [plusMenuOpen, setPlusMenuOpen] = useState(false)

  // Long-press mobile : panneau d'actions
  const [longPressMsg, setLongPressMsg] = useState<string | null>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleTouchStart(msgId: string) {
    longPressTimer.current = setTimeout(() => setLongPressMsg(msgId), 500)
  }
  function handleTouchEnd() {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null }
  }

  // Enregistrement vocal
  const [enregistrement, setEnregistrement] = useState(false)
  const [dureeEnregistrement, setDureeEnregistrement] = useState(0)
  const dureeRef = useRef(0) // ref pour éviter la closure périmée dans recorder.onstop
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  // Durées waveform fixées une seule fois — évite Math.random() dans le render
  const waveformDurationsRef = useRef<number[]>(
    Array.from({ length: 20 }, () => 0.6 + Math.random() * 0.6)
  )

  // ↓ Nouveaux messages — suivi de position de scroll
  const isAtBottomRef = useRef(true)
  const [newMessagesCount, setNewMessagesCount] = useState(0)
  const prevMessagesLengthRef = useRef(messages.length)

  const scrollToBottom = useCallback((force = false) => {
    const container = messagesContainerRef.current
    if (!container && !force) return
    if (force) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
      isAtBottomRef.current = true
      setNewMessagesCount(0)
      return
    }
    // Ne scrolle automatiquement que si l'utilisateur est déjà près du bas (< 150px)
    const distanceFromBottom = container!.scrollHeight - container!.scrollTop - container!.clientHeight
    if (distanceFromBottom < 150) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [])

  // Listener scroll — met à jour isAtBottomRef
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return
    function onScroll() {
      const dist = container!.scrollHeight - container!.scrollTop - container!.clientHeight
      const atBottom = dist < 80
      isAtBottomRef.current = atBottom
      if (atBottom) setNewMessagesCount(0)
    }
    container.addEventListener("scroll", onScroll, { passive: true })
    return () => container.removeEventListener("scroll", onScroll)
  }, [])

  // Détecter les nouveaux messages arrivés pendant que l'user scrolle vers le haut
  useEffect(() => {
    const prev = prevMessagesLengthRef.current
    const curr = messages.length
    if (curr > prev && !loadingMore) {
      // Nouveaux messages arrivés (pas pagination)
      if (!isAtBottomRef.current) {
        setNewMessagesCount((n) => n + (curr - prev))
      }
    }
    prevMessagesLengthRef.current = curr
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length])

  useEffect(() => {
    // Forcer le scroll au bas lors du chargement initial ou changement de conversation
    const container = messagesContainerRef.current
    if (!container) return
    bottomRef.current?.scrollIntoView({ behavior: "instant" })
  }, [interlocuteur?.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping, scrollToBottom])

  // Infinite scroll : charger plus quand on scroll en haut
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container || !onLoadMore) return

    function handleScroll() {
      if (container!.scrollTop < 60 && !loadingMore && hasMore) {
        onLoadMore!()
      }
    }

    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [onLoadMore, loadingMore, hasMore])

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !onSendImage) return
    // Afficher l'aperçu avant envoi — feature 9
    const url = URL.createObjectURL(file)
    setImagePreview({ file, url })
    e.target.value = ""
  }

  function confirmImageSend() {
    if (!imagePreview || !onSendImage) return
    onSendImage(imagePreview.file, replyTo?.id)
    URL.revokeObjectURL(imagePreview.url)
    setImagePreview(null)
    setReplyTo(null)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  function cancelImagePreview() {
    if (imagePreview) URL.revokeObjectURL(imagePreview.url)
    setImagePreview(null)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  function startEdit(msg: MessageData) {
    setEditingMessageId(msg.id)
    setEditContent(msg.contenu)
    setReactionPickerMsg(null)
  }

  function cancelEdit() {
    setEditingMessageId(null)
    setEditContent("")
  }

  function saveEdit() {
    if (!editingMessageId || !editContent.trim() || !onEdit) return
    onEdit(editingMessageId, editContent.trim())
    setEditingMessageId(null)
    setEditContent("")
  }

  function handleForwardClick(msg: MessageData) {
    if (contacts && contacts.length > 0) {
      setForwardMessage(msg)
    } else if (onForward && interlocuteur) {
      onForward(msg.contenu, msg.type ?? "TEXTE", interlocuteur.id)
    }
  }

  // ── Sélection pièce jointe ──
  function handleFileJointeSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !onSendFile) return
    setPieceJointePreview({ file, nom: file.name, taille: file.size })
    e.target.value = ""
  }

  function confirmFileSend() {
    if (!pieceJointePreview || !onSendFile) return
    onSendFile(pieceJointePreview.file, replyTo?.id)
    setPieceJointePreview(null)
    setReplyTo(null)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  function cancelFileSend() {
    setPieceJointePreview(null)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  // ── Sélection vidéo ──
  function handleVideoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !onSendVideo) return
    const url = URL.createObjectURL(file)
    setVideoPreview({ file, url })
    e.target.value = ""
  }

  function confirmVideoSend() {
    if (!videoPreview || !onSendVideo) return
    onSendVideo(videoPreview.file, replyTo?.id)
    URL.revokeObjectURL(videoPreview.url)
    setVideoPreview(null)
    setReplyTo(null)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  function cancelVideoPreview() {
    if (videoPreview) URL.revokeObjectURL(videoPreview.url)
    setVideoPreview(null)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  // ── Export de la conversation ──
  function exportConversation() {
    if (!interlocuteur || messages.length === 0) return
    const nom = `${interlocuteur.prenom} ${interlocuteur.nom}`
    const lignes = messages
      .filter((m) => !m._optimistic)
      .map((m) => {
        const date = new Date(m.createdAt).toLocaleString("fr")
        const qui = m.expediteurId === currentUserId ? "Moi" : `${m.expediteur.prenom} ${m.expediteur.nom}`
        const contenu = m.type === "VOCAL" ? "[Message vocal]" : m.type === "MEDIA" ? "[Image]" : m.type === "FICHIER" ? `[Fichier] ${m.contenu.split("|")[0]?.replace("[fichier] ", "")}` : m.contenu
        return `[${date}] ${qui}: ${contenu}`
      })
    const blob = new Blob([`Conversation avec ${nom}\n${"─".repeat(40)}\n\n${lignes.join("\n")}`], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `conversation-${nom.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0,10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Envoi programmé ──
  function confirmSchedule() {
    const text = saisie.trim()
    if (!text || !programmeDate || !programmeHeure || !onSchedule) return
    const dt = new Date(`${programmeDate}T${programmeHeure}:00`)
    if (isNaN(dt.getTime()) || dt <= new Date()) return
    onSchedule(text, dt, replyTo?.id)
    setSaisie("")
    setReplyTo(null)
    setProgrammeModalOpen(false)
    setProgrammeDate("")
    setProgrammeHeure("")
  }

  useEffect(() => {
    setSaisie("")
    setReplyTo(null)
    setEditingMessageId(null)
    setSearchOpen(false)
    setSearchQuery("")
    if (imagePreview) URL.revokeObjectURL(imagePreview.url)
    setImagePreview(null)
    setEmojiPickerOpen(false)
    setForwardMessage(null)
    setPieceJointePreview(null)
    setProgrammeModalOpen(false)
    setProgrammeDate("")
    setProgrammeHeure("")
    setPlusMenuOpen(false)
    if (textareaRef.current) textareaRef.current.style.height = "auto"
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interlocuteur?.id])

  function handleInputChange(value: string) {
    setSaisie(value)
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px"
    }
    onTyping(true)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => { onTyping(false) }, 2000)
  }

  function sendMessage() {
    const text = saisie.trim()
    if (!text || !interlocuteur) return
    onSendMessage(text, replyTo?.id)
    setSaisie("")
    setReplyTo(null)
    if (textareaRef.current) textareaRef.current.style.height = "auto"
    onTyping(false)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  function handleSubmit(e: React.FormEvent) { e.preventDefault(); sendMessage() }

  // ── Scroll vers message cité ──
  function scrollToMessage(msgId: string) {
    const el = messageRefs.current.get(msgId)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" })
      el.classList.add("bg-gold-light/50")
      setTimeout(() => el.classList.remove("bg-gold-light/50"), 1500)
    }
  }

  // ── Enregistrement vocal ──
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4",
      })
      chunksRef.current = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
        if (blob.size > 0 && dureeRef.current > 0) {
          onSendVocal(blob, dureeRef.current, replyTo?.id)
          setReplyTo(null)
        }
        stream.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setEnregistrement(true)
      setDureeEnregistrement(0)
      dureeRef.current = 0
      timerRef.current = setInterval(() => {
        setDureeEnregistrement((d) => {
          const next = d >= 119 ? 120 : d + 1
          dureeRef.current = next
          if (d >= 119) stopRecording()
          return next
        })
      }, 1000)
    } catch (err) {
      const error = err as DOMException
      if (error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError") {
        toast.error("Accès au microphone refusé", {
          description: "Autorisez l'accès au microphone dans les paramètres de votre navigateur.",
        })
      } else if (error?.name === "NotFoundError" || error?.name === "DevicesNotFoundError") {
        toast.error("Aucun microphone détecté", {
          description: "Vérifiez que votre microphone est bien connecté.",
        })
      } else if (!navigator.mediaDevices) {
        toast.error("Microphone non disponible", {
          description: "Cette fonctionnalité nécessite une connexion sécurisée (HTTPS).",
        })
      } else {
        toast.error("Impossible de démarrer l'enregistrement")
      }
    }
  }

  function stopRecording() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }
    setEnregistrement(false)
  }

  function cancelRecording() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }
    chunksRef.current = [] // vide les chunks pour ne pas envoyer
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null }
    setEnregistrement(false)
    setDureeEnregistrement(0)
  }

  // ─── État vide ─────────────────────────────────────────────────
  if (!interlocuteur) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[#EDE8DF] text-center px-8">
        <div className="relative mb-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-lg">
            <MessageSquare size={40} className="text-primary-brand" />
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary-brand text-white text-lg shadow-md">💬</span>
        </div>
        <h3 className="font-display text-[22px] font-normal text-text-main">
          Bienvenue dans la messagerie
        </h3>
        <p className="mt-2.5 font-body text-[13px] font-light text-text-muted-brand max-w-xs leading-relaxed">
          Sélectionnez une conversation à gauche ou démarrez-en une nouvelle pour commencer à échanger.
        </p>
        <div className="mt-6 flex items-center gap-2 rounded-full bg-white/70 px-5 py-2.5 shadow-sm backdrop-blur-sm">
          <span className="text-sm">✨</span>
          <span className="font-body text-[12px] text-text-muted-brand">Vos messages sont chiffrés de bout en bout</span>
        </div>
      </div>
    )
  }

  let lastDate = ""

  return (
    <div className="flex h-full flex-col bg-bg-page">
      <style>{typingKeyframes}</style>

      {/* ─── Header ─── */}
      <div className="flex items-center justify-between border-b border-border-brand bg-linear-to-r from-white via-white to-[#FAFAF8] px-5 py-3 shadow-[0_1px_8px_-2px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-3">
          <Avatar nom={interlocuteur.nom} prenom={interlocuteur.prenom} photoUrl={interlocuteur.photoUrl} size={44} enLigne={presenceEnLigne} />
          <div>
            <h3 className="font-display text-[15px] font-normal text-text-main leading-tight">
              {interlocuteur.prenom} {interlocuteur.nom}
            </h3>
            {isTyping ? (
              <p className="font-body text-xs italic text-gold flex items-center gap-1">
                <span className="inline-flex gap-0.5">
                  {[0,1,2].map(i => <span key={i} className="block h-1 w-1 rounded-full bg-gold" style={{ animation: "typingDot 1.4s infinite ease-in-out", animationDelay: `${i * 200}ms` }} />)}
                </span>
                en train d&apos;écrire…
              </p>
            ) : presenceEnLigne ? (
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-primary-brand opacity-60 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-brand" />
                </span>
                <span className="font-body text-xs font-light text-primary-brand">En ligne</span>
              </div>
            ) : derniereVueLe ? (
              <span className="font-body text-xs font-light text-text-muted-brand">
                Vu {new Date(derniereVueLe).toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })}
              </span>
            ) : (
              <span className="font-body text-xs font-light text-text-muted-brand">Hors ligne</span>
            )}
          </div>
        </div>
        {/* Boutons header */}
        <div className="flex items-center gap-0.5">
          {onTogglePush && (
            <button
              onClick={onTogglePush}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${pushActive ? "text-gold bg-gold-light/50" : "text-text-muted-brand hover:bg-bg-page hover:text-gold"}`}
              title={pushActive ? "Notifications actives" : "Activer les notifications"}
            >
              <span className="text-[14px]">{pushActive ? "🔔" : "🔕"}</span>
            </button>
          )}
          <button
            onClick={exportConversation}
            disabled={messages.filter(m => !m._optimistic).length === 0}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted-brand hover:bg-bg-page hover:text-gold transition-colors disabled:opacity-30"
            title="Exporter la conversation"
          >
            <Download size={14} />
          </button>
          <button
            onClick={() => { setSearchOpen((v) => !v); setSearchQuery("") }}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${searchOpen ? "bg-gold-light text-gold" : "text-text-muted-brand hover:bg-bg-page hover:text-gold"}`}
            title="Rechercher dans la conversation"
          >
            <Search size={15} />
          </button>
        </div>
      </div>

      {/* ─── Barre de recherche ─── */}
      {searchOpen && (
        <div className="border-b border-border-brand bg-white px-5 py-2 flex items-center gap-2">
          <Search size={13} className="text-text-muted-brand shrink-0" />
          <input
            autoFocus
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher dans la conversation…"
            className="flex-1 bg-transparent font-body text-[13px] text-text-main outline-none placeholder:text-text-muted-brand/60"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-text-muted-brand hover:text-danger">
              <X size={13} />
            </button>
          )}
        </div>
      )}

      {/* ─── Message épinglé ─── */}
      {(() => {
        const pinned = messages.find(m => m.epingle && !m._optimistic)
        return pinned ? (
          <div className="border-b border-border-brand bg-gold-light/40 px-5 py-2 flex items-center gap-2">
            <Pin size={11} className="text-gold shrink-0" />
            <p className="flex-1 font-body text-xs text-text-mid truncate">
              <span className="font-medium text-gold">Message épinglé · </span>
              {pinned.type === "VOCAL" ? "🎤 Message vocal" : pinned.type === "MEDIA" ? "🖼️ Image" : pinned.contenu}
            </p>
            {onPin && (
              <button
                onClick={() => onPin(pinned.id, false)}
                className="shrink-0 text-text-muted-brand hover:text-danger transition-colors"
                title="Désépingler"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ) : null
      })()}

      {/* ─── Messages ─── */}
      {/* Overlay transparent pour fermer le panneau long-press au tap extérieur */}
      {longPressMsg && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setLongPressMsg(null)}
        />
      )}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-5 py-6 bg-[#EDE8DF] relative" style={{ backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.04) 1px, transparent 1px)", backgroundSize: "24px 24px" }} onScroll={() => longPressMsg && setLongPressMsg(null)}>
        {/* ─── Bouton "↓ Nouveaux messages" ─── */}
        {newMessagesCount > 0 && (
          <button
            onClick={() => scrollToBottom(true)}
            className="sticky top-2 left-1/2 z-20 mx-auto flex items-center gap-2 rounded-full bg-primary-brand text-white px-4 py-2 shadow-lg font-body text-[13px] hover:bg-primary-dark transition-colors"
            style={{ transform: "translateX(-50%)", width: "fit-content" }}
          >
            <ArrowDown size={14} />
            {newMessagesCount} nouveau{newMessagesCount > 1 ? "x" : ""} message{newMessagesCount > 1 ? "s" : ""}
          </button>
        )}
        {/* Bouton charger plus (infinite scroll) */}
        {hasMore && (
          <div className="mb-4 flex justify-center">
            <button
              onClick={onLoadMore}
              disabled={loadingMore}
              className="flex items-center gap-2 rounded-full border border-border-brand bg-white px-5 py-1.5 font-body text-xs font-medium text-text-mid shadow-sm transition-colors hover:border-gold hover:text-gold disabled:opacity-50"
            >
              {loadingMore ? <Loader2 size={11} className="animate-spin" /> : null}
              {loadingMore ? "Chargement…" : "Messages précédents"}
            </button>
          </div>
        )}
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 size={22} className="animate-spin text-gold" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center px-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-md mb-4">
              <MessageSquare size={26} className="text-primary-brand" />
            </div>
            <p className="font-body text-[13px] font-medium text-text-mid">
              Commencez la conversation
            </p>
            <p className="mt-1 font-body text-[12px] font-light text-text-muted-brand">
              Envoyez votre premier message ci-dessous
            </p>
          </div>
        ) : (
          <>
            {(() => {
              // Calculé une seule fois hors du .map() — évite O(n²)
              const lastReadMessage = messages
                .filter(m => m.expediteurId === currentUserId && m.lu && m.luLe && !m._optimistic)
                .reduce((acc, m) => !acc || new Date(m.createdAt) > new Date(acc.createdAt) ? m : acc, null as MessageData | null)
              const lastReadMessageId = lastReadMessage?.id ?? null

              return messages
                .filter(msg => !searchQuery || msg.contenu.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((msg) => {
              const isMine = msg.expediteurId === currentUserId
              const msgDate = new Date(msg.createdAt).toLocaleDateString()
              let showDateSep = false
              if (msgDate !== lastDate) { showDateSep = true; lastDate = msgDate }
              const grouped = msg.reactions ? groupReactions(msg.reactions) : []
              const isEditing = editingMessageId === msg.id

              return (
                <div key={msg.id} ref={(el) => { if (el) messageRefs.current.set(msg.id, el) }}>
                  {showDateSep && (
                    <div className="my-4 flex justify-center">
                      <span className="rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 font-body text-[11px] font-medium text-text-muted-brand shadow-sm ring-1 ring-black/4">
                        {formatDateSeparator(msg.createdAt)}
                      </span>
                    </div>
                  )}

                  <div className={`group mb-4 flex ${isMine ? "justify-end" : "justify-start"} ${msg._status === "sending" ? "opacity-70" : ""} ${msg._status === "error" ? "opacity-60" : ""}`}>
                    <div
                      className={`relative max-w-[75%] ${isMine ? "items-end" : "items-start"}`}
                      onTouchStart={() => handleTouchStart(msg.id)}
                      onTouchEnd={handleTouchEnd}
                      onTouchMove={handleTouchEnd}
                    >
                      {!isMine && (
                        <p className="mb-1 font-body text-[12px] font-semibold" style={{ color: getAvatarStyle(msg.expediteur.prenom + msg.expediteur.nom).text }}>
                          {msg.expediteur.prenom}
                        </p>
                      )}

                      {/* Bloc citation */}
                      {msg.replyTo && (
                        <button
                          onClick={() => scrollToMessage(msg.replyTo!.id)}
                          className={`mb-1 w-full text-left border-l-2 border-gold px-3 py-1.5 rounded-lg ${isMine ? "bg-primary-dark/30" : "bg-gold-light/60"} transition-colors hover:opacity-80`}
                        >
                          <p className="font-body text-xs font-medium text-gold truncate">
                            {msg.replyTo.expediteur.prenom} {msg.replyTo.expediteur.nom}
                          </p>
                          <p className={`font-body text-xs truncate ${isMine ? "text-white/70" : "text-text-mid"}`}>
                            {msg.replyTo.type === "VOCAL" ? "🎤 Message vocal" : msg.replyTo.contenu}
                          </p>
                        </button>
                      )}

                      {/* Bulle du message */}
                      <div
                        className={`px-4 py-2.5 font-body text-[13px] font-light leading-relaxed ${
                          isMine
                            ? "rounded-2xl rounded-br-sm bg-linear-to-br from-primary-brand to-primary-dark text-white shadow-md"
                            : "rounded-2xl rounded-bl-sm border border-border-brand bg-white text-text-main shadow-md"
                        }`}
                      >
                        {isEditing ? (
                          <div className="flex flex-col gap-1.5 min-w-40">
                            <textarea
                              autoFocus
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEdit() }
                                if (e.key === "Escape") cancelEdit()
                              }}
                              rows={2}
                              className="resize-none bg-white/10 border border-white/30 text-inherit font-body text-[13px] px-2 py-1 outline-none rounded"
                            />
                            <div className="flex gap-1.5 justify-end">
                              <button onClick={cancelEdit} className="font-body text-xs opacity-70 hover:opacity-100">Annuler</button>
                              <button onClick={saveEdit} className="font-body text-xs font-medium bg-white/20 px-2 py-0.5 hover:bg-white/30 rounded">Sauvegarder</button>
                            </div>
                          </div>
                        ) : msg.type === "VOCAL" ? (
                          msg.contenu.startsWith("http")
                            ? <LecteurVocal url={msg.contenu} duree={msg.dureeSecondes} />
                            : <span className="font-body text-[12px] opacity-75 italic">🎤 Envoi en cours…</span>
                        ) : msg.type === "MEDIA" ? (
                          <div className="overflow-hidden rounded-xl -mx-4 -my-2.5">
                            {(msg.contenu.includes("/video/upload/") || msg._mediaSubtype === "video") ? (
                              <video
                                src={msg.contenu}
                                controls
                                className="block max-h-72 w-full max-w-full"
                                preload="none"
                              />
                            ) : (
                              <Image
                                src={msg.contenu}
                                alt="Image"
                                width={400}
                                height={288}
                                sizes="(max-width: 768px) 100vw, 400px"
                                className="block max-h-72 w-full max-w-full object-cover"
                                unoptimized
                              />
                            )}
                          </div>
                        ) : msg.type === "FICHIER" ? (() => {
                          // Format : "[fichier] nom|taille|url"
                          const parts = msg.contenu.replace("[fichier] ", "").split("|")
                          const nomFichier = parts[0] ?? "fichier"
                          const tailleFichier = parseInt(parts[1] ?? "0", 10)
                          const urlFichier = parts[2] ?? "#"
                          return (
                            <a
                              href={urlFichier}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={nomFichier}
                              className="flex items-center gap-2.5 min-w-44 no-underline hover:opacity-80 transition-opacity"
                            >
                              <IconeFichier nom={nomFichier} />
                              <div className="flex flex-col min-w-0">
                                <span className="font-body text-[12px] font-medium truncate max-w-40">{nomFichier}</span>
                                <span className="font-body text-xs opacity-70">{formatTaille(tailleFichier)}</span>
                              </div>
                              <Download size={13} className="ml-auto shrink-0 opacity-70" />
                            </a>
                          )
                        })() :
                          highlightText(msg.contenu, searchQuery)
                        }
                      </div>

                      {/* Actions au survol (desktop) + long-press (mobile) — positionnées au-dessus de la bulle */}
                      <div className={`absolute flex gap-0.5 transition-all ${longPressMsg === msg.id ? "opacity-100 scale-100" : "opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100"} ${isMine ? "right-0" : "left-0"} -top-9 bg-white rounded-full shadow-lg ring-1 ring-black/8 px-2 py-1.5 z-10`}>
                        <button onClick={() => setReplyTo(msg)} className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted-brand hover:text-primary-brand hover:bg-primary-light transition-colors" title="Répondre">
                          <Reply size={13} />
                        </button>
                        <button onClick={() => setReactionPickerMsg(reactionPickerMsg === msg.id ? null : msg.id)} className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted-brand hover:bg-bg-page transition-colors" title="Réagir">
                          <span className="text-[14px]">😊</span>
                        </button>
                        {(onForward || (contacts && contacts.length > 0)) && (
                          <button onClick={() => handleForwardClick(msg)} className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted-brand hover:text-gold hover:bg-gold-light/40 transition-colors" title="Transférer">
                            <Share2 size={12} />
                          </button>
                        )}
                        {onPin && !msg._optimistic && (
                          <button onClick={() => onPin(msg.id, !msg.epingle)} className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${msg.epingle ? "text-gold bg-gold-light/40" : "text-text-muted-brand hover:text-gold hover:bg-gold-light/40"}`} title={msg.epingle ? "Désépingler" : "Épingler"}>
                            <Pin size={12} />
                          </button>
                        )}
                        {isMine && !msg._optimistic && onEdit && msg.type === "TEXTE" && (
                          <button onClick={() => startEdit(msg)} className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted-brand hover:text-gold hover:bg-gold-light/40 transition-colors" title="Modifier">
                            <Edit2 size={12} />
                          </button>
                        )}
                        {isMine && !msg._optimistic && onDelete && (
                          <button onClick={async () => {
                            const ok = await confirm({ title: "Supprimer ce message ?", description: "Ce message sera supprim\u00e9 d\u00e9finitivement.", confirmLabel: "Supprimer", variant: "danger" })
                            if (ok) onDelete(msg.id)
                          }} className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted-brand hover:text-danger hover:bg-red-50 transition-colors" title="Supprimer">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>

                      {/* Picker réactions — emojis rapides + accès au picker complet */}
                      {reactionPickerMsg === msg.id && (
                        <div className={`absolute z-10 bg-white shadow-lg border border-border-brand px-2 py-1.5 ${isMine ? "right-0" : "left-0"} -top-9`}>
                          <div className="flex items-center gap-1">
                            {REACTION_QUICK.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => { onReaction(msg.id, emoji); setReactionPickerMsg(null) }}
                                className={`text-[16px] hover:scale-125 transition-transform px-0.5 ${msg.reactions?.find(r => r.userId === currentUserId)?.type === emoji ? "scale-125" : ""}`}
                              >
                                {emoji}
                              </button>
                            ))}
                            <button
                              onClick={() => { setReactionPickerMsg(null); setEmojiPickerOpen(true) }}
                              className="ml-1 flex h-6 w-6 items-center justify-center text-text-muted-brand hover:text-gold transition-colors border-l border-border-brand pl-1"
                              title="Plus d'emojis"
                            >
                              <SmilePlus size={12} />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Réactions affichées */}
                      {grouped.length > 0 && (
                        <div className={`-mt-2 relative z-10 flex gap-1 flex-wrap ${isMine ? "justify-end pr-1" : "justify-start pl-1"}`}>
                          {grouped.map((g) => {
                            const emojiDisplay = REACTION_LEGACY_MAP[g.type] ?? g.type
                            return (
                              <span key={g.type} className="inline-flex items-center gap-0.5 rounded-full bg-white shadow-md ring-1 ring-black/5 px-2 py-0.5 text-[13px]">
                                {emojiDisplay}{g.count > 1 && <span className="font-body text-[10px] text-text-muted-brand ml-0.5">{g.count}</span>}
                              </span>
                            )
                          })}
                        </div>
                      )}

                      {/* Timestamp + statut + badges */}
                      <div className={`mt-0.5 flex items-center gap-1 flex-wrap ${isMine ? "justify-end" : "justify-start"}`}>
                        <span className="font-body text-[10px] text-text-muted-brand">
                          {formatHeureMessage(msg.createdAt)}
                        </span>
                        {msg.modifie && (
                          <span className="font-body text-[9px] italic text-text-muted-brand">(modifié)</span>
                        )}
                        {msg.expiresAt && (
                          <span className="font-body text-[9px] text-gold flex items-center gap-0.5" title="Message éphémère — disparaît dans 24h">
                            <Timer size={8} />24h
                          </span>
                        )}
                        {isMine && msg.programmeA && !msg.programmeEnvoye && (
                          <span className="font-body text-[9px] text-gold flex items-center gap-0.5" title={`Programmé pour ${new Date(msg.programmeA).toLocaleString("fr")}`}>
                            <CalendarClock size={8} />Programmé
                          </span>
                        )}
                        {isMine && msg._status === "sending" && (
                          <Clock size={10} className="text-text-muted-brand animate-pulse" />
                        )}
                        {isMine && msg._status === "error" && (
                          <button
                            onClick={() => onRetry?.(msg._tempId!)}
                            className="flex items-center gap-0.5 text-danger hover:text-danger/80 transition-colors"
                            title="Erreur — cliquez pour réessayer"
                          >
                            <AlertCircle size={10} />
                            <RotateCcw size={9} />
                          </button>
                        )}
                        {isMine && !msg._status && (
                          <CheckCheck size={13} className={msg.lu ? "text-primary-brand" : "text-text-muted-brand"} />
                        )}
                        {isMine && msg._status === "sent" && (
                          <Check size={13} className="text-text-muted-brand" />
                        )}
                      </div>

                      {/* "Vu à HH:MM" — seulement sous le dernier message lu avec luLe */}
                      {isMine && msg.lu && msg.luLe && lastReadMessageId === msg.id && (
                        <p className="font-body text-[10px] text-primary-brand mt-0.5 text-right">
                          Vu à {new Date(msg.luLe).toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          })()}

            {/* ─── Indicateur écriture ─── */}
            {isTyping && (
              <div className="mb-3 flex justify-start items-end gap-2">
                <div
                  className="border border-border-brand bg-white px-4 py-3 rounded-2xl rounded-bl-sm shadow-md"
                >
                  <div className="flex gap-1.5 items-center">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="block h-2 w-2 rounded-full bg-text-muted-brand"
                        style={{
                          animation: "typingDot 1.4s infinite ease-in-out",
                          animationDelay: `${i * 200}ms`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ─── Bloc citation / réponse ─── */}
      {replyTo && (
        <div className="border-t border-border-brand bg-linear-to-r from-primary-light/40 to-white px-5 py-2.5 flex items-center gap-3">
          <CornerDownRight size={14} className="text-gold shrink-0" />
          <div className="flex-1 min-w-0 border-l-2 border-gold pl-3">
            <p className="font-body text-xs font-semibold text-gold">{replyTo.expediteur.prenom} {replyTo.expediteur.nom}</p>
            <p className="font-body text-xs text-text-mid truncate">
              {replyTo.type === "VOCAL" ? "🎤 Message vocal" : replyTo.type === "MEDIA" ? "🖼️ Image" : replyTo.contenu}
            </p>
          </div>
          <button onClick={() => setReplyTo(null)} className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full text-text-muted-brand hover:bg-red-50 hover:text-danger transition-colors">
            <X size={12} />
          </button>
        </div>
      )}

      {/* ─── Zone d'enregistrement vocal ─── */}
      {enregistrement ? (
        <div className="border-t border-border-brand bg-white px-5 py-3 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-4">
            <button onClick={cancelRecording} className="text-danger hover:text-danger/80 transition-colors" title="Annuler">
              <X size={18} />
            </button>
            <div className="flex-1 flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-danger animate-pulse" />
              <span className="font-body text-[13px] font-medium text-text-main">{formatDuree(dureeEnregistrement)}</span>
              <div className="flex items-end gap-0.5 h-5">
                {Array.from({ length: 20 }).map((_, i) => (
                  <span
                    key={i}
                    className="w-0.75 bg-gold origin-bottom"
                    style={{
                      animation: `pulse-wave ${waveformDurationsRef.current[i]}s infinite ease-in-out`,
                      animationDelay: `${i * 50}ms`,
                      height: "100%",
                    }}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={stopRecording}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-brand text-white hover:bg-primary-dark transition-colors"
              title="Envoyer"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="mt-1 font-body text-[9px] text-text-muted-brand text-center">
            Glissez vers ✕ pour annuler · Max 2 min
          </p>
        </div>
      ) : (
        /* ─── Champ de saisie standard ─── */
        <form onSubmit={handleSubmit} className="border-t border-border-brand bg-white px-4 py-3 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.06)]">
          {/* Emoji picker */}
          {emojiPickerOpen && (
            <div className="mb-2 border border-border-brand bg-white shadow-lg">
              {/* Onglets catégories */}
              <div className="flex border-b border-border-brand">
                {EMOJI_CATEGORIES.map((cat, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setEmojiTab(idx)}
                    className={`flex-1 py-1.5 text-[14px] transition-colors ${emojiTab === idx ? "bg-gold-light/50 border-b-2 border-gold" : "hover:bg-bg-page"}`}
                    title={cat.label}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
              {/* Grille d'emojis */}
              <div className="grid grid-cols-10 gap-0 p-2 max-h-32 overflow-y-auto">
                {EMOJI_CATEGORIES[emojiTab].emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setSaisie((prev) => prev + emoji)
                      textareaRef.current?.focus()
                    }}
                    className="flex h-7 w-full items-center justify-center text-[16px] hover:bg-gold-light/50 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Inputs fichiers — toujours montés pour que onChange fire après fermeture du menu */}
          {onSendImage && (
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleImageSelect} />
          )}
          {onSendFile && (
            <input ref={fileJointeRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip" className="hidden" onChange={handleFileJointeSelect} />
          )}
          {onSendVideo && (
            <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo" className="hidden" onChange={handleVideoSelect} />
          )}

          {/* Menu "+" — actions secondaires */}
          {plusMenuOpen && (
            <div className="mb-2 border border-border-brand bg-white shadow-lg p-2 flex flex-wrap gap-1">
              {onSendImage && (
                <button
                  type="button"
                  onClick={() => { fileInputRef.current?.click(); setPlusMenuOpen(false) }}
                  className="flex items-center gap-2 px-3 py-2 text-text-muted-brand hover:text-gold hover:bg-bg-page transition-colors font-body text-[13px]"
                  title="Image"
                >
                  <ImageIcon size={16} />
                  <span>Image</span>
                </button>
              )}
              {onSendFile && (
                <button
                  type="button"
                  onClick={() => { fileJointeRef.current?.click(); setPlusMenuOpen(false) }}
                  className="flex items-center gap-2 px-3 py-2 text-text-muted-brand hover:text-gold hover:bg-bg-page transition-colors font-body text-[13px]"
                  title="Pièce jointe"
                >
                  <Paperclip size={16} />
                  <span>Fichier</span>
                </button>
              )}
              {onSendVideo && (
                <button
                  type="button"
                  onClick={() => { videoInputRef.current?.click(); setPlusMenuOpen(false) }}
                  className="flex items-center gap-2 px-3 py-2 text-text-muted-brand hover:text-gold hover:bg-bg-page transition-colors font-body text-[13px]"
                  title="Vidéo"
                >
                  <Play size={16} />
                  <span>Vidéo</span>
                </button>
              )}
              {onToggleEphemere && (
                <button
                  type="button"
                  onClick={() => { onToggleEphemere(); setPlusMenuOpen(false) }}
                  className={`flex items-center gap-2 px-3 py-2 hover:bg-bg-page transition-colors font-body text-[13px] ${ephemere ? "text-gold" : "text-text-muted-brand hover:text-gold"}`}
                  title={ephemere ? "Message éphémère actif" : "Message éphémère (24h)"}
                >
                  <Timer size={16} />
                  <span>{ephemere ? "Éphémère ✓" : "Éphémère"}</span>
                </button>
              )}
              {onSchedule && (
                <button
                  type="button"
                  onClick={() => { setProgrammeModalOpen(true); setPlusMenuOpen(false) }}
                  disabled={!saisie.trim()}
                  className="flex items-center gap-2 px-3 py-2 text-text-muted-brand hover:text-gold hover:bg-bg-page transition-colors font-body text-[13px] disabled:opacity-30"
                  title="Programmer l'envoi"
                >
                  <CalendarClock size={16} />
                  <span>Programmer</span>
                </button>
              )}
            </div>
          )}

          <div className="flex items-end gap-2">
            {/* Bouton "+" — ouvre le menu d'actions */}
            <button
              type="button"
              onClick={() => { setPlusMenuOpen((v) => !v); setEmojiPickerOpen(false) }}
              className={`mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${plusMenuOpen ? "bg-gold-light text-gold" : "text-text-muted-brand hover:bg-bg-page hover:text-gold"}`}
              title="Plus d'options"
            >
              <Plus size={18} />
            </button>
            {/* Bouton emoji */}
            <button
              type="button"
              onClick={() => { setEmojiPickerOpen((v) => !v); setPlusMenuOpen(false) }}
              className={`mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${emojiPickerOpen ? "bg-gold-light text-gold" : "text-text-muted-brand hover:bg-bg-page hover:text-gold"}`}
              title="Emoji"
            >
              <SmilePlus size={16} />
            </button>
            {/* Zone de texte */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={saisie}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={ephemere ? "Message éphémère (24h)…" : "Écrire un message…"}
              maxLength={2000}
              className="max-h-30 min-h-9.5 flex-1 resize-none rounded-2xl border border-border-brand bg-[#F5F3EF] px-4 py-2.5 font-body text-[13px] font-light text-text-main outline-none placeholder:text-text-muted-brand/60 focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/10 transition-all duration-200"
            />
            {/* Micro (si vide) / Envoyer (si texte) */}
            {saisie.trim() ? (
              <button
                type="submit"
                className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary-brand to-primary-dark text-white shadow-md transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95"
              >
                <Send size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-brand bg-[#F5F3EF] text-text-muted-brand transition-all duration-200 hover:border-gold hover:text-gold hover:bg-gold-light/30"
                title="Message vocal"
              >
                <Mic size={16} />
              </button>
            )}
          </div>
          {ephemere && (
            <p className="mt-1.5 font-body text-[9px] text-gold flex items-center gap-1">
              <Timer size={9} /> Message éphémère — disparaîtra après 24h
            </p>
          )}
        </form>
      )}

      {/* ─── Aperçu image avant envoi ─── */}
      {imagePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white shadow-xl w-full max-w-sm mx-4">
            <div className="flex items-center justify-between border-b border-border-brand px-5 py-3">
              <h4 className="font-display text-[15px] font-normal text-text-main">Aperçu de l&apos;image</h4>
              <button onClick={cancelImagePreview} className="text-text-muted-brand hover:text-danger transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview.url} alt="Aperçu" className="max-h-64 max-w-full object-contain" />
            </div>
            {replyTo && (
              <div className="mx-5 mb-3 border-l-2 border-gold pl-3">
                <p className="font-body text-xs text-gold">{replyTo.expediteur.prenom}</p>
                <p className="font-body text-xs text-text-mid truncate">{replyTo.contenu}</p>
              </div>
            )}
            <div className="flex gap-2 border-t border-border-brand px-5 py-3">
              <button onClick={cancelImagePreview} className="flex-1 border border-border-brand py-2 font-body text-xs uppercase tracking-widest text-text-mid hover:border-danger hover:text-danger transition-colors">
                Annuler
              </button>
              <button onClick={confirmImageSend} className="flex-1 bg-primary-brand py-2 font-body text-xs uppercase tracking-widest text-white hover:bg-primary-dark transition-colors">
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal pièce jointe avant envoi ─── */}
      {pieceJointePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white shadow-xl w-full max-w-sm mx-4">
            <div className="flex items-center justify-between border-b border-border-brand px-5 py-3">
              <h4 className="font-display text-[15px] font-normal text-text-main">Envoyer le fichier</h4>
              <button onClick={cancelFileSend} className="text-text-muted-brand hover:text-danger transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-4 flex items-center gap-3">
              <IconeFichier nom={pieceJointePreview.nom} />
              <div className="flex-1 min-w-0">
                <p className="font-body text-[13px] font-medium text-text-main truncate">{pieceJointePreview.nom}</p>
                <p className="font-body text-xs text-text-muted-brand">{formatTaille(pieceJointePreview.taille)}</p>
              </div>
            </div>
            <div className="flex gap-2 border-t border-border-brand px-5 py-3">
              <button onClick={cancelFileSend} className="flex-1 border border-border-brand py-2 font-body text-xs uppercase tracking-widest text-text-mid hover:border-danger hover:text-danger transition-colors">
                Annuler
              </button>
              <button onClick={confirmFileSend} className="flex-1 bg-primary-brand py-2 font-body text-xs uppercase tracking-widest text-white hover:bg-primary-dark transition-colors">
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Aperçu vidéo avant envoi ─── */}
      {videoPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white shadow-xl w-full max-w-sm mx-4">
            <div className="flex items-center justify-between border-b border-border-brand px-5 py-3">
              <h4 className="font-display text-[15px] font-normal text-text-main">Aperçu de la vidéo</h4>
              <button onClick={cancelVideoPreview} className="text-text-muted-brand hover:text-danger transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 flex justify-center">
              <video src={videoPreview.url} controls className="max-h-56 max-w-full rounded" />
            </div>
            <div className="flex gap-2 border-t border-border-brand px-5 py-3">
              <button onClick={cancelVideoPreview} className="flex-1 border border-border-brand py-2 font-body text-xs uppercase tracking-widest text-text-mid hover:border-danger hover:text-danger transition-colors">
                Annuler
              </button>
              <button onClick={confirmVideoSend} className="flex-1 bg-primary-brand py-2 font-body text-xs uppercase tracking-widest text-white hover:bg-primary-dark transition-colors">
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal message programmé ─── */}
      {programmeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white shadow-xl w-full max-w-sm mx-4">
            <div className="flex items-center justify-between border-b border-border-brand px-5 py-3">
              <h4 className="font-display text-[15px] font-normal text-text-main">Programmer l&apos;envoi</h4>
              <button onClick={() => setProgrammeModalOpen(false)} className="text-text-muted-brand hover:text-danger transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="font-body text-[12px] text-text-mid">Message : <em className="text-text-main">&laquo;{saisie.slice(0, 60)}{saisie.length > 60 ? "…" : ""}&raquo;</em></p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="font-body text-xs uppercase tracking-widest text-text-muted-brand">Date</label>
                  <input
                    type="date"
                    value={programmeDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setProgrammeDate(e.target.value)}
                    className="mt-1 w-full border border-border-brand bg-bg-page px-3 py-2 font-body text-[13px] text-text-main outline-none focus:border-gold transition-colors"
                  />
                </div>
                <div className="flex-1">
                  <label className="font-body text-xs uppercase tracking-widest text-text-muted-brand">Heure</label>
                  <input
                    type="time"
                    value={programmeHeure}
                    onChange={(e) => setProgrammeHeure(e.target.value)}
                    className="mt-1 w-full border border-border-brand bg-bg-page px-3 py-2 font-body text-[13px] text-text-main outline-none focus:border-gold transition-colors"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 border-t border-border-brand px-5 py-3">
              <button onClick={() => setProgrammeModalOpen(false)} className="flex-1 border border-border-brand py-2 font-body text-xs uppercase tracking-widest text-text-mid hover:border-danger hover:text-danger transition-colors">
                Annuler
              </button>
              <button
                onClick={confirmSchedule}
                disabled={!programmeDate || !programmeHeure}
                className="flex-1 bg-primary-brand py-2 font-body text-xs uppercase tracking-widest text-white hover:bg-primary-dark disabled:opacity-40 transition-colors"
              >
                Programmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal transfert de message ─── */}
      {forwardMessage && contacts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white shadow-xl w-full max-w-xs mx-4">
            <div className="flex items-center justify-between border-b border-border-brand px-5 py-3">
              <h4 className="font-display text-[15px] font-normal text-text-main">Transférer à…</h4>
              <button onClick={() => setForwardMessage(null)} className="text-text-muted-brand hover:text-danger transition-colors">
                <X size={16} />
              </button>
            </div>
            <ForwardModalBody
              contacts={contacts}
              onSelect={(contactId) => {
                onForward?.(forwardMessage.contenu, forwardMessage.type ?? "TEXTE", contactId)
                setForwardMessage(null)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
