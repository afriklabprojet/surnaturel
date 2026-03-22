"use client"

import { useState, useEffect, useCallback } from "react"
import { Star, Eye, EyeOff, Trash2, Loader2, ChevronLeft, ChevronRight, Download } from "lucide-react"

interface AvisItem {
  id: string
  note: number
  commentaire: string | null
  publie: boolean
  createdAt: string
  user: { nom: string; prenom: string; email: string; photoUrl: string | null }
  soin: string
  dateRdv: string
}

function Avatar({ user, size = 32 }: { user: { prenom: string; nom: string; photoUrl?: string | null }; size?: number }) {
  const initials = `${user.prenom?.[0] ?? ""}${user.nom?.[0] ?? ""}`.toUpperCase()
  if (user.photoUrl) {
    return <img src={user.photoUrl} alt="" className="rounded-full object-cover" style={{ width: size, height: size }} />
  }
  return (
    <div className="flex items-center justify-center rounded-full bg-primary-brand text-white font-body font-medium" style={{ width: size, height: size, fontSize: size * 0.34 }}>
      {initials}
    </div>
  )
}

function Stars({ note }: { note: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={14} className={n <= note ? "fill-gold text-gold" : "text-border-brand"} />
      ))}
    </div>
  )
}

export default function PageAdminAvis() {
  const [avis, setAvis] = useState<AvisItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filtrePublie, setFiltrePublie] = useState<string>("all")
  const [filtreNote, setFiltreNote] = useState<string>("all")
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  const limit = 20

  const fetchAvis = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (filtrePublie !== "all") params.set("publie", filtrePublie)
      if (filtreNote !== "all") params.set("note", filtreNote)
      const res = await fetch(`/api/admin/avis?${params}`)
      if (res.ok) {
        const data = await res.json()
        setAvis(data.avis)
        setTotal(data.total)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [page, filtrePublie, filtreNote])

  useEffect(() => { fetchAvis() }, [fetchAvis])

  async function togglePublie(id: string, publie: boolean) {
    setActionLoading((p) => ({ ...p, [id]: true }))
    try {
      const res = await fetch(`/api/admin/avis/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publie: !publie }),
      })
      if (res.ok) {
        setAvis((prev) => prev.map((a) => a.id === id ? { ...a, publie: !publie } : a))
      }
    } catch { /* ignore */ }
    setActionLoading((p) => ({ ...p, [id]: false }))
  }

  async function supprimer(id: string) {
    if (!confirm("Supprimer cet avis ?")) return
    setActionLoading((p) => ({ ...p, [id]: true }))
    try {
      const res = await fetch(`/api/admin/avis/${id}`, { method: "DELETE" })
      if (res.ok) {
        setAvis((prev) => prev.filter((a) => a.id !== id))
        setTotal((t) => t - 1)
      }
    } catch { /* ignore */ }
    setActionLoading((p) => ({ ...p, [id]: false }))
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="font-body text-[11px] uppercase tracking-widest text-text-muted-brand">Statut :</span>
          {[
            { key: "all", label: "Tous" },
            { key: "false", label: "En attente" },
            { key: "true", label: "Publiés" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => { setFiltrePublie(f.key); setPage(1) }}
              className={`px-2.5 py-1 font-body text-[10px] uppercase tracking-widest border transition-colors ${
                filtrePublie === f.key ? "border-primary-brand bg-primary-light text-primary-brand" : "border-border-brand text-text-muted-brand hover:text-text-mid"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-body text-[11px] uppercase tracking-widest text-text-muted-brand">Note :</span>
          {["all", "5", "4", "3", "2", "1"].map((n) => (
            <button
              key={n}
              onClick={() => { setFiltreNote(n); setPage(1) }}
              className={`px-2.5 py-1 font-body text-[10px] uppercase tracking-widest border transition-colors ${
                filtreNote === n ? "border-primary-brand bg-primary-light text-primary-brand" : "border-border-brand text-text-muted-brand hover:text-text-mid"
              }`}
            >
              {n === "all" ? "Toutes" : `${n}★`}
            </button>
          ))}
        </div>

        <span className="ml-auto font-body text-[12px] text-text-muted-brand">{total} avis</span>
        <button
          onClick={() => window.open("/api/admin/export?type=avis", "_blank")}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-border-brand font-body text-[11px] uppercase tracking-widest text-text-mid hover:bg-bg-page transition-colors"
        >
          <Download className="h-3.5 w-3.5" /> CSV
        </button>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center min-h-100">
          <Loader2 className="h-8 w-8 animate-spin text-primary-brand" />
        </div>
      ) : avis.length === 0 ? (
        <div className="border border-border-brand bg-white p-12 text-center">
          <Star size={36} className="mx-auto text-gold mb-2" />
          <p className="font-body text-[14px] text-text-muted-brand">Aucun avis trouvé</p>
        </div>
      ) : (
        <div className="space-y-3">
          {avis.map((a) => (
            <div key={a.id} className="border border-border-brand bg-white p-5">
              <div className="flex items-start gap-4">
                <Avatar user={a.user} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-body text-[13px] font-medium text-text-main">
                      {a.user.prenom} {a.user.nom}
                    </span>
                    <Stars note={a.note} />
                    <span className={`px-2 py-0.5 font-body text-[10px] uppercase tracking-widest ${
                      a.publie ? "bg-primary-light text-primary-brand" : "bg-gold-light text-gold-dark"
                    }`}>
                      {a.publie ? "Publié" : "En attente"}
                    </span>
                  </div>
                  <p className="font-body text-[11px] text-text-muted-brand mb-2">
                    {a.soin} — {new Date(a.dateRdv).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  {a.commentaire && (
                    <p className="font-body text-[13px] text-text-mid leading-relaxed">{a.commentaire}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => togglePublie(a.id, a.publie)}
                    disabled={actionLoading[a.id]}
                    className="p-2 hover:bg-bg-page transition-colors"
                    title={a.publie ? "Masquer" : "Publier"}
                  >
                    {a.publie ? <EyeOff size={16} className="text-text-muted-brand" /> : <Eye size={16} className="text-primary-brand" />}
                  </button>
                  <button
                    onClick={() => supprimer(a.id)}
                    disabled={actionLoading[a.id]}
                    className="p-2 hover:bg-red-50 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1 px-3 py-1.5 font-body text-[11px] uppercase tracking-widest border border-border-brand hover:bg-bg-page disabled:opacity-40 transition-colors"
          >
            <ChevronLeft size={14} /> Préc.
          </button>
          <span className="font-body text-[12px] text-text-muted-brand">{page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-1 px-3 py-1.5 font-body text-[11px] uppercase tracking-widest border border-border-brand hover:bg-bg-page disabled:opacity-40 transition-colors"
          >
            Suiv. <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
