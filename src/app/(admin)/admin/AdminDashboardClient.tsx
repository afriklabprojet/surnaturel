"use client"

import Link from "next/link"
import {
  Users, Calendar, ShoppingBag, Banknote, Eye, Star,
  AlertTriangle, Mail, Percent, Coins, MessageSquare,
  Sparkles, Heart, BookOpen, Settings, BarChart3,
  Package, Tag, UserCircle, HelpCircle, ImageIcon,
  PlayCircle, UsersRound, CalendarDays, BadgeCheck,
  Gift, Award, Ban, Stethoscope, FileText, Wrench,
  Bell, TrendingUp,
} from "lucide-react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar,
} from "recharts"
import type { PieLabelRenderProps } from "recharts"
import { formatPrix } from "@/lib/utils"

export interface DashboardData {
  totalClients: number
  rdvAujourdhui: number
  rdvEnAttente: number
  commandesEnAttente: number
  revenuMensuel: number
  signalements: number
  avisTotal: number
  avisMoyenne: number
  postsAujourdhui: number
  promosActives: number
  abonnesNewsletter: number
  pointsFideliteMois: number
  rdvParJour: { date: string; count: number }[]
  caParMois: { mois: string; ca: number }[]
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
  derniersAvis: {
    id: string
    client: string
    soin: string
    note: number
    commentaire: string | null
    createdAt: string
  }[]
}

const MODULES = [
  { href: "/admin/rdv", label: "Rendez-vous", icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
  { href: "/admin/clients", label: "Clients", icon: Users, color: "text-primary-brand", bg: "bg-primary-light" },
  { href: "/admin/soins", label: "Soins", icon: Sparkles, color: "text-gold", bg: "bg-gold-light" },
  { href: "/admin/boutique", label: "Boutique", icon: ShoppingBag, color: "text-emerald-600", bg: "bg-emerald-50" },
  { href: "/admin/commandes", label: "Commandes", icon: Package, color: "text-orange-500", bg: "bg-orange-50" },
  { href: "/admin/promo", label: "Codes Promo", icon: Percent, color: "text-purple-600", bg: "bg-purple-50" },
  { href: "/admin/fidelite", label: "Fidélité", icon: Coins, color: "text-gold", bg: "bg-gold-light" },
  { href: "/admin/recompenses", label: "Récompenses", icon: Award, color: "text-amber-600", bg: "bg-amber-50" },
  { href: "/admin/avis", label: "Avis", icon: Star, color: "text-yellow-500", bg: "bg-yellow-50" },
  { href: "/admin/communaute", label: "Communauté", icon: UsersRound, color: "text-primary-brand", bg: "bg-primary-light" },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare, color: "text-sky-600", bg: "bg-sky-50" },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail, color: "text-rose-500", bg: "bg-rose-50" },
  { href: "/admin/sage-femme", label: "Sage-Femme", icon: Heart, color: "text-pink-600", bg: "bg-pink-50" },
  { href: "/admin/blog", label: "Blog", icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-50" },
  { href: "/admin/galerie", label: "Galerie", icon: ImageIcon, color: "text-teal-600", bg: "bg-teal-50" },
  { href: "/admin/videos", label: "Vidéos", icon: PlayCircle, color: "text-red-500", bg: "bg-red-50" },
  { href: "/admin/evenements", label: "Événements", icon: CalendarDays, color: "text-violet-600", bg: "bg-violet-50" },
  { href: "/admin/groupes", label: "Groupes", icon: UsersRound, color: "text-cyan-600", bg: "bg-cyan-50" },
  { href: "/admin/signalements", label: "Signalements", icon: AlertTriangle, color: "text-danger", bg: "bg-red-50" },
  { href: "/admin/verification", label: "Vérification", icon: BadgeCheck, color: "text-primary-brand", bg: "bg-primary-light" },
  { href: "/admin/parrainages", label: "Parrainages", icon: Gift, color: "text-green-600", bg: "bg-green-50" },
  { href: "/admin/blocages", label: "Blocages", icon: Ban, color: "text-gray-600", bg: "bg-gray-50" },
  { href: "/admin/equipe", label: "Équipe", icon: UserCircle, color: "text-primary-brand", bg: "bg-primary-light" },
  { href: "/admin/professionnels", label: "Professionnels", icon: Stethoscope, color: "text-teal-600", bg: "bg-teal-50" },
  { href: "/admin/forfaits", label: "Forfaits", icon: Package, color: "text-indigo-600", bg: "bg-indigo-50" },
  { href: "/admin/categories", label: "Catégories", icon: Tag, color: "text-orange-500", bg: "bg-orange-50" },
  { href: "/admin/faq", label: "FAQ", icon: HelpCircle, color: "text-blue-600", bg: "bg-blue-50" },
  { href: "/admin/rapports", label: "Rapports", icon: BarChart3, color: "text-purple-600", bg: "bg-purple-50" },
  { href: "/admin/contenu", label: "Contenu", icon: FileText, color: "text-slate-600", bg: "bg-slate-50" },
  { href: "/admin/configuration", label: "Configuration", icon: Wrench, color: "text-gray-600", bg: "bg-gray-50" },
  { href: "/admin/parametres", label: "Paramètres", icon: Settings, color: "text-gray-600", bg: "bg-gray-50" },
]

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

function StarRating({ note }: { note: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          className={i <= note ? "fill-gold text-gold" : "text-border-brand"}
        />
      ))}
    </span>
  )
}

export default function AdminDashboardClient({ data }: { data: DashboardData }) {
  const alertes = [
    data.signalements > 0 && {
      href: "/admin/signalements",
      icon: AlertTriangle,
      label: `${data.signalements} signalement${data.signalements > 1 ? "s" : ""} en attente`,
      color: "bg-red-50 border-red-200 text-red-700",
      iconColor: "text-red-500",
    },
    data.rdvEnAttente > 0 && {
      href: "/admin/rdv",
      icon: Calendar,
      label: `${data.rdvEnAttente} rendez-vous à confirmer`,
      color: "bg-yellow-50 border-yellow-200 text-yellow-700",
      iconColor: "text-yellow-500",
    },
    data.commandesEnAttente > 0 && {
      href: "/admin/commandes",
      icon: ShoppingBag,
      label: `${data.commandesEnAttente} commande${data.commandesEnAttente > 1 ? "s" : ""} en attente de traitement`,
      color: "bg-orange-50 border-orange-200 text-orange-700",
      iconColor: "text-orange-500",
    },
  ].filter(Boolean) as { href: string; icon: typeof AlertTriangle; label: string; color: string; iconColor: string }[]

  const row1Metrics = [
    { label: "Total clients", value: data.totalClients, icon: Users, borderColor: "var(--color-primary-brand)", iconBg: "bg-primary-light text-primary-brand" },
    { label: "RDV aujourd'hui", value: data.rdvAujourdhui, icon: Calendar, borderColor: "#3B82F6", iconBg: "bg-blue-50 text-blue-600" },
    { label: "Commandes en attente", value: data.commandesEnAttente, icon: ShoppingBag, borderColor: "var(--color-gold)", iconBg: "bg-gold-light text-gold" },
    { label: "CA du mois", value: formatPrix(data.revenuMensuel), icon: Banknote, borderColor: "var(--color-success)", iconBg: "bg-emerald-50 text-emerald-600" },
  ]

  const row2Metrics = [
    { label: "Signalements", value: data.signalements, icon: AlertTriangle, borderColor: data.signalements > 0 ? "var(--color-danger)" : "var(--color-border)", iconBg: "bg-red-50 text-red-500", href: "/admin/signalements" },
    { label: "Note moyenne avis", value: data.avisMoyenne ? `${data.avisMoyenne}/5 (${data.avisTotal})` : "Aucun avis", icon: Star, borderColor: "#EAB308", iconBg: "bg-yellow-50 text-yellow-500", href: "/admin/avis" },
    { label: "Abonnés newsletter", value: data.abonnesNewsletter, icon: Mail, borderColor: "#F43F5E", iconBg: "bg-rose-50 text-rose-500", href: "/admin/newsletter" },
    { label: "Points fidélité ce mois", value: `+${data.pointsFideliteMois.toLocaleString("fr")} pts`, icon: Coins, borderColor: "var(--color-gold)", iconBg: "bg-gold-light text-gold", href: "/admin/fidelite" },
  ]

  return (
    <div className="space-y-6">

      {/* ── Alertes ── */}
      {alertes.length > 0 && (
        <div className="space-y-2">
          <p className="flex items-center gap-2 font-body text-xs uppercase tracking-[0.15em] text-text-muted-brand">
            <Bell size={13} />
            Actions requises
          </p>
          {alertes.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className={`flex items-center gap-3 border px-4 py-2.5 font-body text-[12px] transition-opacity hover:opacity-80 ${a.color}`}
            >
              <a.icon size={15} className={a.iconColor} />
              {a.label}
              <span className="ml-auto text-xs opacity-60">Voir →</span>
            </Link>
          ))}
        </div>
      )}

      {/* ── KPIs ligne 1 ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {row1Metrics.map((m) => (
          <div
            key={m.label}
            className="relative border border-border-brand bg-white p-5"
            style={{ borderTopWidth: 2, borderTopColor: m.borderColor }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-body text-xs uppercase tracking-[0.15em] text-text-muted-brand">
                  {m.label}
                </p>
                <p className="mt-1 font-display text-[32px] font-light leading-tight text-text-main">
                  {m.value}
                </p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center ${m.iconBg}`}>
                <m.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── KPIs ligne 2 ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {row2Metrics.map((m) => (
          <Link
            key={m.label}
            href={m.href}
            className="relative border border-border-brand bg-white p-5 transition-colors hover:border-gold"
            style={{ borderTopWidth: 2, borderTopColor: m.borderColor }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-body text-xs uppercase tracking-[0.15em] text-text-muted-brand">
                  {m.label}
                </p>
                <p className="mt-1 font-display text-[22px] font-light leading-tight text-text-main">
                  {m.value}
                </p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center ${m.iconBg}`}>
                <m.icon className="h-5 w-5" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Graphiques ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* CA 6 mois */}
        <div className="border border-border-brand bg-white p-5 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-primary-brand" />
            <h3 className="font-display text-[16px] font-light text-text-main">
              Chiffre d&apos;affaires — 6 derniers mois
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.caParMois}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-brand)" />
              <XAxis dataKey="mois" tick={{ fontSize: 11, fontFamily: "var(--font-body)" }} stroke="var(--color-text-muted-brand)" />
              <YAxis tick={{ fontSize: 11, fontFamily: "var(--font-body)" }} stroke="var(--color-text-muted-brand)" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ border: "1px solid var(--color-border-brand)", borderRadius: 0, fontFamily: "var(--font-body)", fontSize: 12 }} formatter={(v) => [formatPrix(v as number), "CA"]} />
              <Bar dataKey="ca" fill="var(--color-primary-brand)" name="CA" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie commandes */}
        <div className="border border-border-brand bg-white p-5">
          <h3 className="mb-4 font-display text-[16px] font-light text-text-main">
            Commandes par statut
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data.commandesParStatut}
                dataKey="count"
                nameKey="statut"
                cx="50%"
                cy="50%"
                outerRadius={75}
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

      {/* RDV 7 jours + Top soins */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="border border-border-brand bg-white p-5">
          <h3 className="mb-4 font-display text-[16px] font-light text-text-main">
            Rendez-vous — 7 derniers jours
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.rdvParJour}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-brand)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fontFamily: "var(--font-body)" }} stroke="var(--color-text-muted-brand)" />
              <YAxis tick={{ fontSize: 11, fontFamily: "var(--font-body)" }} stroke="var(--color-text-muted-brand)" allowDecimals={false} />
              <Tooltip contentStyle={{ border: "1px solid var(--color-border-brand)", borderRadius: 0, fontFamily: "var(--font-body)", fontSize: 12 }} />
              <Line type="monotone" dataKey="count" stroke="var(--color-primary-brand)" strokeWidth={2} name="RDV" dot={{ fill: "var(--color-primary-brand)", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="border border-border-brand bg-white p-5">
          <h3 className="mb-4 font-display text-[16px] font-light text-text-main">
            Top 5 soins les plus demandés
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.soinsPopulaires} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-brand)" />
              <XAxis type="number" tick={{ fontSize: 11, fontFamily: "var(--font-body)" }} stroke="var(--color-text-muted-brand)" allowDecimals={false} />
              <YAxis type="category" dataKey="nom" tick={{ fontSize: 11, fontFamily: "var(--font-body)" }} stroke="var(--color-text-muted-brand)" width={110} />
              <Tooltip contentStyle={{ border: "1px solid var(--color-border-brand)", borderRadius: 0, fontFamily: "var(--font-body)", fontSize: 12 }} />
              <Bar dataKey="count" fill="var(--color-gold)" name="Réservations" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Accès rapide modules ── */}
      <div className="border border-border-brand bg-white p-5">
        <h3 className="mb-4 font-display text-[16px] font-light text-text-main">
          Accès rapide — Tous les modules
        </h3>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {MODULES.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="flex flex-col items-center gap-2 border border-border-brand p-3 text-center transition-colors hover:border-gold hover:bg-bg-page"
            >
              <div className={`flex h-9 w-9 items-center justify-center ${m.bg}`}>
                <m.icon size={18} className={m.color} />
              </div>
              <span className="font-body text-xs leading-tight text-text-mid">{m.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Tableaux activités récentes ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Derniers RDV */}
        <div className="border border-border-brand bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-[16px] font-light text-text-main">Derniers rendez-vous</h3>
            <Link href="/admin/rdv" className="font-body text-xs text-primary-brand hover:text-primary-dark">Voir tout →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-brand">
                  <th className="py-2 text-left font-body text-xs uppercase tracking-widest text-text-muted-brand">Client</th>
                  <th className="py-2 text-left font-body text-xs uppercase tracking-widest text-text-muted-brand">Soin</th>
                  <th className="py-2 text-left font-body text-xs uppercase tracking-widest text-text-muted-brand">Date</th>
                  <th className="py-2 text-left font-body text-xs uppercase tracking-widest text-text-muted-brand">Statut</th>
                </tr>
              </thead>
              <tbody>
                {data.derniersRDV.map((rdv) => (
                  <tr key={rdv.id} className="border-b border-border-brand last:border-0">
                    <td className="py-2 font-body text-[13px] text-text-main">{rdv.client}</td>
                    <td className="py-2 font-body text-[12px] text-text-mid">{rdv.soin}</td>
                    <td className="py-2 font-body text-[12px] text-text-mid">
                      {new Date(rdv.dateHeure).toLocaleDateString("fr", { day: "2-digit", month: "short" })}
                    </td>
                    <td className="py-2">
                      <span className={`inline-block px-2 py-0.5 font-body text-xs font-medium uppercase tracking-wider ${statutColors[rdv.statut] || ""}`}>
                        {statutLabels[rdv.statut] || rdv.statut}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dernières commandes */}
        <div className="border border-border-brand bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-[16px] font-light text-text-main">Dernières commandes</h3>
            <Link href="/admin/commandes" className="font-body text-xs text-primary-brand hover:text-primary-dark">Voir tout →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-brand">
                  <th className="py-2 text-left font-body text-xs uppercase tracking-widest text-text-muted-brand">N°</th>
                  <th className="py-2 text-left font-body text-xs uppercase tracking-widest text-text-muted-brand">Client</th>
                  <th className="py-2 text-left font-body text-xs uppercase tracking-widest text-text-muted-brand">Total</th>
                  <th className="py-2 text-left font-body text-xs uppercase tracking-widest text-text-muted-brand">Statut</th>
                </tr>
              </thead>
              <tbody>
                {data.dernieresCommandes.map((cmd) => (
                  <tr key={cmd.id} className="border-b border-border-brand last:border-0">
                    <td className="py-2 font-body text-[12px] text-text-mid">#{cmd.id.slice(-6).toUpperCase()}</td>
                    <td className="py-2 font-body text-[13px] text-text-main">{cmd.client}</td>
                    <td className="py-2 font-body text-[13px] font-medium text-text-main">{formatPrix(cmd.total)}</td>
                    <td className="py-2">
                      <span className={`inline-block px-2 py-0.5 font-body text-xs font-medium uppercase tracking-wider ${statutColors[cmd.statut] || ""}`}>
                        {statutLabels[cmd.statut] || cmd.statut}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Derniers avis ── */}
      {data.derniersAvis.length > 0 && (
        <div className="border border-border-brand bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-[16px] font-light text-text-main">
              Derniers avis clients
            </h3>
            <Link href="/admin/avis" className="font-body text-xs text-primary-brand hover:text-primary-dark">
              Voir tout →
            </Link>
          </div>
          <div className="space-y-3">
            {data.derniersAvis.map((a) => (
              <div key={a.id} className="flex items-start gap-4 border-b border-border-brand pb-3 last:border-0 last:pb-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-primary-light font-display text-[14px] text-primary-brand">
                  {a.client.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-body text-[13px] font-medium text-text-main">{a.client}</span>
                    <StarRating note={a.note} />
                    <span className="font-body text-xs text-gold">{a.soin}</span>
                  </div>
                  {a.commentaire && (
                    <p className="mt-0.5 font-body text-[12px] text-text-mid line-clamp-1">{a.commentaire}</p>
                  )}
                </div>
                <span className="shrink-0 font-body text-xs text-text-muted-brand">
                  {new Date(a.createdAt).toLocaleDateString("fr", { day: "2-digit", month: "short" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
