"use client"

import { useEffect, useState } from "react"
import StarRating from "./StarRating"
import { formatDate } from "@/lib/utils"

interface Avis {
  id: string
  note: number
  commentaire: string | null
  date: string
  nom: string
}

interface SoinAvisProps {
  soinSlug: string
}

export default function SoinAvis({ soinSlug }: SoinAvisProps) {
  const [avis, setAvis] = useState<Avis[]>([])
  const [noteMoyenne, setNoteMoyenne] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAvis() {
      try {
        const res = await fetch(`/api/soins/${soinSlug}`)
        if (res.ok) {
          const data = await res.json()
          setAvis(data.avis || [])
          setNoteMoyenne(data.noteMoyenne || 0)
        }
      } catch {
        // Erreur réseau, on laisse vide
      }
    }

    fetchAvis().finally(() => setLoading(false))
  }, [soinSlug])

  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse border border-border-brand bg-bg-page p-6">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} className="h-4 w-4 bg-border-brand" />
              ))}
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-3 w-full bg-border-brand" />
              <div className="h-3 w-3/4 bg-border-brand" />
            </div>
            <div className="mt-4 h-3 w-1/3 bg-border-brand" />
          </div>
        ))}
      </div>
    )
  }

  if (avis.length === 0) {
    return (
      <p className="text-center font-body text-[14px] text-text-muted-brand">
        Aucun avis pour le moment. Soyez la première à donner votre avis !
      </p>
    )
  }

  return (
    <>
      {/* Stats résumé */}
      {avis.length > 0 && (
        <div className="mb-8 flex items-center justify-center gap-4">
          <StarRating note={Math.round(noteMoyenne)} size={20} />
          <span className="font-body text-[14px] text-text-mid">
            {noteMoyenne.toFixed(1)} / 5 — {avis.length} avis
          </span>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {avis.map((a) => (
          <div
            key={a.id}
            className="border border-border-brand bg-bg-page p-6 transition-colors duration-300 hover:border-gold"
          >
            <StarRating note={a.note} />
            {a.commentaire && (
              <p className="mt-4 font-body text-[14px] italic leading-relaxed text-text-mid">
                &ldquo;{a.commentaire}&rdquo;
              </p>
            )}
            <div className="mt-4 border-t border-border-brand pt-4">
              <p className="font-body text-[11px] uppercase tracking-widest text-text-main">
                {a.nom}
              </p>
              <p className="mt-1 font-body text-[11px] text-text-muted-brand">
                {formatDate(new Date(a.date))}
              </p>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
