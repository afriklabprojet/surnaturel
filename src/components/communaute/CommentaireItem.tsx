"use client"

import { useState } from "react"
import Link from "next/link"
import BadgeVerification from "@/components/ui/BadgeVerification"
import { Avatar, timeAgo } from "./AvatarCommunaute"
import type { CommentaireData } from "./types"

export function RenderContenu({ text }: { text: string }) {
  const parts = text.split(/(@[a-zA-ZÀ-ÿ0-9_]+)/g)
  return (
    <p className="font-body text-[13px] text-text-main leading-relaxed whitespace-pre-wrap">
      {parts.map((part, i) =>
        part.startsWith("@") ? (
          <span key={i} className="font-medium text-primary-brand cursor-pointer hover:text-gold transition-colors">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  )
}

export function CommentaireItem({ commentaire }: { commentaire: CommentaireData }) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  function toggleLike() {
    setLiked((v) => {
      setLikeCount((c) => (v ? c - 1 : c + 1))
      return !v
    })
  }

  return (
    <div className="flex gap-2.5 py-2">
      <Link href={`/communaute/profil/${commentaire.auteur.id}`} className="shrink-0 mt-0.5">
        <Avatar user={commentaire.auteur} size={32} />
      </Link>
      <div className="flex-1 min-w-0">
        {/* Bulle Facebook-style */}
        <div className="inline-block max-w-full rounded-2xl rounded-tl-sm bg-[#F2F0EB] px-3.5 py-2">
          <Link
            href={`/communaute/profil/${commentaire.auteur.id}`}
            className="font-body text-[12px] font-semibold text-text-main hover:text-gold transition-colors"
          >
            {commentaire.auteur.prenom} {commentaire.auteur.nom}
            <BadgeVerification status={commentaire.auteur.verificationStatus} size={11} className="ml-0.5" />
          </Link>
          <div className="mt-0.5">
            <RenderContenu text={commentaire.contenu} />
          </div>
        </div>

        {/* Actions sous la bulle */}
        <div className="flex items-center gap-3 mt-1 pl-1">
          <span className="font-body text-[11px] text-text-muted-brand">{timeAgo(commentaire.createdAt)}</span>
          <button
            onClick={toggleLike}
            className={`font-body text-[11px] font-semibold transition-colors ${liked ? "text-primary-brand" : "text-text-muted-brand hover:text-primary-brand"}`}
          >
            J&apos;aime{likeCount > 0 && ` · ${likeCount}`}
          </button>
          <button className="font-body text-[11px] font-semibold text-text-muted-brand hover:text-primary-brand transition-colors">
            Répondre
          </button>
          {liked && (
            <span className="inline-flex items-center gap-0.5 text-[11px]">
              <span className="text-[13px] animate-bounce" style={{ animationDuration: "0.4s", animationIterationCount: 1 }}>👍</span>
              <span className="font-body text-text-muted-brand">{likeCount}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
