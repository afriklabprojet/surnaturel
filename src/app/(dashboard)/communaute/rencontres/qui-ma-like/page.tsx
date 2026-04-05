"use client"

import { useState, useEffect } from "react"
import { Heart, Lock, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"

interface LikeItem {
  id: string
  prenom: string
  photoUrl: string | null
  ville: string | null
  dateNaissance: string | null
  verificationStatus: "AUCUNE" | "MEMBRE_VERIFIE" | "PROFESSIONNEL_SANTE"
  type: "LIKE" | "SUPER_LIKE"
  likedAt: string
}

function calcAge(dateNaissance: string | null): number | null {
  if (!dateNaissance) return null
  const diff = Date.now() - new Date(dateNaissance).getTime()
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000))
}

export default function PageQuiMALike() {
  const [likes, setLikes] = useState<LikeItem[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLikes() {
      try {
        const res = await fetch("/api/rencontres/qui-ma-like")
        if (!res.ok) throw new Error()
        const data = (await res.json()) as { count: number; likes: LikeItem[] }
        setCount(data.count)
        setLikes(data.likes)
      } catch {
        toast.error("Impossible de charger")
      } finally {
        setLoading(false)
      }
    }
    void fetchLikes()
  }, [])

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/communaute/rencontres"
          className="p-2 rounded-full text-text-muted-brand hover:bg-bg-page transition-colors"
          aria-label="Retour"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-heading text-xl font-semibold text-text-main flex items-center gap-2">
            <Heart size={20} className="text-pink-500" />
            Qui m&apos;a liké
          </h1>
          <p className="text-sm text-text-muted-brand">
            {count > 0 ? `${count} personne${count > 1 ? "s" : ""} ont aimé votre profil` : "Aucun like pour l'instant"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 sm:h-56 rounded-xl bg-bg-page animate-pulse" />
          ))}
        </div>
      ) : likes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <Heart size={48} className="text-pink-200" />
          <p className="font-heading text-lg text-text-muted-brand">Personne n&apos;a encore liké votre profil</p>
          <p className="text-sm text-text-muted-brand max-w-xs">
            Complétez votre profil et explorez d&apos;autres profils pour augmenter vos chances !
          </p>
          <Link
            href="/communaute/rencontres"
            className="px-4 py-2 rounded-full bg-primary-brand text-white text-sm font-medium hover:bg-primary-brand/90 transition-colors"
          >
            Explorer des profils
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {likes.map((like, index) => {
            const age = calcAge(like.dateNaissance)
            // First item is visible, rest are blurred to encourage interaction
            const isBlurred = index > 0

            return (
              <div
                key={like.id}
                className="relative rounded-xl overflow-hidden bg-bg-page border border-border-brand"
              >
                {/* Photo */}
                <div className="relative h-48 sm:h-56">
                  {like.photoUrl ? (
                    <Image
                      src={like.photoUrl}
                      alt={isBlurred ? "Profil flou" : `${like.prenom}`}
                      fill
                      className={`object-cover transition-all ${isBlurred ? "blur-xl scale-110" : ""}`}
                      sizes="(max-width: 640px) 50vw, 200px"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center text-4xl font-heading text-primary-brand/30 ${isBlurred ? "blur-xl" : ""}`}>
                      {isBlurred ? "?" : like.prenom[0]}
                    </div>
                  )}

                  {/* Super like badge */}
                  {like.type === "SUPER_LIKE" && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500 text-white shadow z-10">
                      ★ Super
                    </span>
                  )}

                  {/* Overlay flou avec cadenas */}
                  {isBlurred && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/20">
                      <Lock size={28} className="text-white drop-shadow" />
                      <span className="text-white text-xs font-medium text-center drop-shadow px-2">
                        Likez en retour pour révéler
                      </span>
                    </div>
                  )}

                  {/* Dégradé bas */}
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/60 to-transparent" />

                  {/* Nom */}
                  <div className="absolute bottom-2 left-3 text-white z-10">
                    <p className="font-heading text-sm font-semibold">
                      {isBlurred ? "???" : like.prenom}
                      {!isBlurred && age !== null && `, ${age}`}
                    </p>
                    {!isBlurred && like.ville && (
                      <p className="text-xs text-white/80">{like.ville}</p>
                    )}
                  </div>
                </div>

                {/* Bouton like en retour (visible seulement si non flou) */}
                {!isBlurred && (
                  <div className="p-2">
                    <Link
                      href="/communaute/rencontres"
                      className="block w-full text-center py-1.5 rounded-full bg-pink-50 text-pink-600 text-xs font-medium hover:bg-pink-100 transition-colors"
                    >
                      Voir dans les suggestions
                    </Link>
                  </div>
                )}

                {/* CTA pour débloquer les autres */}
                {isBlurred && (
                  <div className="p-2">
                    <Link
                      href="/communaute/rencontres"
                      className="block w-full text-center py-1.5 rounded-full bg-primary-brand text-white text-xs font-medium hover:bg-primary-brand/90 transition-colors"
                    >
                      Explorer →
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
