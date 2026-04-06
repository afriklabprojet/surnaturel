"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { MessageCircle, HeartCrack, Flag, Ban } from "lucide-react"
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
  onReport?: (userId: string) => void
  onBlock?: (userId: string, matchId: string) => void
}

function isOnline(derniereVueAt: string | null): boolean {
  if (!derniereVueAt) return false
  return Date.now() - new Date(derniereVueAt).getTime() < 5 * 60 * 1000
}

function isActiveToday(derniereVueAt: string | null): boolean {
  if (!derniereVueAt) return false
  return Date.now() - new Date(derniereVueAt).getTime() < 24 * 60 * 60 * 1000
}

export default function ListeMatches({ matches, onUnmatch, onReport, onBlock }: ListeMatchesProps) {
  // Capture timestamp once at mount to avoid impure Date.now() during render
  const [now] = useState(() => Date.now())
  
  // Séparer les nouveaux matches (< 24h) des conversations existantes
  const nouveaux = matches.filter(
    (m) => now - new Date(m.createdAt).getTime() < 24 * 60 * 60 * 1000
  )
  const anciens = matches.filter(
    (m) => now - new Date(m.createdAt).getTime() >= 24 * 60 * 60 * 1000
  )
  const tous = matches
  
  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <div className="w-20 h-20 rounded-full bg-linear-to-br from-pink-100 to-fuchsia-100 flex items-center justify-center">
          <span className="text-4xl">💕</span>
        </div>
        <p className="font-heading text-lg text-text-muted-brand">Aucun match pour l&apos;instant</p>
        <p className="text-sm text-text-muted-brand max-w-xs">
          Continuez à explorer les profils pour trouver votre correspondance.
        </p>
        <Link
          href="/communaute/rencontres"
          className="px-5 py-2.5 rounded-full bg-linear-to-r from-pink-500 to-fuchsia-600 text-white font-medium shadow-md hover:shadow-pink-200 hover:-translate-y-0.5 transition-all text-sm"
        >
          Découvrir des profils
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Section nouveaux matches — scrollable horizontal */}
      {nouveaux.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-text-muted-brand uppercase tracking-wider px-1">
            Nouveaux matches
          </p>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
            {nouveaux.map((match) => {
              const i = match.interlocuteur
              const online = isOnline(i.derniereVueAt)
              return (
                <Link
                  key={match.id}
                  href={match.conversationId ? `/communaute/messages?conv=${match.conversationId}` : "#"}
                  className="flex flex-col items-center gap-1.5 shrink-0 group"
                >
                  <div className="relative">
                    {/* Anneau gradient animé */}
                    <div className="w-16 h-16 rounded-full p-0.5 bg-linear-to-br from-pink-500 to-fuchsia-600 shadow-md group-hover:shadow-pink-200 transition-shadow">
                      <div className="w-full h-full rounded-full overflow-hidden bg-bg-page border-2 border-white">
                        {i.photoUrl ? (
                          <Image
                            src={i.photoUrl}
                            alt={i.prenom}
                            width={60}
                            height={60}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-heading text-xl text-primary-brand/40">
                            {i.prenom[0]}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Point de présence */}
                    {online && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white" />
                    )}
                  </div>
                  <span className="text-xs text-text-main font-medium truncate w-16 text-center">
                    {i.prenom}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Section conversations */}
      <div className="space-y-2">
        {(anciens.length > 0 || nouveaux.length === 0) && (
          <p className="text-xs font-semibold text-text-muted-brand uppercase tracking-wider px-1">
            {nouveaux.length > 0 ? "Messages" : "Tous les matches"}
          </p>
        )}
        <ul className="space-y-1">
          {(anciens.length > 0 ? anciens : tous).map((match) => {
            const i = match.interlocuteur
            const online = isOnline(i.derniereVueAt)
            const activeToday = isActiveToday(i.derniereVueAt)
            return (
              <li
                key={match.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-bg-page transition-colors group"
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-bg-page border border-border-brand">
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
                  {online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                  )}
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium text-text-main truncate text-sm">
                      {i.prenom} {i.nom}
                    </p>
                    {online ? (
                      <span className="text-xs text-green-600 font-medium shrink-0">En ligne</span>
                    ) : activeToday ? (
                      <span className="text-xs text-yellow-600 font-medium shrink-0">Actif aujourd&apos;hui</span>
                    ) : null}
                  </div>
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
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {match.conversationId && (
                    <Link
                      href={`/communaute/messages?conv=${match.conversationId}`}
                      aria-label="Envoyer un message"
                      className="p-2 rounded-full bg-primary-light text-primary-brand hover:bg-primary-brand hover:text-white transition-colors"
                    >
                      <MessageCircle size={16} />
                    </Link>
                  )}
                  {onReport && (
                    <button
                      onClick={() => onReport(i.id)}
                      aria-label="Signaler"
                      className="p-2 rounded-full text-text-muted-brand hover:text-amber-500 hover:bg-amber-50 transition-colors"
                    >
                      <Flag size={16} />
                    </button>
                  )}
                  {onBlock && (
                    <button
                      onClick={() => onBlock(i.id, match.id)}
                      aria-label="Bloquer"
                      className="p-2 rounded-full text-text-muted-brand hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Ban size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => onUnmatch(match.id)}
                    aria-label="Annuler le match"
                    className="p-2 rounded-full text-text-muted-brand hover:text-red-400 hover:bg-red-50 transition-colors"
                  >
                    <HeartCrack size={16} />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
