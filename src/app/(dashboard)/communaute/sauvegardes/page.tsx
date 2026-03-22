"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, Bookmark, BookmarkX, ChevronDown, MessageCircle } from "lucide-react"

interface PostSauvegarde {
  id: string
  contenu: string
  imageUrl: string | null
  createdAt: string
  auteur: { id: string; nom: string; prenom: string; photoUrl: string | null }
  reactionsCount: number
  commentairesCount: number
}

function Avatar({ user, size = 32 }: { user: { prenom: string; nom: string; photoUrl?: string | null }; size?: number }) {
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

export default function PageSauvegardes() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [posts, setPosts] = useState<PostSauvegarde[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/connexion")
  }, [status, router])

  const fetchSaved = useCallback(async (pageNum: number, append = false) => {
    if (append) setLoadingMore(true)
    else setLoading(true)
    try {
      const res = await fetch(`/api/communaute/posts?saved=true&page=${pageNum}&limit=10`)
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
    if (status === "authenticated") fetchSaved(1)
  }, [status, fetchSaved])

  async function handleUnsave(postId: string) {
    await fetch(`/api/communaute/posts/${postId}/sauvegarder`, { method: "POST" })
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  if (status === "loading" || loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 size={28} className="animate-spin text-gold" /></div>
  }

  return (
    <section className="mx-auto max-w-2xl space-y-5">
      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center bg-primary-light rounded-full mb-3">
            <Bookmark size={24} className="text-primary-brand" />
          </div>
          <p className="font-display text-[16px] font-light text-text-main">Aucune publication sauvegardée</p>
          <p className="font-body text-[11px] text-text-muted-brand mt-1">Les publications que vous sauvegardez apparaîtront ici</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="bg-white border border-border-brand p-4">
              <div className="flex items-center gap-3 mb-2">
                <Link href={`/communaute/profil/${post.auteur.id}`}>
                  <Avatar user={post.auteur} />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/communaute/profil/${post.auteur.id}`} className="font-body text-[12px] font-medium text-text-main hover:text-gold transition-colors">
                    {post.auteur.prenom} {post.auteur.nom}
                  </Link>
                  <p className="font-body text-[10px] text-text-muted-brand">{timeAgo(post.createdAt)}</p>
                </div>
                <button onClick={() => handleUnsave(post.id)} className="p-1.5 text-gold hover:text-danger transition-colors" title="Retirer de la sauvegarde">
                  <BookmarkX size={16} />
                </button>
              </div>
              <p className="font-body text-[13px] text-text-main leading-relaxed whitespace-pre-wrap line-clamp-4">{post.contenu}</p>
              {post.imageUrl && <img src={post.imageUrl} alt="" className="w-full max-h-48 object-cover mt-2" />}
              <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border-brand">
                <span className="font-body text-[10px] text-text-muted-brand">{post.reactionsCount || 0} réactions</span>
                <span className="font-body text-[10px] text-text-muted-brand flex items-center gap-0.5"><MessageCircle size={10} />{post.commentairesCount || 0}</span>
              </div>
            </div>
          ))}

          {page < totalPages && (
            <div className="flex justify-center pt-2 pb-4">
              <button onClick={() => fetchSaved(page + 1, true)} disabled={loadingMore} className="flex items-center gap-2 border border-border-brand bg-white px-6 py-2.5 font-body text-[11px] font-medium uppercase tracking-[0.12em] text-text-mid hover:border-gold hover:text-gold transition-colors disabled:opacity-40">
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
