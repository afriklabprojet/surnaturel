"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { MessageCircle, X, Send, Loader2, ArrowLeft, ChevronRight, Search, Plus } from "lucide-react"

interface Interlocuteur {
  id: string
  nom: string
  prenom: string
  photoUrl: string | null
}

interface Conversation {
  interlocuteur: Interlocuteur
  dernierMessage: { contenu: string; createdAt: string; expediteurId: string }
  nonLus: number
}

interface MessageData {
  id: string
  expediteurId: string
  destinataireId: string
  contenu: string
  createdAt: string
  expediteur: { id: string; nom: string; prenom: string; photoUrl: string | null }
}

function MiniAvatar({ user, size = 32 }: { user: { prenom: string; nom: string; photoUrl: string | null }; size?: number }) {
  const initials = `${user.prenom?.[0] ?? ""}${user.nom?.[0] ?? ""}`.toUpperCase()
  if (user.photoUrl) {
    return <img src={user.photoUrl} alt="" className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />
  }
  return (
    <div className="flex items-center justify-center rounded-full bg-primary-brand text-white font-body font-medium shrink-0" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials}
    </div>
  )
}

function formatHeure(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })
}

export default function ChatBubble() {
  const { data: session, status } = useSession()
  const [open, setOpen] = useState(false)

  // Conversations
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loadingConvs, setLoadingConvs] = useState(false)
  const [totalNonLus, setTotalNonLus] = useState(0)

  // Chat actif
  const [activeUser, setActiveUser] = useState<Interlocuteur | null>(null)
  const [messages, setMessages] = useState<MessageData[]>([])
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [saisie, setSaisie] = useState("")
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Recherche de nouveaux contacts
  const [searchMode, setSearchMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Interlocuteur[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentUserId = session?.user?.id ?? ""
  const isAuth = status === "authenticated"

  // Charger les conversations
  const fetchConversations = useCallback(async () => {
    if (!isAuth) return
    setLoadingConvs(true)
    try {
      const res = await fetch("/api/messages/conversations")
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations)
        setTotalNonLus(data.conversations.reduce((s: number, c: Conversation) => s + c.nonLus, 0))
      }
    } catch { /* ignore */ }
    setLoadingConvs(false)
  }, [isAuth])

  // Charger quand on ouvre
  useEffect(() => {
    if (open && isAuth && conversations.length === 0) fetchConversations()
  }, [open, isAuth, conversations.length, fetchConversations])

  // Rafraîchir les non-lus périodiquement
  useEffect(() => {
    if (!isAuth) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/messages/conversations")
        if (res.ok) {
          const data = await res.json()
          setTotalNonLus(data.conversations.reduce((s: number, c: Conversation) => s + c.nonLus, 0))
          if (open) setConversations(data.conversations)
        }
      } catch { /* ignore */ }
    }, 15000)
    return () => clearInterval(interval)
  }, [isAuth, open])

  // Charger les messages d'une conversation
  async function openChat(interlocuteur: Interlocuteur) {
    setActiveUser(interlocuteur)
    setMessages([])
    setLoadingMsgs(true)
    try {
      const res = await fetch(`/api/messages/${interlocuteur.id}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages.reverse())
      }
    } catch { /* ignore */ }
    setLoadingMsgs(false)
    // Marquer comme lu
    fetch(`/api/messages/${interlocuteur.id}/lus`, { method: "PATCH" }).catch(() => {})
    setConversations((prev) => prev.map((c) => c.interlocuteur.id === interlocuteur.id ? { ...c, nonLus: 0 } : c))
    setTotalNonLus((prev) => {
      const conv = conversations.find((c) => c.interlocuteur.id === interlocuteur.id)
      return Math.max(0, prev - (conv?.nonLus ?? 0))
    })
  }

  // Rechercher des utilisateurs (debounced)
  function handleSearch(q: string) {
    setSearchQuery(q)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (q.trim().length < 2) { setSearchResults([]); return }
    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await fetch(`/api/messages/recherche-utilisateurs?q=${encodeURIComponent(q.trim())}`)
        if (res.ok) {
          const data = await res.json()
          setSearchResults(data.utilisateurs)
        }
      } catch { /* ignore */ }
      setSearchLoading(false)
    }, 350)
  }

  function startNewChat(user: Interlocuteur) {
    setSearchMode(false)
    setSearchQuery("")
    setSearchResults([])
    openChat(user)
  }

  // Scroll to bottom quand messages changent
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Envoyer un message
  async function handleSend() {
    if (!saisie.trim() || !activeUser || sending) return
    const text = saisie.trim()
    setSaisie("")
    setSending(true)
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destinataireId: activeUser.id, contenu: text }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => [...prev, data.message])
        // Mettre à jour l'aperçu
        setConversations((prev) => {
          const exists = prev.find((c) => c.interlocuteur.id === activeUser.id)
          if (exists) {
            return prev.map((c) => c.interlocuteur.id === activeUser.id
              ? { ...c, dernierMessage: { contenu: text, createdAt: data.message.createdAt, expediteurId: currentUserId } }
              : c
            )
          }
          return [{ interlocuteur: activeUser, dernierMessage: { contenu: text, createdAt: data.message.createdAt, expediteurId: currentUserId }, nonLus: 0 }, ...prev]
        })
      }
    } catch { /* ignore */ }
    setSending(false)
  }

  // Ne pas afficher si non connecté
  if (!isAuth) return null

  return (
    <>
      {/* Bulle flottante */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Fermer la messagerie" : "Ouvrir la messagerie"}
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 flex h-14 w-14 items-center justify-center bg-primary-brand text-white shadow-lg transition-transform duration-300 hover:scale-105 active:scale-95"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        {!open && totalNonLus > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center bg-red-500 px-1 font-body text-[10px] font-bold text-white">
            {totalNonLus > 99 ? "99+" : totalNonLus}
          </span>
        )}
      </button>

      {/* Fenêtre messenger */}
      {open && (
        <div className="fixed bottom-[8.5rem] right-4 lg:bottom-24 lg:right-6 z-50 w-[340px] max-w-[calc(100vw-2rem)] border border-border-brand bg-white shadow-xl flex flex-col" style={{ height: 420 }}>

          {/* ── Vue chat actif ── */}
          {activeUser ? (
            <>
              {/* Header chat */}
              <div className="flex items-center gap-2 border-b border-border-brand bg-primary-brand px-3 py-2.5 shrink-0">
                <button onClick={() => { setActiveUser(null); fetchConversations() }} className="text-white/80 hover:text-white transition-colors" aria-label="Retour">
                  <ArrowLeft size={18} />
                </button>
                <MiniAvatar user={activeUser} size={28} />
                <span className="font-display text-[15px] font-light text-white truncate">{activeUser.prenom} {activeUser.nom}</span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 bg-bg-page">
                {loadingMsgs ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 size={20} className="animate-spin text-primary-brand" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center font-body text-[12px] text-text-muted-brand py-8">Aucun message. Dites bonjour !</p>
                ) : (
                  messages.map((m) => {
                    const isMine = m.expediteurId === currentUserId
                    return (
                      <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] px-3 py-1.5 ${isMine ? "bg-primary-brand text-white" : "bg-white border border-border-brand text-text-main"}`}>
                          <p className="font-body text-[13px] leading-snug break-words">{m.contenu}</p>
                          <p className={`font-body text-[9px] mt-0.5 ${isMine ? "text-white/60" : "text-text-muted-brand"}`}>{formatHeure(m.createdAt)}</p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Saisie */}
              <div className="border-t border-border-brand bg-white px-3 py-2 shrink-0">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={saisie}
                    onChange={(e) => setSaisie(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                    placeholder="Votre message…"
                    className="flex-1 px-3 py-2 border border-border-brand font-body text-[13px] bg-white focus:outline-none focus:border-primary-brand"
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !saisie.trim()}
                    className="flex h-9 w-9 items-center justify-center bg-primary-brand text-white hover:bg-primary-brand/90 disabled:opacity-40 transition-colors shrink-0"
                    aria-label="Envoyer"
                  >
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
              </div>
            </>
          ) : searchMode ? (
            /* ── Vue recherche ── */
            <>
              {/* Header recherche */}
              <div className="border-b border-border-brand bg-primary-brand px-3 py-2.5 shrink-0">
                <div className="flex items-center gap-2">
                  <button onClick={() => { setSearchMode(false); setSearchQuery(""); setSearchResults([]) }} className="text-white/80 hover:text-white transition-colors" aria-label="Retour">
                    <ArrowLeft size={18} />
                  </button>
                  <p className="font-display text-[15px] font-light text-white">Nouvelle conversation</p>
                </div>
              </div>

              {/* Barre de recherche */}
              <div className="px-3 py-2 border-b border-border-brand shrink-0">
                <div className="flex items-center gap-2 border border-border-brand px-2 py-1.5 bg-white">
                  <Search size={14} className="text-text-muted-brand shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Rechercher un utilisateur…"
                    className="flex-1 font-body text-[13px] bg-transparent focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>

              {/* Résultats */}
              <div className="flex-1 overflow-y-auto">
                {searchLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={20} className="animate-spin text-primary-brand" />
                  </div>
                ) : searchQuery.trim().length < 2 ? (
                  <p className="font-body text-[12px] text-text-muted-brand text-center py-8">Saisissez au moins 2 caractères</p>
                ) : searchResults.length === 0 ? (
                  <p className="font-body text-[12px] text-text-muted-brand text-center py-8">Aucun utilisateur trouvé</p>
                ) : (
                  searchResults.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => startNewChat(u)}
                      className="flex w-full items-center gap-2.5 px-3 py-3 border-b border-border-brand text-left hover:bg-bg-page transition-colors"
                    >
                      <MiniAvatar user={u} size={36} />
                      <span className="font-display text-[14px] text-text-main truncate">{u.prenom} {u.nom}</span>
                      <ChevronRight size={14} className="text-text-muted-brand shrink-0 ml-auto" />
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            /* ── Vue liste conversations ── */
            <>
              {/* Header */}
              <div className="border-b border-border-brand bg-primary-brand px-4 py-3 shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display text-[16px] font-light text-white">Messagerie</p>
                    <p className="font-body text-[11px] text-white/70">{conversations.length} conversation{conversations.length > 1 ? "s" : ""}</p>
                  </div>
                  <button onClick={() => setSearchMode(true)} className="flex h-8 w-8 items-center justify-center text-white/80 hover:text-white transition-colors" aria-label="Nouvelle conversation">
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              {/* Liste */}
              <div className="flex-1 overflow-y-auto">
                {loadingConvs ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 size={20} className="animate-spin text-primary-brand" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full px-4">
                    <MessageCircle size={32} className="text-border-brand mb-3" />
                    <p className="font-body text-[13px] text-text-muted-brand text-center">Aucune conversation</p>
                    <button onClick={() => setSearchMode(true)} className="mt-3 px-4 py-2 bg-primary-brand text-white font-body text-[11px] uppercase tracking-[0.15em] hover:bg-primary-brand/90 transition-colors">
                      Démarrer une conversation
                    </button>
                  </div>
                ) : (
                  conversations.map((conv) => {
                    const isMine = conv.dernierMessage.expediteurId === currentUserId
                    const apercu = conv.dernierMessage.contenu.slice(0, 40) + (conv.dernierMessage.contenu.length > 40 ? "…" : "")
                    return (
                      <button
                        key={conv.interlocuteur.id}
                        onClick={() => openChat(conv.interlocuteur)}
                        className="flex w-full items-center gap-2.5 px-3 py-3 border-b border-border-brand text-left hover:bg-bg-page transition-colors"
                      >
                        <MiniAvatar user={conv.interlocuteur} size={36} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-display text-[14px] text-text-main truncate">{conv.interlocuteur.prenom} {conv.interlocuteur.nom}</span>
                            <span className="font-body text-[10px] text-text-muted-brand shrink-0 ml-1">{formatHeure(conv.dernierMessage.createdAt)}</span>
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="font-body text-[11px] text-text-muted-brand truncate">
                              {isMine ? "Vous : " : ""}{apercu}
                            </span>
                            {conv.nonLus > 0 && (
                              <span className="ml-1 flex h-4 min-w-4 items-center justify-center bg-primary-brand px-1 font-body text-[9px] font-bold text-white shrink-0">
                                {conv.nonLus}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-text-muted-brand shrink-0" />
                      </button>
                    )
                  })
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
