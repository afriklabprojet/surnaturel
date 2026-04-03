"use client"

import { useState, useEffect, useCallback, FormEvent } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Loader2,
  CalendarDays,
  MapPin,
  Users,
  Plus,
  X,
  Clock,
  Check,
  Star,
  ChevronRight,
} from "lucide-react"

interface EvenementData {
  id: string
  titre: string
  description: string
  imageUrl: string | null
  lieu: string | null
  dateDebut: string
  dateFin: string | null
  maxParticipants: number | null
  participantsCount: number
  myStatut: string | null
  createur: { id: string; nom: string; prenom: string; photoUrl: string | null }
  groupe: { id: string; nom: string; slug: string } | null
}

function Avatar({ user, size = 28 }: { user: { prenom: string; nom: string; photoUrl?: string | null }; size?: number }) {
  const initials = `${user.prenom?.[0] ?? ""}${user.nom?.[0] ?? ""}`.toUpperCase()
  if (user.photoUrl) return <img src={user.photoUrl} alt="" className="rounded-full object-cover" style={{ width: size, height: size }} />
  return <div className="flex items-center justify-center rounded-full bg-primary-brand text-white font-body font-medium" style={{ width: size, height: size, fontSize: size * 0.32 }}>{initials}</div>
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr)
  return {
    jour: d.getDate().toString(),
    mois: d.toLocaleDateString("fr", { month: "short" }).toUpperCase(),
  }
}

/* ━━━━━━━━━━ Page Événements ━━━━━━━━━━ */

export default function PageEvenements() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [tab, setTab] = useState<"upcoming" | "my" | "past">("upcoming")
  const [evenements, setEvenements] = useState<EvenementData[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [rsvpLoading, setRsvpLoading] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (status === "unauthenticated") router.push("/connexion?callbackUrl=/communaute/evenements")
  }, [status, router])

  const fetchEvenements = useCallback(async (type: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/communaute/evenements?type=${type}`)
      if (res.ok) {
        const data = await res.json()
        setEvenements(data.evenements || [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === "authenticated") fetchEvenements(tab)
  }, [status, tab, fetchEvenements])

  async function handleRSVP(id: string, statut: string) {
    setRsvpLoading((prev) => ({ ...prev, [id]: true }))
    try {
      await fetch(`/api/communaute/evenements/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut }),
      })
      setEvenements((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                ...e,
                myStatut: e.myStatut === statut ? null : statut,
                participantsCount: e.myStatut === statut ? e.participantsCount - 1 : e.participantsCount + (e.myStatut ? 0 : 1),
              }
            : e
        )
      )
    } finally {
      setRsvpLoading((prev) => ({ ...prev, [id]: false }))
    }
  }

  if (status === "loading") {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 size={28} className="animate-spin text-gold" /></div>
  }

  return (
    <section className="mx-auto max-w-2xl space-y-5">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-xl bg-bg-page ring-1 ring-border-brand p-1 flex-1 mr-3">
          {([
            { key: "upcoming", label: "À venir" },
            { key: "my", label: "Mes événements" },
            { key: "past", label: "Passés" },
          ] as const).map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`flex-1 rounded-lg py-2 font-body text-xs font-medium transition-colors ${tab === t.key ? "bg-white shadow-sm text-primary-brand" : "text-text-muted-brand hover:bg-white/60"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 rounded-full bg-primary-brand px-4 py-2 font-body text-xs font-medium text-white hover:bg-primary-dark transition-colors shrink-0">
          <Plus size={14} />
          Créer
        </button>
      </div>

      {/* Modal création */}
      {showCreate && (
        <CreateEventModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchEvenements(tab) }}
        />
      )}

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-gold" /></div>
      ) : evenements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center bg-primary-light rounded-full mb-3">
            <CalendarDays size={24} className="text-primary-brand" />
          </div>
          <p className="font-display text-[16px] font-light text-text-main">Aucun événement</p>
          <p className="font-body text-xs text-text-muted-brand mt-1">
            {tab === "upcoming" ? "Créez le premier événement de la communauté" : "Rien à afficher ici"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {evenements.map((evt) => {
            const dateInfo = formatDateShort(evt.dateDebut)
            const isPast = new Date(evt.dateDebut) < new Date()
            return (
              <div key={evt.id} className="rounded-2xl bg-white shadow-sm ring-1 ring-border-brand overflow-hidden">
                <div className="flex">
                  {/* Date bloc */}
                  <div className="w-16 shrink-0 flex flex-col items-center justify-center bg-primary-light border-r border-border-brand py-3">
                    <span className="font-display text-[22px] font-light text-primary-brand leading-none">{dateInfo.jour}</span>
                    <span className="font-body text-[9px] font-medium uppercase tracking-wider text-primary-brand mt-0.5">{dateInfo.mois}</span>
                  </div>

                  <div className="flex-1 p-4">
                    <h3 className="font-body text-[14px] font-medium text-text-main">{evt.titre}</h3>
                    <p className="font-body text-xs text-text-mid mt-0.5 line-clamp-2">{evt.description}</p>

                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <span className="font-body text-xs text-text-muted-brand flex items-center gap-1">
                        <Clock size={10} />
                        {formatDate(evt.dateDebut)}
                      </span>
                      {evt.lieu && (
                        <span className="font-body text-xs text-text-muted-brand flex items-center gap-1">
                          <MapPin size={10} />
                          {evt.lieu}
                        </span>
                      )}
                      <span className="font-body text-xs text-text-muted-brand flex items-center gap-1">
                        <Users size={10} />
                        {evt.participantsCount}{evt.maxParticipants ? `/${evt.maxParticipants}` : ""} inscrits
                      </span>
                    </div>

                    {evt.groupe && (
                      <Link href={`/communaute/groupes/${evt.groupe.slug}`} className="inline-flex items-center gap-1 mt-1.5 font-body text-xs text-gold hover:text-gold-dark transition-colors">
                        <Users size={10} />
                        {evt.groupe.nom}
                        <ChevronRight size={10} />
                      </Link>
                    )}

                    {/* RSVP Buttons */}
                    {!isPast && (
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => handleRSVP(evt.id, "INSCRIT")}
                          disabled={rsvpLoading[evt.id]}
                          className={`flex items-center gap-1 rounded-full px-3 py-1.5 font-body text-xs font-medium transition-colors ${
                            evt.myStatut === "INSCRIT"
                              ? "bg-primary-brand text-white"
                              : "border border-border-brand text-text-mid hover:border-primary-brand hover:text-primary-brand"
                          }`}
                        >
                          <Check size={12} />
                          Inscrit
                        </button>
                        <button
                          onClick={() => handleRSVP(evt.id, "INTERESSE")}
                          disabled={rsvpLoading[evt.id]}
                          className={`flex items-center gap-1 rounded-full px-3 py-1.5 font-body text-xs font-medium transition-colors ${
                            evt.myStatut === "INTERESSE"
                              ? "bg-gold text-white"
                              : "border border-border-brand text-text-mid hover:border-gold hover:text-gold"
                          }`}
                        >
                          <Star size={12} />
                          Intéressé
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

/* ━━━━━━━━━━ Modal Création Événement ━━━━━━━━━━ */

function CreateEventModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [titre, setTitre] = useState("")
  const [description, setDescription] = useState("")
  const [lieu, setLieu] = useState("")
  const [dateDebut, setDateDebut] = useState("")
  const [dateFin, setDateFin] = useState("")
  const [maxParticipants, setMaxParticipants] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!titre.trim() || !description.trim() || !dateDebut) return
    setLoading(true)
    setError("")
    try {
      const body: Record<string, unknown> = {
        titre: titre.trim(),
        description: description.trim(),
        dateDebut: new Date(dateDebut).toISOString(),
      }
      if (lieu.trim()) body.lieu = lieu.trim()
      if (dateFin) body.dateFin = new Date(dateFin).toISOString()
      if (maxParticipants) body.maxParticipants = parseInt(maxParticipants)

      const res = await fetch("/api/communaute/evenements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        onCreated()
      } else {
        const data = await res.json()
        setError(data.error || "Erreur lors de la création")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl ring-1 ring-black/5 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-[20px] font-light text-text-main">Nouvel événement</h2>
          <button onClick={onClose} className="p-1 text-text-muted-brand hover:text-text-mid transition-colors"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-body text-xs font-medium uppercase tracking-wider text-text-muted-brand mb-1 block">Titre</label>
            <input value={titre} onChange={(e) => setTitre(e.target.value)} maxLength={200} className="w-full border border-border-brand bg-bg-page px-3 py-2.5 font-body text-[13px] text-text-main focus:border-gold focus:outline-none transition-colors" />
          </div>

          <div>
            <label className="font-body text-xs font-medium uppercase tracking-wider text-text-muted-brand mb-1 block">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={2000} className="w-full resize-none border border-border-brand bg-bg-page px-3 py-2.5 font-body text-[12px] text-text-main focus:border-gold focus:outline-none transition-colors" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-xs font-medium uppercase tracking-wider text-text-muted-brand mb-1 block">Date de début</label>
              <input type="datetime-local" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="w-full border border-border-brand bg-bg-page px-3 py-2.5 font-body text-[12px] text-text-main focus:border-gold focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="font-body text-xs font-medium uppercase tracking-wider text-text-muted-brand mb-1 block">Date de fin</label>
              <input type="datetime-local" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="w-full border border-border-brand bg-bg-page px-3 py-2.5 font-body text-[12px] text-text-main focus:border-gold focus:outline-none transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-xs font-medium uppercase tracking-wider text-text-muted-brand mb-1 block">Lieu</label>
              <input value={lieu} onChange={(e) => setLieu(e.target.value)} maxLength={200} className="w-full border border-border-brand bg-bg-page px-3 py-2.5 font-body text-[12px] text-text-main focus:border-gold focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="font-body text-xs font-medium uppercase tracking-wider text-text-muted-brand mb-1 block">Places max</label>
              <input type="number" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} min="1" className="w-full border border-border-brand bg-bg-page px-3 py-2.5 font-body text-[12px] text-text-main focus:border-gold focus:outline-none transition-colors" />
            </div>
          </div>

          {error && <p className="font-body text-xs text-danger">{error}</p>}

          <button
            type="submit"
            disabled={!titre.trim() || !description.trim() || !dateDebut || loading}
            className="w-full flex items-center justify-center gap-2 bg-primary-brand py-2.5 font-body text-xs font-medium uppercase tracking-[0.12em] text-white hover:bg-primary-dark transition-colors disabled:opacity-40"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <CalendarDays size={14} />}
            Créer l&apos;événement
          </button>
        </form>
      </div>
    </div>
  )
}
