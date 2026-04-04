"use client"

import { useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart, MessageCircle, X } from "lucide-react"

interface MatchModalProps {
  matchId: string
  conversationId: string | null
  prenom: string
  photoUrl: string | null
  currentUserPhotoUrl: string | null
  onClose: () => void
}

export default function MatchModal({
  conversationId,
  prenom,
  photoUrl,
  currentUserPhotoUrl,
  onClose,
}: MatchModalProps) {
  // Fermer avec Escape
  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handle)
    return () => window.removeEventListener("keydown", handle)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 text-center space-y-5">
        {/* Bouton fermer */}
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-3 right-3 text-text-muted-brand hover:text-text-mid"
        >
          <X size={20} />
        </button>

        {/* Icône match */}
        <div className="flex items-center justify-center gap-3">
          <Heart size={28} className="text-pink-500 fill-pink-500" />
          <span className="font-heading text-2xl font-bold text-text-main">
            C&apos;est un match !
          </span>
          <Heart size={28} className="text-pink-500 fill-pink-500" />
        </div>

        {/* Avatars */}
        <div className="flex items-center justify-center gap-4">
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-pink-200 bg-bg-page">
            {currentUserPhotoUrl ? (
              <Image
                src={currentUserPhotoUrl}
                alt="Vous"
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl text-primary-brand/40">
                ?
              </div>
            )}
          </div>
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-pink-200 bg-bg-page">
            {photoUrl ? (
              <Image
                src={photoUrl}
                alt={prenom}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-heading text-primary-brand/40">
                {prenom[0]}
              </div>
            )}
          </div>
        </div>

        <p className="text-text-mid text-sm">
          Vous et <strong>{prenom}</strong> vous êtes mutuellement likés. Commencez à discuter !
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {conversationId && (
            <Link
              href={`/communaute/messages?conv=${conversationId}`}
              onClick={onClose}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-primary-brand text-white font-medium hover:bg-primary-dark transition-colors"
            >
              <MessageCircle size={18} />
              Envoyer un message
            </Link>
          )}
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-border-brand text-text-mid font-medium hover:bg-bg-page transition-colors"
          >
            Continuer à découvrir
          </button>
        </div>
      </div>
    </div>
  )
}
