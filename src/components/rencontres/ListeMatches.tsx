"use client"

import Image from "next/image"
import Link from "next/link"
import { MessageCircle, Heart } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

interface Interlocuteur {
  id: string
  prenom: string
  nom: string
  pseudo: string | null
  photoUrl: string | null
  bio: string | null
  ville: string | null
  verificationStatus: string
  derniereVueAt: string | null
}

interface MatchItem {
  id: string
  conversationId: string | null
  createdAt: string
  interlocuteur: Interlocuteur
}

interface ListeMatchesProps {
  matches: MatchItem[]
  onUnmatch: (matchId: string) => void
}

export default function ListeMatches({ matches, onUnmatch }: ListeMatchesProps) {
  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <Heart size={48} className="text-pink-200" />
        <p className="font-heading text-lg text-text-muted-brand">Aucun match pour l&apos;instant</p>
        <p className="text-sm text-text-muted-brand max-w-xs">
          Continuez à explorer les profils pour trouver votre correspondance.
        </p>
        <Link
          href="/communaute/rencontres"
          className="px-4 py-2 rounded-xl bg-primary-brand text-white font-medium hover:bg-primary-dark transition-colors text-sm"
        >
          Découvrir des profils
        </Link>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-border-brand">
      {matches.map((match) => {
        const i = match.interlocuteur
        return (
          <li key={match.id} className="flex items-center gap-3 py-3 px-1">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full overflow-hidden bg-bg-page shrink-0 border border-border-brand">
              {i.photoUrl ? (
                <Image
                  src={i.photoUrl}
                  alt={i.prenom}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-heading text-lg text-primary-brand/40">
                  {i.prenom[0]}
                </div>
              )}
            </div>

            {/* Infos */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-text-main truncate">
                {i.prenom} {i.nom}
              </p>
              {i.ville && (
                <p className="text-xs text-text-muted-brand truncate">{i.ville}</p>
              )}
              <p className="text-xs text-text-muted-brand">
                Match{" "}
                {formatDistanceToNow(new Date(match.createdAt), {
                  addSuffix: true,
                  locale: fr,
                })}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {match.conversationId && (
                <Link
                  href={`/communaute/messages?conv=${match.conversationId}`}
                  aria-label="Envoyer un message"
                  className="p-2 rounded-full text-primary-brand hover:bg-primary-light transition-colors"
                >
                  <MessageCircle size={18} />
                </Link>
              )}
              <button
                onClick={() => onUnmatch(match.id)}
                aria-label="Annuler le match"
                className="p-2 rounded-full text-text-muted-brand hover:text-red-400 hover:bg-red-50 transition-colors"
              >
                <Heart size={18} className="fill-current" />
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
