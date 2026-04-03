"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Loader2,
  Search,
  ChevronDown,
  MapPin,
  FileText,
  UserPlus,
  X,
  MessageCircle,
} from "lucide-react"
import BadgeVerification from "@/components/ui/BadgeVerification"

/* ━━━━━━━━━━ Types ━━━━━━━━━━ */

interface Membre {
  id: string
  nom: string
  prenom: string
  pseudo: string | null
  photoUrl: string | null
  bio: string | null
  centresInteret: string[]
  statutProfil: string | null
  role: string
  verificationStatus: string | null
  localisation: string | null
  postsCount: number
}

/* ━━━━━━━━━━ Centres d'intérêt populaires ━━━━━━━━━━ */

const CENTRES_POPULAIRES = [
  "Bien-être", "Méditation", "Yoga", "Soins naturels", "Nutrition",
  "Développement personnel", "Spiritualité", "Relaxation", "Massage", "Aromathérapie",
]

/* ━━━━━━━━━━ Page Annuaire ━━━━━━━━━━ */

export default function PageMembres() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [membres, setMembres] = useState<Membre[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [selectedInteret, setSelectedInteret] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") router.push("/connexion?callbackUrl=/communaute/membres")
  }, [status, router])

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 400)
    return () => clearTimeout(t)
  }, [searchQuery])

  const fetchMembres = useCallback(async (pageNum: number, append = false) => {
    if (append) setLoadingMore(true)
    else setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(pageNum) })
      if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim())
      if (selectedInteret) params.set("interet", selectedInteret)

      const res = await fetch(`/api/communaute/membres?${params}`)
      if (res.ok) {
        const data = await res.json()
        setMembres((prev) => (append ? [...prev, ...data.membres] : data.membres))
        setTotalPages(data.pages)
        setTotal(data.total)
        setPage(data.page)
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [debouncedQuery, selectedInteret])

  useEffect(() => {
    if (status === "authenticated") fetchMembres(1)
  }, [status, fetchMembres])

  function Avatar({ membre, size = 48 }: { membre: Membre; size?: number }) {
    const initials = `${membre.prenom?.[0] ?? ""}${membre.nom?.[0] ?? ""}`.toUpperCase()
    if (membre.photoUrl) {
      return (
        <img
          src={membre.photoUrl}
          alt=""
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

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-gold" />
      </div>
    )
  }

  return (
    <section className="mx-auto max-w-3xl space-y-5">
      {/* En-tête */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-border-brand p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display text-[20px] font-light text-text-main">
              Annuaire des membres
            </h1>
            <p className="font-body text-[12px] text-text-muted-brand mt-0.5">
              {total} membre{total > 1 ? "s" : ""} dans la communauté
            </p>
          </div>
        </div>

        {/* Recherche */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-brand" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un membre par nom, prénom ou pseudo..."
            className="w-full rounded-full border border-border-brand bg-bg-page pl-9 pr-8 py-2.5 font-body text-[12px] text-text-main placeholder:text-text-muted-brand focus:border-gold focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted-brand hover:text-danger transition-colors">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filtres centres intérêt */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {CENTRES_POPULAIRES.map((interet) => (
            <button
              key={interet}
              onClick={() => setSelectedInteret(selectedInteret === interet ? "" : interet)}
              className={`rounded-full px-3 py-1.5 font-body text-xs border transition-colors ${
                selectedInteret === interet
                  ? "border-gold bg-gold-light text-gold font-medium"
                  : "border-border-brand text-text-muted-brand hover:border-gold hover:text-gold"
              }`}
            >
              {interet}
            </button>
          ))}
        </div>
      </div>

      {/* Résultats */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-gold" />
        </div>
      ) : membres.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-border-brand">
          <div className="flex h-16 w-16 items-center justify-center bg-primary-light mb-4 rounded-full">
            <Search size={28} className="text-primary-brand" />
          </div>
          <p className="font-display text-[18px] font-light text-text-main">
            Aucun membre trouvé
          </p>
          <p className="font-body text-[12px] text-text-muted-brand mt-1">
            Essayez d&apos;autres critères de recherche
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {membres.map((membre) => (
            <Link
              key={membre.id}
              href={`/communaute/profil/${membre.id}`}
              className="rounded-2xl bg-white shadow-sm ring-1 ring-border-brand p-4 hover:ring-gold hover:shadow-md transition-all group"
            >
              <div className="flex gap-3">
                <Avatar membre={membre} size={48} />
                <div className="flex-1 min-w-0">
                  <p className="font-body text-[13px] font-medium text-text-main group-hover:text-gold transition-colors truncate">
                    {membre.prenom} {membre.nom}
                    <BadgeVerification status={membre.verificationStatus} size={12} className="ml-1" />
                  </p>
                  {membre.pseudo && (
                    <p className="font-body text-xs text-text-muted-brand truncate">
                      @{membre.pseudo}
                    </p>
                  )}
                  {membre.localisation && (
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin size={10} className="text-text-muted-brand shrink-0" />
                      <span className="font-body text-xs text-text-muted-brand truncate">
                        {membre.localisation}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {membre.bio && (
                <p className="font-body text-xs text-text-mid leading-relaxed mt-2.5 line-clamp-2">
                  {membre.bio}
                </p>
              )}

              {membre.centresInteret?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2.5">
                  {membre.centresInteret.slice(0, 3).map((ci) => (
                    <span
                      key={ci}
                      className="rounded-full px-2 py-0.5 bg-primary-light font-body text-[9px] text-primary-brand"
                    >
                      {ci}
                    </span>
                  ))}
                  {membre.centresInteret.length > 3 && (
                    <span className="font-body text-[9px] text-text-muted-brand">
                      +{membre.centresInteret.length - 3}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-border-brand">
                <span
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/communaute/messages?to=${membre.id}`) }}
                  className="p-1 text-text-muted-brand hover:text-gold transition-colors cursor-pointer"
                  title="Envoyer un message"
                >
                  <MessageCircle size={12} />
                </span>
                <div className="flex items-center gap-1">
                  <FileText size={10} className="text-text-muted-brand" />
                  <span className="font-body text-xs text-text-muted-brand">
                    {membre.postsCount} publication{membre.postsCount > 1 ? "s" : ""}
                  </span>
                </div>
                {membre.statutProfil && (
                  <span className="font-body text-xs text-primary-brand truncate">
                    {membre.statutProfil}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Charger plus */}
      {!loading && page < totalPages && (
        <div className="flex justify-center pt-2 pb-4">
          <button
            onClick={() => fetchMembres(page + 1, true)}
            disabled={loadingMore}
            className="flex items-center gap-2 rounded-full border border-border-brand bg-white px-6 py-2.5 font-body text-xs font-medium text-text-mid hover:border-gold hover:text-gold transition-colors disabled:opacity-40"
          >
            {loadingMore ? <Loader2 size={14} className="animate-spin" /> : <ChevronDown size={14} />}
            Voir plus
          </button>
        </div>
      )}
    </section>
  )
}
