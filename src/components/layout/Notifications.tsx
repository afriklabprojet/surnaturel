"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Bell, Calendar, ShoppingBag, MessageCircle, Gift, Heart, Users, AtSign, UserPlus, Check, X } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { motion, AnimatePresence } from "framer-motion"
import { slideInRight, notificationBadge } from "@/lib/animations"
import Link from "next/link"
import { getPusherClient, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher"
import type { NotifType } from "@/generated/prisma/client"

interface Notification {
  id: string
  type: NotifType
  titre: string
  message: string
  lu: boolean
  lien: string | null
  createdAt: string
}

function getIconeNotif(type: NotifType) {
  switch (type) {
    case "RDV_CONFIRME":
    case "RDV_ANNULE":
    case "EVENEMENT_RAPPEL":
      return <Calendar size={16} className="text-primary-brand" />
    case "COMMANDE_PAYEE":
    case "COMMANDE_EXPEDIEE":
      return <ShoppingBag size={16} className="text-gold" />
    case "NOUVEAU_MESSAGE":
      return <MessageCircle size={16} className="text-primary-brand" />
    case "FIDELITE_POINTS":
    case "FIDELITE_RECOMPENSE":
    case "PARRAINAGE":
      return <Gift size={16} className="text-gold" />
    case "NOUVEAU_LIKE":
      return <Heart size={16} className="text-danger" />
    case "NOUVEAU_COMMENTAIRE":
      return <MessageCircle size={16} className="text-primary-brand" />
    case "MENTION":
      return <AtSign size={16} className="text-gold" />
    case "DEMANDE_CONNEXION":
    case "NOUVELLE_CONNEXION":
      return <UserPlus size={16} className="text-primary-brand" />
    case "INVITATION_GROUPE":
      return <Users size={16} className="text-primary-brand" />
    default:
      return <Bell size={16} className="text-text-muted-brand" />
  }
}

export default function Notifications({ userId }: { userId?: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [totalNonLues, setTotalNonLues] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=8")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setTotalNonLues(data.totalNonLues || 0)
      }
    } catch { /* silently fail */ }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Pusher — écouter les nouvelles notifications en temps réel
  useEffect(() => {
    if (!userId) return
    try {
      const pusher = getPusherClient()
      const channel = pusher.subscribe(PUSHER_CHANNELS.notification(userId))

      channel.bind(PUSHER_EVENTS.NOUVELLE_NOTIFICATION, (notif: Notification) => {
        setNotifications((prev) => {
          if (prev.some((n) => n.id === notif.id)) return prev
          return [notif, ...prev].slice(0, 8)
        })
        setTotalNonLues((prev) => prev + 1)
      })

      return () => {
        channel.unbind_all()
        pusher.unsubscribe(PUSHER_CHANNELS.notification(userId))
      }
    } catch { /* Pusher optionnel */ }
  }, [userId])

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  async function marquerLue(id: string) {
    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, lu: true } : n))
      )
      setTotalNonLues((prev) => Math.max(0, prev - 1))
    } catch {
      // silently fail
    }
  }

  async function marquerToutesLues() {
    setLoading(true)
    try {
      await fetch("/api/notifications/toutes-lues", { method: "PATCH" })
      setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })))
      setTotalNonLues(0)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton cloche */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 items-center justify-center text-text-main transition-colors hover:text-primary-brand"
        aria-label="Notifications"
      >
        <Bell size={20} />
        <AnimatePresence>
          {totalNonLues > 0 && (
            <motion.span
              variants={notificationBadge}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center bg-danger px-1 font-body text-[10px] font-medium text-white"
            >
              {totalNonLues > 99 ? "99+" : totalNonLues}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={slideInRight}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute right-0 top-12 z-50 w-80 border border-border-brand bg-white shadow-lg"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border-brand px-4 py-3">
              <span className="font-display text-[15px] font-normal text-text-main">
                Notifications
              </span>
              {totalNonLues > 0 && (
                <button
                  onClick={marquerToutesLues}
                  disabled={loading}
                  className="flex items-center gap-1 font-body text-[11px] font-medium text-primary-brand transition-colors hover:text-primary-dark disabled:opacity-50"
                >
                  <Check size={12} />
                  Tout marquer lu
                </button>
              )}
            </div>

            {/* Liste */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell size={24} className="text-border-brand" />
                  <p className="mt-2 font-body text-[12px] font-light text-text-muted-brand">
                    Aucune notification
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <Link
                    key={notif.id}
                    href={notif.lien || "#"}
                    onClick={() => {
                      if (!notif.lu) marquerLue(notif.id)
                      setIsOpen(false)
                    }}
                    className={`flex gap-3 border-b border-border-brand px-4 py-3 transition-colors hover:bg-bg-page ${
                      !notif.lu ? "border-l-2 border-l-gold bg-bg-page" : "bg-white"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {getIconeNotif(notif.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-[13px] font-normal text-text-main">
                        {notif.titre}
                      </p>
                      <p className="mt-0.5 line-clamp-2 font-body text-[11px] font-light text-text-muted-brand">
                        {notif.message}
                      </p>
                      <p className="mt-1 font-body text-[10px] text-text-muted-brand">
                        {formatDistanceToNow(new Date(notif.createdAt), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-border-brand px-4 py-2.5">
                <Link
                  href="/notifications"
                  onClick={() => setIsOpen(false)}
                  className="block text-center font-body text-[12px] font-medium text-primary-brand transition-colors hover:text-primary-dark"
                >
                  Voir toutes les notifications
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
