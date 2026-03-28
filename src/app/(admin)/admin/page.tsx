"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Users, Calendar, ShoppingBag, Banknote, Eye } from "lucide-react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar,
} from "recharts"
import type { PieLabelRenderProps } from "recharts"
import { formatPrix } from "@/lib/utils"

interface DashboardData {
  totalClients: number
  rdvAujourdhui: number
  commandesEnAttente: number
  revenuMensuel: number
  rdvParJour: { date: string; count: number }[]
  commandesParStatut: { statut: string; count: number }[]
  soinsPopulaires: { nom: string; count: number }[]
  derniersRDV: {
    id: string
    client: string
    soin: string
    dateHeure: string
    statut: string
  }[]
  dernieresCommandes: {
    id: string
    client: string
    total: number
    statut: string
    createdAt: string
  }[]
}

const PIE_COLORS: Record<string, string> = {
  EN_ATTENTE: "var(--color-gold)",
  PAYEE: "var(--color-primary-brand)",
  LIVREE: "#6BC25E",
  ANNULEE: "var(--color-danger)",
  EN_PREPARATION: "#7C3AED",
  EXPEDIEE: "#4F46E5",
}

const statutLabels: Record<string, string> = {
  EN_ATTENTE: "En attente",
  CONFIRME: "Confirmé",
  ANNULE: "Annulé",
  TERMINE: "Terminé",
  PAYEE: "Payée",
  EN_PREPARATION: "En préparation",
  EXPEDIEE: "Expédiée",
  LIVREE: "Livrée",
  ANNULEE: "Annulée",
}

const statutColors: Record<string, string> = {
  EN_ATTENTE: "bg-yellow-100 text-yellow-700",
  CONFIRME: "bg-green-100 text-green-700",
  ANNULE: "bg-red-100 text-red-700",
  TERMINE: "bg-blue-100 text-blue-700",
  PAYEE: "bg-green-100 text-green-700",
  EN_PREPARATION: "bg-purple-100 text-purple-700",
  EXPEDIEE: "bg-indigo-100 text-indigo-700",
  LIVREE: "bg-emerald-100 text-emerald-700",
  ANNULEE: "bg-red-100 text-red-700",
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-4 border-primary-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) return <p className="text-text-muted-brand">Erreur de chargement</p>

  const metrics = [
    { label: "Total clients", value: data.totalClients, icon: Users, borderColor: "var(--color-primary-brand)", iconBg: "bg-primary-light text-primary-brand" },
    { label: "RDV aujourd'hui", value: data.rdvAujourdhui, icon: Calendar, borderColor: "#3B82F6", iconBg: "bg-blue-50 text-blue-600" },
    { label: "Commandes en attente", value: data.commandesEnAttente, icon: ShoppingBag, borderColor: "var(--color-gold)", iconBg: "bg-gold-light text-gold" },
    { label: "CA du mois", value: formatPrix(data.revenuMensuel), icon: Banknote, borderColor: "var(--color-success)", iconBg: "bg-emerald-50 text-emerald-600" },
  ]

  return (
    <div className="space-y-6">
      {/* Métriques 2x2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="bg-white border border-border-brand p-5 relative"
            style={{ borderTopWidth: 2, borderTopColor: m.borderColor }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-body text-[11px] uppercase tracking-[0.15em] text-text-muted-brand">
                  {m.label}
                </p>
                <p className="font-display text-[36px] font-light text-text-main mt-1 leading-tight">
                  {m.value}
                </p>
              </div>
              <div className={`h-10 w-10 flex items-center justify-center ${m.iconBg}`}>
                <m.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LineChart RDV 7 jours */}
        <div className="lg:col-span-2 bg-white border border-border-brand p-5">
          <h3 className="font-display text-[16px] font-light text-text-main mb-4">
            Rendez-vous — 7 derniers jours
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.rdvParJour}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-brand)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fontFamily: "var(--font-body)" }} stroke="var(--color-text-muted-brand)" />
              <YAxis tick={{ fontSize: 11, fontFamily: "var(--font-body)" }} stroke="var(--color-text-muted-brand)" allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  border: "1px solid var(--color-border-brand)",
                  borderRadius: 0,
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                }}
              />
              <Line type="monotone" dataKey="count" stroke="var(--color-primary-brand)" strokeWidth={2} name="RDV" dot={{ fill: "var(--color-primary-brand)", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* PieChart commandes par statut */}
        <div className="bg-white border border-border-brand p-5">
          <h3 className="font-display text-[16px] font-light text-text-main mb-4">
            Commandes par statut
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data.commandesParStatut}
                dataKey="count"
                nameKey="statut"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={((props: PieLabelRenderProps) => { const s = (props as PieLabelRenderProps & { statut: string }).statut; return statutLabels[s] || s })}
                labelLine={false}
                fontSize={10}
              >
                {data.commandesParStatut.map((entry) => (
                  <Cell key={entry.statut} fill={PIE_COLORS[entry.statut] || "var(--color-text-muted-brand)"} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, statutLabels[name as string] || name]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* BarChart soins populaires */}
      <div className="bg-white border border-border-brand p-5">
        <h3 className="font-display text-[16px] font-light text-text-main mb-4">
          Top 5 soins les plus demandés
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.soinsPopulaires}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-brand)" />
            <XAxis dataKey="nom" tick={{ fontSize: 11, fontFamily: "var(--font-body)" }} stroke="var(--color-text-muted-brand)" />
            <YAxis tick={{ fontSize: 11, fontFamily: "var(--font-body)" }} stroke="var(--color-text-muted-brand)" allowDecimals={false} />
            <Tooltip
              contentStyle={{
                border: "1px solid var(--color-border-brand)",
                borderRadius: 0,
                fontFamily: "var(--font-body)",
                fontSize: 12,
              }}
            />
            <Bar dataKey="count" fill="var(--color-primary-brand)" name="Réservations" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tableaux activités récentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 10 derniers RDV */}
        <div className="bg-white border border-border-brand p-5">
          <h3 className="font-display text-[16px] font-light text-text-main mb-4">
            Derniers rendez-vous
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-brand">
                  <th className="text-left py-2 font-body text-[11px] uppercase tracking-widest text-text-muted-brand font-medium">Client</th>
                  <th className="text-left py-2 font-body text-[11px] uppercase tracking-widest text-text-muted-brand font-medium">Soin</th>
                  <th className="text-left py-2 font-body text-[11px] uppercase tracking-widest text-text-muted-brand font-medium">Date</th>
                  <th className="text-left py-2 font-body text-[11px] uppercase tracking-widest text-text-muted-brand font-medium">Statut</th>
                  <th className="text-left py-2 font-body text-[11px] uppercase tracking-widest text-text-muted-brand font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.derniersRDV.map((rdv) => (
                  <tr key={rdv.id} className="border-b border-border-brand last:border-0">
                    <td className="py-2.5 text-text-main font-body text-[13px]">{rdv.client}</td>
                    <td className="py-2.5 text-text-mid font-body text-[13px]">{rdv.soin}</td>
                    <td className="py-2.5 text-text-mid font-body text-[13px]">
                      {new Date(rdv.dateHeure).toLocaleDateString("fr", { day: "2-digit", month: "short" })}
                    </td>
                    <td className="py-2.5">
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-medium font-body uppercase tracking-wider ${statutColors[rdv.statut] || ""}`}>
                        {statutLabels[rdv.statut] || rdv.statut}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <Link href="/admin/rdv" className="text-primary-brand hover:text-primary-dark">
                        <Eye className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 10 dernières commandes */}
        <div className="bg-white border border-border-brand p-5">
          <h3 className="font-display text-[16px] font-light text-text-main mb-4">
            Dernières commandes
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-brand">
                  <th className="text-left py-2 font-body text-[11px] uppercase tracking-widest text-text-muted-brand font-medium">N°</th>
                  <th className="text-left py-2 font-body text-[11px] uppercase tracking-widest text-text-muted-brand font-medium">Client</th>
                  <th className="text-left py-2 font-body text-[11px] uppercase tracking-widest text-text-muted-brand font-medium">Total</th>
                  <th className="text-left py-2 font-body text-[11px] uppercase tracking-widest text-text-muted-brand font-medium">Statut</th>
                  <th className="text-left py-2 font-body text-[11px] uppercase tracking-widest text-text-muted-brand font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.dernieresCommandes.map((cmd) => (
                  <tr key={cmd.id} className="border-b border-border-brand last:border-0">
                    <td className="py-2.5 font-body text-[13px] text-text-mid">#{cmd.id.slice(-6).toUpperCase()}</td>
                    <td className="py-2.5 text-text-main font-body text-[13px]">{cmd.client}</td>
                    <td className="py-2.5 text-text-main font-body text-[13px] font-medium">{formatPrix(cmd.total)}</td>
                    <td className="py-2.5">
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-medium font-body uppercase tracking-wider ${statutColors[cmd.statut] || ""}`}>
                        {statutLabels[cmd.statut] || cmd.statut}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <Link href="/admin/commandes" className="text-primary-brand hover:text-primary-dark">
                        <Eye className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
