"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/animations"
import { ChevronLeft, ChevronRight, X, Sparkles } from "lucide-react"
import Link from "next/link"

interface GaleriePhoto {
  id: string
  titre: string
  description: string | null
  soinNom: string
  imageAvantUrl: string
  imageApresUrl: string
  createdAt: string
}

export default function GaleriePage() {
  const [photos, setPhotos] = useState<GaleriePhoto[]>([])
  const [parSoin, setParSoin] = useState<Record<string, GaleriePhoto[]>>({})
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<GaleriePhoto | null>(null)
  const [showAfter, setShowAfter] = useState(false)
  const [filter, setFilter] = useState<string | null>(null)

  const fetchPhotos = useCallback(async () => {
    try {
      const res = await fetch("/api/galerie")
      if (res.ok) {
        const data = await res.json()
        setPhotos(data.photos)
        setParSoin(data.parSoin)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPhotos()
  }, [fetchPhotos])

  const filteredPhotos = filter
    ? photos.filter((p) => p.soinNom === filter)
    : photos

  const soins = Object.keys(parSoin)

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-brand border-t-transparent" />
      </div>
    )
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
    >
      {/* Header */}
      <motion.div
        variants={fadeInUp}
        className="mb-12 text-center"
      >
        <span className="font-body text-xs font-medium uppercase tracking-widest text-gold">
          Résultats réels
        </span>
        <h1 className="mt-2 font-display text-[36px] font-light text-text-main sm:text-[48px]">
          Galerie Avant / Après
        </h1>
        <p className="mx-auto mt-4 max-w-2xl font-body text-[15px] leading-relaxed text-text-mid">
          Découvrez les transformations de nos clientes. Chaque photo est publiée
          avec le consentement de la cliente.
        </p>
      </motion.div>

      {/* Filtres par soin */}
      {soins.length > 1 && (
        <motion.div
          variants={staggerItem}
          className="mb-8 flex flex-wrap justify-center gap-2"
        >
          <button
            onClick={() => setFilter(null)}
            className={`px-4 py-2 font-body text-[12px] uppercase tracking-wider transition-colors ${
              filter === null
                ? "bg-primary-brand text-white"
                : "border border-border-brand text-text-mid hover:bg-gray-50"
            }`}
          >
            Tous ({photos.length})
          </button>
          {soins.map((soin) => (
            <button
              key={soin}
              onClick={() => setFilter(soin)}
              className={`px-4 py-2 font-body text-[12px] uppercase tracking-wider transition-colors ${
                filter === soin
                  ? "bg-primary-brand text-white"
                  : "border border-border-brand text-text-mid hover:bg-gray-50"
              }`}
            >
              {soin} ({parSoin[soin].length})
            </button>
          ))}
        </motion.div>
      )}

      {/* Galerie */}
      {filteredPhotos.length === 0 ? (
        <motion.div
          variants={staggerItem}
          className="border border-dashed border-border-brand bg-white py-16 text-center"
        >
          <Sparkles className="mx-auto h-12 w-12 text-text-muted-brand" />
          <p className="mt-4 font-display text-[20px] text-text-mid">
            Aucune transformation à afficher
          </p>
          <p className="mt-2 font-body text-[14px] text-text-muted-brand">
            Revenez bientôt pour découvrir nos résultats
          </p>
          <Link
            href="/prise-rdv"
            className="mt-6 inline-block bg-primary-brand px-6 py-3 font-body text-xs uppercase tracking-widest text-white transition-colors hover:bg-primary-dark"
          >
            Prendre rendez-vous
          </Link>
        </motion.div>
      ) : (
        <motion.div
          variants={staggerContainer}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filteredPhotos.map((photo) => (
            <motion.div
              key={photo.id}
              variants={staggerItem}
              className="group cursor-pointer border border-border-brand bg-white transition-shadow hover:shadow-lg"
              onClick={() => {
                setSelectedPhoto(photo)
                setShowAfter(false)
              }}
            >
              {/* Comparaison visuelle */}
              <div className="relative aspect-4/3 overflow-hidden">
                {/* Image avant */}
                <div className="absolute inset-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.imageAvantUrl}
                    alt={`${photo.titre} - Avant`}
                    className="h-full w-full object-cover"
                  />
                </div>
                {/* Image après (hover reveal) */}
                <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.imageApresUrl}
                    alt={`${photo.titre} - Après`}
                    className="h-full w-full object-cover"
                  />
                </div>
                {/* Labels */}
                <div className="absolute bottom-3 left-3 flex gap-2">
                  <span className="bg-black/60 px-2 py-1 font-body text-xs uppercase text-white group-hover:opacity-0">
                    Avant
                  </span>
                  <span className="bg-primary-brand/80 px-2 py-1 font-body text-xs uppercase text-white opacity-0 group-hover:opacity-100">
                    Après
                  </span>
                </div>
                {/* Instruction */}
                <div className="absolute right-3 top-3 bg-white/90 px-2 py-1 font-body text-xs text-text-mid opacity-0 transition-opacity group-hover:opacity-100">
                  Cliquez pour agrandir
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-display text-[16px] font-medium text-text-main">
                  {photo.titre}
                </h3>
                <p className="mt-1 font-body text-[12px] text-primary-brand">
                  {photo.soinNom}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* CTA */}
      <motion.div
        variants={staggerItem}
        className="mt-16 border border-gold/30 bg-gold/5 p-8 text-center sm:p-12"
      >
        <h2 className="font-display text-[24px] font-light text-text-main">
          Envie de vivre votre propre transformation ?
        </h2>
        <p className="mx-auto mt-3 max-w-xl font-body text-[14px] text-text-mid">
          Prenez rendez-vous pour découvrir nos soins et obtenir des résultats visibles.
        </p>
        <Link
          href="/prise-rdv"
          className="mt-6 inline-block bg-primary-brand px-8 py-4 font-body text-xs uppercase tracking-widest text-white transition-colors hover:bg-primary-dark"
        >
          Réserver un soin
        </Link>
      </motion.div>

      {/* Modal lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute right-4 top-4 text-white/80 hover:text-white"
          >
            <X size={32} />
          </button>

          <div
            className="relative max-h-[90vh] max-w-5xl overflow-hidden bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image slider */}
            <div className="relative aspect-4/3 sm:aspect-video">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={showAfter ? selectedPhoto.imageApresUrl : selectedPhoto.imageAvantUrl}
                alt={selectedPhoto.titre}
                className="h-full w-full object-contain"
              />

              {/* Navigation */}
              <button
                onClick={() => setShowAfter(false)}
                className={`absolute left-4 top-1/2 -translate-y-1/2 p-2 ${
                  !showAfter ? "bg-primary-brand text-white" : "bg-white/80 text-text-main"
                }`}
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={() => setShowAfter(true)}
                className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 ${
                  showAfter ? "bg-primary-brand text-white" : "bg-white/80 text-text-main"
                }`}
              >
                <ChevronRight size={24} />
              </button>

              {/* Label */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <div className="flex overflow-hidden border border-border-brand bg-white">
                  <button
                    onClick={() => setShowAfter(false)}
                    className={`px-4 py-2 font-body text-xs uppercase tracking-wider ${
                      !showAfter ? "bg-primary-brand text-white" : "text-text-mid"
                    }`}
                  >
                    Avant
                  </button>
                  <button
                    onClick={() => setShowAfter(true)}
                    className={`px-4 py-2 font-body text-xs uppercase tracking-wider ${
                      showAfter ? "bg-primary-brand text-white" : "text-text-mid"
                    }`}
                  >
                    Après
                  </button>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="p-6">
              <h3 className="font-display text-[20px] font-medium text-text-main">
                {selectedPhoto.titre}
              </h3>
              <p className="mt-1 font-body text-[13px] text-primary-brand">
                {selectedPhoto.soinNom}
              </p>
              {selectedPhoto.description && (
                <p className="mt-3 font-body text-[14px] text-text-mid">
                  {selectedPhoto.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
