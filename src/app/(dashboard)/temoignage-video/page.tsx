"use client"

import { useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Video, Upload, Loader2, Check, X } from "lucide-react"
import { BtnArrow } from "@/components/ui/buttons"
import { fadeInUp } from "@/lib/animations"

export default function PageEnvoyerTemoignage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [titre, setTitre] = useState("")
  const [soinNom, setSoinNom] = useState("")
  const [description, setDescription] = useState("")
  const [consentement, setConsentement] = useState(false)
  const [video, setVideo] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  if (status === "unauthenticated") {
    router.push("/connexion?callbackUrl=/temoignage-video")
    return null
  }

  function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 100 * 1024 * 1024) {
      setError("Vidéo trop volumineuse (max 100 Mo).")
      return
    }

    const allowed = ["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo", "video/x-matroska"]
    if (!allowed.includes(file.type)) {
      setError("Format non supporté. Envoyez un fichier MP4, MOV ou WebM.")
      return
    }

    setError(null)
    setVideo(file)
    setVideoPreview(URL.createObjectURL(file))
  }

  function removeVideo() {
    setVideo(null)
    if (videoPreview) URL.revokeObjectURL(videoPreview)
    setVideoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!video || !consentement) return

    setLoading(true)
    setError(null)
    setProgress(10)

    try {
      const formData = new FormData()
      formData.append("video", video)
      formData.append("titre", titre.trim() || "Mon expérience")
      if (soinNom.trim()) formData.append("soinNom", soinNom.trim())
      if (description.trim()) formData.append("description", description.trim())
      formData.append("consentement", "true")

      // Simuler la progression pendant l'upload
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 5, 85))
      }, 500)

      const res = await fetch("/api/temoignages/video-upload", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erreur lors de l'envoi")
      }

      setProgress(100)
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-bg-page px-6 py-16 lg:px-10">
        <motion.div
          className="mx-auto max-w-md text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center bg-primary-brand">
            <Check size={40} className="text-white" />
          </div>
          <h1 className="mt-6 font-display text-[32px] font-light text-primary-brand">
            Vidéo envoyée !
          </h1>
          <div className="mx-auto mt-4 h-px w-16 bg-gold" />
          <p className="mt-6 font-body text-[14px] text-text-mid">
            Merci pour votre témoignage ! Notre équipe va le valider avant publication.
            Vous serez notifiée une fois qu&apos;il sera visible sur le site.
          </p>
          <div className="mt-8">
            <BtnArrow onClick={() => router.push("/mes-rdv")}>
              Retour à mes rendez-vous
            </BtnArrow>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-page px-6 py-12 lg:px-10 lg:py-16">
      <motion.div
        className="mx-auto max-w-xl"
        variants={fadeInUp}
        initial="initial"
        animate="animate"
      >
        {/* En-tête */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center bg-primary-light">
            <Video size={28} className="text-primary-brand" />
          </div>
          <h1 className="mt-4 font-display text-[36px] font-light text-text-main">
            Partagez votre expérience
          </h1>
          <p className="mt-3 font-body text-[14px] text-text-mid">
            Enregistrez une courte vidéo depuis votre téléphone et envoyez-la directement.
            Pas besoin de YouTube !
          </p>
          <div className="mx-auto mt-4 h-px w-16 bg-gold" />
        </div>

        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          {/* Zone vidéo */}
          <div>
            <label className="block font-body text-[13px] font-medium text-text-main">
              Votre vidéo *
            </label>
            {videoPreview ? (
              <div className="relative mt-3">
                <video
                  src={videoPreview}
                  controls
                  className="w-full border border-border-brand bg-black"
                  style={{ maxHeight: 300 }}
                />
                <button
                  type="button"
                  onClick={removeVideo}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center bg-danger text-white"
                >
                  <X size={16} />
                </button>
                <p className="mt-2 font-body text-xs text-text-muted-brand">
                  {video?.name} — {((video?.size ?? 0) / (1024 * 1024)).toFixed(1)} Mo
                </p>
              </div>
            ) : (
              <label className="mt-3 flex h-48 cursor-pointer flex-col items-center justify-center border-2 border-dashed border-border-brand bg-white transition-colors hover:border-gold">
                <Upload size={32} className="text-text-muted-brand" />
                <span className="mt-3 font-body text-[13px] text-text-mid">
                  Appuyez pour choisir une vidéo
                </span>
                <span className="mt-1 font-body text-xs text-text-muted-brand">
                  MP4, MOV ou WebM — max 100 Mo
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
                  onChange={handleVideoChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Titre */}
          <div>
            <label htmlFor="titre" className="block font-body text-[13px] font-medium text-text-main">
              Titre du témoignage
            </label>
            <input
              id="titre"
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex : Mon expérience hammam"
              className="mt-2 w-full border border-border-brand bg-white px-4 py-2.5 font-body text-[14px] text-text-main placeholder:text-text-muted-brand focus:border-gold focus:outline-none"
            />
          </div>

          {/* Soin concerné */}
          <div>
            <label htmlFor="soin" className="block font-body text-[13px] font-medium text-text-main">
              Soin concerné (optionnel)
            </label>
            <input
              id="soin"
              type="text"
              value={soinNom}
              onChange={(e) => setSoinNom(e.target.value)}
              placeholder="Ex : Hammam Royal, Gommage Corps..."
              className="mt-2 w-full border border-border-brand bg-white px-4 py-2.5 font-body text-[14px] text-text-main placeholder:text-text-muted-brand focus:border-gold focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block font-body text-[13px] font-medium text-text-main">
              Description (optionnel)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              placeholder="Décrivez brièvement votre expérience..."
              rows={3}
              className="mt-2 w-full border border-border-brand bg-white px-4 py-3 font-body text-[14px] text-text-main placeholder:text-text-muted-brand focus:border-gold focus:outline-none"
            />
            <p className="mt-1 text-right font-body text-xs text-text-muted-brand">
              {description.length}/500
            </p>
          </div>

          {/* Consentement */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consentement}
              onChange={(e) => setConsentement(e.target.checked)}
              className="mt-1 h-4 w-4 accent-primary-brand"
            />
            <span className="font-body text-[13px] text-text-mid">
              J&apos;autorise Le Surnaturel de Dieu à publier cette vidéo sur son site
              et ses réseaux sociaux. *
            </span>
          </label>

          {/* Erreur */}
          {error && (
            <p className="font-body text-[13px] text-danger">{error}</p>
          )}

          {/* Barre de progression */}
          {loading && (
            <div className="space-y-2">
              <div className="h-2 w-full bg-border-brand overflow-hidden">
                <div
                  className="h-full bg-primary-brand transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="font-body text-xs text-text-muted-brand text-center">
                Envoi en cours... {progress}%
              </p>
            </div>
          )}

          {/* Submit */}
          <BtnArrow
            disabled={!video || !consentement || loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Envoi en cours...
              </span>
            ) : (
              "Envoyer ma vidéo"
            )}
          </BtnArrow>
        </form>
      </motion.div>
    </div>
  )
}
