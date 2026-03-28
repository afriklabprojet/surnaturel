"use client"

import { useState, FormEvent, Suspense } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  Loader2,
  Search,
  Users,
  UsersRound,
  FileText,
  Hash,
  MapPin,
} from "lucide-react"

interface MembreResult {
  id: string
  nom: string
  prenom: string
  pseudo?: string | null
  photoUrl?: string | null
  bio?: string | null
  role?: string
}

interface GroupeResult {
  id: string
  nom: string
  slug: string
  description?: string | null
  membresCount: number
}

interface PostResult {
  id: string
  contenu: string
  createdAt: string
  auteur: { id: string; nom: string; prenom: string; photoUrl: string | null }
  _count: { reactions: number; commentaires: number }
}

const TYPES = [
  { key: "all", label: "Tout", icon: Search },
  { key: "membres", label: "Membres", icon: Users },
  { key: "groupes", label: "Groupes", icon: UsersRound },
  { key: "posts", label: "Publications", icon: FileText },
  { key: "hashtags", label: "Hashtags", icon: Hash },
] as const

type SearchType = (typeof TYPES)[number]["key"]

function Avatar({ user, size = 36 }: { user: { prenom: string; nom: string; photoUrl?: string | null }; size?: number }) {
  const initials = `${user.prenom?.[0] ?? ""}${user.nom?.[0] ?? ""}`.toUpperCase()
  if (user.photoUrl) return <img src={user.photoUrl} alt="" className="rounded-full object-cover" style={{ width: size, height: size }} />
  return <div className="flex items-center justify-center rounded-full bg-primary-brand text-white font-body font-medium" style={{ width: size, height: size, fontSize: size * 0.32 }}>{initials}</div>
}

function timeAgo(dateStr: string) {
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

function RechercheContent() {
  const { status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQ = searchParams.get("q") || ""

  const [query, setQuery] = useState(initialQ)
  const [type, setType] = useState<SearchType>("all")
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(!!initialQ)
  const [results, setResults] = useState<{
    membres?: MembreResult[]
    groupes?: GroupeResult[]
    posts?: PostResult[]
    hashtags?: PostResult[]
  }>({})

  async function handleSearch(e?: FormEvent) {
    e?.preventDefault()
    if (!query.trim() || query.trim().length < 2) return
    setLoading(true)
    setSearched(true)
    try {
      const params = new URLSearchParams({ q: query.trim(), type })
      const res = await fetch(`/api/communaute/recherche?${params}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data)
      }
    } finally {
      setLoading(false)
    }
  }

  // Auto-search if initial query from URL
  useState(() => {
    if (initialQ) handleSearch()
  })

  if (status === "loading") {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 size={28} className="animate-spin text-gold" /></div>
  }

  const totalResults =
    (results.membres?.length || 0) +
    (results.groupes?.length || 0) +
    (results.posts?.length || 0) +
    (results.hashtags?.length || 0)

  return (
    <section className="mx-auto max-w-2xl space-y-5">
      {/* Barre de recherche */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-brand" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher des membres, groupes, publications, hashtags..."
            className="w-full pl-10 pr-3 py-3 border border-border-brand bg-white font-body text-[13px] text-text-main placeholder:text-text-muted-brand focus:border-gold focus:outline-none transition-colors"
          />
        </div>
        <button type="submit" disabled={loading || query.trim().length < 2} className="px-5 py-3 bg-primary-brand text-white font-body text-[11px] font-medium uppercase tracking-wider hover:bg-primary-dark transition-colors disabled:opacity-40">
          {loading ? <Loader2 size={14} className="animate-spin" /> : "Rechercher"}
        </button>
      </form>

      {/* Filtres type */}
      <div className="flex gap-1 overflow-x-auto scrollbar-none">
        {TYPES.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => { setType(t.key); if (searched) handleSearch() }}
              className={`flex items-center gap-1 px-3 py-1.5 font-body text-[10px] font-medium uppercase tracking-wider whitespace-nowrap transition-colors ${
                type === t.key
                  ? "bg-primary-brand text-white"
                  : "bg-white border border-border-brand text-text-muted-brand hover:border-gold hover:text-gold"
              }`}
            >
              <Icon size={12} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Résultats */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-gold" /></div>
      ) : !searched ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search size={32} className="text-text-muted-brand/30 mb-3" />
          <p className="font-body text-[12px] text-text-muted-brand">Tapez pour rechercher dans la communauté</p>
        </div>
      ) : totalResults === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search size={32} className="text-text-muted-brand/30 mb-3" />
          <p className="font-display text-[16px] font-light text-text-main">Aucun résultat</p>
          <p className="font-body text-[11px] text-text-muted-brand mt-1">Essayez avec d&apos;autres mots-clés</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Membres */}
          {results.membres && results.membres.length > 0 && (
            <div>
              <h3 className="font-body text-[11px] font-medium uppercase tracking-wider text-text-muted-brand mb-2 flex items-center gap-1.5">
                <Users size={13} />
                Membres ({results.membres.length})
              </h3>
              <div className="space-y-2">
                {results.membres.map((m) => (
                  <Link key={m.id} href={`/communaute/profil/${m.id}`} className="flex items-center gap-3 bg-white border border-border-brand p-3 hover:border-gold transition-colors">
                    <Avatar user={m} />
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-[12px] font-medium text-text-main truncate">
                        {m.prenom} {m.nom}
                        {m.pseudo && <span className="text-text-muted-brand font-normal ml-1">@{m.pseudo}</span>}
                      </p>
                      {m.bio && <p className="font-body text-[10px] text-text-mid line-clamp-1">{m.bio}</p>}
                    </div>
                    {m.role === "PRO_SANTE" && (
                      <span className="px-2 py-0.5 bg-primary-light font-body text-[9px] font-medium text-primary-brand uppercase tracking-wider rounded-full">Pro santé</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Groupes */}
          {results.groupes && results.groupes.length > 0 && (
            <div>
              <h3 className="font-body text-[11px] font-medium uppercase tracking-wider text-text-muted-brand mb-2 flex items-center gap-1.5">
                <UsersRound size={13} />
                Groupes ({results.groupes.length})
              </h3>
              <div className="space-y-2">
                {results.groupes.map((g) => (
                  <Link key={g.id} href={`/communaute/groupes/${g.slug}`} className="flex items-center gap-3 bg-white border border-border-brand p-3 hover:border-gold transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center bg-primary-light rounded-full shrink-0">
                      <UsersRound size={18} className="text-primary-brand" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-[12px] font-medium text-text-main truncate">{g.nom}</p>
                      {g.description && <p className="font-body text-[10px] text-text-mid line-clamp-1">{g.description}</p>}
                    </div>
                    <span className="font-body text-[10px] text-text-muted-brand shrink-0">{g.membresCount} mbr</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Posts */}
          {results.posts && results.posts.length > 0 && (
            <div>
              <h3 className="font-body text-[11px] font-medium uppercase tracking-wider text-text-muted-brand mb-2 flex items-center gap-1.5">
                <FileText size={13} />
                Publications ({results.posts.length})
              </h3>
              <div className="space-y-2">
                {results.posts.map((p) => (
                  <div key={p.id} className="bg-white border border-border-brand p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Avatar user={p.auteur} size={24} />
                      <Link href={`/communaute/profil/${p.auteur.id}`} className="font-body text-[11px] font-medium text-text-main hover:text-gold transition-colors">{p.auteur.prenom} {p.auteur.nom}</Link>
                      <span className="font-body text-[9px] text-text-muted-brand">{timeAgo(p.createdAt)}</span>
                    </div>
                    <p className="font-body text-[12px] text-text-mid line-clamp-3">{p.contenu}</p>
                    <div className="flex gap-3 mt-1.5">
                      <span className="font-body text-[9px] text-text-muted-brand">{p._count.reactions} réactions</span>
                      <span className="font-body text-[9px] text-text-muted-brand">{p._count.commentaires} commentaires</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hashtags */}
          {results.hashtags && results.hashtags.length > 0 && (
            <div>
              <h3 className="font-body text-[11px] font-medium uppercase tracking-wider text-text-muted-brand mb-2 flex items-center gap-1.5">
                <Hash size={13} />
                Publications avec hashtag ({results.hashtags.length})
              </h3>
              <div className="space-y-2">
                {results.hashtags.map((p) => (
                  <div key={p.id} className="bg-white border border-border-brand p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Avatar user={p.auteur} size={24} />
                      <span className="font-body text-[11px] font-medium text-text-main">{p.auteur.prenom} {p.auteur.nom}</span>
                      <span className="font-body text-[9px] text-text-muted-brand">{timeAgo(p.createdAt)}</span>
                    </div>
                    <p className="font-body text-[12px] text-text-mid line-clamp-3">{p.contenu}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default function PageRecherche() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><Loader2 size={28} className="animate-spin text-gold" /></div>}>
      <RechercheContent />
    </Suspense>
  )
}
