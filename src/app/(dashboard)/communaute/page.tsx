"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, MessageCircle, ChevronDown, Shield, X } from "lucide-react"
import { initPusherClient, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher"
import StoriesBandeau from "@/components/stories/StoriesBandeau"
import { NouveauPost } from "@/components/communaute/NouveauPost"
import { CartePost } from "@/components/communaute/CartePost"
import type { PostData, CommentaireData, ReactionType, Auteur } from "@/components/communaute/types"

export default function PageCommunaute() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [posts, setPosts] = useState<PostData[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)

  const currentUserId = session?.user?.id ?? ""

  useEffect(() => {
    if (status === "unauthenticated") router.push("/connexion?callbackUrl=/communaute")
  }, [status, router])

  // Rafraîchir le JWT après retour Jeko (abonnement confirmé)
  useEffect(() => {
    if (searchParams.get("abonnement") === "ok") {
      update({ refreshCommuaute: true }).catch(() => null)
      // Retirer le paramètre de l'URL sans rechargement
      const url = new URL(window.location.href)
      url.searchParams.delete("abonnement")
      window.history.replaceState({}, "", url.toString())
    }
  }, [searchParams, update])

  const fetchPosts = useCallback(async (pageNum: number, append = false) => {
    if (append) setLoadingMore(true)
    else setLoading(true)
    try {
      const res = await fetch(`/api/communaute/posts?page=${pageNum}&limit=10`)
      if (res.ok) {
        const data = await res.json()
        setPosts((prev) => (append ? [...prev, ...data.posts] : data.posts))
        setTotalPages(data.pages)
        setPage(data.page)
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    if (status === "authenticated") fetchPosts(1)
  }, [status, fetchPosts])

  // Pusher — temps réel
  useEffect(() => {
    if (status !== "authenticated") return
    let channelRef: ReturnType<Awaited<ReturnType<typeof initPusherClient>>["subscribe"]> | null = null

    initPusherClient().then((pusher) => {
      channelRef = pusher.subscribe(PUSHER_CHANNELS.communaute)

      channelRef.bind(PUSHER_EVENTS.NOUVEAU_POST, (data: { post: PostData; auteurId: string }) => {
        if (data.auteurId !== currentUserId) {
          setPosts((prev) => {
            if (prev.some((p) => p.id === data.post.id)) return prev
            return [data.post, ...prev]
          })
        }
      })

      channelRef.bind(PUSHER_EVENTS.NOUVEAU_COMMENTAIRE, (data: { postId: string; commentaire: CommentaireData }) => {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === data.postId
              ? { ...p, commentairesCount: p.commentairesCount + 1 }
              : p
          )
        )
      })

      channelRef.bind(PUSHER_EVENTS.POST_SUPPRIME, (data: { postId: string }) => {
        setPosts((prev) => prev.filter((p) => p.id !== data.postId))
      })
    }).catch(() => {
      // Pusher optionnel — pas d'erreur bloquante si non configuré
    })

    return () => {
      if (channelRef) {
        channelRef.unbind_all()
        initPusherClient().then((p) => p.unsubscribe(PUSHER_CHANNELS.communaute))
      }
    }
  }, [status, currentUserId])

  function handleNewPost(post: PostData) {
    setPosts((prev) => [post, ...prev])
  }

  function handleDelete(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id))
  }

  async function handleReaction(postId: string, type: ReactionType) {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p
        const wasReacted = p.userReaction === type
        const newCounts = { ...(p.reactionCounts ?? {}) }
        if (p.userReaction && newCounts[p.userReaction]) {
          newCounts[p.userReaction]--
          if (newCounts[p.userReaction] <= 0) delete newCounts[p.userReaction]
        }
        if (!wasReacted) newCounts[type] = (newCounts[type] || 0) + 1
        return {
          ...p,
          userReaction: wasReacted ? null : type,
          reactionCounts: newCounts,
          reactionsCount: p.reactionsCount + (wasReacted ? -1 : p.userReaction ? 0 : 1),
        }
      })
    )
    await fetch(`/api/communaute/posts/${postId}/reaction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    })
  }

  async function handleToggleSave(postId: string) {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, saved: !p.saved } : p)))
    await fetch(`/api/communaute/posts/${postId}/sauvegarder`, { method: "POST" })
  }

  function handleNewComment(postId: string, comment: CommentaireData) {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, commentaires: [...p.commentaires, comment], commentairesCount: p.commentairesCount + 1 }
          : p
      )
    )
  }

  // Repost
  const [repostData, setRepostData] = useState<PostData | null>(null)
  const composerRef = useRef<HTMLDivElement>(null)
  const [charteVue, setCharteVue] = useState(true)
  const [filtreFeed, setFiltreFeed] = useState<"pourVous" | "recents">("pourVous")

  useEffect(() => {
    const vue = localStorage.getItem("communaute_charte_vue")
    if (!vue) setCharteVue(false)
  }, [])

  function fermerCharte() {
    localStorage.setItem("communaute_charte_vue", "1")
    setCharteVue(true)
  }

  function handleShare(post: PostData) {
    setRepostData(post)
    setTimeout(() => composerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50)
  }

  // Épingler / Désépingler
  async function handleTogglePin(postId: string) {
    const target = posts.find((p) => p.id === postId)
    if (!target) return
    const newVal = !target.epingle
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, epingle: newVal } : p)))
    await fetch(`/api/communaute/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ epingle: newVal }),
    })
  }

  if (status === "loading" || loading) {
    return (
      <section className="mx-auto max-w-2xl space-y-5">
        {/* Skeleton nouveau post */}
        <div className="bg-white border border-border-brand p-5 animate-pulse">
          <div className="flex gap-3">
            <div className="w-9.5 h-9.5 rounded-full bg-border-brand" />
            <div className="flex-1 space-y-2">
              <div className="h-16 bg-bg-page border border-border-brand" />
              <div className="flex justify-between">
                <div className="flex gap-2">
                  <div className="w-7 h-7 bg-border-brand" />
                  <div className="w-7 h-7 bg-border-brand" />
                  <div className="w-7 h-7 bg-border-brand" />
                </div>
                <div className="w-20 h-8 bg-border-brand" />
              </div>
            </div>
          </div>
        </div>
        {/* Skeleton posts */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-border-brand overflow-hidden animate-pulse">
            <div className="flex items-center gap-3 px-5 pt-5 pb-3">
              <div className="w-10 h-10 rounded-full bg-border-brand" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-32 bg-border-brand" />
                <div className="h-2.5 w-16 bg-bg-page" />
              </div>
            </div>
            <div className="px-5 pb-3 space-y-2">
              <div className="h-3 w-full bg-bg-page" />
              <div className="h-3 w-4/5 bg-bg-page" />
              <div className="h-3 w-3/5 bg-bg-page" />
            </div>
            <div className="h-48 bg-bg-page border-t border-border-brand" />
            <div className="flex border-t border-border-brand">
              <div className="flex-1 py-3 flex justify-center"><div className="h-4 w-16 bg-border-brand" /></div>
              <div className="flex-1 py-3 flex justify-center border-l border-border-brand"><div className="h-4 w-20 bg-border-brand" /></div>
              <div className="px-4 py-3 border-l border-border-brand"><div className="h-4 w-4 bg-border-brand" /></div>
            </div>
          </div>
        ))}
      </section>
    )
  }

  const currentUser: Auteur = {
    id: session!.user.id,
    nom: session!.user.nom ?? "",
    prenom: session!.user.prenom ?? "",
    photoUrl: session!.user.photoUrl ?? null,
  }

  return (
    <section className="mx-auto max-w-2xl space-y-5">
      {/* Charte communauté — affichée une seule fois */}
      {!charteVue && (
        <div className="flex items-start gap-3 border border-gold/30 bg-primary-light p-4">
          <Shield size={18} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-body text-xs font-medium uppercase tracking-[0.12em] text-text-main mb-2">
              Bienvenue dans notre communauté
            </p>
            <div className="space-y-1">
              <p className="font-body text-[12px] text-text-mid">🌿 <strong>Bienveillance</strong> — Nous écoutons sans jugement.</p>
              <p className="font-body text-[12px] text-text-mid">🔒 <strong>Confidentialité</strong> — Ce que vous partagez ici reste entre nous.</p>
              <p className="font-body text-[12px] text-text-mid">🚫 <strong>Pas de publicité</strong> — Les contenus commerciaux non autorisés sont supprimés.</p>
            </div>
          </div>
          <button
            onClick={fermerCharte}
            className="shrink-0 text-text-muted-brand transition-colors hover:text-text-main"
            aria-label="Fermer la charte"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Badge modération */}
      <div className="flex items-center justify-end">
        <span className="flex items-center gap-1.5 border border-gold/30 bg-white px-2.5 py-1 font-body text-[10px] uppercase tracking-widest text-gold">
          <Shield size={10} aria-hidden="true" />
          Modéré par l&apos;équipe
        </span>
      </div>

      <StoriesBandeau currentUserId={currentUser.id} />

      {/* ── Onglets filtre feed ── */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFiltreFeed("pourVous")}
          className={`rounded-full px-4 py-1.5 font-body text-[12px] font-semibold transition-all duration-200 ${filtreFeed === "pourVous" ? "bg-primary-brand text-white shadow-sm" : "bg-white ring-1 ring-border-brand text-text-muted-brand hover:text-text-main"}`}
        >
          Pour vous
        </button>
        <button
          onClick={() => setFiltreFeed("recents")}
          className={`rounded-full px-4 py-1.5 font-body text-[12px] font-semibold transition-all duration-200 ${filtreFeed === "recents" ? "bg-primary-brand text-white shadow-sm" : "bg-white ring-1 ring-border-brand text-text-muted-brand hover:text-text-main"}`}
        >
          Récents
        </button>
      </div>
      <div ref={composerRef}>
        <NouveauPost user={currentUser} onPost={handleNewPost} repostData={repostData} onCancelRepost={() => setRepostData(null)} />
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center bg-primary-light mb-4 rounded-full">
            <MessageCircle size={28} className="text-primary-brand" />
          </div>
          <p className="font-display text-[18px] font-light text-text-main">Aucune publication pour l&apos;instant</p>
          <p className="font-body text-[12px] text-text-muted-brand mt-1">Soyez le premier à publier !</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(filtreFeed === "recents"
            ? [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            : posts
          ).map((post) => (
            <CartePost
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              currentUser={currentUser}
              onDelete={handleDelete}
              onReaction={handleReaction}
              onToggleSave={handleToggleSave}
              onNewComment={handleNewComment}
              onShare={handleShare}
              onTogglePin={handleTogglePin}
            />
          ))}
          {page < totalPages && (
            <div className="flex justify-center pt-2 pb-4">
              <button
                onClick={() => fetchPosts(page + 1, true)}
                disabled={loadingMore}
                className="flex items-center gap-2 border border-border-brand bg-white px-6 py-2.5 font-body text-xs font-medium uppercase tracking-[0.12em] text-text-mid hover:border-gold hover:text-gold transition-colors disabled:opacity-40"
              >
                {loadingMore ? <Loader2 size={14} className="animate-spin" /> : <ChevronDown size={14} />}
                Voir plus
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
