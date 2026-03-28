"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Star, ThumbsUp, CheckCircle, ChevronDown, Loader2 } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────────

interface Avis {
  id: string
  note: number
  titre: string | null
  commentaire: string | null
  utile: number
  verifie: boolean
  date: string
  auteur: {
    prenom: string
    photoUrl: string | null
  }
}

interface AvisStats {
  moyenne: number
  total: number
  distribution: Record<number, number>
}

interface AvisProduitProps {
  produitId: string
  produitNom: string
}

// ─── Composants utilitaires ──────────────────────────────────────

function StarsDisplay({ note, size = 16 }: { note: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={cn(
            star <= note
              ? "fill-gold text-gold"
              : "fill-none text-border-brand"
          )}
        />
      ))}
    </div>
  )
}

function StarsInput({
  value,
  onChange,
}: {
  value: number
  onChange: (note: number) => void
}) {
  const [hover, setHover] = useState(0)

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="p-1 transition-transform duration-150 hover:scale-110"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          aria-label={`Donner ${star} étoile${star > 1 ? "s" : ""}`}
        >
          <Star
            size={28}
            className={cn(
              star <= (hover || value)
                ? "fill-gold text-gold"
                : "fill-none text-border-brand"
            )}
          />
        </button>
      ))}
    </div>
  )
}

function DistributionBar({
  note,
  count,
  total,
}: {
  note: number
  count: number
  total: number
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0

  return (
    <div className="flex items-center gap-2">
      <span className="w-8 font-body text-[13px] text-text-mid">{note}★</span>
      <div className="flex-1 h-2 bg-bg-page rounded-full overflow-hidden">
        <div
          className="h-full bg-gold transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-8 font-body text-[12px] text-text-muted-brand text-right">
        {count}
      </span>
    </div>
  )
}

// ─── Composant principal ─────────────────────────────────────────

export default function AvisProduit({ produitId, produitNom }: AvisProduitProps) {
  const { data: session } = useSession()
  const [avis, setAvis] = useState<Avis[]>([])
  const [stats, setStats] = useState<AvisStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [tri, setTri] = useState("recent")

  // Formulaire
  const [showForm, setShowForm] = useState(false)
  const [noteForm, setNoteForm] = useState(0)
  const [titreForm, setTitreForm] = useState("")
  const [commentaireForm, setCommentaireForm] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Charger les avis
  const fetchAvis = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/boutique/produits/${produitId}/avis?page=${page}&tri=${tri}`
      )
      const data = await res.json()

      if (res.ok) {
        setAvis(data.avis)
        setStats(data.stats)
        setTotalPages(data.pages)
      }
    } catch (error) {
      console.error("Erreur chargement avis:", error)
    } finally {
      setLoading(false)
    }
  }, [produitId, page, tri])

  useEffect(() => {
    fetchAvis()
  }, [fetchAvis])

  // Soumettre un avis
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (noteForm === 0) {
      setMessage({ type: "error", text: "Veuillez donner une note" })
      return
    }

    setSubmitting(true)
    setMessage(null)

    try {
      const res = await fetch(`/api/boutique/produits/${produitId}/avis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: noteForm,
          titre: titreForm || undefined,
          commentaire: commentaireForm || undefined,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({
          type: "success",
          text: data.pointsGagnes > 0
            ? `Merci pour votre avis ! +${data.pointsGagnes} points fidélité`
            : "Merci pour votre avis !",
        })
        setShowForm(false)
        setNoteForm(0)
        setTitreForm("")
        setCommentaireForm("")
        fetchAvis()
      } else {
        setMessage({ type: "error", text: data.error || "Erreur lors de l'envoi" })
      }
    } catch {
      setMessage({ type: "error", text: "Erreur de connexion" })
    } finally {
      setSubmitting(false)
    }
  }

  // Voter utile
  async function handleVoteUtile(avisId: string) {
    try {
      await fetch(`/api/boutique/produits/${produitId}/avis?avisId=${avisId}`, {
        method: "PATCH",
      })
      setAvis((prev) =>
        prev.map((a) => (a.id === avisId ? { ...a, utile: a.utile + 1 } : a))
      )
    } catch (error) {
      console.error("Erreur vote:", error)
    }
  }

  return (
    <section className="mt-16 border-t border-border-brand pt-12">
      <h2 className="font-display text-[24px] font-light text-text-main">
        Avis Clients
      </h2>

      {/* Stats globales */}
      {stats && stats.total > 0 && (
        <div className="mt-6 grid gap-8 md:grid-cols-[200px_1fr]">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <span className="font-display text-[48px] font-light text-text-main">
                {stats.moyenne}
              </span>
              <div>
                <StarsDisplay note={Math.round(stats.moyenne)} size={20} />
                <p className="font-body text-[12px] text-text-muted-brand mt-1">
                  {stats.total} avis
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((note) => (
              <DistributionBar
                key={note}
                note={note}
                count={stats.distribution[note] || 0}
                total={stats.total}
              />
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        {session?.user ? (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary-brand px-6 py-2.5 font-body text-[11px] font-medium uppercase tracking-[0.15em] text-white transition-colors duration-300 hover:bg-primary-dark"
          >
            Donner mon avis
          </button>
        ) : (
          <p className="font-body text-[13px] text-text-muted-brand">
            <a href="/connexion" className="text-primary-brand underline">
              Connectez-vous
            </a>{" "}
            pour donner votre avis
          </p>
        )}

        {stats && stats.total > 0 && (
          <div className="relative">
            <select
              value={tri}
              onChange={(e) => {
                setTri(e.target.value)
                setPage(1)
              }}
              className="appearance-none bg-white border border-border-brand px-4 py-2 pr-10 font-body text-[13px] text-text-mid cursor-pointer"
            >
              <option value="recent">Plus récents</option>
              <option value="utile">Plus utiles</option>
              <option value="note">Meilleures notes</option>
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted-brand pointer-events-none"
            />
          </div>
        )}
      </div>

      {/* Formulaire d'avis */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 border border-border-brand bg-white p-6"
        >
          <h3 className="font-display text-[18px] font-light text-text-main">
            Votre avis sur {produitNom}
          </h3>

          <div className="mt-4">
            <label className="block font-body text-[13px] font-medium text-text-mid mb-2">
              Note *
            </label>
            <StarsInput value={noteForm} onChange={setNoteForm} />
          </div>

          <div className="mt-4">
            <label className="block font-body text-[13px] font-medium text-text-mid mb-2">
              Titre (optionnel)
            </label>
            <input
              type="text"
              value={titreForm}
              onChange={(e) => setTitreForm(e.target.value)}
              maxLength={100}
              placeholder="Résumez votre avis en quelques mots"
              className="w-full border border-border-brand px-4 py-2 font-body text-[14px] text-text-main focus:outline-none focus:ring-2 focus:ring-primary-brand/20"
            />
          </div>

          <div className="mt-4">
            <label className="block font-body text-[13px] font-medium text-text-mid mb-2">
              Commentaire (optionnel)
            </label>
            <textarea
              value={commentaireForm}
              onChange={(e) => setCommentaireForm(e.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="Partagez votre expérience avec ce produit..."
              className="w-full border border-border-brand px-4 py-2 font-body text-[14px] text-text-main focus:outline-none focus:ring-2 focus:ring-primary-brand/20 resize-none"
            />
          </div>

          {message && (
            <p
              className={cn(
                "mt-4 font-body text-[13px]",
                message.type === "success" ? "text-success" : "text-danger"
              )}
            >
              {message.text}
            </p>
          )}

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 bg-primary-brand px-6 py-2.5 font-body text-[11px] font-medium uppercase tracking-[0.15em] text-white transition-colors duration-300 hover:bg-primary-dark disabled:opacity-50"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Publier mon avis
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="border border-border-brand px-6 py-2.5 font-body text-[11px] font-medium uppercase tracking-[0.15em] text-text-mid transition-colors duration-300 hover:bg-bg-page"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Liste des avis */}
      {loading ? (
        <div className="mt-8 flex justify-center py-12">
          <Loader2 size={32} className="animate-spin text-primary-brand" />
        </div>
      ) : avis.length === 0 ? (
        <div className="mt-8 text-center py-12 border border-border-brand bg-bg-page">
          <p className="font-body text-[15px] text-text-mid">
            Aucun avis pour le moment.
          </p>
          <p className="font-body text-[13px] text-text-muted-brand mt-1">
            Soyez le premier à donner votre avis !
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {avis.map((a) => (
            <div
              key={a.id}
              className="border border-border-brand bg-white p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {a.auteur.photoUrl ? (
                    <Image
                      src={a.auteur.photoUrl}
                      alt={a.auteur.prenom}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary-light flex items-center justify-center">
                      <span className="font-body text-[14px] font-medium text-primary-brand">
                        {a.auteur.prenom.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-body text-[14px] font-medium text-text-main">
                      {a.auteur.prenom}
                    </p>
                    <div className="flex items-center gap-2">
                      <StarsDisplay note={a.note} size={14} />
                      {a.verifie && (
                        <span className="flex items-center gap-1 font-body text-[11px] text-success">
                          <CheckCircle size={12} />
                          Achat vérifié
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="font-body text-[12px] text-text-muted-brand">
                  {new Date(a.date).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>

              {a.titre && (
                <h4 className="mt-4 font-body text-[15px] font-semibold text-text-main">
                  {a.titre}
                </h4>
              )}

              {a.commentaire && (
                <p className="mt-2 font-body text-[14px] leading-relaxed text-text-mid">
                  {a.commentaire}
                </p>
              )}

              <div className="mt-4 flex items-center gap-4">
                <button
                  onClick={() => handleVoteUtile(a.id)}
                  className="flex items-center gap-1.5 font-body text-[12px] text-text-muted-brand transition-colors duration-200 hover:text-primary-brand"
                >
                  <ThumbsUp size={14} />
                  Utile ({a.utile})
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={cn(
                "h-10 w-10 font-body text-[13px] transition-colors duration-200",
                p === page
                  ? "bg-primary-brand text-white"
                  : "border border-border-brand text-text-mid hover:bg-bg-page"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
