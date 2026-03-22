"use client"

import { useState, useEffect, useCallback, FormEvent, use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Loader2,
  Users,
  FileText,
  Send,
  Settings,
  UserPlus,
  LogOut,
  Lock,
  Globe,
  ChevronDown,
  MessageCircle,
  ArrowLeft,
  Shield,
  Crown,
  Megaphone,
  Clock,
  HelpCircle,
  Check,
  X,
  Archive,
} from "lucide-react"

interface GroupeDetail {
  id: string
  nom: string
  slug: string
  description: string | null
  imageUrl: string | null
  visibilite: string
  regles: string | null
  createdAt: string
  questions?: { id: string; texte: string; ordre: number }[]
  pendingCount?: number
  isPending?: boolean
}

interface MembreData {
  id: string
  userId: string
  role: string
  user: {
    id: string
    nom: string
    prenom: string
    pseudo?: string | null
    photoUrl?: string | null
  }
}

interface PostData {
  id: string
  contenu: string
  isAnnonce?: boolean
  createdAt: string
  auteur: { id: string; nom: string; prenom: string; photoUrl: string | null }
  _count: { commentaires: number; reactions: number }
}

interface DemandeData {
  id: string
  userId: string
  user: { id: string; nom: string; prenom: string; photoUrl?: string | null; pseudo?: string | null }
  reponses: { reponse: string; question: { texte: string; ordre: number } }[]
  createdAt: string
}

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
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
}

export default function PageGroupeDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()

  const [groupe, setGroupe] = useState<GroupeDetail | null>(null)
  const [membres, setMembres] = useState<MembreData[]>([])
  const [posts, setPosts] = useState<PostData[]>([])
  const [annonces, setAnnonces] = useState<PostData[]>([])
  const [demandes, setDemandes] = useState<DemandeData[]>([])
  const [loading, setLoading] = useState(true)
  const [isMember, setIsMember] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [myRole, setMyRole] = useState<string | null>(null)
  const [tab, setTab] = useState<"feed" | "membres" | "infos" | "demandes">("feed")
  const [newPost, setNewPost] = useState("")
  const [posting, setPosting] = useState(false)
  // Modal questions d'adhésion
  const [showQuestionsModal, setShowQuestionsModal] = useState(false)
  const [questionsReponses, setQuestionsReponses] = useState<Record<string, string>>({})
  const [submittingAdhesion, setSubmittingAdhesion] = useState(false)
  // Annonce
  const [showAnnonceForm, setShowAnnonceForm] = useState(false)
  const [annonceContent, setAnnonceContent] = useState("")
  const [postingAnnonce, setPostingAnnonce] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/connexion")
  }, [status, router])

  const isAdminOrMod = myRole === "ADMIN" || myRole === "MODERATEUR"

  const fetchGroupe = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/communaute/groupes/${slug}`)
      if (!res.ok) { router.push("/communaute/groupes"); return }
      const data = await res.json()
      const g = data.groupe || data
      setGroupe(g)
      setMembres(data.membres || g.membres || [])
      setIsMember(data.isMember ?? false)
      setIsPending(data.isPending ?? false)
      setMyRole(data.myRole ?? null)

      // Fetch group posts
      if (data.isMember || g.visibilite === "PUBLIC") {
        const postsRes = await fetch(`/api/communaute/posts?groupeId=${g.id}&limit=20`)
        if (postsRes.ok) {
          const postsData = await postsRes.json()
          setPosts(postsData.posts || [])
        }
        // Fetch annonces
        const annRes = await fetch(`/api/communaute/groupes/${slug}/annonces`)
        if (annRes.ok) {
          const annData = await annRes.json()
          setAnnonces(annData.annonces || [])
        }
      }

      // Fetch demandes en attente si admin/modérateur
      if (["ADMIN", "MODERATEUR"].includes(data.myRole)) {
        const demRes = await fetch(`/api/communaute/groupes/${slug}/adhesion`)
        if (demRes.ok) {
          const demData = await demRes.json()
          setDemandes(demData.demandes || [])
        }
      }
    } finally {
      setLoading(false)
    }
  }, [slug, router])

  useEffect(() => {
    if (status === "authenticated") fetchGroupe()
  }, [status, fetchGroupe])

  async function handleJoinLeave() {
    if (!groupe) return

    if (isMember) {
      // Quitter
      await fetch(`/api/communaute/groupes/${slug}/membres`, { method: "POST" })
      setIsMember(false)
      setMyRole(null)
      fetchGroupe()
      return
    }

    // Si le groupe a des questions (privé) → ouvrir le modal
    if (groupe.visibilite === "PRIVE" && groupe.questions && groupe.questions.length > 0) {
      setShowQuestionsModal(true)
      return
    }

    // Rejoindre directement
    await fetch(`/api/communaute/groupes/${slug}/membres`, { method: "POST" })
    setIsMember(true)
    setMyRole("MEMBRE")
    fetchGroupe()
  }

  async function handleSubmitAdhesion(e: FormEvent) {
    e.preventDefault()
    if (!groupe?.questions || submittingAdhesion) return
    setSubmittingAdhesion(true)
    try {
      const reponses = groupe.questions.map((q) => ({
        questionId: q.id,
        reponse: questionsReponses[q.id] || "",
      }))
      const res = await fetch(`/api/communaute/groupes/${slug}/adhesion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reponses }),
      })
      if (res.ok) {
        const data = await res.json()
        setShowQuestionsModal(false)
        setQuestionsReponses({})
        if (data.joined) {
          setIsMember(true)
          setMyRole("MEMBRE")
        } else {
          setIsPending(true)
        }
        fetchGroupe()
      }
    } finally {
      setSubmittingAdhesion(false)
    }
  }

  async function handleDemandeAction(membreId: string, action: "approuver" | "refuser") {
    await fetch(`/api/communaute/groupes/${slug}/adhesion`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ membreId, action }),
    })
    setDemandes((prev) => prev.filter((d) => d.id !== membreId))
    if (action === "approuver") fetchGroupe()
  }

  async function handlePostAnnonce(e: FormEvent) {
    e.preventDefault()
    if (!annonceContent.trim() || postingAnnonce || !groupe) return
    setPostingAnnonce(true)
    try {
      const res = await fetch(`/api/communaute/groupes/${slug}/annonces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenu: annonceContent.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setAnnonces((prev) => [data.annonce, ...prev])
        setAnnonceContent("")
        setShowAnnonceForm(false)
      }
    } finally {
      setPostingAnnonce(false)
    }
  }

  async function handleArchiveAnnonce(postId: string) {
    await fetch(`/api/communaute/groupes/${slug}/annonces`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    })
    setAnnonces((prev) => prev.filter((a) => a.id !== postId))
  }

  async function handlePost(e: FormEvent) {
    e.preventDefault()
    if (!newPost.trim() || posting || !groupe) return
    setPosting(true)
    try {
      const res = await fetch("/api/communaute/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenu: newPost.trim(), groupeId: groupe.id }),
      })
      if (res.ok) {
        const post = await res.json()
        setPosts((prev) => [post, ...prev])
        setNewPost("")
      }
    } finally {
      setPosting(false)
    }
  }

  if (status === "loading" || loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 size={28} className="animate-spin text-gold" /></div>
  }

  if (!groupe) return null

  const roleIcon = (role: string) => {
    if (role === "ADMIN") return <Crown size={12} className="text-gold" />
    if (role === "MODERATEUR") return <Shield size={12} className="text-primary-brand" />
    return null
  }

  return (
    <section className="mx-auto max-w-2xl space-y-5">
      {/* Retour */}
      <Link href="/communaute/groupes" className="inline-flex items-center gap-1.5 font-body text-[11px] text-text-muted-brand hover:text-text-mid transition-colors">
        <ArrowLeft size={14} />
        Retour aux groupes
      </Link>

      {/* Bannière */}
      <div className="bg-white border border-border-brand overflow-hidden">
        {groupe.imageUrl ? (
          <img src={groupe.imageUrl} alt="" className="w-full h-40 object-cover" />
        ) : (
          <div className="w-full h-40 bg-primary-light flex items-center justify-center">
            <Users size={48} className="text-primary-brand/20" />
          </div>
        )}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-[22px] font-light text-text-main">{groupe.nom}</h1>
                {groupe.visibilite === "PRIVE" ? <Lock size={14} className="text-gold" /> : <Globe size={14} className="text-primary-brand" />}
              </div>
              {groupe.description && <p className="font-body text-[12px] text-text-mid mt-1">{groupe.description}</p>}
              <div className="flex items-center gap-4 mt-2">
                <span className="font-body text-[11px] text-text-muted-brand flex items-center gap-1"><Users size={12} />{membres.length} membres</span>
                <span className="font-body text-[11px] text-text-muted-brand flex items-center gap-1"><FileText size={12} />{posts.length} publications</span>
              </div>
            </div>
            {isPending ? (
              <span className="shrink-0 flex items-center gap-1.5 px-4 py-2 font-body text-[11px] font-medium uppercase tracking-widest border border-gold text-gold">
                <Clock size={13} />En attente
              </span>
            ) : (
              <button
                onClick={handleJoinLeave}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 font-body text-[11px] font-medium uppercase tracking-widest transition-colors ${
                  isMember
                    ? "border border-danger text-danger hover:bg-danger hover:text-white"
                    : "bg-primary-brand text-white hover:bg-primary-dark"
                }`}
              >
                {isMember ? <><LogOut size={13} />Quitter</> : <><UserPlus size={13} />Rejoindre</>}
              </button>
            )}
          </div>
          {myRole && (
            <div className="mt-2 flex items-center gap-1">
              {roleIcon(myRole)}
              <span className="font-body text-[10px] font-medium uppercase tracking-wider text-gold">{myRole}</span>
            </div>
          )}
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 bg-white border border-border-brand p-1">
        {(["feed", "membres", ...(isAdminOrMod && demandes.length > 0 ? ["demandes" as const] : []), "infos"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t as typeof tab)} className={`flex-1 py-2 font-body text-[11px] font-medium uppercase tracking-[0.08em] transition-colors relative ${tab === t ? "bg-primary-brand text-white" : "text-text-muted-brand hover:bg-bg-page"}`}>
            {t === "feed" ? "Publications" : t === "membres" ? "Membres" : t === "demandes" ? "Demandes" : "Informations"}
            {t === "demandes" && demandes.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger text-white text-[9px] flex items-center justify-center">{demandes.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Contenu onglet */}
      {tab === "feed" && (
        <div className="space-y-4">
          {/* Annonces épinglées */}
          {annonces.length > 0 && (
            <div className="space-y-3">
              {annonces.map((annonce) => (
                <div key={annonce.id} className="bg-gold-light border border-gold/30 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Megaphone size={14} className="text-gold" />
                    <span className="font-body text-[11px] font-medium uppercase tracking-widest text-gold">Annonce</span>
                    <span className="font-body text-[10px] text-text-muted-brand ml-auto">{timeAgo(annonce.createdAt)}</span>
                    {myRole === "ADMIN" && (
                      <button onClick={() => handleArchiveAnnonce(annonce.id)} className="ml-1 text-text-muted-brand hover:text-danger transition-colors" title="Archiver">
                        <Archive size={13} />
                      </button>
                    )}
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Avatar user={annonce.auteur} size={28} />
                    <div>
                      <span className="font-body text-[12px] font-medium text-text-main">{annonce.auteur.prenom} {annonce.auteur.nom}</span>
                      <p className="font-body text-[13px] text-text-mid mt-1 whitespace-pre-wrap">{annonce.contenu}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bouton créer annonce (admin/mod) */}
          {isAdminOrMod && isMember && (
            <div>
              {showAnnonceForm ? (
                <form onSubmit={handlePostAnnonce} className="bg-gold-light border border-gold/30 p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Megaphone size={14} className="text-gold" />
                    <span className="font-body text-[11px] font-medium uppercase tracking-widest text-gold">Nouvelle annonce</span>
                  </div>
                  <textarea
                    value={annonceContent}
                    onChange={(e) => setAnnonceContent(e.target.value)}
                    placeholder="Rédigez une annonce importante..."
                    className="w-full border border-border-brand p-3 font-body text-[13px] text-text-main placeholder:text-text-muted-brand focus:outline-none focus:border-gold resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => { setShowAnnonceForm(false); setAnnonceContent("") }} className="px-3 py-1.5 font-body text-[11px] text-text-muted-brand border border-border-brand hover:bg-bg-page transition-colors">
                      Annuler
                    </button>
                    <button type="submit" disabled={!annonceContent.trim() || postingAnnonce} className="px-3 py-1.5 font-body text-[11px] text-white bg-gold hover:bg-gold/90 uppercase tracking-widest disabled:opacity-50 transition-colors flex items-center gap-1.5">
                      {postingAnnonce ? <Loader2 size={12} className="animate-spin" /> : <Megaphone size={12} />}
                      Publier l&apos;annonce
                    </button>
                  </div>
                </form>
              ) : (
                <button onClick={() => setShowAnnonceForm(true)} className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-gold/50 text-gold font-body text-[11px] uppercase tracking-widest hover:bg-gold-light transition-colors">
                  <Megaphone size={13} />Créer une annonce
                </button>
              )}
            </div>
          )}

          {isMember && (
            <form onSubmit={handlePost} className="bg-white border border-border-brand p-4">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Écrire dans le groupe..."
                rows={2}
                maxLength={2000}
                className="w-full resize-none border border-border-brand bg-bg-page px-3 py-2 font-body text-[12px] text-text-main placeholder:text-text-muted-brand focus:border-gold focus:outline-none transition-colors"
              />
              <div className="flex justify-end mt-2">
                <button type="submit" disabled={!newPost.trim() || posting} className="flex items-center gap-1.5 bg-primary-brand px-4 py-2 font-body text-[11px] font-medium uppercase tracking-[0.12em] text-white hover:bg-primary-dark transition-colors disabled:opacity-40">
                  {posting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  Publier
                </button>
              </div>
            </form>
          )}

          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-body text-[12px] text-text-muted-brand">Aucune publication dans ce groupe</p>
            </div>
          ) : (
            posts.filter(p => !p.isAnnonce).map((post) => (
              <div key={post.id} className="bg-white border border-border-brand p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar user={post.auteur} size={32} />
                  <div>
                    <Link href={`/communaute/profil/${post.auteur.id}`} className="font-body text-[12px] font-medium text-text-main hover:text-gold transition-colors">
                      {post.auteur.prenom} {post.auteur.nom}
                    </Link>
                    <p className="font-body text-[10px] text-text-muted-brand">{timeAgo(post.createdAt)}</p>
                  </div>
                </div>
                <p className="font-body text-[13px] text-text-main leading-relaxed whitespace-pre-wrap">{post.contenu}</p>
                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border-brand">
                  <span className="font-body text-[10px] text-text-muted-brand">{post._count?.reactions || 0} réactions</span>
                  <span className="font-body text-[10px] text-text-muted-brand">{post._count?.commentaires || 0} commentaires</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "membres" && (
        <div className="space-y-2">
          {membres.map((m) => (
            <div key={m.id} className="flex items-center gap-3 bg-white border border-border-brand p-3">
              <Link href={`/communaute/profil/${m.user.id}`}>
                <Avatar user={m.user} size={36} />
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/communaute/profil/${m.user.id}`} className="font-body text-[12px] font-medium text-text-main hover:text-gold transition-colors">
                  {m.user.prenom} {m.user.nom}
                  {m.user.pseudo && <span className="text-text-muted-brand font-normal ml-1">@{m.user.pseudo}</span>}
                </Link>
              </div>
              <div className="flex items-center gap-1">
                {roleIcon(m.role)}
                <span className="font-body text-[10px] uppercase tracking-wider text-text-muted-brand">{m.role}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "demandes" && isAdminOrMod && (
        <div className="space-y-3">
          {demandes.length === 0 ? (
            <p className="text-center font-body text-[12px] text-text-muted-brand py-8">Aucune demande en attente</p>
          ) : (
            demandes.map((d) => (
              <div key={d.id} className="bg-white border border-border-brand p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar user={d.user} size={36} />
                  <div className="flex-1">
                    <span className="font-body text-[13px] font-medium text-text-main">{d.user.prenom} {d.user.nom}</span>
                    {d.user.pseudo && <p className="font-body text-[10px] text-text-muted-brand">@{d.user.pseudo}</p>}
                  </div>
                  <span className="font-body text-[10px] text-text-muted-brand">{timeAgo(d.createdAt)}</span>
                </div>
                {d.reponses.length > 0 && (
                  <div className="bg-bg-page border border-border-brand p-3 space-y-2">
                    {d.reponses.map((r, i) => (
                      <div key={i}>
                        <p className="font-body text-[11px] font-medium text-text-main flex items-center gap-1">
                          <HelpCircle size={11} className="text-gold shrink-0" />{r.question.texte}
                        </p>
                        <p className="font-body text-[12px] text-text-mid ml-4 mt-0.5">{r.reponse}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  <button onClick={() => handleDemandeAction(d.id, "refuser")} className="flex items-center gap-1 px-3 py-1.5 font-body text-[11px] border border-danger text-danger hover:bg-danger hover:text-white transition-colors uppercase tracking-[0.08em]">
                    <X size={12} />Refuser
                  </button>
                  <button onClick={() => handleDemandeAction(d.id, "approuver")} className="flex items-center gap-1 px-3 py-1.5 font-body text-[11px] bg-primary-brand text-white hover:bg-primary-dark transition-colors uppercase tracking-[0.08em]">
                    <Check size={12} />Accepter
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "infos" && (
        <div className="bg-white border border-border-brand p-5 space-y-4">
          <div>
            <h3 className="font-body text-[11px] font-medium uppercase tracking-wider text-text-muted-brand mb-1">Visibilité</h3>
            <p className="font-body text-[13px] text-text-main flex items-center gap-1.5">
              {groupe.visibilite === "PRIVE" ? <><Lock size={13} className="text-gold" />Groupe privé</> : <><Globe size={13} className="text-primary-brand" />Groupe public</>}
            </p>
          </div>
          {groupe.regles && (
            <div>
              <h3 className="font-body text-[11px] font-medium uppercase tracking-wider text-text-muted-brand mb-1">Règles du groupe</h3>
              <p className="font-body text-[12px] text-text-mid whitespace-pre-wrap">{groupe.regles}</p>
            </div>
          )}
          <div>
            <h3 className="font-body text-[11px] font-medium uppercase tracking-wider text-text-muted-brand mb-1">Créé le</h3>
            <p className="font-body text-[12px] text-text-mid">
              {new Date(groupe.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          {groupe.questions && groupe.questions.length > 0 && (
            <div>
              <h3 className="font-body text-[11px] font-medium uppercase tracking-wider text-text-muted-brand mb-1">Questions d&apos;adhésion</h3>
              <ul className="space-y-1">
                {groupe.questions.map((q) => (
                  <li key={q.id} className="font-body text-[12px] text-text-mid flex items-start gap-1.5">
                    <HelpCircle size={11} className="text-gold shrink-0 mt-0.5" />{q.texte}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Modal questions d'adhésion */}
      {showQuestionsModal && groupe.questions && groupe.questions.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-5 border-b border-border-brand">
              <h2 className="font-display text-[18px] font-light text-text-main">Rejoindre « {groupe.nom} »</h2>
              <p className="font-body text-[12px] text-text-mid mt-1">Répondez aux questions ci-dessous pour soumettre votre demande.</p>
            </div>
            <form onSubmit={handleSubmitAdhesion} className="p-5 space-y-4">
              {groupe.questions.map((q) => (
                <div key={q.id}>
                  <label className="font-body text-[12px] font-medium text-text-main flex items-start gap-1.5 mb-1">
                    <HelpCircle size={12} className="text-gold shrink-0 mt-0.5" />{q.texte}
                  </label>
                  <textarea
                    value={questionsReponses[q.id] || ""}
                    onChange={(e) => setQuestionsReponses((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    className="w-full border border-border-brand p-2.5 font-body text-[13px] text-text-main placeholder:text-text-muted-brand focus:outline-none focus:border-primary-brand resize-none"
                    rows={2}
                    required
                  />
                </div>
              ))}
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowQuestionsModal(false)} className="px-4 py-2 font-body text-[11px] text-text-muted-brand border border-border-brand hover:bg-bg-page transition-colors uppercase tracking-widest">
                  Annuler
                </button>
                <button type="submit" disabled={submittingAdhesion} className="px-4 py-2 font-body text-[11px] text-white bg-primary-brand hover:bg-primary-dark disabled:opacity-50 transition-colors uppercase tracking-widest flex items-center gap-1.5">
                  {submittingAdhesion ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  Envoyer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
