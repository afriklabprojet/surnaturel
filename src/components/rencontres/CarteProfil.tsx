"use client"

import { useState, useRef, useCallback } from "react"
import Image from "next/image"
import { MapPin, Heart, Star, X, BadgeCheck, Shield, MoreVertical, Flag, Ban } from "lucide-react"

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
  compatibilityScore?: number
  derniereVueAt?: string | null
  photosRencontre?: { url: string }[]
}

interface CarteProfilProps {
  profil: ProfilSuggestion
  onLike: () => void
  onSuperLike: () => void
  onPass: () => void
  onReport?: (userId: string) => void
  onBlock?: (userId: string) => void
  isLoading?: boolean
}

const SWIPE_THRESHOLD = 80
const SUPER_LIKE_THRESHOLD = -90

function calcAge(dateNaissance: string | null): number | null {
  if (!dateNaissance) return null
  const diff = Date.now() - new Date(dateNaissance).getTime()
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000))
}

function getPresence(derniereVueAt?: string | null): { label: string; color: string } | null {
  if (!derniereVueAt) return null
  const diffMins = (Date.now() - new Date(derniereVueAt).getTime()) / 60000
  if (diffMins < 5) return { label: "En ligne", color: "bg-green-500" }
  if (diffMins < 1440) return { label: "Actif aujourd'hui", color: "bg-yellow-400" }
  return null
}

export default function CarteProfil({
  profil,
  onLike,
  onSuperLike,
  onPass,
  onReport,
  onBlock,
  isLoading = false,
}: CarteProfilProps) {
  const age = calcAge(profil.dateNaissance)
  const presence = getPresence(profil.derniereVueAt)

  const [dragX, setDragX] = useState(0)
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [photoIndex, setPhotoIndex] = useState(0)

  // Construire la liste des photos : galerie rencontres + photo de profil en fallback
  const allPhotos: string[] = []
  if (profil.photosRencontre && profil.photosRencontre.length > 0) {
    profil.photosRencontre.forEach((p) => allPhotos.push(p.url))
  } else if (profil.photoUrl) {
    allPhotos.push(profil.photoUrl)
  }

  const handlePhotoTap = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (allPhotos.length <= 1) return
      // Ne pas naviguer si on clique sur un bouton
      if ((e.target as HTMLElement).closest("button")) return
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      if (x < rect.width / 2) {
        setPhotoIndex((i) => Math.max(0, i - 1))
      } else {
        setPhotoIndex((i) => Math.min(allPhotos.length - 1, i + 1))
      }
    },
    [allPhotos.length]
  )
  const startX = useRef(0)
  const startY = useRef(0)

  const rotation = dragX * 0.07
  const likeOpacity = Math.min(1, Math.max(0, (dragX - 20) / 60))
  const nopeOpacity = Math.min(1, Math.max(0, (-dragX - 20) / 60))
  const superOpacity = Math.min(1, Math.max(0, (-dragY - 20) / 60))

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (isLoading) return
    if ((e.target as HTMLElement).closest("button")) return
    startX.current = e.clientX
    startY.current = e.clientY
    setIsDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging) return
    setDragX(e.clientX - startX.current)
    setDragY(e.clientY - startY.current)
  }

  function handlePointerUp() {
    if (!isDragging) return
    setIsDragging(false)
    const dx = dragX
    const dy = dragY
    setDragX(0)
    setDragY(0)
    if (dx > SWIPE_THRESHOLD) {
      onLike()
    } else if (dx < -SWIPE_THRESHOLD) {
      onPass()
    } else if (dy < SUPER_LIKE_THRESHOLD) {
      onSuperLike()
    }
  }

  return (
    <div className="relative w-full max-w-sm sm:max-w-md mx-auto h-[min(560px,75svh)] sm:h-[min(620px,80svh)]">
      {/* Cartes fantômes (effet deck) */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 mx-4 h-full rounded-2xl bg-white border border-border-brand shadow-md"
        style={{ transform: "rotate(6deg) translateY(6px)", zIndex: 1 }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 mx-2 h-full rounded-2xl bg-white border border-border-brand shadow-md"
        style={{ transform: "rotate(3deg) translateY(3px)", zIndex: 2 }}
      />

      {/* Carte principale */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 3,
          transform: `translateX(${dragX}px) translateY(${dragY}px) rotate(${rotation}deg)`,
          transition: isDragging ? "none" : "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
          cursor: isDragging ? "grabbing" : "grab",
          touchAction: "none",
          userSelect: "none",
          willChange: "transform",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="w-full h-full rounded-2xl overflow-hidden shadow-xl bg-white border border-border-brand select-none flex flex-col">
          {/* Photo */}
          <div className="relative flex-1 bg-bg-page min-h-0">
            {/* LIKE overlay */}
            <div
              className="absolute inset-0 z-20 flex items-start justify-start p-6 pointer-events-none"
              style={{ opacity: likeOpacity }}
              aria-hidden="true"
            >
              <span className="border-4 border-green-500 text-green-500 font-black text-3xl px-3 py-1 rounded-lg rotate-[-20deg] tracking-widest">
                LIKE
              </span>
            </div>

            {/* NOPE overlay */}
            <div
              className="absolute inset-0 z-20 flex items-start justify-end p-6 pointer-events-none"
              style={{ opacity: nopeOpacity }}
              aria-hidden="true"
            >
              <span className="border-4 border-red-500 text-red-500 font-black text-3xl px-3 py-1 rounded-lg rotate-20 tracking-widest">
                NOPE
              </span>
            </div>

            {/* SUPER overlay */}
            <div
              className="absolute inset-0 z-20 flex items-end justify-center pb-6 pointer-events-none"
              style={{ opacity: superOpacity }}
              aria-hidden="true"
            >
              <span className="border-4 border-blue-500 text-blue-500 font-black text-3xl px-3 py-1 rounded-lg tracking-widest">
                SUPER
              </span>
            </div>

            {allPhotos.length > 0 ? (
              <div className="relative w-full h-full" onClick={handlePhotoTap}>
                {/* Indicateurs de photos (barres en haut) */}
                {allPhotos.length > 1 && (
                  <div className="absolute top-2 inset-x-2 z-30 flex gap-1">
                    {allPhotos.map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 h-1 rounded-full transition-colors ${
                          i === photoIndex ? "bg-white" : "bg-white/40"
                        }`}
                      />
                    ))}
                  </div>
                )}
                <Image
                  src={allPhotos[photoIndex]}
                  alt={`${profil.prenom} ${profil.nom}`}
                  fill
                  className="object-cover transition-opacity duration-200"
                  sizes="(max-width: 640px) 100vw, 384px"
                  draggable={false}
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl font-heading text-primary-brand/30">
                {profil.prenom[0]}
              </div>
            )}

            {/* Badges top-right + menu sécurité */}
            <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 z-10">
              {/* Menu signaler / bloquer */}
              {(onReport || onBlock) && (
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v) }}
                    aria-label="Options de sécurité"
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-10 w-44 bg-white rounded-xl shadow-lg border border-border-brand py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      {onReport && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onReport(profil.id) }}
                          className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-amber-600 hover:bg-amber-50 transition-colors"
                        >
                          <Flag size={14} />
                          Signaler
                        </button>
                      )}
                      {onBlock && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onBlock(profil.id) }}
                          className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Ban size={14} />
                          Bloquer
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
              {profil.verificationStatus !== "AUCUNE" && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white/90 text-primary-brand shadow">
                  {profil.verificationStatus === "PROFESSIONNEL_SANTE" ? (
                    <Shield size={12} />
                  ) : (
                    <BadgeCheck size={12} />
                  )}
                  {profil.verificationStatus === "PROFESSIONNEL_SANTE" ? "Professionnel" : "Vérifié"}
                </span>
              )}
            </div>

            {/* Badges top-left */}
            <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5 z-10">
              {profil.compatibilityScore !== undefined && profil.compatibilityScore > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/90 text-pink-600 shadow">
                  {profil.compatibilityScore}% compatible
                </span>
              )}
              {presence && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-white/90 text-text-main shadow">
                  <span className={`w-2 h-2 rounded-full ${presence.color}`} />
                  {presence.label}
                </span>
              )}
            </div>

            {/* Dégradé bas */}
            <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-black/70 to-transparent" />

            {/* Nom + âge */}
            <div className="absolute bottom-4 left-4 text-white z-10">
              <p className="font-heading text-2xl font-bold drop-shadow">
                {profil.prenom}
                {age !== null && `, ${age}`}
              </p>
              {profil.ville && (
                <p className="flex items-center gap-1 text-sm text-white/80 drop-shadow">
                  <MapPin size={12} />
                  {profil.ville}
                </p>
              )}
            </div>
          </div>

          {/* Infos + actions */}
          <div className="bg-white px-4 pt-3 pb-4 space-y-3">
            {profil.bio && (
              <p className="text-sm text-text-mid line-clamp-2">{profil.bio}</p>
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

            {/* Boutons actions — style Tinder avec gradients */}
            <div className="flex items-center justify-center gap-4 pt-1">
              <button
                onClick={onPass}
                disabled={isLoading}
                aria-label="Passer"
                className="flex items-center justify-center w-14 h-14 rounded-full shadow-md bg-white border-2 border-gray-100 text-gray-400 hover:border-red-300 hover:text-red-400 hover:scale-110 hover:shadow-red-100 transition-all disabled:opacity-50"
              >
                <X size={26} />
              </button>

              <button
                onClick={onSuperLike}
                disabled={isLoading}
                aria-label="Super like"
                className="flex items-center justify-center w-12 h-12 rounded-full shadow-md bg-linear-to-br from-cyan-400 to-blue-500 text-white hover:scale-110 hover:shadow-blue-200 transition-all disabled:opacity-50"
              >
                <Star size={20} />
              </button>

              <button
                onClick={onLike}
                disabled={isLoading}
                aria-label="Liker"
                className="flex items-center justify-center w-14 h-14 rounded-full shadow-md bg-linear-to-br from-pink-500 to-rose-500 text-white hover:scale-110 hover:shadow-pink-200 transition-all disabled:opacity-50"
              >
                <Heart size={26} className="fill-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
