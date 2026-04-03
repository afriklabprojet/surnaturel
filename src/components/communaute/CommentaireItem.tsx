"use client"

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
  return (
    <div className="flex gap-2.5 py-2.5">
      <Avatar user={commentaire.auteur} size={28} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <Link href={`/communaute/profil/${commentaire.auteur.id}`} className="font-body text-[12px] font-medium text-text-main hover:text-gold transition-colors">
            {commentaire.auteur.prenom} {commentaire.auteur.nom}
            <BadgeVerification status={commentaire.auteur.verificationStatus} size={11} className="ml-0.5" />
          </Link>
          <span className="font-body text-xs text-text-muted-brand">{timeAgo(commentaire.createdAt)}</span>
        </div>
        <div className="mt-0.5">
          <RenderContenu text={commentaire.contenu} />
        </div>
      </div>
    </div>
  )
}
