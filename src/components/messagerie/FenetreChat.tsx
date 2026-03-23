"use client"

import { useState, useEffect, useRef, useCallback, memo } from "react"
import { Send, Loader2, MessageSquare, Mic, X, Reply, Play, Pause, CornerDownRight, Clock, AlertCircle, RotateCcw } from "lucide-react"
import { Avatar } from "@/components/messagerie/ListeConversations"

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

const REACTIONS = [
  { type: "JAIME", emoji: "❤️" },
  { type: "SOUTIEN", emoji: "🤝" },
  { type: "ENCOURAGEMENT", emoji: "💪" },
  { type: "BRAVO", emoji: "👏" },
  { type: "INSPIRATION", emoji: "✨" },
]

interface ReactionData {
  type: string
  userId: string
}

interface ReplyToData {
  id: string
  contenu: string
  type?: string
  expediteur: { id: string; prenom: string; nom: string }
}

interface MessageData {
  id: string
  expediteurId: string
  destinataireId: string
  contenu: string
  type?: string
  dureeSecondes?: number | null
  lu: boolean
  createdAt: string
  replyTo?: ReplyToData | null
  reactions?: ReactionData[]
  expediteur: {
    id: string
    nom: string
    prenom: string
    photoUrl: string | null
  }
  _optimistic?: boolean
  _status?: "sending" | "sent" | "error"
  _tempId?: string
}

interface Interlocuteur {
  id: string
  nom: string
  prenom: string
  photoUrl: string | null
}

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
  loading: boolean
}

function formatHeureMessage(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("fr-FR", {
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
  return date.toLocaleDateString("fr-FR", {
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

/* ━━━━━━━━━━ Lecteur audio vocal (memoized) ━━━━━━━━━━ */
const LecteurVocal = memo(function LecteurVocal({ url, duree }: { url: string; duree?: number | null }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [totalDuree, setTotalDuree] = useState(duree || 0)
  const [vitesse, setVitesse] = useState(1)

  useEffect(() => {
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
  }, [duree])

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (playing) { audio.pause() } else { audio.play() }
    setPlaying(!playing)
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

  return (
    <div className="flex items-center gap-2 min-w-40">
      <audio ref={audioRef} src={url} preload="metadata" />
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
  loading,
}: FenetreChatProps) {
  const [saisie, setSaisie] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // Citation / réponse
  const [replyTo, setReplyTo] = useState<MessageData | null>(null)

  // Réactions picker
  const [reactionPickerMsg, setReactionPickerMsg] = useState<string | null>(null)

  // Enregistrement vocal
  const [enregistrement, setEnregistrement] = useState(false)
  const [dureeEnregistrement, setDureeEnregistrement] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping, scrollToBottom])

  useEffect(() => {
    setSaisie("")
    setReplyTo(null)
    if (textareaRef.current) textareaRef.current.style.height = "auto"
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
        if (blob.size > 0 && dureeEnregistrement > 0) {
          onSendVocal(blob, dureeEnregistrement, replyTo?.id)
          setReplyTo(null)
        }
        stream.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setEnregistrement(true)
      setDureeEnregistrement(0)
      timerRef.current = setInterval(() => {
        setDureeEnregistrement((d) => {
          if (d >= 119) { stopRecording(); return 120 }
          return d + 1
        })
      }, 1000)
    } catch {
      // Permission refusée ou microphone indisponible
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
      <div className="flex h-full flex-col items-center justify-center bg-bg-page text-center">
        <MessageSquare size={40} className="text-border-brand" />
        <h3 className="mt-5 font-display text-[18px] font-normal text-text-main">
          Bienvenue dans la messagerie
        </h3>
        <p className="mt-1.5 font-body text-[12px] font-light text-text-muted-brand">
          Sélectionnez une conversation ou démarrez-en une nouvelle
        </p>
      </div>
    )
  }

  let lastDate = ""

  return (
    <div className="flex h-full flex-col bg-bg-page">
      <style>{typingKeyframes}</style>

      {/* ─── Header ─── */}
      <div className="flex items-center justify-between border-b border-border-brand bg-white px-5 py-3">
        <div className="flex items-center gap-3">
          <Avatar nom={interlocuteur.nom} prenom={interlocuteur.prenom} size={36} enLigne />
          <div>
            <h3 className="font-display text-[15px] font-normal text-text-main">
              {interlocuteur.prenom} {interlocuteur.nom}
            </h3>
            {isTyping ? (
              <p className="font-body text-[11px] italic text-gold">
                en train d&apos;écrire…
              </p>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-brand" />
                <span className="font-body text-[10px] font-light text-text-muted-brand">
                  En ligne
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Messages ─── */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 size={22} className="animate-spin text-gold" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="font-body text-[12px] font-light text-text-muted-brand">
              Aucun message. Envoyez le premier !
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isMine = msg.expediteurId === currentUserId
              const msgDate = new Date(msg.createdAt).toLocaleDateString()
              let showDateSep = false
              if (msgDate !== lastDate) { showDateSep = true; lastDate = msgDate }
              const grouped = msg.reactions ? groupReactions(msg.reactions) : []
              const myReaction = msg.reactions?.find((r) => r.userId === currentUserId)

              return (
                <div key={msg.id} ref={(el) => { if (el) messageRefs.current.set(msg.id, el) }}>
                  {showDateSep && (
                    <div className="my-5 flex items-center gap-3">
                      <div className="h-px flex-1 bg-border-brand" />
                      <span className="font-body text-[10px] font-medium uppercase tracking-[0.15em] text-text-muted-brand">
                        {formatDateSeparator(msg.createdAt)}
                      </span>
                      <div className="h-px flex-1 bg-border-brand" />
                    </div>
                  )}

                  <div className={`group mb-3 flex ${isMine ? "justify-end" : "justify-start"} ${msg._status === "sending" ? "opacity-70" : ""} ${msg._status === "error" ? "opacity-60" : ""}`}>
                    <div className={`relative max-w-[75%] ${isMine ? "items-end" : "items-start"}`}>
                      {!isMine && (
                        <p className="mb-1 font-display text-[12px] text-gold">
                          {msg.expediteur.prenom}
                        </p>
                      )}

                      {/* Bloc citation */}
                      {msg.replyTo && (
                        <button
                          onClick={() => scrollToMessage(msg.replyTo!.id)}
                          className={`mb-1 w-full text-left border-l-2 border-gold px-3 py-1.5 ${isMine ? "bg-primary-dark/30" : "bg-gold-light/60"} transition-colors hover:opacity-80`}
                        >
                          <p className="font-body text-[10px] font-medium text-gold truncate">
                            {msg.replyTo.expediteur.prenom} {msg.replyTo.expediteur.nom}
                          </p>
                          <p className={`font-body text-[11px] truncate ${isMine ? "text-white/70" : "text-text-mid"}`}>
                            {msg.replyTo.type === "VOCAL" ? "🎤 Message vocal" : msg.replyTo.contenu}
                          </p>
                        </button>
                      )}

                      <div
                        className={`px-4 py-2.5 font-body text-[13px] font-light leading-relaxed ${
                          isMine
                            ? "bg-primary-brand text-white"
                            : "border border-border-brand bg-white text-text-main"
                        }`}
                        style={{
                          borderRadius: isMine ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                        }}
                      >
                        {msg.type === "VOCAL" ? (
                          <LecteurVocal url={msg.contenu} duree={msg.dureeSecondes} />
                        ) : (
                          <span className="whitespace-pre-wrap">{msg.contenu}</span>
                        )}
                      </div>

                      {/* Actions au survol : répondre + réaction */}
                      <div className={`absolute top-1/2 -translate-y-1/2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${isMine ? "-left-16" : "-right-16"}`}>
                        <button
                          onClick={() => setReplyTo(msg)}
                          className="flex h-6 w-6 items-center justify-center text-text-muted-brand hover:text-gold transition-colors"
                          title="Répondre"
                        >
                          <Reply size={13} />
                        </button>
                        <button
                          onClick={() => setReactionPickerMsg(reactionPickerMsg === msg.id ? null : msg.id)}
                          className="flex h-6 w-6 items-center justify-center text-text-muted-brand hover:text-gold transition-colors"
                          title="Réagir"
                        >
                          <span className="text-[12px]">😊</span>
                        </button>
                      </div>

                      {/* Picker réactions */}
                      {reactionPickerMsg === msg.id && (
                        <div className={`absolute z-10 flex gap-1 bg-white shadow-lg border border-border-brand px-2 py-1.5 ${isMine ? "right-0" : "left-0"} -top-9`}>
                          {REACTIONS.map((r) => (
                            <button
                              key={r.type}
                              onClick={() => { onReaction(msg.id, r.type); setReactionPickerMsg(null) }}
                              className={`text-[16px] hover:scale-125 transition-transform ${myReaction?.type === r.type ? "scale-125" : ""}`}
                            >
                              {r.emoji}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Réactions affichées */}
                      {grouped.length > 0 && (
                        <div className={`mt-1 flex gap-1 flex-wrap ${isMine ? "justify-end" : "justify-start"}`}>
                          {grouped.map((g) => {
                            const emoji = REACTIONS.find((r) => r.type === g.type)?.emoji || "❤️"
                            return (
                              <span key={g.type} className="inline-flex items-center gap-0.5 bg-white border border-border-brand px-1.5 py-0.5 text-[11px]">
                                {emoji}{g.count > 1 && <span className="font-body text-[9px] text-text-muted-brand">{g.count}</span>}
                              </span>
                            )
                          })}
                        </div>
                      )}

                      <div className={`mt-1 flex items-center gap-1.5 ${isMine ? "justify-end" : "justify-start"}`}>
                        <span className="font-body text-[10px] text-text-muted-brand">
                          {formatHeureMessage(msg.createdAt)}
                        </span>
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
                          <span className={`font-body text-[10px] ${msg.lu ? "text-primary-brand" : "text-text-muted-brand"}`}>
                            ✓✓
                          </span>
                        )}
                        {isMine && msg._status === "sent" && (
                          <span className="font-body text-[10px] text-text-muted-brand">
                            ✓
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* ─── Indicateur écriture ─── */}
            {isTyping && (
              <div className="mb-3 flex justify-start">
                <div
                  className="border border-border-brand bg-white px-4 py-3"
                  style={{ borderRadius: "12px 12px 12px 2px" }}
                >
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="block h-1.5 w-1.5 rounded-full bg-gold"
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
        <div className="border-t border-border-brand bg-white px-5 py-2 flex items-center gap-3">
          <CornerDownRight size={14} className="text-gold shrink-0" />
          <div className="flex-1 min-w-0 border-l-2 border-gold pl-3">
            <p className="font-body text-[10px] font-medium text-gold">{replyTo.expediteur.prenom} {replyTo.expediteur.nom}</p>
            <p className="font-body text-[11px] text-text-mid truncate">
              {replyTo.type === "VOCAL" ? "🎤 Message vocal" : replyTo.contenu}
            </p>
          </div>
          <button onClick={() => setReplyTo(null)} className="shrink-0 text-text-muted-brand hover:text-danger transition-colors">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ─── Zone d'enregistrement vocal ─── */}
      {enregistrement ? (
        <div className="border-t border-border-brand bg-white px-5 py-3">
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
                      animation: `pulse-wave ${0.6 + Math.random() * 0.6}s infinite ease-in-out`,
                      animationDelay: `${i * 50}ms`,
                      height: "100%",
                    }}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={stopRecording}
              className="flex h-10 w-10 items-center justify-center bg-primary-brand text-white hover:bg-primary-dark transition-colors"
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
        <form onSubmit={handleSubmit} className="border-t border-border-brand bg-white px-5 py-3">
          <div className="flex items-end gap-3">
            <button
              type="button"
              onClick={startRecording}
              className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center text-text-muted-brand transition-colors duration-200 hover:text-gold"
              title="Message vocal"
            >
              <Mic size={16} />
            </button>
            <textarea
              ref={textareaRef}
              rows={1}
              value={saisie}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Écrire un message…"
              maxLength={2000}
              className="max-h-30 min-h-9.5 flex-1 resize-none border border-border-brand bg-bg-page px-4 py-2.5 font-body text-[13px] font-light text-text-main outline-none placeholder:text-text-muted-brand/60 focus:border-gold focus:bg-white transition-colors duration-200"
            />
            <button
              type="submit"
              disabled={!saisie.trim()}
              className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center bg-primary-brand text-white transition-colors duration-200 hover:bg-primary-dark disabled:opacity-40"
            >
              <Send size={15} />
            </button>
          </div>
          <p className="mt-1.5 font-body text-[9px] text-text-muted-brand">
            Appuyez sur Entrée pour envoyer · Maj+Entrée pour un saut de ligne
          </p>
        </form>
      )}
    </div>
  )
}
