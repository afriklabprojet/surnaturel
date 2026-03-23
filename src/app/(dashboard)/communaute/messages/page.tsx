"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Loader2, ArrowLeft } from "lucide-react"
import ListeConversations from "@/components/messagerie/ListeConversations"
import FenetreChat from "@/components/messagerie/FenetreChat"
import { usePusherChat } from "@/lib/hooks/use-pusher"
import { fadeInUp } from "@/lib/animations"

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
  type?: string
  dureeSecondes?: number | null
  lu: boolean
  createdAt: string
  replyTo?: { id: string; contenu: string; type?: string; expediteur: { id: string; prenom: string; nom: string } } | null
  reactions?: { type: string; userId: string }[]
  expediteur: {
    id: string
    nom: string
    prenom: string
    photoUrl: string | null
  }
}

export default function PageCommunaute() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const toUserId = searchParams.get("to")

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeInterlocuteur, setActiveInterlocuteur] =
    useState<Interlocuteur | null>(null)
  const [messages, setMessages] = useState<MessageData[]>([])
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [showChat, setShowChat] = useState(false)

  const currentUserId = session?.user?.id ?? ""
  const activeRef = useRef(activeInterlocuteur)
  activeRef.current = activeInterlocuteur

  // ── Pusher : écoute temps réel ──────────────────────────
  const handleNouveauMessage = useCallback(
    (msg: MessageData) => {
      if (msg.expediteurId === currentUserId) return
      setMessages((prev) => [...prev, msg])
      updateConversationPreview(msg)

      if (activeRef.current && msg.expediteurId === activeRef.current.id) {
        fetch(`/api/messages/${activeRef.current.id}/lus`, {
          method: "PATCH",
        }).catch(() => {})
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUserId]
  )

  const handleEcritureEnCours = useCallback((actif: boolean) => {
    setIsTyping(actif)
  }, [])

  const handleReactionPusher = useCallback(
    (data: { messageId: string; reactions: { type: string; count: number }[]; userId: string }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId
            ? {
                ...m,
                reactions: data.reactions.flatMap((r) =>
                  Array.from({ length: r.count }, () => ({ type: r.type, userId: "" }))
                ),
              }
            : m
        )
      )
    },
    []
  )

  usePusherChat(
    currentUserId,
    activeInterlocuteur?.id ?? "",
    handleNouveauMessage,
    handleEcritureEnCours,
    handleReactionPusher
  )

  // ── Redirection si non authentifié ──────────────────────
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/connexion?callbackUrl=/communaute")
    }
  }, [status, router])

  // ── Charger les conversations ───────────────────────────
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/messages/conversations")
      if (res.ok) {
        const data: { conversations: Conversation[] } = await res.json()
        setConversations(data.conversations)
      }
    } catch {
      // Silently fail
    } finally {
      setLoadingConvs(false)
    }
  }, [])

  useEffect(() => {
    if (status === "authenticated") {
      fetchConversations()
    }
  }, [status, fetchConversations])

  // ── Auto-ouvrir conversation depuis ?to=userId ──────────
  useEffect(() => {
    if (!toUserId || status !== "authenticated" || loadingConvs) return
    const existing = conversations.find((c) => c.interlocuteur.id === toUserId)
    if (existing) {
      handleSelectConversation(existing.interlocuteur)
    } else {
      fetch(`/api/communaute/profil?userId=${toUserId}`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data) {
            handleNewConversation({
              id: data.id,
              nom: data.nom,
              prenom: data.prenom,
              photoUrl: data.photoUrl,
            })
          }
        })
        .catch(() => {})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toUserId, status, loadingConvs])

  // ── Charger les messages d'une conversation ─────────────
  const fetchMessages = useCallback(async (userId: string) => {
    setLoadingMessages(true)
    try {
      const res = await fetch(`/api/messages/${userId}`)
      if (res.ok) {
        const data: { messages: MessageData[] } = await res.json()
        setMessages(data.messages)
      }
    } catch {
      // Silently fail
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  // ── Sélectionner une conversation ───────────────────────
  function handleSelectConversation(interlocuteur: Interlocuteur) {
    setActiveInterlocuteur(interlocuteur)
    setIsTyping(false)
    setShowChat(true)
    fetchMessages(interlocuteur.id)

    setConversations((prev) =>
      prev.map((c) =>
        c.interlocuteur.id === interlocuteur.id ? { ...c, nonLus: 0 } : c
      )
    )
    fetch(`/api/messages/${interlocuteur.id}/lus`, { method: "PATCH" }).catch(
      () => {}
    )
  }

  // ── Nouvelle conversation ───────────────────────────────
  function handleNewConversation(interlocuteur: Interlocuteur) {
    setActiveInterlocuteur(interlocuteur)
    setMessages([])
    setIsTyping(false)
    setShowChat(true)
  }

  // ── Envoyer un message ──────────────────────────────────
  function handleSendMessage(contenu: string, replyToId?: string) {
    if (!activeInterlocuteur) return

    fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        destinataireId: activeInterlocuteur.id,
        contenu,
        ...(replyToId ? { replyToId } : {}),
      }),
    })
      .then((res) => res.json())
      .then((data: { message: MessageData }) => {
        setMessages((prev) => [...prev, data.message])
        updateConversationPreview(data.message)
      })
      .catch(() => {})
  }

  // ── Envoyer un message vocal ────────────────────────────
  function handleSendVocal(file: Blob, duree: number, replyToId?: string) {
    if (!activeInterlocuteur) return
    const formData = new FormData()
    formData.append("audio", file, "vocal.webm")
    formData.append("destinataireId", activeInterlocuteur.id)
    formData.append("dureeSecondes", String(duree))
    if (replyToId) formData.append("replyToId", replyToId)

    fetch("/api/messages/vocal", { method: "POST", body: formData })
      .then((res) => res.json())
      .then((data: { message: MessageData }) => {
        setMessages((prev) => [...prev, data.message])
        updateConversationPreview(data.message)
      })
      .catch(() => {})
  }

  // ── Réagir à un message ─────────────────────────────────
  function handleReaction(messageId: string, type: string) {
    if (!activeInterlocuteur) return
    fetch(`/api/messages/${activeInterlocuteur.id}/reaction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, type }),
    })
      .then((res) => res.json())
      .then((data: { reactions: { type: string; count: number }[] }) => {
        // Mettre à jour les réactions du message localement
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  reactions: data.reactions.flatMap((r) =>
                    Array.from({ length: r.count }, () => ({ type: r.type, userId: "" }))
                  ),
                }
              : m
          )
        )
      })
      .catch(() => {})
  }

  // ── Mettre à jour l'aperçu de conversation ─────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  function updateConversationPreview(msg: MessageData) {
    const interlocuteurId =
      msg.expediteurId === currentUserId
        ? msg.destinataireId
        : msg.expediteurId

    setConversations((prev) => {
      const exists = prev.find((c) => c.interlocuteur.id === interlocuteurId)
      if (exists) {
        const updated = prev.map((c) =>
          c.interlocuteur.id === interlocuteurId
            ? {
                ...c,
                dernierMessage: {
                  contenu: msg.contenu,
                  createdAt: msg.createdAt,
                  expediteurId: msg.expediteurId,
                },
                nonLus:
                  msg.expediteurId !== currentUserId &&
                  activeRef.current?.id !== interlocuteurId
                    ? c.nonLus + 1
                    : c.nonLus,
              }
            : c
        )
        return updated.sort(
          (a, b) =>
            new Date(b.dernierMessage.createdAt).getTime() -
            new Date(a.dernierMessage.createdAt).getTime()
        )
      }
      return [
        {
          interlocuteur: msg.expediteur,
          dernierMessage: {
            contenu: msg.contenu,
            createdAt: msg.createdAt,
            expediteurId: msg.expediteurId,
          },
          nonLus: activeRef.current?.id === interlocuteurId ? 0 : 1,
        },
        ...prev,
      ]
    })
  }

  // ── Indicateur « en train d'écrire » via Pusher (debounced) ──
  const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTypingSentRef = useRef(false)

  function handleTyping(enCours: boolean) {
    if (!activeInterlocuteur) return

    // Éviter d'envoyer le même état deux fois d'affilée
    if (enCours === lastTypingSentRef.current && enCours) return

    // Si on arrête d'écrire, envoyer immédiatement
    if (!enCours) {
      if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current)
      lastTypingSentRef.current = false
      fetch("/api/messages/ecriture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destinataireId: activeInterlocuteur.id, actif: false }),
      }).catch(() => {})
      return
    }

    // Debounce : envoyer "en train d'écrire" au maximum 1 fois / 3s
    if (typingDebounceRef.current) return
    lastTypingSentRef.current = true
    fetch("/api/messages/ecriture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destinataireId: activeInterlocuteur.id, actif: true }),
    }).catch(() => {})
    typingDebounceRef.current = setTimeout(() => {
      typingDebounceRef.current = null
    }, 3000)
  }

  if (status === "loading" || loadingConvs) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-gold" />
      </div>
    )
  }

  return (
    <section className="-m-5 lg:-m-8">
      {/* En-tête */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="border-b border-border-brand bg-white px-5 py-4"
      >
        <h1 className="font-display text-[28px] font-light text-text-main">
          Communauté
        </h1>
        <p className="font-body text-[12px] text-text-muted-brand">
          Échangez avec les membres et l&apos;équipe du centre
        </p>
      </motion.div>

      <div className="flex h-[calc(100vh-200px)] overflow-hidden border-b border-border-brand bg-white">
        {/* Colonne gauche — 280px fixe : Liste des conversations */}
        <div
          className={`w-full border-r border-border-brand md:w-[280px] md:shrink-0 ${
            showChat ? "hidden md:flex md:flex-col" : "flex flex-col"
          }`}
        >
          <ListeConversations
            conversations={conversations}
            activeUserId={activeInterlocuteur?.id ?? null}
            currentUserId={currentUserId}
            onSelect={handleSelectConversation}
            onNewConversation={handleNewConversation}
          />
        </div>

        {/* Colonne droite — flex : Fenêtre de chat */}
        <div
          className={`flex-1 ${
            showChat ? "flex flex-col" : "hidden md:flex md:flex-col"
          }`}
        >
          {/* Bouton retour mobile */}
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
              loading={loadingMessages}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
