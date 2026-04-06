"use client"

import { useState, useEffect, useCallback } from "react"
import { Settings, Users, Heart, Camera } from "lucide-react"
import Link from "next/link"
import CarteProfil, { type ProfilSuggestion } from "@/components/rencontres/CarteProfil"
import MatchModal from "@/components/rencontres/MatchModal"
import StoriesBandeau from "@/components/stories/StoriesBandeau"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

interface MatchResult {
  matched: boolean
  matchId?: string
  conversationId?: string
  likesRestants?: number
}

export default function PageRencontres() {
  const { data: session } = useSession()
  const [profiles, setProfiles] = useState<ProfilSuggestion[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [swiping, setSwiping] = useState(false)
  const [matchResult, setMatchResult] = useState<(MatchResult & { profil: ProfilSuggestion }) | null>(null)
  const [likesRestants, setLikesRestants] = useState<number | null>(null)

  const fetchSuggestions = useCallback(async (page = 0) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/rencontres/suggestions?page=${page}`)
      if (!res.ok) throw new Error()
      const data = (await res.json()) as { profiles: ProfilSuggestion[]; hasMore: boolean; page: number }
      setProfiles((prev) => (page === 0 ? data.profiles : [...prev, ...data.profiles]))
      setHasMore(data.hasMore)
      setCurrentPage(data.page)
    } catch {
      toast.error("Impossible de charger les profils")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchSuggestions()
  }, [fetchSuggestions])

  async function handleAction(profil: ProfilSuggestion, type: "LIKE" | "SUPER_LIKE" | "PASS") {
    setSwiping(true)
    try {
      const res = await fetch("/api/rencontres/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId: profil.id, type }),
      })

      if (res.status === 429) {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        toast.error(err.error ?? "Limite de likes atteinte pour aujourd'hui")
        return
      }

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        toast.error(err.error ?? "Erreur inattendue")
        return
      }

      const data = (await res.json()) as MatchResult
      if (data.likesRestants !== undefined) {
        setLikesRestants(data.likesRestants)
      }

      // Retirer le profil de la liste
      setProfiles((prev) => {
        const remaining = prev.filter((p) => p.id !== profil.id)
        // Charger plus si moins de 3 profils restants
        if (remaining.length <= 2 && hasMore) {
          void fetchSuggestions(currentPage + 1)
        }
        return remaining
      })

      if (data.matched) {
        setMatchResult({ ...data, profil })
      }
    } catch {
      toast.error("Erreur inattendue")
    } finally {
      setSwiping(false)
    }
  }

  const currentProfil = profiles[0] ?? null

  async function handleReport(userId: string) {
    const raison = prompt("Raison du signalement :")
    if (!raison || raison.trim().length < 5) {
      if (raison !== null) toast.error("La raison doit contenir au moins 5 caractères")
      return
    }
    try {
      const res = await fetch("/api/communaute/signalements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "MEMBRE", signaleUserId: userId, raison: raison.trim() }),
      })
      if (!res.ok) throw new Error()
      toast.success("Signalement envoyé")
    } catch {
      toast.error("Erreur lors du signalement")
    }
  }

  async function handleBlock(userId: string) {
    if (!confirm("Bloquer cette personne ? Elle ne verra plus votre profil.")) return
    try {
      const res = await fetch("/api/communaute/blocages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bloqueId: userId }),
      })
      if (!res.ok) throw new Error()
      setProfiles((prev) => prev.filter((p) => p.id !== userId))
      toast.success("Utilisateur bloqué")
    } catch {
      toast.error("Erreur lors du blocage")
    }
  }

  return (
    <div className="max-w-lg lg:max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold text-text-main">Rencontres</h1>
          <p className="text-sm text-text-muted-brand">Découvrez des profils qui vous correspondent</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/communaute/rencontres/photos"
            className="p-2 rounded-full text-text-muted-brand hover:bg-bg-page hover:text-pink-500 transition-colors"
            aria-label="Mes photos"
          >
            <Camera size={20} />
          </Link>
          <Link
            href="/communaute/rencontres/qui-ma-like"
            className="p-2 rounded-full text-text-muted-brand hover:bg-bg-page hover:text-pink-500 transition-colors"
            aria-label="Qui m'a liké"
          >
            <Heart size={20} />
          </Link>
          <Link
            href="/communaute/rencontres/matches"
            className="p-2 rounded-full text-text-muted-brand hover:bg-bg-page hover:text-primary-brand transition-colors"
            aria-label="Mes matches"
          >
            <Users size={20} />
          </Link>
          <Link
            href="/communaute/rencontres/preferences"
            className="p-2 rounded-full text-text-muted-brand hover:bg-bg-page hover:text-primary-brand transition-colors"
            aria-label="Préférences"
          >
            <Settings size={20} />
          </Link>
        </div>
      </div>

      {/* Stories bandeau */}
      {session?.user?.id && <StoriesBandeau currentUserId={session.user.id} />}

      {/* Compteur de likes restants */}
      {likesRestants !== null && (
        <div className="flex items-center justify-center gap-1.5 text-xs text-text-muted-brand">
          <Heart size={12} className="text-pink-400" />
          <span>
            {likesRestants > 0
              ? `${likesRestants} like${likesRestants > 1 ? "s" : ""} restant${likesRestants > 1 ? "s" : ""} aujourd'hui`
              : "Limite de likes atteinte — revenez demain"}
          </span>
        </div>
      )}

      {/* Carte profil */}
      {loading && !currentProfil ? (
        <div className="w-full max-w-sm mx-auto h-96 rounded-2xl bg-bg-page animate-pulse" />
      ) : currentProfil ? (
        <CarteProfil
          key={currentProfil.id}
          profil={currentProfil}
          onLike={() => handleAction(currentProfil, "LIKE")}
          onSuperLike={() => handleAction(currentProfil, "SUPER_LIKE")}
          onPass={() => handleAction(currentProfil, "PASS")}
          onReport={handleReport}
          onBlock={handleBlock}
          isLoading={swiping}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <p className="font-heading text-lg text-text-muted-brand">Plus de profils disponibles</p>
          <p className="text-sm text-text-muted-brand max-w-xs">
            Revenez plus tard ou ajustez vos{" "}
            <Link href="/communaute/rencontres/preferences" className="text-primary-brand underline">
              préférences
            </Link>
            .
          </p>
        </div>
      )}

      {/* Modal de match */}
      {matchResult && (
        <MatchModal
          matchId={matchResult.matchId ?? ""}
          conversationId={matchResult.conversationId ?? null}
          prenom={matchResult.profil.prenom}
          photoUrl={matchResult.profil.photoUrl}
          currentUserPhotoUrl={session?.user?.photoUrl ?? null}
          onClose={() => setMatchResult(null)}
        />
      )}
    </div>
  )
}
