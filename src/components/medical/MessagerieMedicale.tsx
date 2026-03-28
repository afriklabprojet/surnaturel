"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Lock,
  MessageSquare,
  Send,
  Loader2,
  ArrowLeft,
  Search,
  X,
  Plus,
} from "lucide-react"

// ── Types ───────────────────────────────────────────────────────
interface Interlocuteur {
  id: string
  nom: string
  prenom: string
  photoUrl: string | null
}

interface Conversation {
  interlocuteur: Interlocuteur
  dernierMessage: {
    contenu: string
    createdAt: string
    expediteurId: string
  }
  nonLus: number
}

interface MessageData {
  id: string
  expediteurId: string
  destinataireId: string
  contenu: string
  lu: boolean
  createdAt: string
  expediteur: {
    id: string
    nom: string
    prenom: string
    photoUrl: string | null
  }
}

// ── Avatar carré vert uniforme ──────────────────────────────────
function Avatar({ nom, prenom, size = "md" }: { nom: string; prenom: string; size?: "sm" | "md" }) {
  const initiales = `${prenom[0]}${nom[0]}`.toUpperCase()
  const dim = size === "sm" ? "h-9 w-9 text-[11px]" : "h-11 w-11 text-[13px]"

  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-primary-brand font-body font-medium text-white ${dim}`}
    >
      {initiales}
    </div>
  )
}

function formatHeure(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const oneDay = 86400000

  if (diff < oneDay && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })
  }
  if (diff < 2 * oneDay) return "Hier"
  return date.toLocaleDateString("fr", { day: "2-digit", month: "2-digit" })
}

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const oneDay = 86400000

  if (diff < oneDay && date.getDate() === now.getDate()) return "Aujourd\u2019hui"
  if (diff < 2 * oneDay) return "Hier"
  return date.toLocaleDateString("fr", { weekday: "long", day: "numeric", month: "long" })
}

// ── Composant principal ─────────────────────────────────────────
export default function MessagerieMedicale({ currentUserId }: { currentUserId: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeInterlocuteur, setActiveInterlocuteur] = useState<Interlocuteur | null>(null)
  const [messages, setMessages] = useState<MessageData[]>([])
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showNewModal, setShowNewModal] = useState(false)

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/medical/messages/conversations")
      if (res.ok) {
        const data: { conversations: Conversation[] } = await res.json()
        setConversations(data.conversations)
      }
    } catch {
      // silently fail
    } finally {
      setLoadingConvs(false)
    }
  }, [])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  const fetchMessages = useCallback(async (userId: string) => {
    setLoadingMessages(true)
    try {
      const res = await fetch(`/api/medical/messages?userId=${userId}`)
      if (res.ok) {
        const data: { messages: MessageData[] } = await res.json()
        setMessages(data.messages)
      }
    } catch {
      // silently fail
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  function handleSelectConversation(interlocuteur: Interlocuteur) {
    setActiveInterlocuteur(interlocuteur)
    setShowChat(true)
    fetchMessages(interlocuteur.id)

    setConversations((prev) =>
      prev.map((c) =>
        c.interlocuteur.id === interlocuteur.id ? { ...c, nonLus: 0 } : c
      )
    )
  }

  function handleNewConversation(interlocuteur: Interlocuteur) {
    setActiveInterlocuteur(interlocuteur)
    setMessages([])
    setShowChat(true)
  }

  async function handleSendMessage(contenu: string) {
    if (!activeInterlocuteur) return

    try {
      const res = await fetch("/api/medical/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinataireId: activeInterlocuteur.id,
          contenu,
        }),
      })

      if (res.ok) {
        const data: { message: MessageData } = await res.json()
        setMessages((prev) => [...prev, data.message])

        setConversations((prev) => {
          const exists = prev.find((c) => c.interlocuteur.id === activeInterlocuteur.id)
          if (exists) {
            return prev
              .map((c) =>
                c.interlocuteur.id === activeInterlocuteur.id
                  ? {
                      ...c,
                      dernierMessage: {
                        contenu,
                        createdAt: data.message.createdAt,
                        expediteurId: currentUserId,
                      },
                    }
                  : c
              )
              .sort(
                (a, b) =>
                  new Date(b.dernierMessage.createdAt).getTime() -
                  new Date(a.dernierMessage.createdAt).getTime()
              )
          }
          return [
            {
              interlocuteur: activeInterlocuteur,
              dernierMessage: {
                contenu,
                createdAt: data.message.createdAt,
                expediteurId: currentUserId,
              },
              nonLus: 0,
            },
            ...prev,
          ]
        })
      }
    } catch {
      // silently fail
    }
  }

  if (loadingConvs) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={22} className="animate-spin text-gold" />
      </div>
    )
  }

  return (
    <div className="overflow-hidden border border-border-brand border-t-2 border-t-gold bg-white">
      {/* Header confidentiel */}
      <div className="flex items-center gap-2 border-b border-border-brand bg-primary-light px-5 py-2.5">
        <Lock size={14} className="text-primary-brand" />
        <span className="font-body text-[11px] font-medium uppercase tracking-[0.15em] text-primary-brand">
          Messagerie confidentielle
        </span>
      </div>

      <div className="flex h-130">
        {/* Colonne gauche — Liste conversations */}
        <div
          className={`w-full border-r border-border-brand md:w-1/3 ${
            showChat ? "hidden md:flex md:flex-col" : "flex flex-col"
          }`}
        >
          <div className="flex items-center justify-between border-b border-border-brand px-4 py-3">
            <span className="font-body text-[10px] font-medium uppercase tracking-[0.15em] text-text-muted-brand">
              Conversations
            </span>
            <button
              onClick={() => setShowNewModal(true)}
              className="flex h-7 w-7 items-center justify-center bg-primary-brand text-white transition-colors hover:bg-primary-dark"
              aria-label="Nouveau message"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare size={24} className="mx-auto text-border-brand" />
                <p className="mt-3 font-body text-[12px] font-light text-text-muted-brand">
                  Aucune conversation médicale
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = activeInterlocuteur?.id === conv.interlocuteur.id
                const isMine = conv.dernierMessage.expediteurId === currentUserId
                const apercu =
                  conv.dernierMessage.contenu.slice(0, 35) +
                  (conv.dernierMessage.contenu.length > 35 ? "\u2026" : "")

                return (
                  <button
                    key={conv.interlocuteur.id}
                    onClick={() => handleSelectConversation(conv.interlocuteur)}
                    className={`flex w-full items-center gap-3 border-b border-border-brand px-4 py-3.5 text-left transition-colors ${
                      isActive
                        ? "border-l-2 border-l-gold bg-bg-page"
                        : "hover:bg-bg-page"
                    }`}
                  >
                    <Avatar nom={conv.interlocuteur.nom} prenom={conv.interlocuteur.prenom} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="truncate font-display text-[14px] font-normal text-text-main">
                          {conv.interlocuteur.prenom} {conv.interlocuteur.nom}
                        </span>
                        <span className="shrink-0 font-body text-[10px] text-text-muted-brand">
                          {formatHeure(conv.dernierMessage.createdAt)}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between">
                        <span className="truncate font-body text-[11px] font-light text-text-muted-brand">
                          {isMine ? "Vous : " : ""}{apercu}
                        </span>
                        {conv.nonLus > 0 && (
                          <span className="ml-2 flex h-4 min-w-4 shrink-0 items-center justify-center bg-primary-brand px-1 font-body text-[9px] font-medium text-white">
                            {conv.nonLus > 99 ? "99+" : conv.nonLus}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Colonne droite — Chat */}
        <div
          className={`flex-1 ${showChat ? "flex flex-col" : "hidden md:flex md:flex-col"}`}
        >
          {showChat && (
            <div className="border-b border-border-brand px-4 py-2 md:hidden">
              <button
                onClick={() => setShowChat(false)}
                className="flex items-center gap-1 font-body text-[12px] font-medium text-primary-brand"
              >
                <ArrowLeft size={14} />
                Conversations
              </button>
            </div>
          )}

          <ChatMedical
            interlocuteur={activeInterlocuteur}
            currentUserId={currentUserId}
            messages={messages}
            loading={loadingMessages}
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>

      {/* Bandeau bas confidentiel */}
      <div className="flex items-center gap-2 border-t border-border-brand bg-bg-page px-5 py-2.5">
        <Lock size={12} className="shrink-0 text-text-muted-brand" />
        <span className="font-body text-[11px] font-light text-text-muted-brand">
          Cette messagerie est chiffrée et réservée à votre accompagnateur médical
        </span>
      </div>

      {/* Modale nouvelle conversation */}
      {showNewModal && (
        <NouvelleConversationMedicale
          currentUserId={currentUserId}
          existingIds={conversations.map((c) => c.interlocuteur.id)}
          onSelect={(user) => {
            handleNewConversation(user)
            setShowNewModal(false)
          }}
          onClose={() => setShowNewModal(false)}
        />
      )}
    </div>
  )
}

// ── Chat médical — style Parisian ───────────────────────────────
function ChatMedical({
  interlocuteur,
  currentUserId,
  messages,
  loading,
  onSendMessage,
}: {
  interlocuteur: Interlocuteur | null
  currentUserId: string
  messages: MessageData[]
  loading: boolean
  onSendMessage: (contenu: string) => void
}) {
  const [saisie, setSaisie] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    setSaisie("")
  }, [interlocuteur?.id])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = saisie.trim()
    if (!text || !interlocuteur) return
    onSendMessage(text)
    setSaisie("")
  }

  if (!interlocuteur) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-bg-page px-4 text-center">
        <Lock size={32} className="text-border-brand" />
        <h4 className="mt-4 font-display text-[16px] font-light text-text-main">
          Messagerie médicale confidentielle
        </h4>
        <p className="mt-1.5 font-body text-[12px] font-light text-text-muted-brand">
          Sélectionnez ou démarrez une conversation confidentielle
        </p>
      </div>
    )
  }

  let lastDate = ""

  return (
    <div className="flex h-full flex-col bg-bg-page">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border-brand bg-white px-5 py-3">
        <Avatar nom={interlocuteur.nom} prenom={interlocuteur.prenom} size="sm" />
        <div>
          <h4 className="font-display text-[15px] font-normal text-text-main">
            {interlocuteur.prenom} {interlocuteur.nom}
          </h4>
          <span className="font-body text-[10px] font-light text-text-muted-brand">
            Confidentiel
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 size={20} className="animate-spin text-gold" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="font-body text-[12px] font-light text-text-muted-brand">
              Aucun message. Envoyez le premier !
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.expediteurId === currentUserId
            const msgDate = new Date(msg.createdAt).toLocaleDateString()
            let showDateSep = false
            if (msgDate !== lastDate) {
              showDateSep = true
              lastDate = msgDate
            }

            return (
              <div key={msg.id}>
                {showDateSep && (
                  <div className="my-5 flex items-center gap-3">
                    <div className="h-px flex-1 bg-border-brand" />
                    <span className="font-body text-[10px] font-medium uppercase tracking-[0.15em] text-text-muted-brand">
                      {formatDateSeparator(msg.createdAt)}
                    </span>
                    <div className="h-px flex-1 bg-border-brand" />
                  </div>
                )}

                <div className={`mb-3 flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] ${isMine ? "items-end" : "items-start"}`}>
                    {!isMine && (
                      <p className="mb-1 font-display text-[12px] text-gold">
                        {msg.expediteur.prenom}
                      </p>
                    )}
                    <div
                      className={`px-4 py-2.5 font-body text-[13px] font-light leading-relaxed ${
                        isMine
                          ? "bg-primary-brand text-white"
                          : "border border-border-brand bg-white text-text-main"
                      }`}
                    >
                      {msg.contenu}
                    </div>
                    <div className={`mt-1 flex items-center gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
                      <span className="bg-red-50 px-1.5 py-0.5 font-body text-[8px] font-medium text-red-800">
                        Confidentiel
                      </span>
                      <span className="font-body text-[10px] text-text-muted-brand">
                        {new Date(msg.createdAt).toLocaleTimeString("fr", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Saisie */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-3 border-t border-border-brand bg-white px-5 py-3"
      >
        <input
          type="text"
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          placeholder="Message confidentiel\u2026"
          maxLength={2000}
          className="flex-1 border border-border-brand bg-bg-page px-4 py-2.5 font-body text-[13px] font-light text-text-main outline-none placeholder:text-text-muted-brand/60 focus:border-gold focus:bg-white"
        />
        <button
          type="submit"
          disabled={!saisie.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary-brand text-white transition-colors hover:bg-primary-dark disabled:opacity-40"
          aria-label="Envoyer"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}

// ── Modale nouvelle conversation médicale ───────────────────────
function NouvelleConversationMedicale({
  currentUserId,
  existingIds,
  onSelect,
  onClose,
}: {
  currentUserId: string
  existingIds: string[]
  onSelect: (user: Interlocuteur) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<(Interlocuteur & { role?: string })[]>([])
  const [loading, setLoading] = useState(false)

  async function handleSearch(q: string) {
    setQuery(q)
    if (q.length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const res = await fetch(
        `/api/medical/messages/recherche?q=${encodeURIComponent(q)}`
      )
      if (res.ok) {
        const data: { utilisateurs: (Interlocuteur & { role?: string })[] } = await res.json()
        setResults(
          data.utilisateurs.filter((u) => !existingIds.includes(u.id))
        )
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md border border-border-brand bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-border-brand p-5">
          <div>
            <h3 className="font-display text-[16px] font-light text-text-main">
              Nouvelle conversation médicale
            </h3>
            <p className="mt-0.5 font-body text-[11px] font-light text-text-muted-brand">
              Confidentiel
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center text-text-muted-brand transition-colors hover:text-text-main"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-brand"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Rechercher un accompagnateur médical\u2026"
              className="w-full border border-border-brand bg-bg-page py-2.5 pl-9 pr-3 font-body text-[13px] font-light text-text-main outline-none placeholder:text-text-muted-brand/60 focus:border-gold"
            />
          </div>

          <div className="mt-4 max-h-60 overflow-y-auto">
            {loading && (
              <div className="flex justify-center py-6">
                <Loader2 size={18} className="animate-spin text-gold" />
              </div>
            )}
            {!loading && query.length >= 2 && results.length === 0 && (
              <p className="py-6 text-center font-body text-[12px] font-light text-text-muted-brand">
                Aucun accompagnateur trouvé
              </p>
            )}
            {results.map((user) => (
              <button
                key={user.id}
                onClick={() => onSelect(user)}
                className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-primary-light"
              >
                <Avatar nom={user.nom} prenom={user.prenom} size="sm" />
                <div>
                  <span className="font-display text-[14px] font-normal text-text-main">
                    {user.prenom} {user.nom}
                  </span>
                  {user.role === "ACCOMPAGNATEUR_MEDICAL" && (
                    <span className="ml-2 bg-primary-light px-2 py-0.5 font-body text-[10px] font-medium text-primary-brand">
                      Accompagnateur
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

