"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import ListeMatches from "@/components/rencontres/ListeMatches"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface MatchItem {
  id: string
  conversationId: string | null
  createdAt: string
  interlocuteur: {
    id: string
    prenom: string
    nom: string
    pseudo: string | null
    photoUrl: string | null
    bio: string | null
    ville: string | null
    verificationStatus: string
    derniereVueAt: string | null
  }
}

export default function PageMatches() {
  const [matches, setMatches] = useState<MatchItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/rencontres/matches")
        if (!res.ok) throw new Error()
        const data = (await res.json()) as { matches: MatchItem[] }
        setMatches(data.matches)
      } catch {
        toast.error("Impossible de charger les matches")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  async function handleUnmatch(matchId: string) {
    try {
      const res = await fetch(`/api/rencontres/${matchId}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setMatches((prev) => prev.filter((m) => m.id !== matchId))
      toast.success("Match annulé")
    } catch {
      toast.error("Impossible d'annuler le match")
    }
  }

  return (
    <div className="max-w-lg lg:max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/communaute/rencontres"
          className="p-1.5 rounded-full text-text-muted-brand hover:bg-bg-page transition-colors"
          aria-label="Retour"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-heading text-xl font-semibold text-text-main">Mes matches</h1>
          <p className="text-sm text-text-muted-brand">
            {loading ? "…" : `${matches.length} match${matches.length !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <div className="w-12 h-12 rounded-full bg-bg-page animate-pulse" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-32 bg-bg-page rounded animate-pulse" />
                <div className="h-3 w-20 bg-bg-page rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ListeMatches matches={matches} onUnmatch={handleUnmatch} />
      )}
    </div>
  )
}
