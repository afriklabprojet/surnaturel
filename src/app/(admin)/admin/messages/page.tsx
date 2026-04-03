"use client"

import { Suspense, useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { Loader2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import ListeConversations from "@/components/messagerie/ListeConversations"
import FenetreChat from "@/components/messagerie/FenetreChatLazy"
import { usePusherChat } from "@/lib/hooks/use-pusher"
import type { MessageData, Interlocuteur, Conversation } from "@/types/messages"

export default function AdminMessagesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-gold" /></div>}>
      <AdminMessagesContent />
    </Suspense>
  )
}

function AdminMessagesContent() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const preselectedClient = searchParams.get("client")

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeInterlocuteur, setActiveInterlocuteur] = useState<Interlocuteur | null>(null)
  const [messages, setMessages] = useState<MessageData[]>([])
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [presenceEnLigne, setPresenceEnLigne] = useState(false)
  const [derniereVueLe, setDerniereVueLe] = useState<string | null>(null)
  const [ephemere, setEphemere] = useState(false)

  const currentUserId = session?.user?.id ?? ""
  const activeRef = useRef(activeInterlocuteur)
  activeRef.current = activeInterlocuteur

  // ── Pusher : écoute temps réel ──────────────────────────
  const handleNouveauMessage = useCallback(
    (msg: MessageData) => {
      if (msg.expediteurId === currentUserId) return
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
      updateConversationPreview(msg)
      if (activeRef.current && msg.expediteurId === activeRef.current.id) {
        fetch(`/api/messages/${activeRef.current.id}/lus`, { method: "PATCH" }).catch(() => {})
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUserId]
  )

  const handleEcritureEnCours = useCallback((actif: boolean) => { setIsTyping(actif) }, [])

  const handleReactionPusher = useCallback(
    (data: { messageId: string; reactions: { type: string; count: number }[]; userId: string }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId
            ? { ...m, reactions: data.reactions.flatMap((r) => Array.from({ length: r.count }, () => ({ type: r.type, userId: "" }))) }
            : m
        )
      )
    },
    []
  )

  const handleMessageLu = useCallback(() => {
    setMessages((prev) => prev.map((m) => m.expediteurId === currentUserId ? { ...m, lu: true } : m))
  }, [currentUserId])

  const handleMessageSupprime = useCallback(({ messageId }: { messageId: string }) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId))
  }, [])

  const handleMessageModifie = useCallback(({ messageId, contenu, modifieLeAt }: { messageId: string; contenu: string; modifieLeAt: string }) => {
    setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, contenu, modifie: true, modifieLeAt } : m))
  }, [])

  const handleMessageEpingle = useCallback(({ messageId, epingle }: { messageId: string; epingle: boolean; message: MessageData | null }) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (epingle && m.id !== messageId) return { ...m, epingle: false }
        if (m.id === messageId) return { ...m, epingle }
        return m
      })
    )
  }, [])

  usePusherChat(
    currentUserId,
    activeInterlocuteur?.id ?? "",
    handleNouveauMessage,
    handleEcritureEnCours,
    handleReactionPusher,
    handleMessageLu,
    handleMessageSupprime,
    handleMessageModifie,
    handleMessageEpingle
  )

  // ── Charger les conversations ───────────────────────────
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/messages/conversations")
      if (res.ok) {
        const data: { conversations: Conversation[] } = await res.json()
        setConversations(
          Array.from(new Map(data.conversations.map((c) => [c.interlocuteur.id, c])).values())
        )
      }
    } catch { /* silently fail */ }
    finally { setLoadingConvs(false) }
  }, [])

  useEffect(() => {
    if (status === "authenticated") fetchConversations()
  }, [status, fetchConversations])

  // ── Heartbeat présence ──────────────────────────────────
  useEffect(() => {
    if (status !== "authenticated") return
    const ping = () => fetch("/api/presence", { method: "POST" }).catch(() => {})
    ping()
    const interval = setInterval(ping, 30_000)
    return () => clearInterval(interval)
  }, [status])

  // ── Présence de l'interlocuteur ─────────────────────────
  const fetchPresence = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/presence/${userId}`)
      if (res.ok) {
        const data: { enLigne: boolean; derniereVueLe: string | null } = await res.json()
        setPresenceEnLigne(data.enLigne)
        setDerniereVueLe(data.derniereVueLe)
      }
    } catch { /* silently fail */ }
  }, [])

  // ── Auto-ouvrir conversation depuis ?client=userId ──────
  useEffect(() => {
    if (!preselectedClient || status !== "authenticated" || loadingConvs) return
    const existing = conversations.find((c) => c.interlocuteur.id === preselectedClient)
    if (existing) {
      handleSelectConversation(existing.interlocuteur)
    } else {
      fetch(`/api/communaute/profil?userId=${preselectedClient}`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data) {
            handleNewConversation({ id: data.id, nom: data.nom, prenom: data.prenom, photoUrl: data.photoUrl })
          }
        })
        .catch(() => toast.error("Impossible de charger ce profil"))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedClient, status, loadingConvs])

  // ── Charger les messages ────────────────────────────────
  const fetchMessages = useCallback(async (userId: string, page = 1) => {
    if (page === 1) setLoadingMessages(true)
    else setLoadingMore(true)
    try {
      const res = await fetch(`/api/messages/${userId}?page=${page}&limit=50`)
      if (res.ok) {
        const data: { messages: MessageData[]; pagination: { page: number; pages: number } } = await res.json()
        if (page === 1) setMessages(data.messages)
        else setMessages((prev) => [...data.messages, ...prev])
        setCurrentPage(page)
        setHasMore(page < data.pagination.pages)
      }
    } catch { /* silently fail */ }
    finally { setLoadingMessages(false); setLoadingMore(false) }
  }, [])

  const loadMoreMessages = useCallback(() => {
    if (!activeInterlocuteur || loadingMore || !hasMore) return
    fetchMessages(activeInterlocuteur.id, currentPage + 1)
  }, [activeInterlocuteur, loadingMore, hasMore, currentPage, fetchMessages])

  // ── Sélectionner une conversation ───────────────────────
  function handleSelectConversation(interlocuteur: Interlocuteur) {
    setActiveInterlocuteur(interlocuteur)
    setIsTyping(false)
    setShowChat(true)
    setCurrentPage(1)
    setHasMore(false)
    setPresenceEnLigne(false)
    setDerniereVueLe(null)
    fetchMessages(interlocuteur.id, 1)
    fetchPresence(interlocuteur.id)
    setConversations((prev) => prev.map((c) => c.interlocuteur.id === interlocuteur.id ? { ...c, nonLus: 0 } : c))
    fetch(`/api/messages/${interlocuteur.id}/lus`, { method: "PATCH" }).catch(() => {})
  }

  function handleNewConversation(interlocuteur: Interlocuteur) {
    setActiveInterlocuteur(interlocuteur)
    setMessages([])
    setIsTyping(false)
    setShowChat(true)
  }

  const tempIdCounter = useRef(0)

  // ── Envoyer un message (optimistic) ─────────────────────
  function handleSendMessage(contenu: string, replyToId?: string) {
    if (!activeInterlocuteur || !session?.user) return
    const tempId = `_temp_${++tempIdCounter.current}_${Date.now()}`
    const optimisticMsg: MessageData = {
      id: tempId, expediteurId: currentUserId, destinataireId: activeInterlocuteur.id,
      contenu, type: "TEXTE", lu: false, createdAt: new Date().toISOString(),
      replyTo: replyToId ? (() => { const m = messages.find((x) => x.id === replyToId); return m ? { id: replyToId, contenu: m.contenu, type: m.type, expediteur: m.expediteur } : null })() : null,
      reactions: [],
      expediteur: { id: currentUserId, nom: session.user.nom ?? "", prenom: session.user.prenom ?? "", photoUrl: session.user.photoUrl ?? null },
      _optimistic: true, _status: "sending", _tempId: tempId,
    }
    setMessages((prev) => [...prev, optimisticMsg])
    updateConversationPreview(optimisticMsg)

    fetch("/api/messages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destinataireId: activeInterlocuteur.id, contenu, ...(replyToId ? { replyToId } : {}), ...(ephemere ? { ephemere: true } : {}) }),
    })
      .then((res) => { if (!res.ok) throw new Error("send failed"); return res.json() })
      .then((data: { message: MessageData }) => {
        setMessages((prev) => prev.map((m) => m._tempId === tempId ? { ...data.message, _status: "sent" as const } : m))
      })
      .catch(() => {
        setMessages((prev) => prev.map((m) => m._tempId === tempId ? { ...m, _status: "error" as const } : m))
      })
  }

  // ── Envoyer un vocal ────────────────────────────────────
  function handleSendVocal(file: Blob, duree: number, replyToId?: string) {
    if (!activeInterlocuteur || !session?.user) return
    const tempId = `_temp_${++tempIdCounter.current}_${Date.now()}`
    const optimisticMsg: MessageData = {
      id: tempId, expediteurId: currentUserId, destinataireId: activeInterlocuteur.id,
      contenu: "🎤 Envoi en cours…", type: "VOCAL", dureeSecondes: duree, lu: false, createdAt: new Date().toISOString(),
      replyTo: null, reactions: [],
      expediteur: { id: currentUserId, nom: session.user.nom ?? "", prenom: session.user.prenom ?? "", photoUrl: session.user.photoUrl ?? null },
      _optimistic: true, _status: "sending", _tempId: tempId,
    }
    setMessages((prev) => [...prev, optimisticMsg])
    updateConversationPreview(optimisticMsg)

    const formData = new FormData()
    formData.append("audio", file, "vocal.webm")
    formData.append("destinataireId", activeInterlocuteur.id)
    formData.append("dureeSecondes", String(duree))
    if (replyToId) formData.append("replyToId", replyToId)

    fetch("/api/messages/vocal", { method: "POST", body: formData })
      .then((res) => { if (!res.ok) throw new Error("send failed"); return res.json() })
      .then((data: { message: MessageData }) => {
        setMessages((prev) => prev.map((m) => m._tempId === tempId ? { ...data.message, _status: "sent" as const } : m))
      })
      .catch(() => {
        setMessages((prev) => prev.map((m) => m._tempId === tempId ? { ...m, _status: "error" as const, contenu: "🎤 Message vocal" } : m))
      })
  }

  // ── Envoyer une image ───────────────────────────────────
  function handleSendImage(file: File, replyToId?: string) {
    if (!activeInterlocuteur || !session?.user) return
    const tempId = `_temp_${++tempIdCounter.current}_${Date.now()}`
    const objectUrl = URL.createObjectURL(file)
    const optimisticMsg: MessageData = {
      id: tempId, expediteurId: currentUserId, destinataireId: activeInterlocuteur.id,
      contenu: objectUrl, type: "MEDIA", lu: false, createdAt: new Date().toISOString(),
      replyTo: null, reactions: [],
      expediteur: { id: currentUserId, nom: session.user.nom ?? "", prenom: session.user.prenom ?? "", photoUrl: session.user.photoUrl ?? null },
      _optimistic: true, _status: "sending", _tempId: tempId,
    }
    setMessages((prev) => [...prev, optimisticMsg])
    updateConversationPreview(optimisticMsg)

    const formData = new FormData()
    formData.append("image", file)
    formData.append("destinataireId", activeInterlocuteur.id)
    if (replyToId) formData.append("replyToId", replyToId)
    if (ephemere) formData.append("ephemere", "true")

    fetch("/api/messages/image", { method: "POST", body: formData })
      .then((res) => { if (!res.ok) throw new Error("send failed"); return res.json() })
      .then((data: { message: MessageData }) => {
        URL.revokeObjectURL(objectUrl)
        setMessages((prev) => prev.map((m) => m._tempId === tempId ? { ...data.message, _status: "sent" as const } : m))
      })
      .catch(() => {
        setMessages((prev) => prev.map((m) => m._tempId === tempId ? { ...m, _status: "error" as const } : m))
      })
  }

  // ── Envoyer un fichier ──────────────────────────────────
  function handleSendFile(file: File, replyToId?: string) {
    if (!activeInterlocuteur || !session?.user) return
    const tempId = `_temp_${++tempIdCounter.current}_${Date.now()}`
    const optimisticMsg: MessageData = {
      id: tempId, expediteurId: currentUserId, destinataireId: activeInterlocuteur.id,
      contenu: `[fichier] ${file.name}|${file.size}|`, type: "FICHIER", lu: false, createdAt: new Date().toISOString(),
      replyTo: null, reactions: [],
      expediteur: { id: currentUserId, nom: session.user.nom ?? "", prenom: session.user.prenom ?? "", photoUrl: session.user.photoUrl ?? null },
      _optimistic: true, _status: "sending", _tempId: tempId,
    }
    setMessages((prev) => [...prev, optimisticMsg])
    updateConversationPreview(optimisticMsg)

    const formData = new FormData()
    formData.append("fichier", file)
    formData.append("destinataireId", activeInterlocuteur.id)
    if (replyToId) formData.append("replyToId", replyToId)

    fetch("/api/messages/fichier", { method: "POST", body: formData })
      .then((res) => { if (!res.ok) throw new Error("send failed"); return res.json() })
      .then((data: { message: MessageData }) => {
        setMessages((prev) => prev.map((m) => m._tempId === tempId ? { ...data.message, _status: "sent" as const } : m))
      })
      .catch(() => {
        setMessages((prev) => prev.map((m) => m._tempId === tempId ? { ...m, _status: "error" as const } : m))
      })
  }

  // ── Message programmé ───────────────────────────────────
  function handleScheduleMessage(contenu: string, programmeA: Date, replyToId?: string) {
    if (!activeInterlocuteur || !session?.user) return
    const tempId = `_temp_${++tempIdCounter.current}_${Date.now()}`
    const optimisticMsg: MessageData = {
      id: tempId, expediteurId: currentUserId, destinataireId: activeInterlocuteur.id,
      contenu, type: "TEXTE", lu: false, createdAt: new Date().toISOString(),
      replyTo: null, reactions: [], programmeA: programmeA.toISOString(), programmeEnvoye: false,
      expediteur: { id: currentUserId, nom: session.user.nom ?? "", prenom: session.user.prenom ?? "", photoUrl: session.user.photoUrl ?? null },
      _optimistic: true, _status: "sending", _tempId: tempId,
    }
    setMessages((prev) => [...prev, optimisticMsg])

    fetch("/api/messages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destinataireId: activeInterlocuteur.id, contenu, ...(replyToId ? { replyToId } : {}), programmeA: programmeA.toISOString() }),
    })
      .then((res) => { if (!res.ok) throw new Error("send failed"); return res.json() })
      .then((data: { message: MessageData }) => {
        setMessages((prev) => prev.map((m) => m._tempId === tempId ? { ...data.message, _status: "sent" as const } : m))
      })
      .catch(() => {
        setMessages((prev) => prev.map((m) => m._tempId === tempId ? { ...m, _status: "error" as const } : m))
      })
  }

  // ── Supprimer ───────────────────────────────────────────
  function handleSupprimerMessage(messageId: string) {
    setMessages((prev) => prev.filter((m) => m.id !== messageId))
    fetch(`/api/messages/message/${messageId}`, { method: "DELETE" })
      .then((res) => { if (!res.ok && activeInterlocuteur) fetchMessages(activeInterlocuteur.id, 1) })
      .catch(() => { if (activeInterlocuteur) fetchMessages(activeInterlocuteur.id, 1) })
  }

  // ── Modifier ────────────────────────────────────────────
  function handleEditMessage(messageId: string, nouveauContenu: string) {
    setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, contenu: nouveauContenu, modifie: true, modifieLeAt: new Date().toISOString() } : m))
    fetch(`/api/messages/message/${messageId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "edit", contenu: nouveauContenu }) })
      .then((res) => { if (!res.ok && activeInterlocuteur) fetchMessages(activeInterlocuteur.id, 1) })
      .catch(() => { if (activeInterlocuteur) fetchMessages(activeInterlocuteur.id, 1) })
  }

  // ── Épingler ────────────────────────────────────────────
  function handlePinMessage(messageId: string, nouvelEtat: boolean) {
    setMessages((prev) => prev.map((m) => {
      if (nouvelEtat && m.id !== messageId) return { ...m, epingle: false }
      if (m.id === messageId) return { ...m, epingle: nouvelEtat }
      return m
    }))
    fetch(`/api/messages/message/${messageId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: nouvelEtat ? "pin" : "unpin" }) })
      .then((res) => { if (!res.ok && activeInterlocuteur) fetchMessages(activeInterlocuteur.id, 1) })
      .catch(() => { if (activeInterlocuteur) fetchMessages(activeInterlocuteur.id, 1) })
  }

  // ── Transférer ──────────────────────────────────────────
  function handleForwardMessage(contenu: string, type: string, contactId: string) {
    if (!contactId) return
    if (contactId === activeInterlocuteur?.id) {
      if (type === "TEXTE") handleSendMessage(contenu)
      return
    }
    if (type !== "TEXTE") return
    fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destinataireId: contactId, contenu }),
    }).catch(() => {})
  }

  // ── Réagir ──────────────────────────────────────────────
  function handleReaction(messageId: string, type: string) {
    if (!activeInterlocuteur) return
    fetch(`/api/messages/${activeInterlocuteur.id}/reaction`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, type }),
    })
      .then((res) => res.json())
      .then((data: { reactions: { type: string; count: number }[] }) => {
        setMessages((prev) => prev.map((m) =>
          m.id === messageId
            ? { ...m, reactions: data.reactions.flatMap((r) => Array.from({ length: r.count }, () => ({ type: r.type, userId: "" }))) }
            : m
        ))
      })
      .catch(() => toast.error("Erreur lors de l'ajout de la réaction"))
  }

  // ── Renvoyer un message échoué ──────────────────────────
  function handleRetry(tempId: string) {
    const failedMsg = messages.find((m) => m._tempId === tempId)
    if (!failedMsg || !activeInterlocuteur) return
    setMessages((prev) => prev.filter((m) => m._tempId !== tempId))
    if (failedMsg.type === "VOCAL") return
    handleSendMessage(failedMsg.contenu, failedMsg.replyTo?.id)
  }

  // ── Mettre à jour l'aperçu de conversation ─────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  function updateConversationPreview(msg: MessageData) {
    const interlocuteurId = msg.expediteurId === currentUserId ? msg.destinataireId : msg.expediteurId
    setConversations((prev) => {
      const exists = prev.find((c) => c.interlocuteur.id === interlocuteurId)
      if (exists) {
        const updated = prev.map((c) =>
          c.interlocuteur.id === interlocuteurId
            ? { ...c, dernierMessage: { contenu: msg.contenu, createdAt: msg.createdAt, expediteurId: msg.expediteurId }, nonLus: msg.expediteurId !== currentUserId && activeRef.current?.id !== interlocuteurId ? c.nonLus + 1 : c.nonLus }
            : c
        )
        return updated.sort((a, b) => new Date(b.dernierMessage.createdAt).getTime() - new Date(a.dernierMessage.createdAt).getTime())
      }
      const interlocuteurInfo = msg.expediteurId === currentUserId
        ? (activeRef.current ?? { id: interlocuteurId, nom: "", prenom: "", photoUrl: null })
        : msg.expediteur
      return Array.from(new Map([{ interlocuteur: interlocuteurInfo, dernierMessage: { contenu: msg.contenu, createdAt: msg.createdAt, expediteurId: msg.expediteurId }, nonLus: activeRef.current?.id === interlocuteurId ? 0 : 1 }, ...prev].map((c) => [c.interlocuteur.id, c])).values())
    })
  }

  // ── Indicateur écriture ─────────────────────────────────
  const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTypingSentRef = useRef(false)

  function handleTyping(enCours: boolean) {
    if (!activeInterlocuteur) return
    if (enCours === lastTypingSentRef.current && enCours) return
    if (!enCours) {
      if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current)
      lastTypingSentRef.current = false
      fetch("/api/messages/ecriture", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ destinataireId: activeInterlocuteur.id, actif: false }) }).catch(() => {})
      return
    }
    if (typingDebounceRef.current) return
    lastTypingSentRef.current = true
    fetch("/api/messages/ecriture", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ destinataireId: activeInterlocuteur.id, actif: true }) }).catch(() => {})
    typingDebounceRef.current = setTimeout(() => { typingDebounceRef.current = null }, 3000)
  }

  if (status === "loading" || loadingConvs) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-gold" />
      </div>
    )
  }

  return (
    <div className="flex border border-border-brand bg-white overflow-hidden" style={{ height: "calc(100dvh - 120px)" }}>
      {/* Liste des conversations */}
      <div className={`w-full border-r border-border-brand md:w-80 md:shrink-0 ${showChat ? "hidden md:flex md:flex-col" : "flex flex-col"}`}>
        <ListeConversations
          conversations={conversations}
          activeUserId={activeInterlocuteur?.id ?? null}
          currentUserId={currentUserId}
          onSelect={handleSelectConversation}
          onNewConversation={handleNewConversation}
        />
      </div>

      {/* Fenêtre de chat */}
      <div className={`flex-1 ${showChat ? "flex flex-col" : "hidden md:flex md:flex-col"}`}>
        {showChat && (
          <div className="border-b border-border-brand bg-white px-5 py-2.5 md:hidden">
            <button
              onClick={() => setShowChat(false)}
              className="flex items-center gap-1.5 font-body text-[12px] font-medium text-gold transition-colors duration-200 hover:text-primary-brand"
            >
              <ArrowLeft size={14} />
              Conversations
            </button>
          </div>
        )}
        <div className="flex-1">
          <FenetreChat
            interlocuteur={activeInterlocuteur}
            currentUserId={currentUserId}
            messages={messages}
            isTyping={isTyping}
            onSendMessage={handleSendMessage}
            onSendVocal={handleSendVocal}
            onReaction={handleReaction}
            onTyping={handleTyping}
            onRetry={handleRetry}
            onDelete={handleSupprimerMessage}
            onEdit={handleEditMessage}
            onPin={handlePinMessage}
            onForward={handleForwardMessage}
            onSendImage={handleSendImage}
            onSendFile={handleSendFile}
            onSchedule={handleScheduleMessage}
            onLoadMore={loadMoreMessages}
            hasMore={hasMore}
            loadingMore={loadingMore}
            loading={loadingMessages}
            presenceEnLigne={presenceEnLigne}
            derniereVueLe={derniereVueLe}
            ephemere={ephemere}
            onToggleEphemere={() => setEphemere((v) => !v)}
            contacts={conversations.map((c) => c.interlocuteur).filter((c) => c.id !== activeInterlocuteur?.id)}
          />
        </div>
      </div>
    </div>
  )
}
