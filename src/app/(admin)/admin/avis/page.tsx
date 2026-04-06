"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Star, Eye, EyeOff, Trash2, Loader2, ChevronLeft, ChevronRight, Download, CheckSquare, Square, X, AlertTriangle, ShoppingBag, Stethoscope, MessageSquare } from "lucide-react"

type TabType = "soins" | "produits"

interface AvisItem {
  id: string
  note: number
  titre?: string | null
  commentaire: string | null
  publie: boolean
  signale: boolean
  raisonRejet: string | null
  moderePar: string | null
  modereAt: string | null
  createdAt: string
  user: { nom: string; prenom: string; email: string; photoUrl: string | null }
  soin?: string
  produit?: string
  dateRdv?: string
  verifie?: boolean
}

function Avatar({ user, size = 32 }: { user: { prenom: string; nom: string; photoUrl?: string | null }; size?: number }) {
  const initials = `${user.prenom?.[0] ?? ""}${user.nom?.[0] ?? ""}`.toUpperCase()
  if (user.photoUrl) {
    return <Image src={user.photoUrl} alt="" className="rounded-full object-cover" width={size} height={size} />
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
  const [tab, setTab] = useState<TabType>("soins")
  const [avis, setAvis] = useState<AvisItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filtrePublie, setFiltrePublie] = useState<string>("all")
  const [filtreNote, setFiltreNote] = useState<string>("all")
  const [filtreSignale, setFiltreSignale] = useState(false)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [rejetModal, setRejetModal] = useState<{ id: string; type: TabType } | null>(null)
  const [raisonRejet, setRaisonRejet] = useState("")

  const limit = 20

  const apiBase = tab === "soins" ? "/api/admin/avis" : "/api/admin/avis-produits"

  const fetchAvis = useCallback(async () => {
    setLoading(true)
    setSelected(new Set())
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (filtrePublie !== "all") params.set("publie", filtrePublie)
      if (filtreNote !== "all") params.set("note", filtreNote)
      if (filtreSignale) params.set("signale", "true")
      const res = await fetch(`${apiBase}?${params}`)
      if (res.ok) {
        const data = await res.json()
        setAvis(data.avis)
        setTotal(data.total)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [page, filtrePublie, filtreNote, filtreSignale, apiBase])

  useEffect(() => { fetchAvis() }, [fetchAvis])

  // Reset filters on tab change
  useEffect(() => {
    setPage(1)
    setFiltrePublie("all")
    setFiltreNote("all")
    setFiltreSignale(false)
    setSelected(new Set())
  }, [tab])

  async function togglePublie(id: string, publie: boolean) {
    setActionLoading((p) => ({ ...p, [id]: true }))
    try {
      const detailBase = tab === "soins" ? "/api/admin/avis" : "/api/admin/avis-produits"
      const res = await fetch(`${detailBase}/${id}`, {
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

  async function rejeter(id: string) {
    if (!raisonRejet.trim()) return
    setActionLoading((p) => ({ ...p, [id]: true }))
    try {
      const detailBase = tab === "soins" ? "/api/admin/avis" : "/api/admin/avis-produits"
      const res = await fetch(`${detailBase}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publie: false, raisonRejet: raisonRejet.trim() }),
      })
      if (res.ok) {
        setAvis((prev) => prev.map((a) => a.id === id ? { ...a, publie: false, raisonRejet: raisonRejet.trim(), signale: false } : a))
      }
    } catch { /* ignore */ }
    setActionLoading((p) => ({ ...p, [id]: false }))
    setRejetModal(null)
    setRaisonRejet("")
  }

  async function supprimer(id: string) {
    if (!confirm("Supprimer cet avis ?")) return
    setActionLoading((p) => ({ ...p, [id]: true }))
    try {
      const detailBase = tab === "soins" ? "/api/admin/avis" : "/api/admin/avis-produits"
      const res = await fetch(`${detailBase}/${id}`, { method: "DELETE" })
      if (res.ok) {
        setAvis((prev) => prev.filter((a) => a.id !== id))
        setTotal((t) => t - 1)
      }
    } catch { /* ignore */ }
    setActionLoading((p) => ({ ...p, [id]: false }))
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === avis.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(avis.map((a) => a.id)))
    }
  }

  async function bulkPublier(publie: boolean) {
    if (selected.size === 0) return
    setBulkLoading(true)
    try {
      const detailBase = tab === "soins" ? "/api/admin/avis" : "/api/admin/avis-produits"
      await Promise.all(
        Array.from(selected).map((id) =>
          fetch(`${detailBase}/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ publie }),
          })
        )
      )
      await fetchAvis()
    } catch { /* ignore */ }
    setBulkLoading(false)
  }

  async function bulkSupprimer() {
    if (selected.size === 0) return
    if (!confirm(`Supprimer ${selected.size} avis sélectionné(s) ?`)) return
    setBulkLoading(true)
    try {
      const detailBase = tab === "soins" ? "/api/admin/avis" : "/api/admin/avis-produits"
      await Promise.all(
        Array.from(selected).map((id) =>
          fetch(`${detailBase}/${id}`, { method: "DELETE" })
        )
      )
      await fetchAvis()
    } catch { /* ignore */ }
    setBulkLoading(false)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      {/* Tabs Soins / Produits */}
      <div className="flex items-center gap-1 border-b border-border-brand">
        <button
          onClick={() => setTab("soins")}
          className={`flex items-center gap-2 px-4 py-2.5 font-body text-xs uppercase tracking-widest border-b-2 transition-colors ${
            tab === "soins" ? "border-primary-brand text-primary-brand" : "border-transparent text-text-muted-brand hover:text-text-mid"
          }`}
        >
          <Stethoscope size={14} /> Avis soins
        </button>
        <button
          onClick={() => setTab("produits")}
          className={`flex items-center gap-2 px-4 py-2.5 font-body text-xs uppercase tracking-widest border-b-2 transition-colors ${
            tab === "produits" ? "border-primary-brand text-primary-brand" : "border-transparent text-text-muted-brand hover:text-text-mid"
          }`}
        >
          <ShoppingBag size={14} /> Avis produits
        </button>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="font-body text-xs uppercase tracking-widest text-text-muted-brand">Statut :</span>
          {[
            { key: "all", label: "Tous" },
            { key: "false", label: "En attente" },
            { key: "true", label: "Publiés" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => { setFiltrePublie(f.key); setPage(1) }}
              className={`px-2.5 py-1 font-body text-xs uppercase tracking-widest border transition-colors ${
                filtrePublie === f.key ? "border-primary-brand bg-primary-light text-primary-brand" : "border-border-brand text-text-muted-brand hover:text-text-mid"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-body text-xs uppercase tracking-widest text-text-muted-brand">Note :</span>
          {["all", "5", "4", "3", "2", "1"].map((n) => (
            <button
              key={n}
              onClick={() => { setFiltreNote(n); setPage(1) }}
              className={`px-2.5 py-1 font-body text-xs uppercase tracking-widest border transition-colors ${
                filtreNote === n ? "border-primary-brand bg-primary-light text-primary-brand" : "border-border-brand text-text-muted-brand hover:text-text-mid"
              }`}
            >
              {n === "all" ? "Toutes" : `${n}★`}
            </button>
          ))}
        </div>

        <button
          onClick={() => { setFiltreSignale(!filtreSignale); setPage(1) }}
          className={`flex items-center gap-1.5 px-2.5 py-1 font-body text-xs uppercase tracking-widest border transition-colors ${
            filtreSignale ? "border-red-400 bg-red-50 text-red-600" : "border-border-brand text-text-muted-brand hover:text-text-mid"
          }`}
        >
          <AlertTriangle size={12} /> Signalés
        </button>

        <span className="ml-auto font-body text-[12px] text-text-muted-brand">{total} avis</span>
        {tab === "soins" && (
          <button
            onClick={() => window.open("/api/admin/export?type=avis", "_blank")}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border-brand font-body text-xs uppercase tracking-widest text-text-mid hover:bg-bg-page transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
        )}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-primary-brand/5 border border-primary-brand/20">
          <span className="font-body text-sm text-primary-brand font-medium">{selected.size} sélectionné(s)</span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => bulkPublier(true)}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-brand text-white font-body text-xs uppercase tracking-widest hover:bg-primary-dark disabled:opacity-50 transition-colors"
            >
              <Eye className="h-3.5 w-3.5" /> Publier tout
            </button>
            <button
              onClick={() => bulkPublier(false)}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border-brand text-text-mid font-body text-xs uppercase tracking-widest hover:bg-bg-page disabled:opacity-50 transition-colors"
            >
              <EyeOff className="h-3.5 w-3.5" /> Masquer tout
            </button>
            <button
              onClick={bulkSupprimer}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white font-body text-xs uppercase tracking-widest hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> Supprimer
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="p-1.5 text-text-muted-brand hover:text-text-main transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

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
          {/* Select all */}
          <div className="flex items-center gap-2 px-1">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 font-body text-xs text-text-muted-brand hover:text-text-main transition-colors"
            >
              {selected.size === avis.length && avis.length > 0 ? (
                <CheckSquare size={15} className="text-primary-brand" />
              ) : (
                <Square size={15} />
              )}
              Tout sélectionner
            </button>
          </div>

          {avis.map((a) => (
            <div
              key={a.id}
              className={`border bg-white p-5 transition-colors ${
                a.signale ? "border-red-300 bg-red-50/30" :
                selected.has(a.id) ? "border-primary-brand/40 bg-primary-brand/2" : "border-border-brand"
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <button
                  onClick={() => toggleSelect(a.id)}
                  className="mt-1 shrink-0 text-text-muted-brand hover:text-primary-brand transition-colors"
                >
                  {selected.has(a.id) ? (
                    <CheckSquare size={16} className="text-primary-brand" />
                  ) : (
                    <Square size={16} />
                  )}
                </button>

                <Avatar user={a.user} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="font-body text-[13px] font-medium text-text-main">
                      {a.user.prenom} {a.user.nom}
                    </span>
                    <Stars note={a.note} />
                    <span className={`px-2 py-0.5 font-body text-xs uppercase tracking-widest ${
                      a.publie ? "bg-primary-light text-primary-brand" : "bg-gold-light text-gold-dark"
                    }`}>
                      {a.publie ? "Publié" : "En attente"}
                    </span>
                    {a.signale && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 font-body text-xs uppercase tracking-widest">
                        <AlertTriangle size={10} /> Signalé
                      </span>
                    )}
                    {a.verifie && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 font-body text-xs uppercase tracking-widest">
                        Achat vérifié
                      </span>
                    )}
                  </div>
                  <p className="font-body text-xs text-text-muted-brand mb-2">
                    {a.soin ?? a.produit}
                    {a.dateRdv && <> — {new Date(a.dateRdv).toLocaleDateString("fr", { day: "numeric", month: "long", year: "numeric" })}</>}
                  </p>
                  {a.titre && (
                    <p className="font-body text-[13px] font-medium text-text-main mb-1">{a.titre}</p>
                  )}
                  {a.commentaire && (
                    <p className="font-body text-[13px] text-text-mid leading-relaxed">{a.commentaire}</p>
                  )}
                  {a.raisonRejet && (
                    <p className="mt-2 font-body text-xs text-red-600 bg-red-50 px-3 py-1.5 border border-red-200">
                      <strong>Motif de rejet :</strong> {a.raisonRejet}
                    </p>
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
                    onClick={() => { setRejetModal({ id: a.id, type: tab }); setRaisonRejet("") }}
                    disabled={actionLoading[a.id]}
                    className="p-2 hover:bg-amber-50 transition-colors"
                    title="Rejeter avec motif"
                  >
                    <MessageSquare size={16} className="text-amber-600" />
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
            className="flex items-center gap-1 px-3 py-1.5 font-body text-xs uppercase tracking-widest border border-border-brand hover:bg-bg-page disabled:opacity-40 transition-colors"
          >
            <ChevronLeft size={14} /> Préc.
          </button>
          <span className="font-body text-[12px] text-text-muted-brand">{page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-1 px-3 py-1.5 font-body text-xs uppercase tracking-widest border border-border-brand hover:bg-bg-page disabled:opacity-40 transition-colors"
          >
            Suiv. <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Modal rejet */}
      {rejetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md bg-white border border-border-brand p-6 space-y-4">
            <h3 className="font-heading text-lg text-text-main">Rejeter cet avis</h3>
            <textarea
              value={raisonRejet}
              onChange={(e) => setRaisonRejet(e.target.value)}
              placeholder="Motif du rejet (ex: contenu inapproprié, hors sujet...)"
              className="w-full border border-border-brand p-3 font-body text-sm text-text-main resize-none focus:outline-none focus:border-primary-brand"
              rows={3}
              maxLength={500}
            />
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => { setRejetModal(null); setRaisonRejet("") }}
                className="px-4 py-2 font-body text-xs uppercase tracking-widest border border-border-brand text-text-mid hover:bg-bg-page transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => rejeter(rejetModal.id)}
                disabled={!raisonRejet.trim() || actionLoading[rejetModal.id]}
                className="px-4 py-2 font-body text-xs uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                Rejeter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
