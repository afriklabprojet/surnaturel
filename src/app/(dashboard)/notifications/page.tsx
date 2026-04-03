"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Bell,
  Calendar,
  ShoppingBag,
  MessageCircle,
  Gift,
  Heart,
  Users,
  AtSign,
  UserPlus,
  Repeat2,
  Check,
  ChevronDown,
  Loader2,
  Settings,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import type { NotifType } from "@/generated/prisma/client"
import { PushNotificationToggle } from "@/components/ui/push-notification-toggle"

interface Notification {
  id: string
  type: NotifType
  titre: string
  message: string
  lu: boolean
  lien: string | null
  sourceId: string | null
  createdAt: string
}

function getIconeNotif(type: NotifType) {
  switch (type) {
    case "RDV_CONFIRME":
    case "RDV_ANNULE":
    case "EVENEMENT_RAPPEL":
      return <Calendar size={18} className="text-primary-brand" />
    case "COMMANDE_PAYEE":
    case "COMMANDE_EXPEDIEE":
      return <ShoppingBag size={18} className="text-gold" />
    case "NOUVEAU_MESSAGE":
      return <MessageCircle size={18} className="text-primary-brand" />
    case "FIDELITE_POINTS":
    case "FIDELITE_RECOMPENSE":
    case "PARRAINAGE":
      return <Gift size={18} className="text-gold" />
    case "NOUVEAU_LIKE":
      return <Heart size={18} className="text-danger" />
    case "NOUVEAU_COMMENTAIRE":
      return <MessageCircle size={18} className="text-primary-brand" />
    case "MENTION":
      return <AtSign size={18} className="text-gold" />
    case "DEMANDE_CONNEXION":
    case "NOUVELLE_CONNEXION":
      return <UserPlus size={18} className="text-primary-brand" />
    case "INVITATION_GROUPE":
      return <Users size={18} className="text-primary-brand" />
    case "SIGNALEMENT_TRAITE":
      return <Check size={18} className="text-primary-brand" />
    default:
      return <Bell size={18} className="text-text-muted-brand" />
  }
}

type Filtre = "toutes" | "nonLues" | "interactions" | "social" | "rdv" | "commandes" | "messages"

const FILTRES: { value: Filtre; label: string }[] = [
  { value: "toutes", label: "Toutes" },
  { value: "nonLues", label: "Non lues" },
  { value: "interactions", label: "Interactions" },
  { value: "social", label: "Social" },
  { value: "rdv", label: "RDV & Événements" },
  { value: "commandes", label: "Commandes" },
  { value: "messages", label: "Messages" },
]

const TYPE_CATEGORIES: Record<string, NotifType[]> = {
  interactions: ["NOUVEAU_LIKE", "NOUVEAU_COMMENTAIRE", "MENTION"],
  social: ["DEMANDE_CONNEXION", "NOUVELLE_CONNEXION", "INVITATION_GROUPE"],
  rdv: ["RDV_CONFIRME", "RDV_ANNULE", "EVENEMENT_RAPPEL"],
  commandes: ["COMMANDE_PAYEE", "COMMANDE_EXPEDIEE"],
  messages: ["NOUVEAU_MESSAGE"],
}

export default function PageNotifications() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalNonLues, setTotalNonLues] = useState(0)
  const [filtre, setFiltre] = useState<Filtre>("toutes")
  const [markingAll, setMarkingAll] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/connexion?callbackUrl=/notifications")
  }, [status, router])

  const fetchNotifications = useCallback(async (pageNum: number, append = false) => {
    if (append) setLoadingMore(true)
    else setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: "20" })
      if (filtre === "nonLues") params.set("nonLues", "true")
      const res = await fetch(`/api/notifications?${params}`)
      if (res.ok) {
        const data = await res.json()
        setNotifications((prev) => (append ? [...prev, ...data.notifications] : data.notifications))
        setTotalPages(data.pages)
        setTotalNonLues(data.totalNonLues)
        setPage(data.page)
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [filtre])

  useEffect(() => {
    if (status === "authenticated") {
      setPage(1)
      fetchNotifications(1)
    }
  }, [status, fetchNotifications])

  async function marquerLue(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, lu: true } : n)))
    setTotalNonLues((prev) => Math.max(0, prev - 1))
    await fetch(`/api/notifications/${id}`, { method: "PATCH" })
  }

  async function marquerToutesLues() {
    setMarkingAll(true)
    try {
      await fetch("/api/notifications/toutes-lues", { method: "PATCH" })
      setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })))
      setTotalNonLues(0)
    } finally {
      setMarkingAll(false)
    }
  }

  // Filtrage côté client par catégorie
  const notifsFiltrees = filtre === "toutes" || filtre === "nonLues"
    ? notifications
    : notifications.filter((n) => TYPE_CATEGORIES[filtre]?.includes(n.type))

  if (status === "loading" || loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-3">
        <div className="bg-white border border-border-brand p-5 animate-pulse">
          <div className="h-6 w-48 bg-border-brand mb-4" />
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-8 w-20 bg-bg-page" />)}
          </div>
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white border border-border-brand p-4 animate-pulse flex gap-3">
            <div className="h-10 w-10 bg-border-brand rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-3/4 bg-border-brand" />
              <div className="h-3 w-1/2 bg-bg-page" />
              <div className="h-2.5 w-20 bg-bg-page" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* En-tête */}
      <div className="bg-white border border-border-brand px-5 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Bell size={22} className="text-primary-brand" />
            <h2 className="font-display text-[20px] font-light text-text-main">Notifications</h2>
            {totalNonLues > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center bg-primary-brand px-1.5 font-body text-xs font-medium text-white">
                {totalNonLues}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {totalNonLues > 0 && (
              <button
                onClick={marquerToutesLues}
                disabled={markingAll}
                className="flex items-center gap-1.5 font-body text-xs font-medium uppercase tracking-widest text-primary-brand hover:text-primary-dark transition-colors disabled:opacity-50"
              >
                {markingAll ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                Tout marquer lu
              </button>
            )}
            <Link
              href="/profil/modifier"
              className="flex items-center gap-1.5 font-body text-xs text-text-muted-brand hover:text-text-mid transition-colors"
            >
              <Settings size={13} />
              Préférences
            </Link>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-2">
          {FILTRES.map((f) => (
            <button
              key={f.value}
              onClick={() => setFiltre(f.value)}
              className={`px-3 py-1.5 font-body text-xs font-medium uppercase tracking-[0.08em] transition-colors border ${
                filtre === f.value
                  ? "border-primary-brand bg-primary-brand text-white"
                  : "border-border-brand bg-white text-text-mid hover:border-gold hover:text-gold"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Push Notifications */}
      <PushNotificationToggle />

      {/* Liste */}
      {notifsFiltrees.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-white border border-border-brand py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center bg-bg-page rounded-full mb-4">
            <Bell size={28} className="text-border-brand" />
          </div>
          <p className="font-display text-[16px] font-light text-text-main">Aucune notification</p>
          <p className="font-body text-[12px] text-text-muted-brand mt-1">
            {filtre === "nonLues" ? "Toutes vos notifications sont lues" : "Vous n'avez pas encore de notifications"}
          </p>
        </div>
      ) : (
        <div className="space-y-0 border border-border-brand bg-white divide-y divide-border-brand">
          {notifsFiltrees.map((notif) => (
            <Link
              key={notif.id}
              href={notif.lien || "#"}
              onClick={() => { if (!notif.lu) marquerLue(notif.id) }}
              className={`flex gap-3 px-5 py-4 transition-colors hover:bg-bg-page ${
                !notif.lu ? "bg-gold/5 border-l-2 border-l-gold" : "bg-white border-l-2 border-l-transparent"
              }`}
            >
              <div className="mt-0.5 shrink-0 flex h-10 w-10 items-center justify-center bg-bg-page rounded-full">
                {getIconeNotif(notif.type)}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`font-display text-[14px] text-text-main ${!notif.lu ? "font-medium" : "font-light"}`}>
                  {notif.titre}
                </p>
                <p className="mt-0.5 font-body text-[12px] text-text-muted-brand line-clamp-2">
                  {notif.message}
                </p>
                <p className="mt-1 font-body text-xs text-text-muted-brand">
                  {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: fr })}
                </p>
              </div>
              {!notif.lu && (
                <div className="mt-2 shrink-0">
                  <div className="h-2 w-2 rounded-full bg-gold" />
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {page < totalPages && (
        <div className="flex justify-center pt-1 pb-4">
          <button
            onClick={() => fetchNotifications(page + 1, true)}
            disabled={loadingMore}
            className="flex items-center gap-2 border border-border-brand bg-white px-6 py-2.5 font-body text-xs font-medium uppercase tracking-[0.12em] text-text-mid hover:border-gold hover:text-gold transition-colors disabled:opacity-40"
          >
            {loadingMore ? <Loader2 size={14} className="animate-spin" /> : <ChevronDown size={14} />}
            Voir plus
          </button>
        </div>
      )}
    </div>
  )
}
