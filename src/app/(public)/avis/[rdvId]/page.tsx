"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Star, Camera, X, Loader2, Gift, Video, ExternalLink } from "lucide-react"
import { SkeletonAvisForm } from "@/components/ui/skeletons"
import { formatDate } from "@/lib/utils"
import { BtnArrow, BtnTextLine } from "@/components/ui/buttons"
import { fadeInUp } from "@/lib/animations"

const NOTES_LABELS: Record<number, string> = {
  1: "Décevant",
  2: "Passable",
  3: "Bien",
  4: "Très bien",
  5: "Exceptionnel !",
}

export default function PageAvisRDV() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams<{ rdvId: string }>()

  const [note, setNote] = useState(0)
  const [hoverNote, setHoverNote] = useState(0)
  const [commentaire, setCommentaire] = useState("")
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [rdvData, setRdvData] = useState<{
    soin: string
    date: Date
  } | null>(null)
  const [googleReviewUrl, setGoogleReviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/connexion")
    }
  }, [status, router])

  useEffect(() => {
    fetch("/api/config/google_place_id")
      .then(r => r.json())
      .then(d => {
        const id = d.valeur
        if (id) setGoogleReviewUrl(`https://search.google.com/local/writereview?placeid=${id}`)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    // Charger les données du RDV depuis l'API
    async function loadRdv() {
      try {
        const res = await fetch(`/api/rdv/${params.rdvId}`)
        if (res.ok) {
          const data = await res.json()
          setRdvData({
            soin: data.rdv.soin.nom,
            date: new Date(data.rdv.dateHeure),
          })
        } else {
          // RDV non trouvé ou non autorisé
          router.push("/mes-rdv")
        }
      } catch {
        router.push("/mes-rdv")
      }
    }
    if (session?.user?.id && params.rdvId) {
      loadRdv()
    }
  }, [params.rdvId, session?.user?.id, router])

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setPhoto(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  function removePhoto() {
    setPhoto(null)
    setPhotoPreview(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (note === 0) return

    setLoading(true)

    try {
      const res = await fetch("/api/avis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rdvId: params.rdvId,
          note,
          commentaire: commentaire.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erreur lors de l'envoi")
      }

      setSubmitted(true)
      setShowConfetti(true)

      // Redirect après 3 secondes
      setTimeout(() => {
        router.push("/mes-rdv")
      }, 3000)
    } catch (error) {
      console.error("Erreur:", error)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || !rdvData) {
    return <SkeletonAvisForm />
  }

  // État après soumission réussie
  if (submitted) {
    return (
      <div className="relative min-h-screen bg-bg-page px-6 py-16 lg:px-10">
        {/* Confettis */}
        {showConfetti && (
          <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
            {[...Array(40)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-3 w-3"
                style={{
                  left: `${Math.random() * 100}%`,
                  backgroundColor: "var(--color-gold)",
                }}
                initial={{ y: -20, opacity: 1, rotate: 0 }}
                animate={{
                  y: "100vh",
                  opacity: 0,
                  rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
                }}
                transition={{
                  duration: 3,
                  delay: Math.random() * 0.5,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>
        )}

        <motion.div
          className="mx-auto max-w-md text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center bg-primary-brand">
            <Star size={40} className="fill-white text-white" />
          </div>
          <h1 className="mt-6 font-display text-[32px] font-light text-primary-brand">
            Merci pour votre avis !
          </h1>
          <div className="mx-auto mt-4 h-px w-16 bg-gold" />
          
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="mt-6 inline-flex items-center gap-2 bg-primary-brand px-6 py-3 text-white"
          >
            <Gift size={20} />
            <span className="font-display text-[18px]">+30 points fidélité</span>
          </motion.div>

          {/* Google Review CTA pour les notes 4-5 */}
          {note >= 4 && googleReviewUrl && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-8 border border-gold bg-gold-light/30 p-6"
            >
              <p className="font-body text-[14px] text-text-mid">
                Votre expérience vous a plu ? Un avis sur Google aiderait d&apos;autres personnes à nous découvrir.
              </p>
              <a
                href={googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 bg-gold px-5 py-2.5 font-body text-xs uppercase tracking-[0.12em] text-white transition-colors hover:bg-gold-dark"
              >
                <ExternalLink size={14} />
                Laisser un avis Google
              </a>
            </motion.div>
          )}
          
          <p className="mt-6 font-body text-[14px] text-text-muted-brand">
            Redirection vers vos rendez-vous...
          </p>

          <Link
            href="/temoignage-video"
            className="mt-6 inline-flex items-center gap-2 border border-primary-brand px-5 py-2.5 font-body text-xs uppercase tracking-[0.12em] text-primary-brand transition-colors hover:bg-primary-brand hover:text-white"
          >
            <Video size={14} />
            Envoyer un témoignage vidéo
          </Link>
        </motion.div>
      </div>
    )
  }

  const displayNote = hoverNote || note

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
          <h1 className="font-display text-[36px] font-light text-text-main">
            Votre avis nous tient à cœur
          </h1>
          <p className="mt-4 font-display text-[22px] font-light text-primary-brand">
            {rdvData.soin}
          </p>
          <p className="mt-2 font-body text-[13px] text-text-muted-brand">
            {formatDate(rdvData.date)}
          </p>
          <div className="mx-auto mt-4 h-px w-16 bg-gold" />
        </div>

        <form onSubmit={handleSubmit} className="mt-12 space-y-10">
          {/* Section note */}
          <div className="text-center">
            <p className="font-body text-[13px] text-text-mid">
              Comment évaluez-vous ce soin ?
            </p>
            
            {/* Étoiles */}
            <div className="mt-6 flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setNote(value)}
                  onMouseEnter={() => setHoverNote(value)}
                  onMouseLeave={() => setHoverNote(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={48}
                    className={`transition-colors ${
                      value <= displayNote
                        ? "fill-gold text-gold"
                        : "text-border-brand"
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Label note */}
            <AnimatePresence mode="wait">
              {displayNote > 0 && (
                <motion.p
                  key={displayNote}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 font-display text-[18px] font-light text-primary-brand"
                >
                  {NOTES_LABELS[displayNote]}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Section commentaire */}
          <div>
            <label className="block font-body text-[13px] text-text-mid">
              Partagez votre expérience (optionnel)
            </label>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value.slice(0, 500))}
              placeholder="Décrivez votre expérience, les points forts, vos recommandations..."
              rows={5}
              className="mt-3 w-full border border-border-brand bg-white px-4 py-3 font-body text-[14px] text-text-main placeholder:text-text-muted-brand focus:border-gold focus:outline-none"
            />
            <p className="mt-2 text-right font-body text-xs text-text-muted-brand">
              {commentaire.length}/500 caractères
            </p>
          </div>

          {/* Section photo */}
          <div>
            <label className="block font-body text-[13px] text-text-mid">
              Ajouter une photo (optionnel)
            </label>
            
            {photoPreview ? (
              <div className="relative mt-3 inline-block">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="h-32 w-32 object-cover border border-border-brand"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center bg-danger text-white"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="mt-3 flex h-32 w-32 cursor-pointer flex-col items-center justify-center border-2 border-dashed border-border-brand bg-white transition-colors hover:border-gold">
                <Camera size={24} className="text-text-muted-brand" />
                <span className="mt-2 font-body text-xs text-text-muted-brand">
                  Ajouter
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-4 pt-4">
            <BtnArrow
              type="submit"
              disabled={note === 0 || loading}
              className="w-full justify-center bg-primary-brand text-white border-primary-brand hover:bg-primary-dark hover:border-primary-dark hover:text-white disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Publier mon avis"
              )}
            </BtnArrow>
            <div className="text-center">
              <BtnTextLine href="/mes-rdv">
                Ignorer pour l&apos;instant
              </BtnTextLine>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
