"use client"

import type { Auteur } from "./types"

export function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}j`
  return new Date(dateStr).toLocaleDateString("fr", { day: "numeric", month: "short" })
}

export function Avatar({ user, size = 40 }: { user: Auteur; size?: number }) {
  const initials = `${user.prenom?.[0] ?? ""}${user.nom?.[0] ?? ""}`.toUpperCase()
  if (user.photoUrl) {
    return (
      <img
        src={user.photoUrl}
        alt={`Photo de ${user.prenom} ${user.nom}`}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className="flex items-center justify-center rounded-full bg-primary-brand text-white font-body font-medium"
      style={{ width: size, height: size, fontSize: size * 0.32 }}
    >
      {initials}
    </div>
  )
}
