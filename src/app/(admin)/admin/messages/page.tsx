"use client"

import { Suspense, useEffect, useState, useRef, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Send, Search, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Conversation {
  interlocuteur: {
    id: string
    nom: string
    prenom: string
    photoUrl: string | null
  }
  dernierMessage: { contenu: string; createdAt: string; expediteurId: string }
  nonLus: number
}

interface Message {
  id: string
  contenu: string
  expediteurId: string
  createdAt: string
}

export default function AdminMessagesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-40"><div className="h-6 w-6 border-2 border-primary-brand border-t-transparent rounded-full animate-spin" /></div>}>
      <AdminMessagesContent />
    </Suspense>
  )
}

function AdminMessagesContent() {
  const searchParams = useSearchParams()
  const preselectedClient = searchParams.get("client")

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(preselectedClient)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchConversations = useCallback(async () => {
    const res = await fetch("/api/messages/conversations")
    if (res.ok) {
      const data = await res.json()
      setConversations(data.conversations)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchConversations()
    intervalRef.current = setInterval(fetchConversations, 5000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [fetchConversations])

  const fetchMessages = useCallback(async (userId: string) => {
    const res = await fetch(`/api/messages/${userId}?limit=100`)
    if (res.ok) {
      const data = await res.json()
      setMessages(data.messages.reverse())
    }
    // mark as read
    await fetch(`/api/messages/${userId}/lus`, { method: "PATCH" })
  }, [])

  useEffect(() => {
    if (selectedId) {
      fetchMessages(selectedId)
      const interval = setInterval(() => fetchMessages(selectedId), 3000)
      return () => clearInterval(interval)
    }
  }, [selectedId, fetchMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || !selectedId) return
    setSending(true)
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destinataireId: selectedId, contenu: input.trim() }),
    })
    setInput("")
    setSending(false)
    fetchMessages(selectedId)
    fetchConversations()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const selectedConv = conversations.find((c) => c.interlocuteur.id === selectedId)
  const filtered = search
    ? conversations.filter((c) =>
        `${c.interlocuteur.prenom} ${c.interlocuteur.nom}`.toLowerCase().includes(search.toLowerCase())
      )
    : conversations

  const initials = (c: Conversation["interlocuteur"]) =>
    `${c.prenom?.[0] || ""}${c.nom?.[0] || ""}`.toUpperCase()

  return (
    <div className="flex h-[calc(100vh-120px)] border border-border-brand bg-white overflow-hidden">
      {/* Conversations list */}
      <div className="w-80 border-r border-border-brand flex flex-col">
        <div className="p-3 border-b border-border-brand">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-border-brand text-sm font-body focus:outline-none focus:border-primary-brand"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="h-5 w-5 border-3 border-primary-brand border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-500 font-body py-8">Aucune conversation</p>
          ) : (
            filtered.map((conv) => (
              <button
                key={conv.interlocuteur.id}
                onClick={() => setSelectedId(conv.interlocuteur.id)}
                className={cn(
                  "w-full text-left px-4 py-3 border-b border-border-brand hover:bg-bg-page transition-colors",
                  selectedId === conv.interlocuteur.id && "bg-bg-page"
                )}
              >
                <div className="flex items-center gap-3">
                  {conv.interlocuteur.photoUrl ? (
                    <img src={conv.interlocuteur.photoUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-primary-brand/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-primary-brand font-body">{initials(conv.interlocuteur)}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text-main font-body truncate">
                        {conv.interlocuteur.prenom} {conv.interlocuteur.nom}
                      </span>
                      {conv.nonLus > 0 && (
                        <span className="bg-primary-brand text-white text-[10px] h-5 min-w-[20px] flex items-center justify-center rounded-full font-body">
                          {conv.nonLus}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate font-body mt-0.5">
                      {conv.dernierMessage.contenu}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat window */}
      <div className="flex-1 flex flex-col">
        {selectedId && selectedConv ? (
          <>
            {/* Header */}
            <div className="px-4 py-3 border-b border-border-brand flex items-center gap-3">
              {selectedConv.interlocuteur.photoUrl ? (
                <img src={selectedConv.interlocuteur.photoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary-brand/10 flex items-center justify-center">
                  <span className="text-xs font-medium text-primary-brand font-body">{initials(selectedConv.interlocuteur)}</span>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-text-main font-body">
                  {selectedConv.interlocuteur.prenom} {selectedConv.interlocuteur.nom}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => {
                const isMe = msg.expediteurId !== selectedId
                return (
                  <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[70%] px-3 py-2 text-sm font-body",
                        isMe
                          ? "bg-primary-brand text-white"
                          : "bg-bg-page text-text-main border border-border-brand"
                      )}
                    >
                      <p className="whitespace-pre-wrap">{msg.contenu}</p>
                      <p className={cn("text-[10px] mt-1", isMe ? "text-white/70" : "text-gray-500")}>
                        {new Date(msg.createdAt).toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border-brand">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Écrire un message…"
                  rows={1}
                  className="flex-1 border border-border-brand px-3 py-2 text-sm font-body resize-none focus:outline-none focus:border-primary-brand max-h-24"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !input.trim()}
                  className="p-2 bg-primary-brand text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 text-border-brand mx-auto mb-3" />
              <p className="text-sm text-gray-500 font-body">Sélectionnez une conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
