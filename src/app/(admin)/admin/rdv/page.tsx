"use client"

import { useEffect, useState, useCallback, Fragment } from "react"
import { Check, X, Clock, Search, Eye, ChevronUp, ChevronDown, Plus, Loader2, Download } from "lucide-react"
import { formatPrix } from "@/lib/utils"

interface RDV {
  id: string
  client: string
  email: string
  soin: string
  soinId: string
  prix: number
  dateHeure: string
  statut: string
  notes: string | null
}

interface SoinOption {
  id: string
  nom: string
}

const statutLabels: Record<string, string> = {
  EN_ATTENTE: "En attente",
  CONFIRME: "Confirmé",
  ANNULE: "Annulé",
  TERMINE: "Terminé",
}

const statutColors: Record<string, string> = {
  EN_ATTENTE: "bg-yellow-100 text-yellow-700",
  CONFIRME: "bg-green-100 text-green-700",
  ANNULE: "bg-red-100 text-red-700",
  TERMINE: "bg-blue-100 text-blue-700",
}

type SortKey = "client" | "soin" | "dateHeure" | "statut"

export default function AdminRDVPage() {
  const [rdvs, setRdvs] = useState<RDV[]>([])
  const [loading, setLoading] = useState(true)
  const [filtreStatut, setFiltreStatut] = useState("")
  const [filtreDate, setFiltreDate] = useState("")
  const [filtreSoin, setFiltreSoin] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [soinsOptions, setSoinsOptions] = useState<SoinOption[]>([])
  const [sortKey, setSortKey] = useState<SortKey>("dateHeure")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [detailId, setDetailId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [clients, setClients] = useState<{ id: string; nom: string; prenom: string; email: string }[]>([])
  const [rdvForm, setRdvForm] = useState({ userId: "", soinId: "", dateHeure: "", notes: "" })
  const [rdvSaving, setRdvSaving] = useState(false)
  const [clientSearch, setClientSearch] = useState("")
  const limit = 20

  useEffect(() => {
    fetch("/api/admin/soins")
      .then((r) => r.json())
      .then((d) => setSoinsOptions(d.soins?.map((s: SoinOption) => ({ id: s.id, nom: s.nom })) || []))
      .catch(() => {})
  }, [])

  const fetchRDV = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (filtreStatut) params.set("statut", filtreStatut)
    if (filtreDate) params.set("date", filtreDate)
    if (filtreSoin) params.set("soinId", filtreSoin)
    if (search) params.set("search", search)
    const res = await fetch(`/api/admin/rdv?${params}`)
    const data = await res.json()
    setRdvs(data.rdvs || [])
    setTotal(data.total || 0)
    setLoading(false)
  }, [page, filtreStatut, filtreDate, filtreSoin, search])

  useEffect(() => { fetchRDV() }, [fetchRDV])

  const updateStatut = async (id: string, statut: string) => {
    await fetch(`/api/admin/rdv/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut }),
    })
    fetchRDV()
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const sorted = [...rdvs].sort((a, b) => {
    const va = a[sortKey]
    const vb = b[sortKey]
    const cmp = va < vb ? -1 : va > vb ? 1 : 0
    return sortDir === "asc" ? cmp : -cmp
  })

  const totalPages = Math.ceil(total / limit)

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronUp className="h-3 w-3 opacity-30" />
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
  }

  async function openCreateModal() {
    setShowCreate(true)
    setRdvForm({ userId: "", soinId: "", dateHeure: "", notes: "" })
    setClientSearch("")
    try {
      const res = await fetch("/api/admin/clients?limit=100")
      if (res.ok) {
        const data = await res.json()
        setClients(data.clients?.map((c: { id: string; nom: string; prenom: string; email: string }) => ({ id: c.id, nom: c.nom, prenom: c.prenom, email: c.email })) || [])
      }
    } catch { /* ignore */ }
  }

  async function handleCreateRdv(e: React.FormEvent) {
    e.preventDefault()
    setRdvSaving(true)
    try {
      const res = await fetch("/api/admin/rdv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rdvForm),
      })
      if (res.ok) {
        setShowCreate(false)
        fetchRDV()
      }
    } catch { /* ignore */ }
    setRdvSaving(false)
  }

  const filteredClients = clients.filter((c) => {
    if (!clientSearch) return true
    const s = clientSearch.toLowerCase()
    return `${c.prenom} ${c.nom}`.toLowerCase().includes(s) || c.email.toLowerCase().includes(s)
  })

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filtreStatut}
          onChange={(e) => { setFiltreStatut(e.target.value); setPage(1) }}
          className="border border-border-brand px-3 py-2 text-sm bg-white font-body"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(statutLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <input
          type="date"
          value={filtreDate}
          onChange={(e) => { setFiltreDate(e.target.value); setPage(1) }}
          className="border border-border-brand px-3 py-2 text-sm bg-white font-body"
        />

        <select
          value={filtreSoin}
          onChange={(e) => { setFiltreSoin(e.target.value); setPage(1) }}
          className="border border-border-brand px-3 py-2 text-sm bg-white font-body"
        >
          <option value="">Tous les soins</option>
          {soinsOptions.map((s) => (
            <option key={s.id} value={s.id}>{s.nom}</option>
          ))}
        </select>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted-brand" />
          <input
            type="text"
            placeholder="Rechercher un client…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9 pr-4 py-2 border border-border-brand text-sm bg-white font-body w-56"
          />
        </div>

        <button
          onClick={() => window.open("/api/admin/export?type=rdv", "_blank")}
          className="ml-auto flex items-center gap-1.5 px-3 py-2 border border-border-brand font-body text-[11px] uppercase tracking-widest text-text-mid hover:bg-bg-page transition-colors"
        >
          <Download className="h-3.5 w-3.5" /> CSV
        </button>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary-brand text-white font-body text-[11px] uppercase tracking-widest hover:bg-primary-dark transition-colors"
        >
          <Plus size={14} /> Nouveau RDV
        </button>
      </div>

      {/* Tableau */}
      <div className="bg-white border border-border-brand overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="h-6 w-6 border-4 border-primary-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-page">
                <tr>
                  {([["client", "Client"], ["soin", "Soin"], ["dateHeure", "Date & Heure"], ["statut", "Statut"]] as [SortKey, string][]).map(([key, label]) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      className="text-left px-4 py-3 font-body text-[11px] uppercase tracking-[0.1em] text-text-muted-brand font-medium cursor-pointer select-none hover:text-text-main"
                    >
                      <span className="inline-flex items-center gap-1">
                        {label} <SortIcon col={key} />
                      </span>
                    </th>
                  ))}
                  <th className="text-left px-4 py-3 font-body text-[11px] uppercase tracking-[0.1em] text-text-muted-brand font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((rdv) => (
                  <Fragment key={rdv.id}>
                    <tr className="border-t border-border-brand hover:bg-bg-page">
                      <td className="px-4 py-3">
                        <div className="text-text-main font-medium font-body text-[13px]">{rdv.client}</div>
                        <div className="text-text-muted-brand text-xs font-body">{rdv.email}</div>
                      </td>
                      <td className="px-4 py-3 text-text-main font-body text-[13px]">{rdv.soin}</td>
                      <td className="px-4 py-3 text-text-mid font-body text-[13px]">
                        {new Date(rdv.dateHeure).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                        {" "}
                        {new Date(rdv.dateHeure).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-[10px] font-medium font-body uppercase tracking-wider ${statutColors[rdv.statut] || ""}`}>
                          {statutLabels[rdv.statut] || rdv.statut}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {rdv.statut === "EN_ATTENTE" && (
                            <>
                              <button
                                onClick={() => updateStatut(rdv.id, "CONFIRME")}
                                className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                                title="Confirmer"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => updateStatut(rdv.id, "ANNULE")}
                                className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                title="Annuler"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {rdv.statut === "CONFIRME" && (
                            <>
                              <button
                                onClick={() => updateStatut(rdv.id, "TERMINE")}
                                className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                title="Terminer"
                              >
                                <Clock className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => updateStatut(rdv.id, "ANNULE")}
                                className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                title="Annuler"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setDetailId(detailId === rdv.id ? null : rdv.id)}
                            className="p-1.5 bg-primary-light text-primary-brand hover:bg-primary-lighter transition-colors"
                            title="Voir détail"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {detailId === rdv.id && (
                      <tr className="bg-bg-page">
                        <td colSpan={5} className="px-6 py-4">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm font-body">
                            <div>
                              <span className="text-text-muted-brand text-[11px] uppercase tracking-wider block">Prix</span>
                              <span className="text-text-main font-medium">{formatPrix(rdv.prix)}</span>
                            </div>
                            <div>
                              <span className="text-text-muted-brand text-[11px] uppercase tracking-wider block">Email</span>
                              <span className="text-text-main">{rdv.email}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-text-muted-brand text-[11px] uppercase tracking-wider block">Notes</span>
                              <span className="text-text-mid">{rdv.notes || "Aucune note"}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
                {rdvs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-text-muted-brand font-body">Aucun rendez-vous trouvé</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border-brand">
            <p className="text-sm text-text-muted-brand font-body">{total} résultat(s)</p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 text-sm border border-border-brand disabled:opacity-50 font-body"
              >
                Préc.
              </button>
              <span className="text-sm text-text-muted-brand font-body">{page}/{totalPages}</span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 text-sm border border-border-brand disabled:opacity-50 font-body"
              >
                Suiv.
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Création RDV */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false) }}>
          <div className="bg-white max-w-lg w-full mx-4 border border-border-brand p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-[20px] font-light text-text-main">Nouveau rendez-vous</h2>
              <button onClick={() => setShowCreate(false)}><X className="h-4 w-4 text-text-muted-brand" /></button>
            </div>
            <form onSubmit={handleCreateRdv} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-text-muted-brand font-body mb-1">Client</label>
                <input
                  type="text"
                  placeholder="Rechercher un client…"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-border-brand font-body text-[13px] focus:outline-none focus:border-primary-brand mb-2"
                />
                <select
                  required
                  value={rdvForm.userId}
                  onChange={(e) => setRdvForm((f) => ({ ...f, userId: e.target.value }))}
                  className="w-full px-3 py-2 border border-border-brand font-body text-[13px] focus:outline-none focus:border-primary-brand"
                >
                  <option value="">Sélectionner un client</option>
                  {filteredClients.map((c) => (
                    <option key={c.id} value={c.id}>{c.prenom} {c.nom} — {c.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-text-muted-brand font-body mb-1">Soin</label>
                <select
                  required
                  value={rdvForm.soinId}
                  onChange={(e) => setRdvForm((f) => ({ ...f, soinId: e.target.value }))}
                  className="w-full px-3 py-2 border border-border-brand font-body text-[13px] focus:outline-none focus:border-primary-brand"
                >
                  <option value="">Sélectionner un soin</option>
                  {soinsOptions.map((s) => (
                    <option key={s.id} value={s.id}>{s.nom}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-text-muted-brand font-body mb-1">Date & Heure</label>
                <input
                  type="datetime-local"
                  required
                  value={rdvForm.dateHeure}
                  onChange={(e) => setRdvForm((f) => ({ ...f, dateHeure: e.target.value }))}
                  className="w-full px-3 py-2 border border-border-brand font-body text-[13px] focus:outline-none focus:border-primary-brand"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-text-muted-brand font-body mb-1">Notes</label>
                <textarea
                  value={rdvForm.notes}
                  onChange={(e) => setRdvForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-border-brand font-body text-[13px] focus:outline-none focus:border-primary-brand resize-none"
                />
              </div>
              <button type="submit" disabled={rdvSaving} className="w-full py-2.5 bg-primary-brand text-white font-body text-[11px] uppercase tracking-widest hover:bg-primary-dark transition-colors disabled:opacity-50">
                {rdvSaving ? "Création…" : "Créer le rendez-vous"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
