"use client"

import { useState, useEffect, useCallback, FormEvent } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Loader2,
  Users,
  Plus,
  Search,
  Lock,
  Globe,
  EyeOff,
  X,
  FileText,
  HelpCircle,
  Trash2,
} from "lucide-react"

interface GroupeData {
  id: string
  nom: string
  slug: string
  description: string | null
  imageUrl: string | null
  visibilite: string
  membresCount: number
  postsCount: number
  isMember?: boolean
  myRole?: string | null
  role?: string
}

/* ━━━━━━━━━━ Page Groupes ━━━━━━━━━━ */

export default function PageGroupes() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [tab, setTab] = useState<"joined" | "discover">("joined")
  const [groupes, setGroupes] = useState<GroupeData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/connexion?callbackUrl=/communaute/groupes")
  }, [status, router])

  const fetchGroupes = useCallback(async (type: string, q?: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ type })
      if (q) params.set("q", q)
      const res = await fetch(`/api/communaute/groupes?${params}`)
      if (res.ok) {
        const data = await res.json()
        setGroupes(data.groupes || [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === "authenticated") fetchGroupes(tab)
  }, [status, tab, fetchGroupes])

  function handleSearch(e: FormEvent) {
    e.preventDefault()
    fetchGroupes(tab, search)
  }

  async function handleJoin(slug: string) {
    await fetch(`/api/communaute/groupes/${slug}/membres`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "join" }),
    })
    fetchGroupes(tab, search)
  }

  function handleCreated() {
    setShowCreate(false)
    fetchGroupes("joined")
    setTab("joined")
  }

  const visIcon = (v: string) => {
    if (v === "PRIVE") return <Lock size={11} className="text-gold" />
    if (v === "SECRET") return <EyeOff size={11} className="text-danger" />
    return <Globe size={11} className="text-primary-brand" />
  }

  if (status === "loading") {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 size={28} className="animate-spin text-gold" /></div>
  }

  return (
    <section className="mx-auto max-w-2xl space-y-5">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-white border border-border-brand p-1 flex-1 mr-3">
          <button onClick={() => setTab("joined")} className={`flex-1 py-2 font-body text-[11px] font-medium uppercase tracking-[0.08em] transition-colors ${tab === "joined" ? "bg-primary-brand text-white" : "text-text-muted-brand hover:bg-bg-page"}`}>
            Mes groupes
          </button>
          <button onClick={() => setTab("discover")} className={`flex-1 py-2 font-body text-[11px] font-medium uppercase tracking-[0.08em] transition-colors ${tab === "discover" ? "bg-primary-brand text-white" : "text-text-muted-brand hover:bg-bg-page"}`}>
            Découvrir
          </button>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-primary-brand px-4 py-2 font-body text-[11px] font-medium uppercase tracking-[0.12em] text-white hover:bg-primary-dark transition-colors shrink-0">
          <Plus size={14} />
          Créer
        </button>
      </div>

      {/* Recherche */}
      {tab === "discover" && (
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-brand" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un groupe..."
              className="w-full pl-9 pr-3 py-2.5 border border-border-brand bg-white font-body text-[12px] text-text-main placeholder:text-text-muted-brand focus:border-gold focus:outline-none transition-colors"
            />
          </div>
          <button type="submit" className="px-4 py-2.5 bg-gold text-white font-body text-[11px] font-medium uppercase tracking-wider hover:bg-gold-dark transition-colors">
            Rechercher
          </button>
        </form>
      )}

      {/* Modal création */}
      {showCreate && <CreateGroupeModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-gold" /></div>
      ) : groupes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center bg-primary-light rounded-full mb-3">
            <Users size={24} className="text-primary-brand" />
          </div>
          <p className="font-display text-[16px] font-light text-text-main">
            {tab === "joined" ? "Vous n'avez rejoint aucun groupe" : "Aucun groupe trouvé"}
          </p>
          <p className="font-body text-[11px] text-text-muted-brand mt-1">
            {tab === "joined" ? "Découvrez des groupes ou créez le vôtre" : "Essayez avec d'autres mots-clés"}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {groupes.map((g) => (
            <Link
              key={g.id}
              href={`/communaute/groupes/${g.slug}`}
              className="bg-white border border-border-brand hover:border-gold transition-colors overflow-hidden group"
            >
              {g.imageUrl ? (
                <img src={g.imageUrl} alt="" className="w-full h-28 object-cover" />
              ) : (
                <div className="w-full h-28 bg-primary-light flex items-center justify-center">
                  <Users size={32} className="text-primary-brand/30" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center gap-1.5 mb-1">
                  {visIcon(g.visibilite)}
                  <h3 className="font-body text-[13px] font-medium text-text-main group-hover:text-gold transition-colors truncate">{g.nom}</h3>
                </div>
                {g.description && <p className="font-body text-[11px] text-text-mid line-clamp-2 mb-2">{g.description}</p>}
                <div className="flex items-center gap-3">
                  <span className="font-body text-[10px] text-text-muted-brand flex items-center gap-1"><Users size={10} />{g.membresCount} membres</span>
                  <span className="font-body text-[10px] text-text-muted-brand flex items-center gap-1"><FileText size={10} />{g.postsCount} posts</span>
                </div>
                {g.role && (
                  <span className="inline-block mt-2 px-2 py-0.5 bg-gold-light font-body text-[9px] font-medium text-gold uppercase tracking-wider rounded-full">{g.role}</span>
                )}
                {tab === "discover" && !g.isMember && (
                  <button
                    onClick={(e) => { e.preventDefault(); handleJoin(g.slug) }}
                    className="mt-2 w-full py-1.5 bg-primary-brand text-white font-body text-[10px] font-medium uppercase tracking-wider hover:bg-primary-dark transition-colors"
                  >
                    Rejoindre
                  </button>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

/* ━━━━━━━━━━ Modal Création ━━━━━━━━━━ */

function CreateGroupeModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [nom, setNom] = useState("")
  const [description, setDescription] = useState("")
  const [visibilite, setVisibilite] = useState("PUBLIC")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [questions, setQuestions] = useState<string[]>([])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nom.trim()) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/communaute/groupes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: nom.trim(),
          description: description.trim() || undefined,
          visibilite,
          ...(visibilite !== "PUBLIC" && questions.filter(q => q.trim()).length > 0
            ? { questions: questions.filter(q => q.trim()).map(q => ({ texte: q.trim() })) }
            : {}),
        }),
      })
      if (res.ok) {
        onCreated()
      } else {
        const data = await res.json()
        setError(data.error || "Erreur lors de la création")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white border border-border-brand shadow-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-[20px] font-light text-text-main">Créer un groupe</h2>
          <button onClick={onClose} className="p-1 text-text-muted-brand hover:text-text-mid transition-colors"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-body text-[11px] font-medium uppercase tracking-wider text-text-muted-brand mb-1 block">Nom du groupe</label>
            <input value={nom} onChange={(e) => setNom(e.target.value)} maxLength={100} className="w-full border border-border-brand bg-bg-page px-3 py-2.5 font-body text-[13px] text-text-main focus:border-gold focus:outline-none transition-colors" />
          </div>

          <div>
            <label className="font-body text-[11px] font-medium uppercase tracking-wider text-text-muted-brand mb-1 block">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={1000} className="w-full resize-none border border-border-brand bg-bg-page px-3 py-2.5 font-body text-[12px] text-text-main focus:border-gold focus:outline-none transition-colors" />
          </div>

          <div>
            <label className="font-body text-[11px] font-medium uppercase tracking-wider text-text-muted-brand mb-1 block">Visibilité</label>
            <div className="flex gap-2">
              {[
                { value: "PUBLIC", label: "Public", icon: Globe },
                { value: "PRIVE", label: "Privé", icon: Lock },
              ].map((opt) => {
                const Icon = opt.icon
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setVisibilite(opt.value)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 border font-body text-[11px] font-medium transition-colors ${
                      visibilite === opt.value ? "border-gold bg-gold-light text-gold" : "border-border-brand text-text-muted-brand hover:border-gold"
                    }`}
                  >
                    <Icon size={13} />
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Questions d'adhésion (privé / secret uniquement) */}
          {visibilite !== "PUBLIC" && (
            <div>
              <label className="font-body text-[11px] font-medium uppercase tracking-wider text-text-muted-brand mb-1.5 flex items-center gap-1 block">
                <HelpCircle size={12} />Questions d&apos;adhésion (max 3)
              </label>
              <p className="font-body text-[10px] text-text-muted-brand mb-2">Les nouveaux membres devront répondre avant de rejoindre le groupe</p>
              <div className="space-y-2">
                {questions.map((q, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={q}
                      onChange={(e) => { const nq = [...questions]; nq[i] = e.target.value; setQuestions(nq) }}
                      placeholder={`Question ${i + 1}...`}
                      maxLength={300}
                      className="flex-1 border border-border-brand bg-bg-page px-3 py-2 font-body text-[12px] text-text-main focus:border-gold focus:outline-none transition-colors"
                    />
                    <button type="button" onClick={() => setQuestions(questions.filter((_, j) => j !== i))} className="p-2 text-text-muted-brand hover:text-danger transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                {questions.length < 3 && (
                  <button type="button" onClick={() => setQuestions([...questions, ""])} className="font-body text-[10px] text-primary-brand hover:text-primary-dark transition-colors">
                    + Ajouter une question
                  </button>
                )}
              </div>
            </div>
          )}

          {error && <p className="font-body text-[11px] text-danger">{error}</p>}

          <button
            type="submit"
            disabled={!nom.trim() || loading}
            className="w-full flex items-center justify-center gap-2 bg-primary-brand py-2.5 font-body text-[11px] font-medium uppercase tracking-[0.12em] text-white hover:bg-primary-dark transition-colors disabled:opacity-40"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Créer le groupe
          </button>
        </form>
      </div>
    </div>
  )
}
