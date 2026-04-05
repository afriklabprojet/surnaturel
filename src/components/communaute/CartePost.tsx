"use client"

import { useState, useEffect, useRef, type FormEvent } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Loader2,
  MessageCircle,
  Send,
  Trash2,
  ChevronDown,
  Bookmark,
  BookmarkCheck,
  Flag,
  MoreHorizontal,
  Repeat2,
  Pin,
  PinOff,
  Copy,
  Check,
  X,
} from "lucide-react"
import { Avatar, timeAgo } from "./AvatarCommunaute"
import { ReactionPicker } from "./ReactionPicker"
import { PostMedia } from "./PostMedia"
import { CommentaireItem, RenderContenu } from "./CommentaireItem"
import { MentionTextarea } from "./MentionTextarea"
import BadgeVerification from "@/components/ui/BadgeVerification"
import { useConfirm } from "@/components/ui/confirm-dialog"
import { useToast } from "@/components/ui/toast"
import { REACTIONS, type PostData, type CommentaireData, type ReactionType, type Auteur } from "./types"

export function CartePost({
  post,
  currentUserId,
  currentUser,
  onDelete,
  onReaction,
  onToggleSave,
  onNewComment,
  onShare,
  onTogglePin,
}: {
  post: PostData
  currentUserId: string
  currentUser?: Auteur
  onDelete: (id: string) => void
  onReaction: (postId: string, type: ReactionType) => void
  onToggleSave: (postId: string) => void
  onNewComment: (postId: string, comment: CommentaireData) => void
  onShare: (post: PostData) => void
  onTogglePin: (postId: string) => void
}) {
  const confirm = useConfirm()
  const toast = useToast()
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [commentMentionIds, setCommentMentionIds] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const shareMenuRef = useRef<HTMLDivElement>(null)
  const [allComments, setAllComments] = useState<CommentaireData[]>(post.commentaires)
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentPage, setCommentPage] = useState(1)
  const [totalCommentPages, setTotalCommentPages] = useState(1)
  const menuRef = useRef<HTMLDivElement>(null)
  const [reportDialog, setReportDialog] = useState<{ open: boolean; resolve: (v: string | null) => void } | null>(null)
  const [reportFeedback, setReportFeedback] = useState(false)

  const isAuteur = post.auteur.id === currentUserId
  const totalComments = post.commentairesCount

  useEffect(() => {
    if (!commentsLoaded) setAllComments(post.commentaires)
  }, [post.commentaires, commentsLoaded])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false)
    }
    if (showMenu) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showMenu])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) setShowShareMenu(false)
    }
    if (showShareMenu) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showShareMenu])

  async function loadAllComments() {
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
    } finally {
      setLoadingComments(false)
    }
  }

  async function loadMoreComments() {
    if (loadingComments || commentPage >= totalCommentPages) return
    setLoadingComments(true)
    try {
      const nextPage = commentPage + 1
      const res = await fetch(`/api/communaute/posts/${post.id}/commentaires?limit=20&page=${nextPage}`)
      if (res.ok) {
        const data = await res.json()
        setAllComments((prev) => [...prev, ...data.commentaires])
        setCommentPage(nextPage)
        setTotalCommentPages(data.pages)
      }
    } finally {
      setLoadingComments(false)
    }
  }

  function handleToggleComments() {
    const next = !showComments
    setShowComments(next)
    if (next && !commentsLoaded && totalComments > 3) loadAllComments()
  }

  async function handleDelete() {
    if (deleting) return
    const ok = await confirm({
      title: "Supprimer la publication ?",
      description: "Cette action est irréversible. La publication et tous ses commentaires seront définitivement supprimés.",
      confirmLabel: "Supprimer",
      variant: "danger",
    })
    if (!ok) return
    setDeleting(true)
    const res = await fetch(`/api/communaute/posts/${post.id}`, { method: "DELETE" })
    if (res.ok) {
      onDelete(post.id)
      toast.success("Publication supprimée")
    } else {
      toast.error("Erreur lors de la suppression")
    }
    setDeleting(false)
  }

  const RAISONS_SIGNALEMENT = [
    "Contenu inapproprié",
    "Harcèlement ou intimidation",
    "Discours haineux",
    "Fausses informations",
    "Spam",
    "Autre",
  ] as const

  async function handleReport() {
    setShowMenu(false)
    const raison = await new Promise<string | null>((resolve) => {
      setReportDialog({ open: true, resolve })
    })
    if (!raison) return
    const res = await fetch("/api/communaute/signalements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "POST", cibleId: post.id, raison }),
    })
    if (res.ok) {
      setReportFeedback(true)
      setTimeout(() => setReportFeedback(false), 3000)
    }
  }

  async function handleComment(e: FormEvent) {
    e.preventDefault()
    if (!commentText.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/communaute/posts/${post.id}/commentaires`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenu: commentText.trim(), mentions: commentMentionIds }),
      })
      if (res.ok) {
        const comment = await res.json()
        setAllComments((prev) => [...prev, comment])
        onNewComment(post.id, comment)
        setCommentText("")
        setCommentMentionIds([])
        toast.success("Commentaire publié")
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <article className="rounded-2xl bg-white shadow-sm ring-1 ring-border-brand overflow-hidden">
      {post.epingle && (
        <div className="flex items-center gap-1.5 px-5 pt-3 pb-0">
          <Pin size={12} className="text-gold" />
          <span className="rounded-full bg-gold/10 px-2.5 py-0.5 font-body text-[10px] uppercase tracking-wider text-gold font-medium">Publication épinglée</span>
        </div>
      )}

      {post.partageDeId && (
        <div className="flex items-center gap-1.5 px-5 pt-3 pb-0">
          <Repeat2 size={12} className="text-primary-brand" />
          <span className="font-body text-xs text-text-muted-brand">
            {post.auteur.prenom} {post.auteur.nom} a partagé
          </span>
        </div>
      )}

      <div className="flex items-center gap-3 px-5 pt-4 pb-3">
        <Link href={`/communaute/profil/${post.auteur.id}`}>
          <Avatar user={post.auteur} size={44} />
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/communaute/profil/${post.auteur.id}`} className="font-body text-[13px] font-medium text-text-main hover:text-gold transition-colors truncate block">
            {post.auteur.prenom} {post.auteur.nom}
            <BadgeVerification status={post.auteur.verificationStatus} size={13} className="ml-1" />
            {post.auteur.pseudo && <span className="text-text-muted-brand font-normal ml-1">@{post.auteur.pseudo}</span>}
          </Link>
          <p className="font-body text-xs text-text-muted-brand">{timeAgo(post.createdAt)}</p>
        </div>
        <div className="relative" ref={menuRef}>
          <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 text-text-muted-brand hover:text-text-mid transition-colors">
            <MoreHorizontal size={16} />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-white shadow-lg ring-1 ring-black/5 z-20 overflow-hidden">
              {isAuteur && (
                <button onClick={() => { onTogglePin(post.id); setShowMenu(false) }} className="flex w-full items-center gap-2 px-3 py-2 font-body text-[12px] text-text-mid hover:bg-bg-page transition-colors">
                  {post.epingle ? <PinOff size={13} /> : <Pin size={13} />}
                  {post.epingle ? "Désépingler" : "Épingler"}
                </button>
              )}
              {isAuteur ? (
                <button onClick={handleDelete} disabled={deleting} className="flex w-full items-center gap-2 px-3 py-2 font-body text-[12px] text-danger hover:bg-bg-page transition-colors">
                  {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  Supprimer
                </button>
              ) : (
                <button onClick={handleReport} className="flex w-full items-center gap-2 px-3 py-2 font-body text-[12px] text-text-mid hover:bg-bg-page transition-colors">
                  <Flag size={13} />
                  Signaler
                </button>
              )}
              <button onClick={() => { onToggleSave(post.id); setShowMenu(false); toast.info(post.saved ? "Retiré des sauvegardes" : "Publication sauvegardée") }} className="flex w-full items-center gap-2 px-3 py-2 font-body text-[12px] text-text-mid hover:bg-bg-page transition-colors">
                {post.saved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
                {post.saved ? "Retirer" : "Sauvegarder"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pb-3">
        <RenderContenu text={post.contenu} />
        {post.hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {post.hashtags.map((tag) => (
              <Link key={tag} href={`/communaute/recherche?q=${encodeURIComponent(tag)}`} className="rounded-full bg-primary-light px-2.5 py-0.5 font-body text-xs text-primary-brand hover:bg-gold-light hover:text-gold transition-colors">
                {tag}
              </Link>
            ))}
          </div>
        )}
      </div>

      <PostMedia post={post} />

      {post.partageDe && (
        <div className="mx-5 mb-3 rounded-xl border border-border-brand bg-bg-page overflow-hidden">
          <div className="flex items-center gap-2 px-4 pt-3 pb-2">
            <Link href={`/communaute/profil/${post.partageDe.auteur.id}`}>
              <Avatar user={post.partageDe.auteur} size={28} />
            </Link>
            <div className="min-w-0">
              <Link href={`/communaute/profil/${post.partageDe.auteur.id}`} className="font-body text-[12px] font-medium text-text-main hover:text-gold transition-colors truncate block">
                {post.partageDe.auteur.prenom} {post.partageDe.auteur.nom}
                <BadgeVerification status={post.partageDe.auteur.verificationStatus} size={11} className="ml-0.5" />
              </Link>
              <p className="font-body text-xs text-text-muted-brand">{timeAgo(post.partageDe.createdAt)}</p>
            </div>
          </div>
          <div className="px-4 pb-3">
            <RenderContenu text={post.partageDe.contenu} />
          </div>
          {post.partageDe.imageUrl && (
            <div className="relative w-full h-48">
              <Image src={post.partageDe.imageUrl} alt={`Photo par ${post.partageDe.auteur.prenom}`} fill sizes="(max-width: 768px) 100vw, 600px" className="object-cover" />
            </div>
          )}
        </div>
      )}

      {(post.reactionsCount > 0 || totalComments > 0 || post.partagesCount > 0) && (
        <div className="flex items-center justify-between px-5 py-2 text-text-muted-brand">
          {post.reactionsCount > 0 && (
            <span className="font-body text-xs">
              {Object.entries(post.reactionCounts ?? {})
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([type]) => REACTIONS.find((r) => r.type === type)?.emoji)
                .filter(Boolean)
                .join("")}{" "}
              {post.reactionsCount}
            </span>
          )}
          <div className="flex items-center gap-3 ml-auto">
            {totalComments > 0 && (
              <button onClick={handleToggleComments} className="font-body text-xs hover:text-gold transition-colors">
                {totalComments} commentaire{totalComments > 1 ? "s" : ""}
              </button>
            )}
            {post.partagesCount > 0 && (
              <span className="font-body text-xs">{post.partagesCount} partage{post.partagesCount > 1 ? "s" : ""}</span>
            )}
          </div>
        </div>
      )}

      <div className="flex items-stretch gap-0 border-t border-border-brand divide-x divide-border-brand">
        <ReactionPicker
          userReaction={post.userReaction}
          reactionCounts={post.reactionCounts}
          reactionsCount={post.reactionsCount}
          onReact={(type) => onReaction(post.id, type)}
        />
        <button onClick={handleToggleComments} className="flex flex-1 items-center justify-center gap-2 py-2.5 font-body text-[13px] font-medium text-text-muted-brand hover:bg-bg-page hover:text-primary-brand transition-colors">
          <MessageCircle size={16} />
          Commenter
        </button>
        <div className="relative flex-1" ref={shareMenuRef}>
          <button onClick={() => setShowShareMenu(!showShareMenu)} className="w-full flex items-center justify-center gap-2 py-2.5 font-body text-[13px] font-medium text-text-muted-brand hover:bg-bg-page hover:text-primary-brand transition-colors">
            <Repeat2 size={16} />
            Partager
          </button>
          {showShareMenu && (
            <div className="absolute bottom-full right-0 mb-2 rounded-xl bg-white shadow-lg ring-1 ring-black/5 z-50 w-44 overflow-hidden">
              <button
                onClick={() => { onShare(post); setShowShareMenu(false) }}
                className="w-full flex items-center gap-2 px-4 py-2.5 font-body text-[12px] text-text-main hover:bg-bg-page transition-colors"
              >
                <Repeat2 size={14} />
                Repartager
              </button>
              <button
                onClick={async () => {
                  const url = `${window.location.origin}/communaute?post=${post.id}`
                  if (navigator.share) {
                    try {
                      await navigator.share({ title: "Publication", text: post.contenu.slice(0, 100), url })
                    } catch { /* user cancelled */ }
                  } else {
                    await navigator.clipboard.writeText(url)
                    setLinkCopied(true)
                    setTimeout(() => setLinkCopied(false), 2000)
                  }
                  setShowShareMenu(false)
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 font-body text-[12px] text-text-main hover:bg-bg-page transition-colors border-t border-border-brand rounded-none"
              >
                {linkCopied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                {linkCopied ? "Lien copié !" : "Copier le lien"}
              </button>
            </div>
          )}
        </div>
      </div>

      {showComments && (
        <div className="border-t border-border-brand bg-[#F8F6F2] px-5 py-4 space-y-1">
          {allComments.length > 0 && (
            <div className="space-y-0">
              {allComments.map((c) => (
                <CommentaireItem key={c.id} commentaire={c} />
              ))}
            </div>
          )}

          {commentsLoaded && commentPage < totalCommentPages && (
            <button
              onClick={loadMoreComments}
              disabled={loadingComments}
              className="flex items-center gap-1.5 font-body text-xs text-primary-brand hover:text-gold transition-colors"
            >
              {loadingComments ? <Loader2 size={12} className="animate-spin" /> : <ChevronDown size={12} />}
              Voir plus de commentaires
            </button>
          )}

          {loadingComments && !commentsLoaded && (
            <div className="flex justify-center py-2">
              <Loader2 size={16} className="animate-spin text-gold" />
            </div>
          )}

          <form onSubmit={handleComment} className="flex gap-2.5 items-end pt-2">
            {currentUser && (
              <div className="shrink-0 mb-0.5">
                <Avatar user={currentUser} size={32} />
              </div>
            )}
            <div className="flex-1 flex items-end gap-2 rounded-full bg-white ring-1 ring-border-brand px-3 py-1.5 focus-within:ring-2 focus-within:ring-gold/40 transition-all">
              <MentionTextarea
                value={commentText}
                onChange={setCommentText}
                onMentionSelect={(u) => setCommentMentionIds((prev) => prev.includes(u.id) ? prev : [...prev, u.id])}
                placeholder="Écrire un commentaire..."
                maxLength={1000}
                rows={1}
                className="flex-1 bg-transparent font-body text-[13px] text-text-main placeholder:text-text-muted-brand focus:outline-none resize-none"
              />
              {commentText.trim() && (
                <button type="submit" disabled={submitting} className="shrink-0 text-primary-brand hover:text-primary-dark transition-colors disabled:opacity-40">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ─── Toast feedback signalement ─── */}
      {reportFeedback && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-text-main text-white px-5 py-3 shadow-lg font-body text-[13px]">
          <Flag size={14} className="text-gold" />
          Signalement envoyé. Merci.
        </div>
      )}

      {/* ─── Dialog choix de raison signalement ─── */}
      {reportDialog?.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => { reportDialog.resolve(null); setReportDialog(null) }}
        >
          <div
            className="bg-white rounded-2xl shadow-xl ring-1 ring-black/5 w-full max-w-sm mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border-brand px-5 py-4">
              <h3 className="font-display text-[18px] font-normal text-text-main">Signaler cette publication</h3>
              <button
                onClick={() => { reportDialog.resolve(null); setReportDialog(null) }}
                className="text-text-muted-brand hover:text-danger transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="divide-y divide-border-brand">
              {RAISONS_SIGNALEMENT.map((raison) => (
                <button
                  key={raison}
                  onClick={() => { reportDialog.resolve(raison); setReportDialog(null) }}
                  className="flex w-full items-center px-5 py-3 font-body text-[13px] text-text-main hover:bg-bg-page transition-colors text-left"
                >
                  {raison}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </article>
  )
}
