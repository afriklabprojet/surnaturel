"use client"

import Image from "next/image"
import { MapPin, Heart, Star, X, BadgeCheck, Shield } from "lucide-react"

export interface ProfilSuggestion {
  id: string
  prenom: string
  nom: string
  pseudo: string | null
  photoUrl: string | null
  bio: string | null
  ville: string | null
  centresInteret: string[]
  verificationStatus: "AUCUNE" | "MEMBRE_VERIFIE" | "PROFESSIONNEL_SANTE"
  dateNaissance: string | null
  profilDetail: { languesParlees: string[]; specialite: string | null } | null
}

interface CarteProfilProps {
  profil: ProfilSuggestion
  onLike: () => void
  onSuperLike: () => void
  onPass: () => void
  isLoading?: boolean
}

function calcAge(dateNaissance: string | null): number | null {
  if (!dateNaissance) return null
  const diff = Date.now() - new Date(dateNaissance).getTime()
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000))
}

export default function CarteProfil({
  profil,
  onLike,
  onSuperLike,
  onPass,
  isLoading = false,
}: CarteProfilProps) {
  const age = calcAge(profil.dateNaissance)

  return (
    <div className="relative w-full max-w-sm mx-auto rounded-2xl overflow-hidden shadow-lg bg-white border border-border-brand select-none">
      {/* Photo */}
      <div className="relative h-96 bg-bg-page">
        {profil.photoUrl ? (
          <Image
            src={profil.photoUrl}
            alt={`${profil.prenom} ${profil.nom}`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 384px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl font-heading text-primary-brand/30">
            {profil.prenom[0]}
          </div>
        )}

        {/* Badge vérification */}
        {profil.verificationStatus !== "AUCUNE" && (
          <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white/90 text-primary-brand shadow">
            {profil.verificationStatus === "PROFESSIONNEL_SANTE" ? (
              <Shield size={12} />
            ) : (
              <BadgeCheck size={12} />
            )}
            {profil.verificationStatus === "PROFESSIONNEL_SANTE"
              ? "Professionnel"
              : "Vérifié"}
          </span>
        )}

        {/* Dégradé bas */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-black/60 to-transparent" />

        {/* Nom + âge */}
        <div className="absolute bottom-4 left-4 text-white">
          <p className="font-heading text-xl font-semibold">
            {profil.prenom}
            {age !== null && `, ${age} ans`}
          </p>
          {profil.ville && (
            <p className="flex items-center gap-1 text-sm text-white/80">
              <MapPin size={12} />
              {profil.ville}
            </p>
          )}
        </div>
      </div>

      {/* Infos */}
      <div className="p-4 space-y-3">
        {profil.bio && (
          <p className="text-sm text-text-mid line-clamp-3">{profil.bio}</p>
        )}

        {profil.centresInteret.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {profil.centresInteret.slice(0, 5).map((c) => (
              <span
                key={c}
                className="px-2 py-0.5 rounded-full text-xs bg-primary-light text-primary-brand font-medium"
              >
                {c}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-5 px-4 pb-5">
        <button
          onClick={onPass}
          disabled={isLoading}
          aria-label="Passer"
          className="flex items-center justify-center w-14 h-14 rounded-full border-2 border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-400 transition-colors disabled:opacity-50"
        >
          <X size={24} />
        </button>

        <button
          onClick={onSuperLike}
          disabled={isLoading}
          aria-label="Super like"
          className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-blue-200 text-blue-400 hover:border-blue-400 hover:text-blue-500 transition-colors disabled:opacity-50"
        >
          <Star size={20} />
        </button>

        <button
          onClick={onLike}
          disabled={isLoading}
          aria-label="Liker"
          className="flex items-center justify-center w-14 h-14 rounded-full border-2 border-pink-200 text-pink-400 hover:border-pink-400 hover:text-pink-500 transition-colors disabled:opacity-50"
        >
          <Heart size={24} />
        </button>
      </div>
    </div>
  )
}
