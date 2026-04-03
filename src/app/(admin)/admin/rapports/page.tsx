"use client"

import { useState } from "react"
import { Loader2, Download, BarChart3, Users, Calendar, ShoppingBag, Star, Gift, Coins, TrendingUp, Percent } from "lucide-react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts"

interface Rapport {
  periode: { debut: string; fin: string }
  clients: { total: number; nouveaux: number }
  rdv: { total: number; parStatut: Record<string, number>; tauxConversion: number }
  commandes: { total: number; ca: number }
  avis: { total: number; moyenne: number }
  parrainages: { total: number }
  fidelite: { totalPoints: number }
  revenuMensuel: { mois: string; ca: number; rdv: number }[]
  soinsPopulaires: { nom: string; count: number }[]
}

const RDV_STATUT_LABELS: Record<string, string> = {
  EN_ATTENTE: "En attente",
  CONFIRME: "Confirmé",
  ANNULE: "Annulé",
  TERMINE: "Terminé",
}

const PIE_COLORS: Record<string, string> = {
  EN_ATTENTE: "var(--color-gold)",
  CONFIRME: "var(--color-primary-brand)",
  ANNULE: "var(--color-danger)",
  TERMINE: "#3B82F6",
}

export default function PageAdminRapports() {
  const [debut, setDebut] = useState("")
  const [fin, setFin] = useState("")
  const [rapport, setRapport] = useState<Rapport | null>(null)
  const [loading, setLoading] = useState(false)

  async function fetchRapport() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debut) params.set("debut", debut)
      if (fin) params.set("fin", fin)
      const res = await fetch(`/api/admin/rapports?${params}`)
      if (res.ok) setRapport(await res.json())
    } catch { /* ignore */ }
    setLoading(false)
  }

  function exportCSV() {
    const params = new URLSearchParams({ format: "csv" })
    if (debut) params.set("debut", debut)
    if (fin) params.set("fin", fin)
    window.open(`/api/admin/rapports?${params}`, "_blank")
  }

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <label className="font-body text-xs uppercase tracking-widest text-text-muted-brand">Début</label>
          <input
            type="date"
            value={debut}
            onChange={(e) => setDebut(e.target.value)}
            className="mt-1 block px-3 py-2 border border-border-brand font-body text-[13px] bg-white focus:outline-none focus:border-primary-brand"
          />
        </div>
        <div>
          <label className="font-body text-xs uppercase tracking-widest text-text-muted-brand">Fin</label>
          <input
            type="date"
            value={fin}
            onChange={(e) => setFin(e.target.value)}
            className="mt-1 block px-3 py-2 border border-border-brand font-body text-[13px] bg-white focus:outline-none focus:border-primary-brand"
          />
        </div>
        <div className="flex items-end gap-2">
          <button
            onClick={fetchRapport}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary-brand text-white font-body text-xs uppercase tracking-widest hover:bg-primary-brand/90 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <BarChart3 size={14} />} Générer
          </button>
          {rapport && (
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-4 py-2 border border-border-brand font-body text-xs uppercase tracking-widest text-text-mid hover:bg-bg-page transition-colors"
            >
              <Download size={14} /> CSV
            </button>
          )}
        </div>
      </div>

      {/* Résultats */}
      {rapport && (
        <div className="space-y-6">
          <p className="font-body text-[12px] text-text-muted-brand">
            Période : {rapport.periode.debut === "tout" ? "Toutes les données" : `${rapport.periode.debut} → ${rapport.periode.fin === "tout" ? "aujourd'hui" : rapport.periode.fin}`}
          </p>

          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KPICard icon={Users} label="Clients" value={rapport.clients.total} sub={`${rapport.clients.nouveaux} nouveaux`} />
            <KPICard icon={Calendar} label="RDV" value={rapport.rdv.total} />
            <KPICard icon={ShoppingBag} label="Commandes" value={rapport.commandes.total} sub={`${rapport.commandes.ca.toLocaleString("fr")} FCFA`} />
            <KPICard icon={Star} label="Avis" value={rapport.avis.total} sub={`Moyenne : ${rapport.avis.moyenne}/5`} />
            <KPICard icon={Gift} label="Parrainages" value={rapport.parrainages.total} />
            <KPICard icon={Coins} label="Points fidélité" value={rapport.fidelite.totalPoints} sub="distribués" />
            <KPICard icon={Percent} label="Taux conversion" value={rapport.rdv.tauxConversion} sub="% des RDV confirmés/terminés" />
            <KPICard icon={TrendingUp} label="Panier moyen" value={rapport.commandes.total > 0 ? Math.round(rapport.commandes.ca / rapport.commandes.total) : 0} sub="FCFA" />
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenus mensuels */}
            {rapport.revenuMensuel.length > 0 && (
              <div className="bg-white border border-border-brand p-5">
                <h3 className="font-display text-[16px] font-light text-text-main mb-4">Chiffre d&apos;affaires — 6 derniers mois</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={rapport.revenuMensuel}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-brand)" />
                    <XAxis dataKey="mois" tick={{ fontSize: 11, fontFamily: "var(--font-body)" }} stroke="var(--color-text-muted-brand)" />
                    <YAxis tick={{ fontSize: 11, fontFamily: "var(--font-body)" }} stroke="var(--color-text-muted-brand)" />
                    <Tooltip contentStyle={{ border: "1px solid var(--color-border-brand)", borderRadius: 0, fontFamily: "var(--font-body)", fontSize: 12 }} formatter={(v: unknown) => [`${Number(v).toLocaleString("fr")} F`, "CA"]} />
                    <Line type="monotone" dataKey="ca" stroke="var(--color-primary-brand)" strokeWidth={2} name="CA" dot={{ fill: "var(--color-primary-brand)", r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* RDV par mois */}
            {rapport.revenuMensuel.length > 0 && (
              <div className="bg-white border border-border-brand p-5">
                <h3 className="font-display text-[16px] font-light text-text-main mb-4">Rendez-vous — 6 derniers mois</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={rapport.revenuMensuel}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-brand)" />
                    <XAxis dataKey="mois" tick={{ fontSize: 11, fontFamily: "var(--font-body)" }} stroke="var(--color-text-muted-brand)" />
                    <YAxis tick={{ fontSize: 11, fontFamily: "var(--font-body)" }} stroke="var(--color-text-muted-brand)" allowDecimals={false} />
                    <Tooltip contentStyle={{ border: "1px solid var(--color-border-brand)", borderRadius: 0, fontFamily: "var(--font-body)", fontSize: 12 }} />
                    <Bar dataKey="rdv" fill="var(--color-gold)" name="RDV" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Soins populaires chart */}
          {rapport.soinsPopulaires.length > 0 && (
            <div className="bg-white border border-border-brand p-5">
              <h3 className="font-display text-[16px] font-light text-text-main mb-4">Soins les plus demandés</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={rapport.soinsPopulaires} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-brand)" />
                  <XAxis type="number" tick={{ fontSize: 11, fontFamily: "var(--font-body)" }} stroke="var(--color-text-muted-brand)" allowDecimals={false} />
                  <YAxis type="category" dataKey="nom" tick={{ fontSize: 11, fontFamily: "var(--font-body)" }} stroke="var(--color-text-muted-brand)" width={140} />
                  <Tooltip contentStyle={{ border: "1px solid var(--color-border-brand)", borderRadius: 0, fontFamily: "var(--font-body)", fontSize: 12 }} />
                  <Bar dataKey="count" fill="var(--color-primary-brand)" name="Réservations" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* RDV par statut */}
          {Object.keys(rapport.rdv.parStatut).length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-border-brand p-5 space-y-3">
                <h3 className="font-display text-[16px] font-light text-text-main">RDV par statut</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {Object.entries(rapport.rdv.parStatut).map(([statut, count]) => (
                    <div key={statut} className="flex items-center justify-between px-3 py-2 border border-border-brand">
                      <span className="font-body text-[12px] text-text-mid">{RDV_STATUT_LABELS[statut] || statut}</span>
                      <span className="font-body text-[14px] font-semibold text-text-main">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white border border-border-brand p-5">
                <h3 className="font-display text-[16px] font-light text-text-main mb-4">Répartition RDV</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={Object.entries(rapport.rdv.parStatut).map(([statut, count]) => ({ name: RDV_STATUT_LABELS[statut] || statut, value: count }))}
                      dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                      label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      labelLine={false} fontSize={10}
                    >
                      {Object.keys(rapport.rdv.parStatut).map((statut) => (
                        <Cell key={statut} fill={PIE_COLORS[statut] || "var(--color-text-muted-brand)"} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {!rapport && !loading && (
        <div className="flex flex-col items-center justify-center min-h-80 text-text-muted-brand">
          <BarChart3 size={48} strokeWidth={1} className="mb-4" />
          <p className="font-body text-[14px]">Sélectionnez une période et cliquez sur Générer</p>
        </div>
      )}
    </div>
  )
}

function KPICard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: number; sub?: string }) {
  return (
    <div className="bg-white border border-border-brand p-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className="text-primary-brand" />
        <span className="font-body text-xs uppercase tracking-widest text-text-muted-brand">{label}</span>
      </div>
      <p className="font-display text-[28px] font-light text-text-main">{value.toLocaleString("fr")}</p>
      {sub && <p className="font-body text-[12px] text-text-muted-brand mt-1">{sub}</p>}
    </div>
  )
}
