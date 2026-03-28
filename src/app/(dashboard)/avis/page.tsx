"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { staggerContainer, staggerItem, fadeInUp } from "@/lib/animations"
import {
  Star,
  Sparkles,
  Calendar,
  Gift,
  Loader2,
  ChevronDown,
  Edit2,
  Trash2,
} from "lucide-react"
import EmptyState from "@/components/ui/empty-states"
import Image from "next/image"

interface Soin {
  id: string
  nom: string
  slug: string
  image?: string | null
}

interface Avis {
  id: string
  note: number
  commentaire?: string | null
  createdAt: string
  soin?: Soin | null
  rendezVous?: {
    id: string
    date: string
  } | null
}

interface RDVSansAvis {
  id: string
  date: string
  soin?: Soin | null
}

interface AvisData {
  avis: Avis[]
  rdvsSansAvis: RDVSansAvis[]
}

export default function AvisPage() {
  const [data, setData] = useState<AvisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState<string | null>(null)
  const [note, setNote] = useState(5)
  const [commentaire, setCommentaire] = useState("")
  const [soumettant, setSoumettant] = useState(false)
  const [editant, setEditant] = useState<string | null>(null)
  const [supprimant, setSupprimant] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/avis?mesAvis=true")
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function soumettre(rdvId: string) {
    if (soumettant) return
    setSoumettant(true)

    try {
      const res = await fetch("/api/avis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rendezVousId: rdvId,
          note,
          commentaire: commentaire.trim() || null,
        }),
      })

      if (res.ok) {
        setFormOpen(null)
        setNote(5)
        setCommentaire("")
        fetchData()
      }
    } catch {
      // silently fail
    } finally {
      setSoumettant(false)
    }
  }

  async function modifierAvis(avisId: string) {
    if (soumettant) return
    setSoumettant(true)

    try {
      const res = await fetch("/api/avis", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avisId,
          note,
          commentaire: commentaire.trim() || null,
        }),
      })

      if (res.ok) {
        setEditant(null)
        setNote(5)
        setCommentaire("")
        fetchData()
      }
    } catch {
      // silently fail
    } finally {
      setSoumettant(false)
    }
  }

  async function supprimerAvis(avisId: string) {
    if (supprimant) return
    setSupprimant(avisId)

    try {
      const res = await fetch(`/api/avis?id=${avisId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        fetchData()
      }
    } catch {
      // silently fail
    } finally {
      setSupprimant(null)
    }
  }

  function startEdit(avis: Avis) {
    setEditant(avis.id)
    setNote(avis.note)
    setCommentaire(avis.commentaire || "")
  }

  function renderStars(value: number, interactive: boolean = false) {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && setNote(i)}
            className={interactive ? "cursor-pointer" : "cursor-default"}
          >
            <Star
              size={interactive ? 24 : 16}
              className={
                i <= value
                  ? "fill-gold text-gold"
                  : "fill-transparent text-border-brand"
              }
            />
          </button>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 size={24} className="animate-spin text-gold" />
      </div>
    )
  }

  const avis = data?.avis || []
  const rdvsSansAvis = data?.rdvsSansAvis || []

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={staggerItem}>
        <div className="flex items-center gap-3">
          <Star size={20} className="text-gold" />
          <h1 className="font-display text-[28px] font-light text-text-main">
            Mes avis
          </h1>
        </div>
        <p className="mt-2 font-body text-[13px] text-text-muted-brand">
          Partagez votre expérience et gagnez{" "}
          <span className="font-medium text-gold">30 points</span> par avis !
        </p>
      </motion.div>

      {/* RDVs en attente d'avis */}
      {rdvsSansAvis.length > 0 && (
        <motion.section variants={staggerItem}>
          <div className="flex items-center gap-2 mb-4">
            <Gift size={18} className="text-gold" />
            <h2 className="font-display text-[18px] font-light text-text-main">
              En attente de votre avis
            </h2>
            <span className="bg-gold/10 px-2 py-0.5 font-body text-[11px] font-medium text-gold">
              +30 pts
            </span>
          </div>

          <div className="space-y-4">
            {rdvsSansAvis.map((rdv) => (
              <motion.div
                key={rdv.id}
                variants={staggerItem}
                className="border border-border-brand border-l-4 border-l-gold bg-white"
              >
                <div
                  className="flex cursor-pointer items-center justify-between p-4"
                  onClick={() => setFormOpen(formOpen === rdv.id ? null : rdv.id)}
                >
                  <div className="flex items-center gap-4">
                    {/* Image */}
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-bg-page">
                      {rdv.soin?.image ? (
                        <Image
                          src={rdv.soin.image}
                          alt={rdv.soin?.nom || "Soin"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Sparkles size={20} className="text-border-brand" />
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="font-display text-[16px] font-normal text-text-main">
                        {rdv.soin?.nom || "Soin"}
                      </p>
                      <div className="mt-1 flex items-center gap-1 text-text-muted-brand">
                        <Calendar size={12} />
                        <span className="font-body text-[11px]">
                          {new Date(rdv.date).toLocaleDateString("fr", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <ChevronDown
                    size={20}
                    className={`text-text-muted-brand transition-transform ${
                      formOpen === rdv.id ? "rotate-180" : ""
                    }`}
                  />
                </div>

                {/* Formulaire */}
                <AnimatePresence>
                  {formOpen === rdv.id && (
                    <motion.div
                      variants={fadeInUp}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="border-t border-border-brand bg-bg-page p-4"
                    >
                      <div className="space-y-4">
                        {/* Note */}
                        <div>
                          <p className="mb-2 font-body text-[11px] font-medium uppercase tracking-widest text-text-muted-brand">
                            Votre note
                          </p>
                          {renderStars(note, true)}
                        </div>

                        {/* Commentaire */}
                        <div>
                          <label className="mb-2 block font-body text-[11px] font-medium uppercase tracking-widest text-text-muted-brand">
                            Commentaire (optionnel)
                          </label>
                          <textarea
                            value={commentaire}
                            onChange={(e) => setCommentaire(e.target.value)}
                            placeholder="Partagez votre expérience..."
                            rows={3}
                            className="w-full border border-border-brand bg-white px-4 py-3 font-body text-[13px] placeholder:text-text-muted-brand focus:border-primary-brand focus:outline-none"
                          />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                          <button
                            onClick={() => soumettre(rdv.id)}
                            disabled={soumettant}
                            className="flex items-center gap-2 bg-primary-brand px-6 py-2.5 font-body text-[12px] font-medium text-white transition-colors hover:bg-primary-brand/90 disabled:opacity-50"
                          >
                            {soumettant ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              "Publier mon avis"
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setFormOpen(null)
                              setNote(5)
                              setCommentaire("")
                            }}
                            className="px-4 py-2.5 font-body text-[12px] text-text-muted-brand transition-colors hover:text-text-main"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Mes avis publiés */}
      <motion.section variants={staggerItem}>
        <h2 className="mb-4 font-display text-[22px] font-light text-text-main">
          Mes avis publiés
        </h2>

        {avis.length === 0 ? (
          <EmptyState type="avis" />
        ) : (
          <div className="space-y-4">
            {avis.map((a) => (
              <motion.div
                key={a.id}
                variants={staggerItem}
                className="border border-border-brand bg-white p-5"
              >
                {editant === a.id ? (
                  // Mode édition
                  <div className="space-y-4">
                    <div>
                      <p className="mb-2 font-body text-[11px] font-medium uppercase tracking-widest text-text-muted-brand">
                        Votre note
                      </p>
                      {renderStars(note, true)}
                    </div>
                    <div>
                      <label className="mb-2 block font-body text-[11px] font-medium uppercase tracking-widest text-text-muted-brand">
                        Commentaire (optionnel)
                      </label>
                      <textarea
                        value={commentaire}
                        onChange={(e) => setCommentaire(e.target.value)}
                        rows={3}
                        className="w-full border border-border-brand bg-white px-4 py-3 font-body text-[13px] placeholder:text-text-muted-brand focus:border-primary-brand focus:outline-none"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => modifierAvis(a.id)}
                        disabled={soumettant}
                        className="flex items-center gap-2 bg-primary-brand px-6 py-2.5 font-body text-[12px] font-medium text-white transition-colors hover:bg-primary-brand/90 disabled:opacity-50"
                      >
                        {soumettant ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          "Enregistrer"
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditant(null)
                          setNote(5)
                          setCommentaire("")
                        }}
                        className="px-4 py-2.5 font-body text-[12px] text-text-muted-brand transition-colors hover:text-text-main"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  // Mode affichage
                  <>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        {/* Image */}
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-bg-page">
                          {a.soin?.image ? (
                            <Image
                              src={a.soin.image}
                              alt={a.soin?.nom || "Soin"}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Sparkles size={18} className="text-border-brand" />
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="font-display text-[16px] font-normal text-text-main">
                            {a.soin?.nom || "Soin"}
                          </p>
                          <div className="mt-1">{renderStars(a.note)}</div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(a)}
                          className="p-2 text-text-muted-brand transition-colors hover:text-primary-brand"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => supprimerAvis(a.id)}
                          disabled={supprimant === a.id}
                          className="p-2 text-text-muted-brand transition-colors hover:text-danger disabled:opacity-50"
                        >
                          {supprimant === a.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </div>

                    {a.commentaire && (
                      <p className="mt-3 font-body text-[13px] font-light leading-relaxed text-text-main">
                        &ldquo;{a.commentaire}&rdquo;
                      </p>
                    )}

                    <p className="mt-3 font-body text-[11px] text-text-muted-brand">
                      Publié le{" "}
                      {new Date(a.createdAt).toLocaleDateString("fr", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>
    </motion.div>
  )
}
