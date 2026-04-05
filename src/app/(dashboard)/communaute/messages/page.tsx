"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import ListeConversations from "@/components/messagerie/ListeConversations"
import FenetreChat from "@/components/messagerie/FenetreChatLazy"
import { usePusherChat } from "@/lib/hooks/use-pusher"
import type { MessageData, Interlocuteur, Conversation } from "@/types/messages"

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
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  // Présence en ligne
  const [presenceEnLigne, setPresenceEnLigne] = useState(false)
  const [derniereVueLe, setDerniereVueLe] = useState<string | null>(null)
  // Messages éphémères
  const [ephemere, setEphemere] = useState(false)
  // Push notifications
  const [pushActive, setPushActive] = useState(false)

  const currentUserId = session?.user?.id ?? ""
  const activeRef = useRef(activeInterlocuteur)
  activeRef.current = activeInterlocuteur

  // ── Pusher : écoute temps réel ──────────────────────────
  const handleNouveauMessage = useCallback(
    (msg: MessageData) => {
      // Skip our own messages — already shown via optimistic update
      if (msg.expediteurId === currentUserId) return
      // Deduplicate: skip if message ID already exists
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
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
        prev.map((m) => {
          if (m.id !== data.messageId) return m
          // Keep existing reactions for all users except the one who just reacted
          const otherReactions = (m.reactions ?? []).filter((r) => r.userId !== data.userId)
          // Find which reaction type this user added (count increased) or none (toggle off)
          const userReactionType = data.reactions.find((r) => {
            const oldCount = (m.reactions ?? []).filter((rx) => rx.type === r.type).length
            return r.count > oldCount
          })?.type ?? null
          const newReactions = userReactionType
            ? [...otherReactions, { type: userReactionType, userId: data.userId }]
            : otherReactions
          return { ...m, reactions: newReactions }
        })
      )
    },
    []
  )

  // ── Read receipts : marquer ✓✓ bleu en temps réel ────────
  const handleMessageLu = useCallback(() => {
    setMessages((prev) =>
      prev.map((m) =>
        m.expediteurId === currentUserId ? { ...m, lu: true } : m
      )
    )
  }, [currentUserId])

  // ── Message supprimé par l'expéditeur ───────────────────
  const handleMessageSupprime = useCallback(({ messageId }: { messageId: string }) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId))
  }, [])

  // ── Message modifié en temps réel ────────────────────────
  const handleMessageModifie = useCallback(({ messageId, contenu, modifieLeAt }: { messageId: string; contenu: string; modifieLeAt: string }) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, contenu, modifie: true, modifieLeAt } : m
      )
    )
  }, [])

  // ── Message épinglé/désépinglé en temps réel ─────────────
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
        setConversations(
          Array.from(new Map(data.conversations.map((c) => [c.interlocuteur.id, c])).values())
        )
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

  // ── Heartbeat présence : signaler que je suis en ligne ──
  useEffect(() => {
    if (status !== "authenticated") return
    const ping = () => fetch("/api/presence", { method: "POST" }).catch(() => {})
    ping()
    const interval = setInterval(ping, 30_000)
    return () => clearInterval(interval)
  }, [status])

  // ── Push notifications : vérifier si déjà abonné ────────
  useEffect(() => {
    if (status !== "authenticated" || typeof window === "undefined" || !("serviceWorker" in navigator)) return
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setPushActive(!!sub)
      }).catch(() => {})
    }).catch(() => {})
  }, [status])

  // ── Activer / désactiver notifications push ─────────────
  async function handleTogglePush() {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) return
    try {
      const reg = await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      if (existing) {
        // Désabonner
        await existing.unsubscribe()
        await fetch("/api/push/subscribe", { method: "DELETE" })
        setPushActive(false)
      } else {
        // S'abonner
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!vapidKey) return
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKey,
        })
        const subJson = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string }; expirationTime?: number | null }
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: subJson.endpoint,
            p256dh: subJson.keys.p256dh,
            auth: subJson.keys.auth,
          }),
        })
        setPushActive(true)
      }
    } catch { /* push non supporté ou refusé */ }
  }

  // ── Récupérer la présence de l'interlocuteur actif ───────
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
        .catch(() => toast.error("Impossible de charger ce profil"))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toUserId, status, loadingConvs])

  // ── Charger les messages d'une conversation ─────────────
  const fetchMessages = useCallback(async (userId: string, page = 1) => {
    if (page === 1) setLoadingMessages(true)
    else setLoadingMore(true)
    try {
      const res = await fetch(`/api/messages/${userId}?page=${page}&limit=50`)
      if (res.ok) {
        const data: { messages: MessageData[]; pagination: { page: number; pages: number } } = await res.json()
        if (page === 1) {
          setMessages(data.messages)
        } else {
          // Prepend older messages
          setMessages((prev) => [...data.messages, ...prev])
        }
        setCurrentPage(page)
        setHasMore(page < data.pagination.pages)
      }
    } catch {
      // Silently fail
    } finally {
      setLoadingMessages(false)
      setLoadingMore(false)
    }
  }, [])

  // ── Charger les messages plus anciens (infinite scroll) ──
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

  // ── Compteur ID temporaire ──────────────────────────────
  const tempIdCounter = useRef(0)

  // ── Envoyer un message (optimistic) ─────────────────────
  function handleSendMessage(contenu: string, replyToId?: string) {
    if (!activeInterlocuteur || !session?.user) return

    const tempId = `_temp_${++tempIdCounter.current}_${Date.now()}`
    const optimisticMsg: MessageData = {
      id: tempId,
      expediteurId: currentUserId,
      destinataireId: activeInterlocuteur.id,
      contenu,
      type: "TEXTE",
      lu: false,
      createdAt: new Date().toISOString(),
      replyTo: replyToId ? messages.find((m) => m.id === replyToId) ? {
        id: replyToId,
        contenu: messages.find((m) => m.id === replyToId)!.contenu,
        type: messages.find((m) => m.id === replyToId)!.type,
        expediteur: messages.find((m) => m.id === replyToId)!.expediteur,
      } : null : null,
      reactions: [],
      expediteur: {
        id: currentUserId,
        nom: session.user.nom ?? "",
        prenom: session.user.prenom ?? "",
        photoUrl: session.user.photoUrl ?? null,
      },
      _optimistic: true,
      _status: "sending",
      _tempId: tempId,
    }

    // Instantly show the message
    setMessages((prev) => [...prev, optimisticMsg])
    updateConversationPreview(optimisticMsg)

    // Send to server in background
    fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        destinataireId: activeInterlocuteur.id,
        contenu,
        ...(replyToId ? { replyToId } : {}),
        ...(ephemere ? { ephemere: true } : {}),
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("send failed")
        return res.json()
      })
      .then((data: { message: MessageData }) => {
        // Replace optimistic message with real one
        setMessages((prev) =>
          prev.map((m) =>
            m._tempId === tempId
              ? { ...data.message, _status: "sent" as const }
              : m
          )
        )
      })
      .catch(() => {
        // Mark as failed — user can retry
        setMessages((prev) =>
          prev.map((m) =>
            m._tempId === tempId
              ? { ...m, _status: "error" as const }
              : m
          )
        )
      })
  }

  // ── Envoyer une pièce jointe ─────────────────────────────
  function handleSendFile(file: File, replyToId?: string) {
    if (!activeInterlocuteur || !session?.user) return

    const tempId = `_temp_${++tempIdCounter.current}_${Date.now()}`
    const optimisticMsg: MessageData = {
      id: tempId,
      expediteurId: currentUserId,
      destinataireId: activeInterlocuteur.id,
      contenu: `[fichier] ${file.name}|${file.size}|`,
      type: "FICHIER",
      lu: false,
      createdAt: new Date().toISOString(),
      replyTo: null,
      reactions: [],
      expediteur: {
        id: currentUserId,
        nom: session.user.nom ?? "",
        prenom: session.user.prenom ?? "",
        photoUrl: session.user.photoUrl ?? null,
      },
      _optimistic: true,
      _status: "sending",
      _tempId: tempId,
    }

    setMessages((prev) => [...prev, optimisticMsg])
    updateConversationPreview(optimisticMsg)

    const formData = new FormData()
    formData.append("fichier", file)
    formData.append("destinataireId", activeInterlocuteur.id)
    if (replyToId) formData.append("replyToId", replyToId)

    fetch("/api/messages/fichier", { method: "POST", body: formData })
      .then((res) => {
        if (!res.ok) throw new Error("send failed")
        return res.json()
      })
      .then((data: { message: MessageData }) => {
        setMessages((prev) =>
          prev.map((m) =>
            m._tempId === tempId ? { ...data.message, _status: "sent" as const } : m
          )
        )
      })
      .catch(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m._tempId === tempId ? { ...m, _status: "error" as const } : m
          )
        )
      })
  }

  // ── Envoyer un message programmé ─────────────────────────
  function handleScheduleMessage(contenu: string, programmeA: Date, replyToId?: string) {
    if (!activeInterlocuteur || !session?.user) return

    const tempId = `_temp_${++tempIdCounter.current}_${Date.now()}`
    const optimisticMsg: MessageData = {
      id: tempId,
      expediteurId: currentUserId,
      destinataireId: activeInterlocuteur.id,
      contenu,
      type: "TEXTE",
      lu: false,
      createdAt: new Date().toISOString(),
      replyTo: null,
      reactions: [],
      programmeA: programmeA.toISOString(),
      programmeEnvoye: false,
      expediteur: {
        id: currentUserId,
        nom: session.user.nom ?? "",
        prenom: session.user.prenom ?? "",
        photoUrl: session.user.photoUrl ?? null,
      },
      _optimistic: true,
      _status: "sending",
      _tempId: tempId,
    }

    setMessages((prev) => [...prev, optimisticMsg])

    fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        destinataireId: activeInterlocuteur.id,
        contenu,
        ...(replyToId ? { replyToId } : {}),
        programmeA: programmeA.toISOString(),
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("send failed")
        return res.json()
      })
      .then((data: { message: MessageData }) => {
        setMessages((prev) =>
          prev.map((m) =>
            m._tempId === tempId ? { ...data.message, _status: "sent" as const } : m
          )
        )
      })
      .catch(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m._tempId === tempId ? { ...m, _status: "error" as const } : m
          )
        )
      })
  }

  // ── Envoyer un message vocal (optimistic) ───────────────
  function handleSendVocal(file: Blob, duree: number, replyToId?: string) {
    if (!activeInterlocuteur || !session?.user) return

    const tempId = `_temp_${++tempIdCounter.current}_${Date.now()}`
    const optimisticMsg: MessageData = {
      id: tempId,
      expediteurId: currentUserId,
      destinataireId: activeInterlocuteur.id,
      contenu: "🎤 Envoi en cours…",
      type: "VOCAL",
      dureeSecondes: duree,
      lu: false,
      createdAt: new Date().toISOString(),
      replyTo: null,
      reactions: [],
      expediteur: {
        id: currentUserId,
        nom: session.user.nom ?? "",
        prenom: session.user.prenom ?? "",
        photoUrl: session.user.photoUrl ?? null,
      },
      _optimistic: true,
      _status: "sending",
      _tempId: tempId,
    }

    setMessages((prev) => [...prev, optimisticMsg])
    updateConversationPreview(optimisticMsg)

    const formData = new FormData()
    formData.append("audio", file, "vocal.webm")
    formData.append("destinataireId", activeInterlocuteur.id)
    formData.append("dureeSecondes", String(duree))
    if (replyToId) formData.append("replyToId", replyToId)

    fetch("/api/messages/vocal", { method: "POST", body: formData })
      .then((res) => {
        if (!res.ok) throw new Error("send failed")
        return res.json()
      })
      .then((data: { message: MessageData }) => {
        setMessages((prev) =>
          prev.map((m) =>
            m._tempId === tempId
              ? { ...data.message, _status: "sent" as const }
              : m
          )
        )
      })
      .catch(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m._tempId === tempId
              ? { ...m, _status: "error" as const, contenu: "🎤 Message vocal" }
              : m
          )
        )
      })
  }

  // ── Supprimer un message ───────────────────────────────
  function handleSupprimerMessage(messageId: string) {
    // Optimistic remove
    setMessages((prev) => prev.filter((m) => m.id !== messageId))
    fetch(`/api/messages/message/${messageId}`, { method: "DELETE" })
      .then((res) => {
        if (!res.ok) {
          // Restaurer si échec
          if (activeInterlocuteur) fetchMessages(activeInterlocuteur.id, 1)
        }
      })
      .catch(() => {
        if (activeInterlocuteur) fetchMessages(activeInterlocuteur.id, 1)
      })
  }

  // ── Modifier un message ─────────────────────────────────
  function handleEditMessage(messageId: string, nouveauContenu: string) {
    // Optimistic update
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, contenu: nouveauContenu, modifie: true, modifieLeAt: new Date().toISOString() } : m
      )
    )
    fetch(`/api/messages/message/${messageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "edit", contenu: nouveauContenu }),
    })
      .then((res) => {
        if (!res.ok) {
          // Revenir à l'état précédent en rechargeant
          if (activeInterlocuteur) fetchMessages(activeInterlocuteur.id, 1)
        }
      })
      .catch(() => {
        if (activeInterlocuteur) fetchMessages(activeInterlocuteur.id, 1)
      })
  }

  // ── Épingler / désépingler un message ───────────────────
  function handlePinMessage(messageId: string, nouvelEtat: boolean) {
    // Optimistic: désépingler tous, puis épingler celui-ci
    setMessages((prev) =>
      prev.map((m) => {
        if (nouvelEtat && m.id !== messageId) return { ...m, epingle: false }
        if (m.id === messageId) return { ...m, epingle: nouvelEtat }
        return m
      })
    )
    fetch(`/api/messages/message/${messageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: nouvelEtat ? "pin" : "unpin" }),
    })
      .then((res) => {
        if (!res.ok) {
          if (activeInterlocuteur) fetchMessages(activeInterlocuteur.id, 1)
        }
      })
      .catch(() => {
        if (activeInterlocuteur) fetchMessages(activeInterlocuteur.id, 1)
      })
  }

  // ── Transférer un message —— envoyer vers le contact sélectionné ──
  function handleForwardMessage(contenu: string, type: string, contactId: string) {
    if (!contactId) return
    // Si le contact cible est déjà l'interlocuteur actif, envoi normal
    if (contactId === activeInterlocuteur?.id) {
      if (type === "TEXTE") handleSendMessage(contenu)
      return
    }
    // Sinon, envoi direct via API vers le contact cible (sans changer de conversation)
    if (type !== "TEXTE") return // Les médias/vocaux ne peuvent pas être retransférés
    fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destinataireId: contactId, contenu }),
    }).catch(() => {})
  }

  // ── Envoyer une image ────────────────────────────────────
  function handleSendImage(file: File, replyToId?: string) {
    if (!activeInterlocuteur || !session?.user) return

    const tempId = `_temp_${++tempIdCounter.current}_${Date.now()}`
    const objectUrl = URL.createObjectURL(file)
    const optimisticMsg: MessageData = {
      id: tempId,
      expediteurId: currentUserId,
      destinataireId: activeInterlocuteur.id,
      contenu: objectUrl,
      type: "MEDIA",
      lu: false,
      createdAt: new Date().toISOString(),
      replyTo: replyToId ? (messages.find((m) => m.id === replyToId) ? {
        id: replyToId,
        contenu: messages.find((m) => m.id === replyToId)!.contenu,
        type: messages.find((m) => m.id === replyToId)!.type,
        expediteur: messages.find((m) => m.id === replyToId)!.expediteur,
      } : null) : null,
      reactions: [],
      expediteur: {
        id: currentUserId,
        nom: session.user.nom ?? "",
        prenom: session.user.prenom ?? "",
        photoUrl: session.user.photoUrl ?? null,
      },
      _optimistic: true,
      _status: "sending",
      _tempId: tempId,
    }

    setMessages((prev) => [...prev, optimisticMsg])
    updateConversationPreview(optimisticMsg)

    const formData = new FormData()
    formData.append("image", file)
    formData.append("destinataireId", activeInterlocuteur.id)
    if (replyToId) formData.append("replyToId", replyToId)
    if (ephemere) formData.append("ephemere", "true")

    fetch("/api/messages/image", { method: "POST", body: formData })
      .then((res) => {
        if (!res.ok) throw new Error("send failed")
        return res.json()
      })
      .then((data: { message: MessageData }) => {
        URL.revokeObjectURL(objectUrl)
        setMessages((prev) =>
          prev.map((m) =>
            m._tempId === tempId ? { ...data.message, _status: "sent" as const } : m
          )
        )
      })
      .catch(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m._tempId === tempId ? { ...m, _status: "error" as const } : m
          )
        )
      })
  }

  // ── Envoyer une vidéo ────────────────────────────────────
  function handleSendVideo(file: File, replyToId?: string) {
    if (!activeInterlocuteur || !session?.user) return

    const tempId = `_temp_${++tempIdCounter.current}_${Date.now()}`
    const objectUrl = URL.createObjectURL(file)
    const optimisticMsg: MessageData = {
      id: tempId,
      expediteurId: currentUserId,
      destinataireId: activeInterlocuteur.id,
      contenu: objectUrl,
      type: "MEDIA",
      lu: false,
      createdAt: new Date().toISOString(),
      replyTo: null,
      reactions: [],
      expediteur: {
        id: currentUserId,
        nom: session.user.nom ?? "",
        prenom: session.user.prenom ?? "",
        photoUrl: session.user.photoUrl ?? null,
      },
      _optimistic: true,
      _status: "sending",
      _tempId: tempId,
      _mediaSubtype: "video",
    }

    setMessages((prev) => [...prev, optimisticMsg])
    updateConversationPreview(optimisticMsg)

    const formData = new FormData()
    formData.append("video", file)
    formData.append("destinataireId", activeInterlocuteur.id)
    if (replyToId) formData.append("replyToId", replyToId)
    if (ephemere) formData.append("ephemere", "true")

    fetch("/api/messages/video", { method: "POST", body: formData })
      .then((res) => {
        if (!res.ok) throw new Error("send failed")
        return res.json()
      })
      .then((data: { message: MessageData }) => {
        URL.revokeObjectURL(objectUrl)
        setMessages((prev) =>
          prev.map((m) =>
            m._tempId === tempId ? { ...data.message, _status: "sent" as const } : m
          )
        )
      })
      .catch(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m._tempId === tempId ? { ...m, _status: "error" as const } : m
          )
        )
      })
  }

  // ── Renvoyer un message échoué ───────────────────────────
  function handleRetry(tempId: string) {
    const failedMsg = messages.find((m) => m._tempId === tempId)
    if (!failedMsg || !activeInterlocuteur) return

    // Remove the failed message
    setMessages((prev) => prev.filter((m) => m._tempId !== tempId))

    // Resend it through the normal optimistic path
    if (failedMsg.type === "VOCAL") return // Can't retry vocal (blob is gone)
    handleSendMessage(failedMsg.contenu, failedMsg.replyTo?.id)
  }

  // ── Réagir à un message ─────────────────────────────────────
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
      .catch(() => toast.error("Erreur lors de l'ajout de la réaction"))
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
      const interlocuteurInfo = msg.expediteurId === currentUserId
        ? (activeRef.current ?? { id: interlocuteurId, nom: "", prenom: "", photoUrl: null })
        : msg.expediteur
      return Array.from(
        new Map(
          [
            {
              interlocuteur: interlocuteurInfo,
              dernierMessage: {
                contenu: msg.contenu,
                createdAt: msg.createdAt,
                expediteurId: msg.expediteurId,
              },
              nonLus: activeRef.current?.id === interlocuteurId ? 0 : 1,
            },
            ...prev,
          ].map((c) => [c.interlocuteur.id, c])
        ).values()
      )
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
      <div className="border-b border-border-brand bg-white px-5 py-4">
        <h1 className="font-display text-[28px] font-light text-text-main">
          Messagerie
        </h1>
        <p className="font-body text-[12px] text-text-muted-brand">
          Échangez avec les membres et l&apos;équipe du centre
        </p>
      </div>

      <div className="flex overflow-hidden bg-bg-page" style={{ height: "calc(100svh - 200px)" }}>
        {/* Colonne gauche — 280px fixe : Liste des conversations */}
        <div
          className={`w-full border-r border-border-brand bg-white shadow-sm md:w-72 md:shrink-0 ${
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
          className={`flex-1 bg-bg-page ${
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
              onRetry={handleRetry}
              onDelete={handleSupprimerMessage}
              onEdit={handleEditMessage}
              onPin={handlePinMessage}
              onForward={handleForwardMessage}
              onSendImage={handleSendImage}
              onSendFile={handleSendFile}
              onSendVideo={handleSendVideo}
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
              pushActive={pushActive}
              onTogglePush={handleTogglePush}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
