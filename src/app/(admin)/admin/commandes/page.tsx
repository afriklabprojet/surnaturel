"use client"

import { useEffect, useState } from "react"
import { Download } from "lucide-react"
import { formatPrix } from "@/lib/utils"

interface Commande {
  id: string
  client: string
  email: string
  total: number
  statut: string
  paiementId: string | null
  createdAt: string
  lignes: { produit: string; quantite: number; prixUnitaire: number }[]
}

const statutLabels: Record<string, string> = {
  EN_ATTENTE: "En attente",
  PAYEE: "Payée",
  EN_PREPARATION: "En préparation",
  EXPEDIEE: "Expédiée",
  LIVREE: "Livrée",
  ANNULEE: "Annulée",
}

const statutColors: Record<string, string> = {
  EN_ATTENTE: "bg-gold/10 text-gold",
  PAYEE: "bg-primary-brand/10 text-primary-brand",
  EN_PREPARATION: "bg-purple-100 text-purple-700",
  EXPEDIEE: "bg-indigo-100 text-indigo-700",
  LIVREE: "bg-emerald-100 text-emerald-700",
  ANNULEE: "bg-red-100 text-red-700",
}

const statutTransitions: Record<string, string[]> = {
  EN_ATTENTE: ["ANNULEE"],
  PAYEE: ["EN_PREPARATION", "ANNULEE"],
  EN_PREPARATION: ["EXPEDIEE"],
  EXPEDIEE: ["LIVREE"],
}

export default function AdminCommandesPage() {
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [loading, setLoading] = useState(true)
  const [filtreStatut, setFiltreStatut] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)
  const limit = 20

  const fetchCommandes = async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (filtreStatut) params.set("statut", filtreStatut)
    const res = await fetch(`/api/admin/commandes?${params}`)
    const data = await res.json()
    setCommandes(data.commandes)
    setTotal(data.total)
    setLoading(false)
  }

  useEffect(() => { fetchCommandes() }, [page, filtreStatut])

  const updateStatut = async (id: string, statut: string) => {
    await fetch(`/api/admin/commandes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut }),
    })
    fetchCommandes()
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="font-body text-sm text-gray-500">{total} commande(s)</p>
          <button
            onClick={() => window.open("/api/admin/export?type=commandes", "_blank")}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border-brand font-body text-[11px] uppercase tracking-widest text-text-mid hover:bg-bg-page transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
        </div>
        <select
          value={filtreStatut}
          onChange={(e) => { setFiltreStatut(e.target.value); setPage(1) }}
          className="border border-border-brand px-3 py-2 text-sm font-body bg-white focus:outline-none focus:border-primary-brand"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(statutLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-border-brand overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="h-6 w-6 border-4 border-primary-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead className="bg-bg-page">
                <tr>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-widest text-gray-500 font-medium">Client</th>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-widest text-gray-500 font-medium">Total</th>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-widest text-gray-500 font-medium">Date</th>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-widest text-gray-500 font-medium">Statut</th>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-widest text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {commandes.map((cmd) => (
                  <>
                    <tr
                      key={cmd.id}
                      className="border-t border-border-brand hover:bg-bg-page cursor-pointer transition-colors"
                      onClick={() => setExpanded(expanded === cmd.id ? null : cmd.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="text-text-main font-medium">{cmd.client}</div>
                        <div className="text-gray-500 text-xs">{cmd.email}</div>
                      </td>
                      <td className="px-4 py-3 text-text-main font-medium">{formatPrix(cmd.total)}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(cmd.createdAt).toLocaleDateString("fr")}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs font-medium ${statutColors[cmd.statut] || ""}`}>
                          {statutLabels[cmd.statut] || cmd.statut}
                        </span>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1 flex-wrap">
                          {(statutTransitions[cmd.statut] || []).map((s) => (
                            <button
                              key={s}
                              onClick={() => updateStatut(cmd.id, s)}
                              className="px-2 py-1 text-xs font-medium bg-primary-brand/10 text-primary-brand hover:bg-primary-brand/20 transition-colors"
                            >
                              → {statutLabels[s]}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                    {expanded === cmd.id && (
                      <tr key={`${cmd.id}-detail`} className="bg-bg-page">
                        <td colSpan={5} className="px-4 py-3">
                          <div className="text-[11px] uppercase tracking-widest text-gray-500 mb-2 font-medium">Détail de la commande</div>
                          <ul className="space-y-1">
                            {cmd.lignes.map((l, i) => (
                              <li key={i} className="text-sm text-text-main">
                                {l.quantite}× {l.produit} — {formatPrix(l.prixUnitaire)}
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
                {commandes.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Aucune commande</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border-brand">
            <p className="text-sm text-gray-500 font-body">{total} commande(s)</p>
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 text-sm border border-border-brand disabled:opacity-50 font-body hover:bg-bg-page transition-colors">Préc.</button>
              <span className="text-sm text-gray-500 font-body">{page}/{totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 text-sm border border-border-brand disabled:opacity-50 font-body hover:bg-bg-page transition-colors">Suiv.</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
