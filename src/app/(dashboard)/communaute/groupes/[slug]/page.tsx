"use client"

import { useState, useEffect, useCallback, useRef, FormEvent, use, ChangeEvent } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  Loader2, Users, FileText, Send, Settings, UserPlus, LogOut, Lock, Globe,
  ChevronDown, MessageCircle, ArrowLeft, Shield, Crown, Megaphone, Clock,
  HelpCircle, Check, X, Archive, BarChart3, Trash2, Copy, Link2, EyeOff,
  AlertTriangle, Ban, VolumeX, UserX, Plus, CalendarDays, TrendingUp,
  Image as ImageIcon, Video, Link as LinkIcon, ThumbsUp, Heart, Repeat2,
} from "lucide-react"

import { REACTIONS, ReactionType } from "@/components/communaute/types"

/* ────────────── Types ────────────── */

interface GroupeDetail {
  id: string; nom: string; slug: string; description: string | null
  imageUrl: string | null; visibilite: string; regles: string | null
  categorie?: string; approvalRequired?: boolean; inviteCode?: string | null
  createdAt: string; createurId?: string; archivee?: boolean
  tags?: string[]; quiPeutPublier?: string; quiPeutCommenter?: string
  reactionsActivees?: boolean; invitationsParMembres?: boolean
  suggestionsActivees?: boolean; partagesExternes?: boolean
  slowModeMinutes?: number; badgesActifs?: boolean
  parentGroupeId?: string | null
  questions?: { id: string; texte: string; ordre: number }[]
  reglesGroupe?: RegleData[]
  pendingCount?: number; isPending?: boolean; isBanned?: boolean; bannedCount?: number
}
interface MembreData {
  id: string; userId: string; role: string; badge?: string | null; mutedUntil?: string | null
  user: { id: string; nom: string; prenom: string; pseudo?: string | null; photoUrl?: string | null }
}
interface CommentData {
  id: string; contenu: string; createdAt: string
  auteur: { id: string; nom: string; prenom: string; photoUrl: string | null; pseudo?: string | null }
}
interface PostData {
  id: string; contenu: string; isAnnonce?: boolean; createdAt: string
  auteur: { id: string; nom: string; prenom: string; photoUrl: string | null }
  images?: string[]; imageUrl?: string | null; videoUrl?: string | null; lienUrl?: string | null
  userReaction?: ReactionType | null
  reactionCounts?: Record<string, number>
  reactionsCount?: number
  commentairesCount?: number
  commentaires?: CommentData[]
  _count: { commentaires: number; reactions: number }
}

interface DemandeData {
  id: string; userId: string
  user: { id: string; nom: string; prenom: string; photoUrl?: string | null; pseudo?: string | null }
  reponses: { reponse: string; question: { texte: string; ordre: number } }[]
  createdAt: string
}
interface SondageOption { id: string; texte: string; votesCount: number; pourcentage: number; aVote: boolean }
interface SondageData {
  id: string; question: string; multiChoix: boolean; anonyme: boolean
  totalVotes: number; hasVoted: boolean; isExpired: boolean; createdAt: string
  expireAt: string | null; options: SondageOption[]
}
interface StatsData {
  general: {
    totalMembres: number; membresActifs7j: number; nouveauxMembres7j: number
    nouveauxMembres30j: number; totalPosts: number; postsThisWeek: number
    postsThisMonth: number; totalCommentaires: number; totalReactions: number
    totalEvenements: number; totalSondages: number; demandesEnAttente: number
    tauxEngagement?: number
  }
  topContributeurs: { id?: string; nom?: string; prenom?: string; postsCount: number }[]
  croissance: { semaine: string; nouveauxMembres: number }[]
  heuresPic?: { heure: string; posts: number }[]
}
interface RegleData { id: string; titre: string; contenu: string; ordre: number }
interface BadgeData { id: string; nom: string; description?: string | null; icone?: string | null; automatique: boolean; critere?: string | null }
interface JournalEntry { id: string; action: string; details?: string | null; createdAt: string; moderateur?: { prenom: string; nom: string } | null; cibleUser?: { prenom: string; nom: string } | null }

/* ────────────── Helpers ────────────── */

function Avatar({ user, size = 36 }: { user: { prenom: string; nom: string; photoUrl?: string | null }; size?: number }) {
  const initials = `${user.prenom?.[0] ?? ""}${user.nom?.[0] ?? ""}`.toUpperCase()
  if (user.photoUrl) return <Image src={user.photoUrl} alt={`Photo de ${user.prenom}`} width={size} height={size} className="rounded-full object-cover" />
  return (
    <div className="flex items-center justify-center rounded-full bg-primary-brand text-white font-body font-medium"
      style={{ width: size, height: size, fontSize: size * 0.32 }}>{initials}</div>
  )
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "\u00c0 l\u2019instant"
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}j`
  return new Date(dateStr).toLocaleDateString("fr", { day: "numeric", month: "short" })
}

const CATEGORIE_LABELS: Record<string, string> = {
  SANTE: "Sant\u00e9", BIEN_ETRE: "Bien-\u00eatre", SPORT: "Sport", EDUCATION: "\u00c9ducation",
  BUSINESS: "Business", FAMILLE: "Famille", CULTURE: "Culture", SPIRITUALITE: "Spiritualit\u00e9", AUTRE: "Autre",
}

/* ────────────── Post Card avec réactions et commentaires ────────────── */

function GroupePostCard({ post, currentUserId, onUpdatePost }: {
  post: PostData; currentUserId: string; onUpdatePost: (post: PostData) => void
}) {
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [allComments, setAllComments] = useState<CommentData[]>(post.commentaires || [])
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentPage, setCommentPage] = useState(1)
  const [totalCommentPages, setTotalCommentPages] = useState(1)
  const [showPicker, setShowPicker] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const hoverTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)

  const userReaction = post.userReaction ?? null
  const reactionCounts = post.reactionCounts ?? {}
  const reactionsCount = post.reactionsCount ?? post._count?.reactions ?? 0
  const totalComments = post.commentairesCount ?? post._count?.commentaires ?? 0
  const currentReaction = REACTIONS.find(r => r.type === userReaction)

  const topEmojis = Object.entries(reactionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([type]) => REACTIONS.find(r => r.type === type)?.emoji)
    .filter(Boolean)

  useEffect(() => {
    if (!commentsLoaded) setAllComments(post.commentaires || [])
  }, [post.commentaires, commentsLoaded])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setShowPicker(false)
    }
    if (showPicker) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showPicker])

  async function handleReaction(type: ReactionType) {
    setShowPicker(false)
    const res = await fetch(`/api/communaute/posts/${post.id}/reaction`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    })
    if (res.ok) {
      const data = await res.json()
      const newType: ReactionType | null = data.type ?? null
      const newCounts = { ...reactionCounts }
      // remove old
      if (userReaction && newCounts[userReaction]) {
        newCounts[userReaction] = Math.max(0, newCounts[userReaction] - 1)
        if (newCounts[userReaction] === 0) delete newCounts[userReaction]
      }
      // add new
      if (newType) newCounts[newType] = (newCounts[newType] || 0) + 1
      const total = Object.values(newCounts).reduce((s, n) => s + n, 0)
      onUpdatePost({ ...post, userReaction: newType, reactionCounts: newCounts, reactionsCount: total })
    }
  }

  async function loadComments() {
    if (commentsLoaded || loadingComments) return
    setLoadingComments(true)
    try {
      const res = await fetch(`/api/communaute/posts/${post.id}/commentaires?limit=20&page=1`)
      if (res.ok) {
        const data = await res.json()
        setAllComments(data.commentaires)
        setTotalCommentPages(data.pages)
        setCommentPage(1)
        setCommentsLoaded(true)
      }
    } finally { setLoadingComments(false) }
  }

  async function loadMoreComments() {
    if (loadingComments || commentPage >= totalCommentPages) return
    setLoadingComments(true)
    try {
      const next = commentPage + 1
      const res = await fetch(`/api/communaute/posts/${post.id}/commentaires?limit=20&page=${next}`)
      if (res.ok) {
        const data = await res.json()
        setAllComments(prev => [...prev, ...data.commentaires])
        setCommentPage(next)
        setTotalCommentPages(data.pages)
      }
    } finally { setLoadingComments(false) }
  }

  function toggleComments() {
    const next = !showComments
    setShowComments(next)
    if (next && !commentsLoaded && totalComments > 3) loadComments()
  }

  async function handleComment(e: FormEvent) {
    e.preventDefault()
    if (!commentText.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/communaute/posts/${post.id}/commentaires`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenu: commentText.trim() }),
      })
      if (res.ok) {
        const comment = await res.json()
        setAllComments(prev => [...prev, comment])
        setCommentText("")
        onUpdatePost({
          ...post,
          commentairesCount: (post.commentairesCount ?? post._count.commentaires) + 1,
          _count: { ...post._count, commentaires: post._count.commentaires + 1 },
        })
      }
    } finally { setSubmitting(false) }
  }

  return (
    <article className="bg-white border border-border-brand overflow-hidden">
      {/* En-t\u00eate */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <Link href={`/communaute/profil/${post.auteur.id}`}><Avatar user={post.auteur} size={36} /></Link>
        <div className="flex-1 min-w-0">
          <Link href={`/communaute/profil/${post.auteur.id}`} className="font-body text-[12px] font-medium text-text-main hover:text-gold transition-colors">{post.auteur.prenom} {post.auteur.nom}</Link>
          <p className="font-body text-xs text-text-muted-brand">{timeAgo(post.createdAt)}</p>
        </div>
      </div>

      {/* Contenu */}
      <div className="px-4 pb-3">
        <p className="font-body text-[13px] text-text-main leading-relaxed whitespace-pre-wrap">{post.contenu}</p>
      </div>

      {/* M\u00e9dias */}
      {post.images && post.images.length > 0 && (
        <div className={`grid gap-0.5 ${post.images.length === 1 ? "" : "grid-cols-2"}`}>
          {post.images.slice(0, 4).map((img, i) => (
            <div key={i} className={`relative h-48 ${post.images!.length === 3 && i === 0 ? "col-span-2" : ""}`}>
              <Image src={img} alt="Image du post" fill className="object-cover" />
            </div>
          ))}
        </div>
      )}
      {post.videoUrl && (
        <div className="px-4 pb-2"><a href={post.videoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gold font-body text-[12px] hover:underline"><Video size={14} />{post.videoUrl}</a></div>
      )}
      {post.lienUrl && (
        <div className="px-4 pb-2"><a href={post.lienUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary-brand font-body text-[12px] hover:underline"><LinkIcon size={14} />{post.lienUrl}</a></div>
      )}

      {/* Compteurs */}
      {(reactionsCount > 0 || totalComments > 0) && (
        <div className="flex items-center justify-between px-4 py-2 text-text-muted-brand">
          {reactionsCount > 0 && (
            <span className="font-body text-xs flex items-center gap-1">
              {topEmojis.map((emoji, i) => <span key={i} className="text-[12px]">{emoji}</span>)}
              <span className="ml-0.5">{reactionsCount}</span>
            </span>
          )}
          {totalComments > 0 && (
            <button onClick={toggleComments} className="font-body text-xs hover:text-gold transition-colors ml-auto">
              {totalComments} commentaire{totalComments > 1 ? "s" : ""}
            </button>
          )}
        </div>
      )}

      {/* Boutons d'action */}
      <div className="flex border-t border-border-brand relative">
        {/* R\u00e9action */}
        <div className="relative flex-1" ref={pickerRef}>
          <button
            onMouseEnter={() => { clearTimeout(hoverTimeout.current); hoverTimeout.current = setTimeout(() => setShowPicker(true), 300) }}
            onMouseLeave={() => { clearTimeout(hoverTimeout.current); hoverTimeout.current = setTimeout(() => setShowPicker(false), 400) }}
            onClick={() => handleReaction(userReaction ?? "JAIME")}
            className={`flex w-full items-center justify-center gap-2 py-2.5 font-body text-[12px] font-medium transition-colors ${userReaction ? "text-gold" : "text-text-muted-brand hover:text-gold"}`}
          >
            <span className="text-[15px]">{currentReaction?.emoji ?? "\ud83d\udc4d"}</span>
            {currentReaction?.label ?? "R\u00e9agir"}
          </button>
          {showPicker && (
            <div
              onMouseEnter={() => clearTimeout(hoverTimeout.current)}
              onMouseLeave={() => { clearTimeout(hoverTimeout.current); hoverTimeout.current = setTimeout(() => setShowPicker(false), 400) }}
              className="absolute bottom-full left-0 mb-2 flex items-center gap-1 px-2 py-1.5 bg-white border border-border-brand shadow-lg rounded-full z-20"
            >
              {REACTIONS.map(r => (
                <button key={r.type} onClick={() => handleReaction(r.type)} title={r.label}
                  className={`px-1.5 py-0.5 rounded-full transition-transform hover:scale-125 ${userReaction === r.type ? "bg-gold-light" : ""}`}>
                  <span className="text-[20px]">{r.emoji}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Commenter */}
        <button onClick={toggleComments} className="flex-1 flex items-center justify-center gap-2 py-2.5 font-body text-[12px] font-medium text-text-muted-brand hover:text-primary-brand transition-colors border-l border-border-brand">
          <MessageCircle size={16} />Commenter
        </button>
      </div>

      {/* Section commentaires */}
      {showComments && (
        <div className="border-t border-border-brand px-4 py-3">
          {allComments.length > 0 && (
            <div className="space-y-0 divide-y divide-border-brand mb-3 max-h-96 overflow-y-auto">
              {allComments.map(c => (
                <div key={c.id} className="flex gap-2.5 py-2.5">
                  <Avatar user={c.auteur} size={28} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <Link href={`/communaute/profil/${c.auteur.id}`} className="font-body text-[12px] font-medium text-text-main hover:text-gold transition-colors">{c.auteur.prenom} {c.auteur.nom}</Link>
                      <span className="font-body text-xs text-text-muted-brand">{timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="font-body text-[12px] text-text-mid mt-0.5">{c.contenu}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {commentsLoaded && commentPage < totalCommentPages && (
            <button onClick={loadMoreComments} disabled={loadingComments} className="flex items-center gap-1.5 mb-3 font-body text-xs text-primary-brand hover:text-gold transition-colors">
              {loadingComments ? <Loader2 size={12} className="animate-spin" /> : <ChevronDown size={12} />}
              Voir plus de commentaires
            </button>
          )}
          {loadingComments && !commentsLoaded && (
            <div className="flex justify-center py-2 mb-3"><Loader2 size={16} className="animate-spin text-gold" /></div>
          )}
          <form onSubmit={handleComment} className="flex gap-2">
            <textarea value={commentText} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCommentText(e.target.value)} placeholder="\u00c9crire un commentaire..." rows={1} maxLength={1000}
              className="flex-1 resize-none border border-border-brand bg-bg-page px-3 py-2 font-body text-[12px] text-text-main placeholder:text-text-muted-brand focus:border-gold focus:outline-none transition-colors" />
            <button type="submit" disabled={!commentText.trim() || submitting} className="px-3 py-2 bg-primary-brand text-white transition-colors hover:bg-primary-dark disabled:opacity-40 self-end">
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </form>
        </div>
      )}
    </article>
  )
}

/* ────────────── Page ────────────── */

export default function PageGroupeDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()

  const [groupe, setGroupe] = useState<GroupeDetail | null>(null)
  const [membres, setMembres] = useState<MembreData[]>([])
  const [posts, setPosts] = useState<PostData[]>([])
  const [annonces, setAnnonces] = useState<PostData[]>([])
  const [demandes, setDemandes] = useState<DemandeData[]>([])
  const [sondages, setSondages] = useState<SondageData[]>([])
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMember, setIsMember] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [myRole, setMyRole] = useState<string | null>(null)

  type TabKey = "feed" | "sondages" | "membres" | "demandes" | "bannis" | "regles" | "journal" | "stats" | "parametres" | "infos"
  const [tab, setTab] = useState<TabKey>("feed")

  const [newPost, setNewPost] = useState("")
  const [posting, setPosting] = useState(false)
  const [postImages, setPostImages] = useState<string[]>([])
  const [postVideoUrl, setPostVideoUrl] = useState("")
  const [postLienUrl, setPostLienUrl] = useState("")
  const [postMediaType, setPostMediaType] = useState<"" | "image" | "video" | "lien">("")
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showAnnonceForm, setShowAnnonceForm] = useState(false)
  const [annonceContent, setAnnonceContent] = useState("")
  const [postingAnnonce, setPostingAnnonce] = useState(false)
  const [showQuestionsModal, setShowQuestionsModal] = useState(false)
  const [questionsReponses, setQuestionsReponses] = useState<Record<string, string>>({})
  const [submittingAdhesion, setSubmittingAdhesion] = useState(false)
  const [showSondageForm, setShowSondageForm] = useState(false)
  const [sondageQ, setSondageQ] = useState("")
  const [sondageOpts, setSondageOpts] = useState(["", ""])
  const [sondageMulti, setSondageMulti] = useState(false)
  const [sondageAnonyme, setSondageAnonyme] = useState(false)
  const [sondageDuree, setSondageDuree] = useState(24)
  const [creatingSondage, setCreatingSondage] = useState(false)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [copiedInvite, setCopiedInvite] = useState(false)
  const [roleChangeTarget, setRoleChangeTarget] = useState<string | null>(null)
  const [bannedMembres, setBannedMembres] = useState<MembreData[]>([])
  const [reglesGroupe, setReglesGroupe] = useState<RegleData[]>([])
  const [badgesGroupe, setBadgesGroupe] = useState<BadgeData[]>([])
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [notifPref, setNotifPref] = useState("TOUTES")

  useEffect(() => { if (status === "unauthenticated") router.push("/connexion") }, [status, router])

  const isAdminOrMod = myRole === "ADMIN" || myRole === "MODERATEUR"
  const isAdmin = myRole === "ADMIN"

  /* ── Fetch ── */
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
      setInviteCode(g.inviteCode ?? null)

      if (data.isMember || g.visibilite === "PUBLIC") {
        const [postsRes, annRes, sondRes] = await Promise.all([
          fetch(`/api/communaute/posts?groupeId=${g.id}&limit=20`),
          fetch(`/api/communaute/groupes/${slug}/annonces`),
          fetch(`/api/communaute/groupes/${slug}/sondages`),
        ])
        if (postsRes.ok) { const d = await postsRes.json(); setPosts(d.posts || []) }
        if (annRes.ok) { const d = await annRes.json(); setAnnonces(d.annonces || []) }
        if (sondRes.ok) { const d = await sondRes.json(); setSondages(d.sondages || []) }
      }

      if (["ADMIN", "MODERATEUR"].includes(data.myRole)) {
        const [demRes, statsRes, bannedRes, journalRes] = await Promise.all([
          fetch(`/api/communaute/groupes/${slug}/adhesion`),
          fetch(`/api/communaute/groupes/${slug}/stats`),
          fetch(`/api/communaute/groupes/${slug}/sanctions?type=bannis`),
          fetch(`/api/communaute/groupes/${slug}/journal?limit=50`),
        ])
        if (demRes.ok) { const d = await demRes.json(); setDemandes(d.demandes || []) }
        if (statsRes.ok) { const d = await statsRes.json(); setStats(d) }
        if (bannedRes.ok) { const d = await bannedRes.json(); setBannedMembres(d.bannis || []) }
        if (journalRes.ok) { const d = await journalRes.json(); setJournalEntries(d.entries || []) }
      }

      // Charger règles, badges et notif prefs si membre
      if (data.isMember) {
        const [reglesRes, badgesRes, notifRes] = await Promise.all([
          fetch(`/api/communaute/groupes/${slug}/regles`),
          fetch(`/api/communaute/groupes/${slug}/badges`),
          fetch(`/api/communaute/groupes/${slug}/notif-prefs`),
        ])
        if (reglesRes.ok) { const d = await reglesRes.json(); setReglesGroupe(Array.isArray(d) ? d : []) }
        if (badgesRes.ok) { const d = await badgesRes.json(); setBadgesGroupe(Array.isArray(d) ? d : []) }
        if (notifRes.ok) { const d = await notifRes.json(); setNotifPref(d.niveau || "TOUTES") }
      }
    } finally { setLoading(false) }
  }, [slug, router])

  useEffect(() => { if (status === "authenticated") fetchGroupe() }, [status, fetchGroupe])

  /* ── Actions ── */
  async function handleJoinLeave() {
    if (!groupe) return
    if (isMember) {
      await fetch(`/api/communaute/groupes/${slug}/membres`, { method: "POST" })
      setIsMember(false); setMyRole(null); fetchGroupe(); return
    }
    if (groupe.visibilite !== "PUBLIC" && groupe.questions && groupe.questions.length > 0) {
      setShowQuestionsModal(true); return
    }
    await fetch(`/api/communaute/groupes/${slug}/membres`, { method: "POST" })
    setIsMember(true); setMyRole("MEMBRE"); fetchGroupe()
  }

  async function handleSubmitAdhesion(e: FormEvent) {
    e.preventDefault()
    if (!groupe?.questions || submittingAdhesion) return
    setSubmittingAdhesion(true)
    try {
      const reponses = groupe.questions.map((q) => ({ questionId: q.id, reponse: questionsReponses[q.id] || "" }))
      const res = await fetch(`/api/communaute/groupes/${slug}/adhesion`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reponses }),
      })
      if (res.ok) {
        const data = await res.json()
        setShowQuestionsModal(false); setQuestionsReponses({})
        if (data.joined) { setIsMember(true); setMyRole("MEMBRE") } else { setIsPending(true) }
        fetchGroupe()
      }
    } finally { setSubmittingAdhesion(false) }
  }

  async function handleDemandeAction(membreId: string, action: "approuver" | "refuser") {
    await fetch(`/api/communaute/groupes/${slug}/adhesion`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ membreId, action }),
    })
    setDemandes((p) => p.filter((d) => d.id !== membreId))
    if (action === "approuver") fetchGroupe()
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    try {
      const newUrls: string[] = []
      for (const file of Array.from(files).slice(0, 4 - postImages.length)) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("folder", "surnaturel-de-dieu/posts")
        const res = await fetch("/api/upload/image", { method: "POST", body: formData })
        const data = await res.json()
        if (res.ok && data.url) newUrls.push(data.url)
      }
      setPostImages((prev) => [...prev, ...newUrls].slice(0, 4))
      setPostMediaType("image")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  function removePostImage(idx: number) {
    setPostImages((prev) => {
      const next = prev.filter((_, i) => i !== idx)
      if (next.length === 0) setPostMediaType("")
      return next
    })
  }

  async function handlePost(e: FormEvent) {
    e.preventDefault()
    if (!newPost.trim() || posting || !groupe) return
    setPosting(true)
    try {
      const body: Record<string, unknown> = { contenu: newPost.trim(), groupeId: groupe.id }
      if (postMediaType === "image" && postImages.length > 0) {
        body.images = postImages
        body.imageUrl = postImages[0]
      }
      if (postMediaType === "video" && postVideoUrl.trim()) body.videoUrl = postVideoUrl.trim()
      if (postMediaType === "lien" && postLienUrl.trim()) body.lienUrl = postLienUrl.trim()
      const res = await fetch("/api/communaute/posts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const post = await res.json()
        setPosts((p) => [post, ...p])
        setNewPost(""); setPostImages([]); setPostVideoUrl(""); setPostLienUrl(""); setPostMediaType("")
      }
    } finally { setPosting(false) }
  }

  async function handlePostAnnonce(e: FormEvent) {
    e.preventDefault()
    if (!annonceContent.trim() || postingAnnonce || !groupe) return
    setPostingAnnonce(true)
    try {
      const res = await fetch(`/api/communaute/groupes/${slug}/annonces`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenu: annonceContent.trim() }),
      })
      if (res.ok) { const d = await res.json(); setAnnonces((p) => [d.annonce, ...p]); setAnnonceContent(""); setShowAnnonceForm(false) }
    } finally { setPostingAnnonce(false) }
  }

  async function handleArchiveAnnonce(postId: string) {
    await fetch(`/api/communaute/groupes/${slug}/annonces`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId }),
    })
    setAnnonces((p) => p.filter((a) => a.id !== postId))
  }

  /* ── Sondages ── */
  async function handleCreateSondage(e: FormEvent) {
    e.preventDefault()
    if (!sondageQ.trim() || creatingSondage) return
    const validOpts = sondageOpts.filter((o) => o.trim())
    if (validOpts.length < 2) return
    setCreatingSondage(true)
    try {
      const res = await fetch(`/api/communaute/groupes/${slug}/sondages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: sondageQ.trim(), options: validOpts, multiChoix: sondageMulti, anonyme: sondageAnonyme, dureeHeures: sondageDuree }),
      })
      if (res.ok) {
        setShowSondageForm(false); setSondageQ(""); setSondageOpts(["", ""]); setSondageMulti(false); setSondageAnonyme(false)
        const sRes = await fetch(`/api/communaute/groupes/${slug}/sondages`)
        if (sRes.ok) { const d = await sRes.json(); setSondages(d.sondages || []) }
      }
    } finally { setCreatingSondage(false) }
  }

  async function handleVoteSondage(sondageId: string, optionId: string) {
    await fetch(`/api/communaute/groupes/${slug}/sondages/${sondageId}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionIds: [optionId] }),
    })
    const sRes = await fetch(`/api/communaute/groupes/${slug}/sondages`)
    if (sRes.ok) { const d = await sRes.json(); setSondages(d.sondages || []) }
  }

  /* ── Invite ── */
  async function handleGenerateInvite() {
    const res = await fetch(`/api/communaute/groupes/${slug}/invite`, { method: "POST" })
    if (res.ok) { const d = await res.json(); setInviteCode(d.inviteCode) }
  }
  async function handleRevokeInvite() {
    await fetch(`/api/communaute/groupes/${slug}/invite`, { method: "DELETE" })
    setInviteCode(null)
  }
  function copyInviteLink() {
    if (!inviteCode) return
    navigator.clipboard.writeText(`${window.location.origin}/communaute/groupes/rejoindre?code=${inviteCode}`)
    setCopiedInvite(true); setTimeout(() => setCopiedInvite(false), 2000)
  }

  /* ── Membres: role & kick ── */
  async function handleChangeRole(userId: string, role: string) {
    await fetch(`/api/communaute/groupes/${slug}/membres`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    })
    setRoleChangeTarget(null); fetchGroupe()
  }
  async function handleKickMember(userId: string) {
    await fetch(`/api/communaute/groupes/${slug}/membres?userId=${userId}`, { method: "DELETE" })
    fetchGroupe()
  }
  async function handleSanction(userId: string, type: string, raison: string, dureeHeures?: number) {
    await fetch(`/api/communaute/groupes/${slug}/sanctions`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, type, raison, dureeHeures }),
    })
    fetchGroupe()
  }

  async function handleUnban(userId: string) {
    await fetch(`/api/communaute/groupes/${slug}/sanctions`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })
    fetchGroupe()
  }

  async function handleAddRegle(titre: string, contenu: string) {
    const res = await fetch(`/api/communaute/groupes/${slug}/regles`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titre, contenu }),
    })
    if (res.ok) { const r = await res.json(); setReglesGroupe(p => [...p, r]) }
  }

  async function handleDeleteRegle(id: string) {
    await fetch(`/api/communaute/groupes/${slug}/regles?id=${id}`, { method: "DELETE" })
    setReglesGroupe(p => p.filter(r => r.id !== id))
  }

  async function handleUpdateNotifPref(niveau: string) {
    await fetch(`/api/communaute/groupes/${slug}/notif-prefs`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ niveau }),
    })
    setNotifPref(niveau)
  }

  async function handleTransferOwnership(userId: string) {
    const membre = membres.find(m => m.userId === userId)
    if (!confirm(`Transférer la propriété à ${membre?.user.prenom} ${membre?.user.nom} ? Cette action est irréversible.`)) return
    await fetch(`/api/communaute/groupes/${slug}/transferer`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nouveauProprietaireId: userId }),
    })
    fetchGroupe()
  }

  async function handleArchiveGroupe() {
    if (!confirm("Archiver ce groupe ? Les membres ne pourront plus publier.")) return
    await fetch(`/api/communaute/groupes/${slug}/parametres`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archivee: true }),
    })
    fetchGroupe()
  }

  /* ── Loading ── */
  if (status === "loading" || loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 size={28} className="animate-spin text-gold" /></div>
  }
  if (!groupe) return null

  const roleIcon = (role: string) => {
    if (role === "ADMIN") return <Crown size={12} className="text-gold" />
    if (role === "MODERATEUR") return <Shield size={12} className="text-primary-brand" />
    return null
  }

  const tabs: { key: TabKey; label: string; show: boolean; badge?: number }[] = [
    { key: "feed", label: "Publications", show: true },
    { key: "sondages", label: "Sondages", show: isMember, badge: sondages.length },
    { key: "membres", label: "Membres", show: true, badge: membres.length },
    { key: "demandes", label: "Demandes", show: isAdminOrMod && demandes.length > 0, badge: demandes.length },    { key: "bannis", label: "Bannis", show: isAdminOrMod && bannedMembres.length > 0, badge: bannedMembres.length },
    { key: "regles", label: "Règles", show: isMember },
    { key: "journal", label: "Journal", show: isAdminOrMod },    { key: "stats", label: "Statistiques", show: isAdminOrMod },
    { key: "parametres", label: "Param\u00e8tres", show: isAdmin },
    { key: "infos", label: "Infos", show: true },
  ]

  return (
    <section className="mx-auto max-w-2xl space-y-5">
      {/* Retour */}
      <Link href="/communaute/groupes" className="inline-flex items-center gap-1.5 font-body text-xs text-text-muted-brand hover:text-text-mid transition-colors">
        <ArrowLeft size={14} />Retour aux groupes
      </Link>

      {/* Banniere */}
      <div className="bg-white border border-border-brand overflow-hidden">
        {groupe.imageUrl ? (
          <div className="relative w-full h-40">
            <Image src={groupe.imageUrl} alt={groupe.nom} fill className="object-cover" />
          </div>
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
                {groupe.visibilite === "SECRET" ? <EyeOff size={14} className="text-text-muted-brand" /> : groupe.visibilite === "PRIVE" ? <Lock size={14} className="text-gold" /> : <Globe size={14} className="text-primary-brand" />}
              </div>
              {groupe.description && <p className="font-body text-[12px] text-text-mid mt-1">{groupe.description}</p>}
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <span className="font-body text-xs text-text-muted-brand flex items-center gap-1"><Users size={12} />{membres.length} membres</span>
                <span className="font-body text-xs text-text-muted-brand flex items-center gap-1"><FileText size={12} />{posts.length} publications</span>
                {groupe.categorie && groupe.categorie !== "AUTRE" && (
                  <span className="font-body text-xs px-2 py-0.5 bg-bg-page border border-border-brand text-text-muted-brand">{CATEGORIE_LABELS[groupe.categorie] || groupe.categorie}</span>
                )}
              </div>
            </div>
            {isPending ? (
              <span className="shrink-0 flex items-center gap-1.5 px-4 py-2 font-body text-xs font-medium uppercase tracking-widest border border-gold text-gold">
                <Clock size={13} />En attente
              </span>
            ) : (
              <button onClick={handleJoinLeave} className={`shrink-0 flex items-center gap-1.5 px-4 py-2 font-body text-xs font-medium uppercase tracking-widest transition-colors ${isMember ? "border border-danger text-danger hover:bg-danger hover:text-white" : "bg-primary-brand text-white hover:bg-primary-dark"}`}>
                {isMember ? <><LogOut size={13} />Quitter</> : <><UserPlus size={13} />Rejoindre</>}
              </button>
            )}
          </div>
          {myRole && (
            <div className="mt-2 flex items-center gap-1">
              {roleIcon(myRole)}
              <span className="font-body text-xs font-medium uppercase tracking-wider text-gold">{myRole}</span>
            </div>
          )}
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 bg-white border border-border-brand p-1 overflow-x-auto">
        {tabs.filter(t => t.show).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`shrink-0 px-3 py-2 font-body text-xs font-medium uppercase tracking-[0.08em] transition-colors relative ${tab === t.key ? "bg-primary-brand text-white" : "text-text-muted-brand hover:bg-bg-page"}`}>
            {t.label}
            {t.key === "demandes" && t.badge && t.badge > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger text-white text-[9px] flex items-center justify-center">{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ==== TAB: FEED ==== */}
      {tab === "feed" && (
        <div className="space-y-4">
          {annonces.length > 0 && annonces.map((a) => (
            <div key={a.id} className="bg-gold-light border border-gold/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Megaphone size={14} className="text-gold" />
                <span className="font-body text-xs font-medium uppercase tracking-widest text-gold">Annonce</span>
                <span className="font-body text-xs text-text-muted-brand ml-auto">{timeAgo(a.createdAt)}</span>
                {isAdmin && <button onClick={() => handleArchiveAnnonce(a.id)} className="ml-1 text-text-muted-brand hover:text-danger transition-colors"><Archive size={13} /></button>}
              </div>
              <div className="flex items-start gap-2.5">
                <Avatar user={a.auteur} size={28} />
                <div>
                  <span className="font-body text-[12px] font-medium text-text-main">{a.auteur.prenom} {a.auteur.nom}</span>
                  <p className="font-body text-[13px] text-text-mid mt-1 whitespace-pre-wrap">{a.contenu}</p>
                </div>
              </div>
            </div>
          ))}

          {isAdminOrMod && isMember && (
            showAnnonceForm ? (
              <form onSubmit={handlePostAnnonce} className="bg-gold-light border border-gold/30 p-4 space-y-3">
                <div className="flex items-center gap-2"><Megaphone size={14} className="text-gold" /><span className="font-body text-xs font-medium uppercase tracking-widest text-gold">Nouvelle annonce</span></div>
                <textarea value={annonceContent} onChange={(e) => setAnnonceContent(e.target.value)} placeholder="R&#233;digez une annonce importante..." className="w-full border border-border-brand p-3 font-body text-[13px] text-text-main placeholder:text-text-muted-brand focus:outline-none focus:border-gold resize-none" rows={3} />
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => { setShowAnnonceForm(false); setAnnonceContent("") }} className="px-3 py-1.5 font-body text-xs text-text-muted-brand border border-border-brand hover:bg-bg-page transition-colors">Annuler</button>
                  <button type="submit" disabled={!annonceContent.trim() || postingAnnonce} className="px-3 py-1.5 font-body text-xs text-white bg-gold hover:bg-gold/90 uppercase tracking-widest disabled:opacity-50 transition-colors flex items-center gap-1.5">
                    {postingAnnonce ? <Loader2 size={12} className="animate-spin" /> : <Megaphone size={12} />}Publier
                  </button>
                </div>
              </form>
            ) : (
              <button onClick={() => setShowAnnonceForm(true)} className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-gold/50 text-gold font-body text-xs uppercase tracking-widest hover:bg-gold-light transition-colors">
                <Megaphone size={13} />Cr&#233;er une annonce
              </button>
            )
          )}

          {isMember && (
            <form onSubmit={handlePost} className="bg-white border border-border-brand p-4">
              <textarea value={newPost} onChange={(e) => setNewPost(e.target.value)} placeholder="\u00c9crire dans le groupe..." rows={2} maxLength={2000} className="w-full resize-none border border-border-brand bg-bg-page px-3 py-2 font-body text-[12px] text-text-main placeholder:text-text-muted-brand focus:border-gold focus:outline-none transition-colors" />

              {/* Prévisualisation images */}
              {postImages.length > 0 && (
                <div className="mt-2 flex gap-2 flex-wrap">
                  {postImages.map((url, i) => (
                    <div key={i} className="relative group w-20 h-20">
                      <Image src={url} alt="Aperçu" fill className="object-cover border border-border-brand" />
                      <button type="button" onClick={() => removePostImage(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-danger text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} /></button>
                    </div>
                  ))}
                  {postImages.length < 4 && (
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="w-20 h-20 border border-dashed border-border-brand flex items-center justify-center text-text-muted-brand hover:border-gold hover:text-gold transition-colors"><ImageIcon size={18} /></button>
                  )}
                </div>
              )}

              {/* URL vidéo / lien */}
              {postMediaType && postMediaType !== "image" && (
                <div className="mt-2 flex items-center gap-2">
                  <input value={postMediaType === "video" ? postVideoUrl : postLienUrl} onChange={(e) => { if (postMediaType === "video") setPostVideoUrl(e.target.value); else setPostLienUrl(e.target.value) }} placeholder={postMediaType === "video" ? "URL de la vid\u00e9o..." : "URL du lien..."} className="flex-1 border border-border-brand bg-bg-page px-3 py-2 font-body text-[12px] text-text-main placeholder:text-text-muted-brand focus:border-gold focus:outline-none transition-colors" />
                  <button type="button" onClick={() => { setPostMediaType(""); setPostVideoUrl(""); setPostLienUrl("") }} className="p-1.5 text-text-muted-brand hover:text-danger transition-colors"><X size={14} /></button>
                </div>
              )}

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1">
                  <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                  <button type="button" onClick={() => { if (postMediaType === "image") { setPostMediaType(""); setPostImages([]) } else { setPostMediaType("image"); fileInputRef.current?.click() } }} disabled={uploading} className={`p-1.5 transition-colors ${postMediaType === "image" ? "text-gold" : "text-text-muted-brand hover:text-text-mid"}`} title="Images">
                    {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                  </button>
                  <button type="button" onClick={() => setPostMediaType(postMediaType === "video" ? "" : "video")} className={`p-1.5 transition-colors ${postMediaType === "video" ? "text-gold" : "text-text-muted-brand hover:text-text-mid"}`} title="Vid\u00e9o"><Video size={16} /></button>
                  <button type="button" onClick={() => setPostMediaType(postMediaType === "lien" ? "" : "lien")} className={`p-1.5 transition-colors ${postMediaType === "lien" ? "text-gold" : "text-text-muted-brand hover:text-text-mid"}`} title="Lien"><LinkIcon size={16} /></button>
                  <span className="font-body text-xs text-text-muted-brand ml-2">{newPost.length}/2000</span>
                </div>
                <button type="submit" disabled={!newPost.trim() || posting || uploading} className="flex items-center gap-1.5 bg-primary-brand px-4 py-2 font-body text-xs font-medium uppercase tracking-[0.12em] text-white hover:bg-primary-dark transition-colors disabled:opacity-40">
                  {posting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}Publier
                </button>
              </div>
            </form>
          )}

          {posts.length === 0 ? (
            <div className="text-center py-12"><p className="font-body text-[12px] text-text-muted-brand">Aucune publication dans ce groupe</p></div>
          ) : posts.filter(p => !p.isAnnonce).map((post) => (
            <GroupePostCard key={post.id} post={post} currentUserId={session?.user?.id ?? ""} onUpdatePost={(updated) => setPosts(prev => prev.map(p => p.id === updated.id ? updated : p))} />
          ))}
        </div>
      )}

      {/* ==== TAB: SONDAGES ==== */}
      {tab === "sondages" && isMember && (
        <div className="space-y-4">
          {isMember && (
            showSondageForm ? (
              <form onSubmit={handleCreateSondage} className="bg-white border border-border-brand p-4 space-y-3">
                <h3 className="font-body text-xs font-medium uppercase tracking-wider text-text-muted-brand flex items-center gap-1"><BarChart3 size={13} />Nouveau sondage</h3>
                <input value={sondageQ} onChange={(e) => setSondageQ(e.target.value)} placeholder="Votre question..." maxLength={500} className="w-full border border-border-brand bg-bg-page px-3 py-2 font-body text-[13px] text-text-main focus:border-gold focus:outline-none transition-colors" />
                <div className="space-y-2">
                  {sondageOpts.map((o, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={o} onChange={(e) => { const n = [...sondageOpts]; n[i] = e.target.value; setSondageOpts(n) }} placeholder={`Option ${i + 1}`} maxLength={200} className="flex-1 border border-border-brand bg-bg-page px-3 py-1.5 font-body text-[12px] text-text-main focus:border-gold focus:outline-none transition-colors" />
                      {sondageOpts.length > 2 && <button type="button" onClick={() => setSondageOpts(sondageOpts.filter((_, j) => j !== i))} className="p-1 text-text-muted-brand hover:text-danger"><Trash2 size={13} /></button>}
                    </div>
                  ))}
                  {sondageOpts.length < 10 && <button type="button" onClick={() => setSondageOpts([...sondageOpts, ""])} className="font-body text-xs text-primary-brand hover:text-primary-dark">+ Ajouter une option</button>}
                </div>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-1.5 font-body text-xs text-text-mid"><input type="checkbox" checked={sondageMulti} onChange={(e) => setSondageMulti(e.target.checked)} className="accent-primary-brand" />Multi-choix</label>
                  <label className="flex items-center gap-1.5 font-body text-xs text-text-mid"><input type="checkbox" checked={sondageAnonyme} onChange={(e) => setSondageAnonyme(e.target.checked)} className="accent-primary-brand" />Anonyme</label>
                  <label className="flex items-center gap-1.5 font-body text-xs text-text-mid">Dur&#233;e:
                    <select value={sondageDuree} onChange={(e) => setSondageDuree(Number(e.target.value))} className="border border-border-brand px-2 py-0.5 font-body text-xs bg-bg-page">
                      <option value={1}>1h</option><option value={6}>6h</option><option value={24}>24h</option><option value={48}>48h</option><option value={168}>1 semaine</option>
                    </select>
                  </label>
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowSondageForm(false)} className="px-3 py-1.5 font-body text-xs text-text-muted-brand border border-border-brand hover:bg-bg-page transition-colors">Annuler</button>
                  <button type="submit" disabled={!sondageQ.trim() || sondageOpts.filter(o => o.trim()).length < 2 || creatingSondage} className="px-3 py-1.5 font-body text-xs text-white bg-primary-brand hover:bg-primary-dark uppercase tracking-widest disabled:opacity-50 transition-colors flex items-center gap-1.5">
                    {creatingSondage ? <Loader2 size={12} className="animate-spin" /> : <BarChart3 size={12} />}Cr&#233;er
                  </button>
                </div>
              </form>
            ) : (
              <button onClick={() => setShowSondageForm(true)} className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-primary-brand/50 text-primary-brand font-body text-xs uppercase tracking-widest hover:bg-primary-light transition-colors">
                <BarChart3 size={13} />Cr&#233;er un sondage
              </button>
            )
          )}

          {sondages.length === 0 ? (
            <div className="text-center py-12"><p className="font-body text-[12px] text-text-muted-brand">Aucun sondage dans ce groupe</p></div>
          ) : sondages.map((s) => (
            <div key={s.id} className="bg-white border border-border-brand p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-body text-[14px] font-medium text-text-main">{s.question}</h4>
                {s.isExpired && <span className="font-body text-xs px-2 py-0.5 bg-bg-page border border-border-brand text-text-muted-brand">Termin&#233;</span>}
              </div>
              <div className="space-y-2">
                {s.options.map((opt) => (
                  <button key={opt.id} onClick={() => !s.isExpired && handleVoteSondage(s.id, opt.id)} disabled={s.isExpired}
                    className={`w-full text-left relative overflow-hidden border transition-colors ${opt.aVote ? "border-primary-brand bg-primary-light" : "border-border-brand hover:border-primary-brand"} ${s.isExpired ? "opacity-70" : ""}`}>
                    <div className="absolute inset-y-0 left-0 bg-primary-brand/10 transition-all" style={{ width: `${s.hasVoted || s.isExpired ? opt.pourcentage : 0}%` }} />
                    <div className="relative px-3 py-2 flex items-center justify-between">
                      <span className="font-body text-[12px] text-text-main">{opt.texte}</span>
                      {(s.hasVoted || s.isExpired) && <span className="font-body text-xs font-medium text-primary-brand">{opt.pourcentage}%</span>}
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-body text-xs text-text-muted-brand">{s.totalVotes} vote{s.totalVotes !== 1 ? "s" : ""}</span>
                {s.multiChoix && <span className="font-body text-xs text-text-muted-brand">Multi-choix</span>}
                {s.anonyme && <span className="font-body text-xs text-text-muted-brand">Anonyme</span>}
                <span className="font-body text-xs text-text-muted-brand ml-auto">{timeAgo(s.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==== TAB: MEMBRES ==== */}
      {tab === "membres" && (
        <div className="space-y-2">
          {isAdminOrMod && (
            <div className="bg-white border border-border-brand p-3 mb-3">
              <h3 className="font-body text-xs font-medium uppercase tracking-wider text-text-muted-brand mb-2 flex items-center gap-1"><Link2 size={12} />Lien d&apos;invitation</h3>
              {inviteCode ? (
                <div className="flex items-center gap-2">
                  <code className="flex-1 font-body text-xs bg-bg-page border border-border-brand px-2 py-1.5 truncate text-text-mid">{typeof window !== "undefined" ? `${window.location.origin}/communaute/groupes/rejoindre?code=${inviteCode}` : inviteCode}</code>
                  <button onClick={copyInviteLink} className="px-2 py-1.5 border border-border-brand font-body text-xs text-text-muted-brand hover:text-primary-brand transition-colors flex items-center gap-1">
                    {copiedInvite ? <><Check size={11} />Copi&#233;</> : <><Copy size={11} />Copier</>}
                  </button>
                  {isAdmin && <button onClick={handleRevokeInvite} className="px-2 py-1.5 border border-danger text-danger font-body text-xs hover:bg-danger hover:text-white transition-colors">R&#233;voquer</button>}
                </div>
              ) : (
                <button onClick={handleGenerateInvite} className="font-body text-xs text-primary-brand hover:text-primary-dark transition-colors flex items-center gap-1"><Plus size={12} />G&#233;n&#233;rer un lien d&apos;invitation</button>
              )}
            </div>
          )}

          {membres.map((m) => (
            <div key={m.id} className="flex items-center gap-3 bg-white border border-border-brand p-3">
              <Link href={`/communaute/profil/${m.user.id}`}><Avatar user={m.user} size={36} /></Link>
              <div className="flex-1 min-w-0">
                <Link href={`/communaute/profil/${m.user.id}`} className="font-body text-[12px] font-medium text-text-main hover:text-gold transition-colors">
                  {m.user.prenom} {m.user.nom}
                  {m.user.pseudo && <span className="text-text-muted-brand font-normal ml-1">@{m.user.pseudo}</span>}
                </Link>
                {m.badge && <span className="ml-2 font-body text-[9px] px-1.5 py-0.5 bg-gold-light text-gold border border-gold/30">{m.badge}</span>}
                {m.mutedUntil && new Date(m.mutedUntil) > new Date() && <span className="ml-2 font-body text-[9px] px-1.5 py-0.5 bg-red-50 text-danger border border-danger/30 inline-flex items-center gap-0.5"><VolumeX size={9} />Muet</span>}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {roleIcon(m.role)}
                  <span className="font-body text-xs uppercase tracking-wider text-text-muted-brand">{m.role}</span>
                </div>
                {isAdmin && m.userId !== session?.user?.id && (
                  <div className="relative">
                    <button onClick={() => setRoleChangeTarget(roleChangeTarget === m.userId ? null : m.userId)} className="p-1 text-text-muted-brand hover:text-text-mid transition-colors"><ChevronDown size={14} /></button>
                    {roleChangeTarget === m.userId && (
                      <div className="absolute right-0 top-8 z-20 bg-white border border-border-brand shadow-lg w-40 py-1">
                        {["ADMIN", "MODERATEUR", "MEMBRE"].filter(r => r !== m.role).map(r => (
                          <button key={r} onClick={() => handleChangeRole(m.userId, r)} className="w-full text-left px-3 py-1.5 font-body text-xs text-text-main hover:bg-bg-page transition-colors flex items-center gap-1.5">
                            {r === "ADMIN" ? <Crown size={11} className="text-gold" /> : r === "MODERATEUR" ? <Shield size={11} className="text-primary-brand" /> : <Users size={11} />}{r}
                          </button>
                        ))}
                        <hr className="my-1 border-border-brand" />
                        <button onClick={() => { handleSanction(m.userId, "AVERTISSEMENT", "Avertissement"); setRoleChangeTarget(null) }} className="w-full text-left px-3 py-1.5 font-body text-xs text-yellow-600 hover:bg-yellow-50 transition-colors flex items-center gap-1.5"><AlertTriangle size={11} />Avertir</button>
                        <button onClick={() => { handleSanction(m.userId, "MUTE", "Sourdine temporaire", 24); setRoleChangeTarget(null) }} className="w-full text-left px-3 py-1.5 font-body text-xs text-orange-600 hover:bg-orange-50 transition-colors flex items-center gap-1.5"><VolumeX size={11} />Muter 24h</button>
                        <button onClick={() => { handleKickMember(m.userId); setRoleChangeTarget(null) }} className="w-full text-left px-3 py-1.5 font-body text-xs text-danger hover:bg-red-50 transition-colors flex items-center gap-1.5"><UserX size={11} />Expulser</button>
                        <button onClick={() => { handleSanction(m.userId, "BAN", "Banni du groupe"); setRoleChangeTarget(null) }} className="w-full text-left px-3 py-1.5 font-body text-xs text-danger hover:bg-red-50 transition-colors flex items-center gap-1.5"><Ban size={11} />Bannir</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==== TAB: DEMANDES ==== */}
      {tab === "demandes" && isAdminOrMod && (
        <div className="space-y-3">
          {demandes.length === 0 ? (
            <p className="text-center font-body text-[12px] text-text-muted-brand py-8">Aucune demande en attente</p>
          ) : demandes.map((d) => (
            <div key={d.id} className="bg-white border border-border-brand p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Avatar user={d.user} size={36} />
                <div className="flex-1">
                  <span className="font-body text-[13px] font-medium text-text-main">{d.user.prenom} {d.user.nom}</span>
                  {d.user.pseudo && <p className="font-body text-xs text-text-muted-brand">@{d.user.pseudo}</p>}
                </div>
                <span className="font-body text-xs text-text-muted-brand">{timeAgo(d.createdAt)}</span>
              </div>
              {d.reponses.length > 0 && (
                <div className="bg-bg-page border border-border-brand p-3 space-y-2">
                  {d.reponses.map((r, i) => (
                    <div key={i}>
                      <p className="font-body text-xs font-medium text-text-main flex items-center gap-1"><HelpCircle size={11} className="text-gold shrink-0" />{r.question.texte}</p>
                      <p className="font-body text-[12px] text-text-mid ml-4 mt-0.5">{r.reponse}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <button onClick={() => handleDemandeAction(d.id, "refuser")} className="flex items-center gap-1 px-3 py-1.5 font-body text-xs border border-danger text-danger hover:bg-danger hover:text-white transition-colors uppercase tracking-[0.08em]"><X size={12} />Refuser</button>
                <button onClick={() => handleDemandeAction(d.id, "approuver")} className="flex items-center gap-1 px-3 py-1.5 font-body text-xs bg-primary-brand text-white hover:bg-primary-dark transition-colors uppercase tracking-[0.08em]"><Check size={12} />Accepter</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==== TAB: BANNIS ==== */}
      {tab === "bannis" && isAdminOrMod && (
        <div className="space-y-2">
          {bannedMembres.length === 0 ? (
            <p className="text-center font-body text-[12px] text-text-muted-brand py-8">Aucun membre banni</p>
          ) : bannedMembres.map((m) => (
            <div key={m.id} className="flex items-center gap-3 bg-white border border-danger/30 p-3">
              <Avatar user={m.user} size={36} />
              <div className="flex-1 min-w-0">
                <span className="font-body text-[12px] font-medium text-text-main">{m.user.prenom} {m.user.nom}</span>
                {m.user.pseudo && <span className="text-text-muted-brand font-normal ml-1 text-xs">@{m.user.pseudo}</span>}
                <span className="ml-2 font-body text-[9px] px-1.5 py-0.5 bg-red-50 text-danger border border-danger/30">Banni</span>
              </div>
              <button onClick={() => handleUnban(m.userId)} className="px-3 py-1.5 border border-primary-brand text-primary-brand font-body text-xs hover:bg-primary-brand hover:text-white transition-colors uppercase tracking-widest">
                D&eacute;bannir
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ==== TAB: REGLES ==== */}
      {tab === "regles" && isMember && (
        <div className="space-y-3">
          {reglesGroupe.length === 0 && !isAdmin ? (
            <p className="text-center font-body text-[12px] text-text-muted-brand py-8">Aucune r&egrave;gle d&eacute;finie pour ce groupe</p>
          ) : (
            reglesGroupe.map((r, i) => (
              <div key={r.id} className="bg-white border border-border-brand p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-body text-xs font-medium text-gold mr-2">{i + 1}.</span>
                    <span className="font-body text-[13px] font-medium text-text-main">{r.titre}</span>
                  </div>
                  {isAdmin && (
                    <button onClick={() => handleDeleteRegle(r.id)} className="p-1 text-text-muted-brand hover:text-danger transition-colors"><Trash2 size={13} /></button>
                  )}
                </div>
                <p className="font-body text-[12px] text-text-mid mt-1 whitespace-pre-wrap">{r.contenu}</p>
              </div>
            ))
          )}
          {isAdmin && <RegleForm onAdd={handleAddRegle} />}
        </div>
      )}

      {/* ==== TAB: JOURNAL ==== */}
      {tab === "journal" && isAdminOrMod && (
        <div className="space-y-2">
          {journalEntries.length === 0 ? (
            <p className="text-center font-body text-[12px] text-text-muted-brand py-8">Aucune action de mod&eacute;ration enregistr&eacute;e</p>
          ) : journalEntries.map((entry) => (
            <div key={entry.id} className="bg-white border border-border-brand p-3 flex items-start gap-3">
              <Shield size={14} className="text-primary-brand shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-body text-xs font-medium text-text-main">{entry.moderateur?.prenom} {entry.moderateur?.nom}</span>
                  <span className="font-body text-xs px-1.5 py-0.5 bg-bg-page border border-border-brand text-primary-brand uppercase tracking-wider">{entry.action}</span>
                  {entry.cibleUser && <span className="font-body text-xs text-text-muted-brand">&rarr; {entry.cibleUser.prenom} {entry.cibleUser.nom}</span>}
                </div>
                {entry.details && <p className="font-body text-xs text-text-mid mt-0.5">{entry.details}</p>}
                <span className="font-body text-[9px] text-text-muted-brand">{timeAgo(entry.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==== TAB: STATS ==== */}
      {tab === "stats" && isAdminOrMod && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Membres", value: stats.general.totalMembres, icon: Users },
              { label: "Actifs (7j)", value: stats.general.membresActifs7j, icon: TrendingUp },
              { label: "Nouveaux (7j)", value: stats.general.nouveauxMembres7j, icon: UserPlus },
              { label: "Publications", value: stats.general.totalPosts, icon: FileText },
              { label: "Posts (7j)", value: stats.general.postsThisWeek, icon: BarChart3 },
              { label: "Commentaires", value: stats.general.totalCommentaires, icon: MessageCircle },
              { label: "R\u00e9actions", value: stats.general.totalReactions, icon: BarChart3 },
              { label: "\u00c9v\u00e9nements", value: stats.general.totalEvenements, icon: CalendarDays },
              { label: "Sondages", value: stats.general.totalSondages, icon: BarChart3 },
              { label: "Engagement", value: stats.general.tauxEngagement ?? 0, icon: TrendingUp },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-border-brand p-3">
                <div className="flex items-center gap-1.5 mb-1"><s.icon size={12} className="text-text-muted-brand" /><span className="font-body text-xs uppercase tracking-wider text-text-muted-brand">{s.label}</span></div>
                <p className="font-display text-[22px] font-light text-text-main">{s.value}</p>
              </div>
            ))}
          </div>

          {stats.topContributeurs.length > 0 && (
            <div className="bg-white border border-border-brand p-4">
              <h3 className="font-body text-xs font-medium uppercase tracking-wider text-text-muted-brand mb-3">Top contributeurs (30j)</h3>
              <div className="space-y-2">
                {stats.topContributeurs.map((c, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="font-body text-[12px] text-text-main">{i + 1}. {c.prenom} {c.nom}</span>
                    <span className="font-body text-xs font-medium text-primary-brand">{c.postsCount} posts</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.croissance.length > 0 && (
            <div className="bg-white border border-border-brand p-4">
              <h3 className="font-body text-xs font-medium uppercase tracking-wider text-text-muted-brand mb-3">Croissance (4 semaines)</h3>
              <div className="flex items-end gap-2 h-24">
                {stats.croissance.map((w, i) => {
                  const max = Math.max(...stats.croissance.map(c => c.nouveauxMembres), 1)
                  const h = Math.max((w.nouveauxMembres / max) * 100, 5)
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="font-body text-xs text-text-muted-brand">{w.nouveauxMembres}</span>
                      <div className="w-full bg-primary-brand/20 rounded-sm" style={{ height: `${h}%` }}><div className="w-full h-full bg-primary-brand rounded-sm" /></div>
                      <span className="font-body text-[9px] text-text-muted-brand">{w.semaine}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {stats.heuresPic && stats.heuresPic.length > 0 && (
            <div className="bg-white border border-border-brand p-4">
              <h3 className="font-body text-xs font-medium uppercase tracking-wider text-text-muted-brand mb-3 flex items-center gap-1"><Clock size={12} />Heures de forte activit&eacute;</h3>
              <div className="space-y-2">
                {stats.heuresPic.map((h, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="font-body text-[12px] text-text-main">{h.heure}</span>
                    <span className="font-body text-xs font-medium text-primary-brand">{h.posts} publications</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==== TAB: PARAMETRES ==== */}
      {tab === "parametres" && isAdmin && groupe && (
        <ParametresTab slug={slug} groupe={groupe} onUpdated={fetchGroupe} />
      )}

      {/* ==== TAB: INFOS ==== */}
      {tab === "infos" && (
        <div className="bg-white border border-border-brand p-5 space-y-4">
          <div>
            <h3 className="font-body text-xs font-medium uppercase tracking-wider text-text-muted-brand mb-1">Visibilit&#233;</h3>
            <p className="font-body text-[13px] text-text-main flex items-center gap-1.5">
              {groupe.visibilite === "SECRET" ? <><EyeOff size={13} className="text-text-muted-brand" />Groupe secret</> : groupe.visibilite === "PRIVE" ? <><Lock size={13} className="text-gold" />Groupe priv&#233;</> : <><Globe size={13} className="text-primary-brand" />Groupe public</>}
            </p>
          </div>
          {groupe.categorie && groupe.categorie !== "AUTRE" && (
            <div>
              <h3 className="font-body text-xs font-medium uppercase tracking-wider text-text-muted-brand mb-1">Cat&#233;gorie</h3>
              <p className="font-body text-[13px] text-text-main">{CATEGORIE_LABELS[groupe.categorie] || groupe.categorie}</p>
            </div>
          )}
          {groupe.regles && (
            <div>
              <h3 className="font-body text-xs font-medium uppercase tracking-wider text-text-muted-brand mb-1">R&#232;gles du groupe</h3>
              <p className="font-body text-[12px] text-text-mid whitespace-pre-wrap">{groupe.regles}</p>
            </div>
          )}
          <div>
            <h3 className="font-body text-xs font-medium uppercase tracking-wider text-text-muted-brand mb-1">Cr&#233;&#233; le</h3>
            <p className="font-body text-[12px] text-text-mid">{new Date(groupe.createdAt).toLocaleDateString("fr", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
          {groupe.questions && groupe.questions.length > 0 && (
            <div>
              <h3 className="font-body text-xs font-medium uppercase tracking-wider text-text-muted-brand mb-1">Questions d&apos;adh&#233;sion</h3>
              <ul className="space-y-1">
                {groupe.questions.map((q) => (
                  <li key={q.id} className="font-body text-[12px] text-text-mid flex items-start gap-1.5"><HelpCircle size={11} className="text-gold shrink-0 mt-0.5" />{q.texte}</li>
                ))}
              </ul>
            </div>
          )}
          {groupe.tags && groupe.tags.length > 0 && (
            <div>
              <h3 className="font-body text-xs font-medium uppercase tracking-wider text-text-muted-brand mb-1">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {groupe.tags.map((tag, i) => (
                  <span key={i} className="font-body text-xs px-2 py-0.5 bg-primary-light border border-primary-brand/20 text-primary-brand">{tag}</span>
                ))}
              </div>
            </div>
          )}
          {isMember && (
            <div>
              <h3 className="font-body text-xs font-medium uppercase tracking-wider text-text-muted-brand mb-2">Notifications du groupe</h3>
              <select value={notifPref} onChange={(e) => handleUpdateNotifPref(e.target.value)}
                className="border border-border-brand bg-bg-page px-3 py-2 font-body text-[12px] text-text-main focus:border-gold focus:outline-none">
                <option value="TOUTES">Toutes les notifications</option>
                <option value="ANNONCES_SEULEMENT">Annonces uniquement</option>
                <option value="AMIS_SEULEMENT">Amis uniquement</option>
                <option value="AUCUNE">Aucune</option>
              </select>
            </div>
          )}
          {groupe.slowModeMinutes !== undefined && groupe.slowModeMinutes > 0 && (
            <div className="flex items-center gap-1.5">
              <Clock size={12} className="text-gold" />
              <span className="font-body text-xs text-text-mid">Mode lent actif : {groupe.slowModeMinutes} min entre chaque publication</span>
            </div>
          )}
        </div>
      )}

      {/* ==== MODAL ADHESION ==== */}
      {showQuestionsModal && groupe.questions && groupe.questions.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-5 border-b border-border-brand">
              <h2 className="font-display text-[18px] font-light text-text-main">Rejoindre &laquo; {groupe.nom} &raquo;</h2>
              <p className="font-body text-[12px] text-text-mid mt-1">R&#233;pondez aux questions ci-dessous pour soumettre votre demande.</p>
            </div>
            <form onSubmit={handleSubmitAdhesion} className="p-5 space-y-4">
              {groupe.questions.map((q) => (
                <div key={q.id}>
                  <label className="font-body text-[12px] font-medium text-text-main flex items-start gap-1.5 mb-1"><HelpCircle size={12} className="text-gold shrink-0 mt-0.5" />{q.texte}</label>
                  <textarea value={questionsReponses[q.id] || ""} onChange={(e) => setQuestionsReponses((p) => ({ ...p, [q.id]: e.target.value }))} className="w-full border border-border-brand p-2.5 font-body text-[13px] text-text-main placeholder:text-text-muted-brand focus:outline-none focus:border-primary-brand resize-none" rows={2} required />
                </div>
              ))}
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowQuestionsModal(false)} className="px-4 py-2 font-body text-xs text-text-muted-brand border border-border-brand hover:bg-bg-page transition-colors uppercase tracking-widest">Annuler</button>
                <button type="submit" disabled={submittingAdhesion} className="px-4 py-2 font-body text-xs text-white bg-primary-brand hover:bg-primary-dark disabled:opacity-50 transition-colors uppercase tracking-widest flex items-center gap-1.5">
                  {submittingAdhesion ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}Envoyer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

/* ================================================================
   Composant Parametres (admin uniquement)
   ================================================================ */

function ParametresTab({ slug, groupe, onUpdated }: { slug: string; groupe: GroupeDetail; onUpdated: () => void }) {
  const [nom, setNom] = useState(groupe.nom)
  const [description, setDescription] = useState(groupe.description || "")
  const [visibilite, setVisibilite] = useState(groupe.visibilite)
  const [regles, setRegles] = useState(groupe.regles || "")
  const [categorie, setCategorie] = useState(groupe.categorie || "AUTRE")
  const [approvalReq, setApprovalReq] = useState(groupe.approvalRequired || false)
  const [quiPeutPublier, setQuiPeutPublier] = useState(groupe.quiPeutPublier || "TOUS")
  const [quiPeutCommenter, setQuiPeutCommenter] = useState(groupe.quiPeutCommenter || "TOUS")
  const [reactionsActivees, setReactionsActivees] = useState(groupe.reactionsActivees ?? true)
  const [invitationsParMembres, setInvitationsParMembres] = useState(groupe.invitationsParMembres ?? true)
  const [suggestionsActivees, setSuggestionsActivees] = useState(groupe.suggestionsActivees ?? true)
  const [partagesExternes, setPartagesExternes] = useState(groupe.partagesExternes ?? true)
  const [slowModeMinutes, setSlowModeMinutes] = useState(groupe.slowModeMinutes || 0)
  const [badgesActifs, setBadgesActifs] = useState(groupe.badgesActifs ?? true)
  const [tags, setTags] = useState<string[]>(groupe.tags || [])
  const [newTag, setNewTag] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [motsBloques, setMotsBloques] = useState<{ id: string; mot: string; action: string }[]>([])
  const [newMot, setNewMot] = useState("")
  const [loadingMots, setLoadingMots] = useState(true)

  useEffect(() => {
    async function fetchMod() {
      const res = await fetch(`/api/communaute/groupes/${slug}/moderation`)
      if (res.ok) {
        const d = await res.json()
        setMotsBloques(d.motsBloques || [])
        setApprovalReq(d.approvalRequired ?? false)
      }
      setLoadingMots(false)
    }
    fetchMod()
  }, [slug])

  async function handleSave() {
    setSaving(true)
    await fetch(`/api/communaute/groupes/${slug}/parametres`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nom, description: description || undefined, visibilite,
        regles: regles || undefined, categorie, approvalRequired: approvalReq,
        quiPeutPublier, quiPeutCommenter, reactionsActivees,
        invitationsParMembres, suggestionsActivees, partagesExternes,
        slowModeMinutes, badgesActifs, tags,
      }),
    })
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
    onUpdated()
  }

  async function handleAddMot() {
    if (!newMot.trim()) return
    const res = await fetch(`/api/communaute/groupes/${slug}/moderation`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mot: newMot.trim() }),
    })
    if (res.ok) { const m = await res.json(); setMotsBloques(p => [m, ...p]); setNewMot("") }
  }

  async function handleDeleteMot(motId: string) {
    await fetch(`/api/communaute/groupes/${slug}/moderation`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ motId }),
    })
    setMotsBloques(p => p.filter(m => m.id !== motId))
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-border-brand p-4 space-y-3">
        <h3 className="font-body text-xs font-medium uppercase tracking-wider text-text-muted-brand flex items-center gap-1"><Settings size={12} />Param&#232;tres g&#233;n&#233;raux</h3>
        <div>
          <label className="font-body text-xs uppercase tracking-wider text-text-muted-brand mb-1 block">Nom</label>
          <input value={nom} onChange={(e) => setNom(e.target.value)} maxLength={100} className="w-full border border-border-brand bg-bg-page px-3 py-2 font-body text-[13px] text-text-main focus:border-gold focus:outline-none" />
        </div>
        <div>
          <label className="font-body text-xs uppercase tracking-wider text-text-muted-brand mb-1 block">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={1000} className="w-full resize-none border border-border-brand bg-bg-page px-3 py-2 font-body text-[12px] text-text-main focus:border-gold focus:outline-none" />
        </div>
        <div>
          <label className="font-body text-xs uppercase tracking-wider text-text-muted-brand mb-1 block">R&#232;gles</label>
          <textarea value={regles} onChange={(e) => setRegles(e.target.value)} rows={3} maxLength={2000} className="w-full resize-none border border-border-brand bg-bg-page px-3 py-2 font-body text-[12px] text-text-main focus:border-gold focus:outline-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-body text-xs uppercase tracking-wider text-text-muted-brand mb-1 block">Visibilit&#233;</label>
            <select value={visibilite} onChange={(e) => setVisibilite(e.target.value)} className="w-full border border-border-brand bg-bg-page px-3 py-2 font-body text-[12px] text-text-main">
              <option value="PUBLIC">Public</option><option value="PRIVE">Priv&#233;</option><option value="SECRET">Secret</option>
            </select>
          </div>
          <div>
            <label className="font-body text-xs uppercase tracking-wider text-text-muted-brand mb-1 block">Cat&#233;gorie</label>
            <select value={categorie} onChange={(e) => setCategorie(e.target.value)} className="w-full border border-border-brand bg-bg-page px-3 py-2 font-body text-[12px] text-text-main">
              {Object.entries(CATEGORIE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 font-body text-xs text-text-mid">
          <input type="checkbox" checked={approvalReq} onChange={(e) => setApprovalReq(e.target.checked)} className="accent-primary-brand" />
          Mod&#233;ration des publications (approbation avant publication)
        </label>

        {/* Permissions */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-body text-xs uppercase tracking-wider text-text-muted-brand mb-1 block">Qui peut publier</label>
            <select value={quiPeutPublier} onChange={(e) => setQuiPeutPublier(e.target.value)} className="w-full border border-border-brand bg-bg-page px-3 py-2 font-body text-[12px] text-text-main">
              <option value="TOUS">Tous les membres</option>
              <option value="ADMINS_SEULEMENT">Admins uniquement</option>
            </select>
          </div>
          <div>
            <label className="font-body text-xs uppercase tracking-wider text-text-muted-brand mb-1 block">Qui peut commenter</label>
            <select value={quiPeutCommenter} onChange={(e) => setQuiPeutCommenter(e.target.value)} className="w-full border border-border-brand bg-bg-page px-3 py-2 font-body text-[12px] text-text-main">
              <option value="TOUS">Tous les membres</option>
              <option value="MEMBRES_SEULEMENT">Membres uniquement</option>
            </select>
          </div>
        </div>

        {/* Mode lent */}
        <div>
          <label className="font-body text-xs uppercase tracking-wider text-text-muted-brand mb-1 block">Mode lent (minutes entre publications)</label>
          <select value={slowModeMinutes} onChange={(e) => setSlowModeMinutes(Number(e.target.value))} className="w-full border border-border-brand bg-bg-page px-3 py-2 font-body text-[12px] text-text-main">
            <option value={0}>D&#233;sactiv&#233;</option>
            <option value={1}>1 minute</option>
            <option value={5}>5 minutes</option>
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>1 heure</option>
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="font-body text-xs uppercase tracking-wider text-text-muted-brand mb-1 block">Tags (max 10)</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map((tag, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-light border border-primary-brand/20 font-body text-xs text-primary-brand">
                {tag}
                <button type="button" onClick={() => setTags(tags.filter((_, j) => j !== i))} className="hover:text-danger"><X size={9} /></button>
              </span>
            ))}
          </div>
          {tags.length < 10 && (
            <div className="flex gap-2">
              <input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Ajouter un tag..." maxLength={50} className="flex-1 border border-border-brand bg-bg-page px-3 py-1.5 font-body text-[12px] text-text-main focus:border-gold focus:outline-none"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (newTag.trim() && !tags.includes(newTag.trim())) { setTags([...tags, newTag.trim()]); setNewTag("") } } }} />
              <button type="button" onClick={() => { if (newTag.trim() && !tags.includes(newTag.trim())) { setTags([...tags, newTag.trim()]); setNewTag("") } }} disabled={!newTag.trim()} className="px-3 py-1.5 bg-primary-brand text-white font-body text-xs hover:bg-primary-dark disabled:opacity-50 transition-colors"><Plus size={12} /></button>
            </div>
          )}
        </div>

        {/* Toggles */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 font-body text-xs text-text-mid">
            <input type="checkbox" checked={reactionsActivees} onChange={(e) => setReactionsActivees(e.target.checked)} className="accent-primary-brand" />
            Activer les r&#233;actions
          </label>
          <label className="flex items-center gap-2 font-body text-xs text-text-mid">
            <input type="checkbox" checked={invitationsParMembres} onChange={(e) => setInvitationsParMembres(e.target.checked)} className="accent-primary-brand" />
            Autoriser les membres &#224; inviter
          </label>
          <label className="flex items-center gap-2 font-body text-xs text-text-mid">
            <input type="checkbox" checked={suggestionsActivees} onChange={(e) => setSuggestionsActivees(e.target.checked)} className="accent-primary-brand" />
            Afficher dans les suggestions
          </label>
          <label className="flex items-center gap-2 font-body text-xs text-text-mid">
            <input type="checkbox" checked={partagesExternes} onChange={(e) => setPartagesExternes(e.target.checked)} className="accent-primary-brand" />
            Autoriser les partages externes
          </label>
          <label className="flex items-center gap-2 font-body text-xs text-text-mid">
            <input type="checkbox" checked={badgesActifs} onChange={(e) => setBadgesActifs(e.target.checked)} className="accent-primary-brand" />
            Activer les badges
          </label>
        </div>

        <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 bg-primary-brand px-4 py-2 font-body text-xs font-medium uppercase tracking-[0.12em] text-white hover:bg-primary-dark disabled:opacity-50 transition-colors">
          {saving ? <Loader2 size={12} className="animate-spin" /> : saved ? <><Check size={12} />Enregistr&#233;</> : <><Settings size={12} />Enregistrer</>}
        </button>
      </div>

      <div className="bg-white border border-border-brand p-4 space-y-3">
        <h3 className="font-body text-xs font-medium uppercase tracking-wider text-text-muted-brand flex items-center gap-1"><Ban size={12} />Mots bloqu&#233;s</h3>
        <p className="font-body text-xs text-text-muted-brand">Les publications contenant ces mots seront automatiquement filtr&#233;es.</p>
        <div className="flex gap-2">
          <input value={newMot} onChange={(e) => setNewMot(e.target.value)} placeholder="Ajouter un mot..." maxLength={100} className="flex-1 border border-border-brand bg-bg-page px-3 py-1.5 font-body text-[12px] text-text-main focus:border-gold focus:outline-none" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddMot() } }} />
          <button onClick={handleAddMot} disabled={!newMot.trim()} className="px-3 py-1.5 bg-primary-brand text-white font-body text-xs uppercase tracking-widest hover:bg-primary-dark disabled:opacity-50 transition-colors"><Plus size={12} /></button>
        </div>
        {loadingMots ? <Loader2 size={14} className="animate-spin text-gold mx-auto" /> : (
          <div className="flex flex-wrap gap-2">
            {motsBloques.map((m) => (
              <span key={m.id} className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 border border-danger/30 font-body text-xs text-danger">
                {m.mot}
                <button onClick={() => handleDeleteMot(m.id)} className="hover:text-red-700"><X size={10} /></button>
              </span>
            ))}
            {motsBloques.length === 0 && <p className="font-body text-xs text-text-muted-brand">Aucun mot bloqu&#233;</p>}
          </div>
        )}
      </div>

      <div className="bg-white border border-danger/30 p-4 space-y-3">
        <h3 className="font-body text-xs font-medium uppercase tracking-wider text-danger flex items-center gap-1"><AlertTriangle size={12} />Zone dangereuse</h3>
        <div className="flex flex-wrap gap-2">
          <button onClick={async () => {
            if (confirm("Archiver ce groupe ? Les membres ne pourront plus publier.")) {
              await fetch(`/api/communaute/groupes/${slug}/parametres`, {
                method: "PATCH", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ archivee: true }),
              })
              onUpdated()
            }
          }} className="px-4 py-2 border border-yellow-500 text-yellow-600 font-body text-xs uppercase tracking-widest hover:bg-yellow-50 transition-colors flex items-center gap-1.5">
            <Archive size={12} />Archiver le groupe
          </button>
          <button onClick={async () => { if (confirm("Supprimer d\u00e9finitivement ce groupe ?")) { await fetch(`/api/communaute/groupes/${slug}`, { method: "DELETE" }); window.location.href = "/communaute/groupes" } }} className="px-4 py-2 border border-danger text-danger font-body text-xs uppercase tracking-widest hover:bg-danger hover:text-white transition-colors flex items-center gap-1.5">
            <Trash2 size={12} />Supprimer le groupe
          </button>
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   Composant RegleForm (ajout de règle dans l'onglet Règles)
   ================================================================ */

function RegleForm({ onAdd }: { onAdd: (titre: string, contenu: string) => void }) {
  const [show, setShow] = useState(false)
  const [titre, setTitre] = useState("")
  const [contenu, setContenu] = useState("")

  if (!show) {
    return (
      <button onClick={() => setShow(true)} className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-primary-brand/50 text-primary-brand font-body text-xs uppercase tracking-widest hover:bg-primary-light transition-colors">
        <Plus size={13} />Ajouter une r&egrave;gle
      </button>
    )
  }

  return (
    <div className="bg-white border border-border-brand p-4 space-y-3">
      <h4 className="font-body text-xs font-medium uppercase tracking-wider text-text-muted-brand">Nouvelle r&egrave;gle</h4>
      <input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Titre de la r&egrave;gle" maxLength={200}
        className="w-full border border-border-brand bg-bg-page px-3 py-2 font-body text-[13px] text-text-main focus:border-gold focus:outline-none" />
      <textarea value={contenu} onChange={(e) => setContenu(e.target.value)} placeholder="Description de la r&egrave;gle..." rows={3} maxLength={2000}
        className="w-full resize-none border border-border-brand bg-bg-page px-3 py-2 font-body text-[12px] text-text-main focus:border-gold focus:outline-none" />
      <div className="flex gap-2 justify-end">
        <button onClick={() => { setShow(false); setTitre(""); setContenu("") }} className="px-3 py-1.5 font-body text-xs text-text-muted-brand border border-border-brand hover:bg-bg-page transition-colors">Annuler</button>
        <button onClick={() => { onAdd(titre, contenu); setTitre(""); setContenu(""); setShow(false) }} disabled={!titre.trim() || !contenu.trim()}
          className="px-3 py-1.5 font-body text-xs text-white bg-primary-brand hover:bg-primary-dark uppercase tracking-widest disabled:opacity-50 transition-colors flex items-center gap-1.5">
          <Plus size={12} />Ajouter
        </button>
      </div>
    </div>
  )
}
