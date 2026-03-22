"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Users,
  Newspaper,
  MessageCircle,
  UsersRound,
  CalendarDays,
  AlertTriangle,
  TrendingUp,
  Loader2,
  Check,
  X,
  Trash2,
  Eye,
  ChevronDown,
} from "lucide-react"

/* ━━━ Types ━━━ */

interface Stats {
  totalMembres: number
  membresActifs7j: number
  membresActifs30j: number
  totalPosts: number
  posts7j: number
  posts30j: number
  totalCommentaires: number
  totalReactions: number
  totalGroupes: number
  totalEvenements: number
  signalementsEnAttente: number
  totalConnexions: number
  tauxEngagement7j: number
  tauxEngagement30j: number
  topAuteurs: { id: string; nom: string; prenom: string; photoUrl?: string | null; postsCount: number }[]
}

interface Signalement {
  id: string
  type: string
  raison: string
  description?: string | null
  statut: string
  createdAt: string
  signaleur: { id: string; nom: string; prenom: string; photoUrl?: string | null }
  signaleUser?: { id: string; nom: string; prenom: string; photoUrl?: string | null } | null
  post?: { id: string; contenu: string; auteurId: string } | null
  commentaire?: { id: string; contenu: string; auteurId: string } | null
}

/* ━━━ Helpers ━━━ */

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

function StatCard({ label, value, sub, icon: Icon, accent = "text-primary-brand" }: { label: string; value: string | number; sub?: string; icon: React.ElementType; accent?: string }) {
  return (
    <div className="border border-border-brand bg-white p-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className={accent} />
        <span className="font-body text-[10px] uppercase tracking-wider text-text-muted-brand">{label}</span>
      </div>
      <p className={`font-display text-[28px] ${accent}`}>{value}</p>
      {sub && <p className="font-body text-[11px] text-text-muted-brand mt-0.5">{sub}</p>}
    </div>
  )
}

const TYPE_LABELS: Record<string, string> = {
  POST: "Publication",
  COMMENTAIRE: "Commentaire",
  MEMBRE: "Membre",
  GROUPE: "Groupe",
}

const STATUT_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  EN_ATTENTE: { label: "En attente", bg: "bg-gold-light", text: "text-gold-dark" },
  EN_COURS: { label: "En cours", bg: "bg-blue-50", text: "text-blue-700" },
  RESOLU: { label: "Résolu", bg: "bg-primary-light", text: "text-primary-brand" },
  REJETE: { label: "Rejeté", bg: "bg-border-brand", text: "text-text-muted-brand" },
}

/* ━━━ Page ━━━ */

export default function PageAdminCommunaute() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [signalements, setSignalements] = useState<Signalement[]>([])
  const [filtreStatut, setFiltreStatut] = useState("EN_ATTENTE")
  const [sigLoading, setSigLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  const [tab, setTab] = useState<"stats" | "signalements">("stats")

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/communaute/stats")
      if (res.ok) {
        setStats(await res.json())
      } else {
        console.error("Stats API error:", res.status, await res.text())
        // Set empty stats so the UI still shows
        setStats({
          totalMembres: 0, membresActifs7j: 0, membresActifs30j: 0,
          totalPosts: 0, posts7j: 0, posts30j: 0,
          totalCommentaires: 0, totalReactions: 0, totalGroupes: 0,
          totalEvenements: 0, signalementsEnAttente: 0, totalConnexions: 0,
          tauxEngagement7j: 0, tauxEngagement30j: 0, topAuteurs: [],
        })
      }
    } catch (e) {
      console.error("Stats fetch failed:", e)
      setStats({
        totalMembres: 0, membresActifs7j: 0, membresActifs30j: 0,
        totalPosts: 0, posts7j: 0, posts30j: 0,
        totalCommentaires: 0, totalReactions: 0, totalGroupes: 0,
        totalEvenements: 0, signalementsEnAttente: 0, totalConnexions: 0,
        tauxEngagement7j: 0, tauxEngagement30j: 0, topAuteurs: [],
      })
    }
  }, [])

  const fetchSignalements = useCallback(async (statut: string) => {
    setSigLoading(true)
    try {
      const res = await fetch(`/api/communaute/signalements?statut=${statut}`)
      if (res.ok) {
        const data = await res.json()
        setSignalements(data.signalements || [])
      }
    } catch {}
    setSigLoading(false)
  }, [])

  useEffect(() => {
    Promise.all([fetchStats(), fetchSignalements("EN_ATTENTE")]).finally(() => setLoading(false))
  }, [fetchStats, fetchSignalements])

  async function handleAction(signalementId: string, statut: string, action?: string) {
    setActionLoading((prev) => ({ ...prev, [signalementId]: true }))
    try {
      const res = await fetch("/api/communaute/signalements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signalementId, statut, action }),
      })
      if (res.ok) {
        setSignalements((prev) => prev.filter((s) => s.id !== signalementId))
        fetchStats()
      }
    } catch {}
    setActionLoading((prev) => ({ ...prev, [signalementId]: false }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-brand" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-border-brand">
        {[
          { key: "stats" as const, label: "Statistiques", icon: TrendingUp },
          { key: "signalements" as const, label: `Signalements${stats?.signalementsEnAttente ? ` (${stats.signalementsEnAttente})` : ""}`, icon: AlertTriangle },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); if (t.key === "signalements") fetchSignalements(filtreStatut) }}
            className={`flex items-center gap-1.5 px-4 py-2.5 font-body text-[11px] uppercase tracking-wider border-b-2 transition-colors ${
              tab === t.key ? "border-primary-brand text-primary-brand" : "border-transparent text-text-muted-brand hover:text-text-mid"
            }`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ━━━ Onglet Statistiques ━━━ */}
      {tab === "stats" && stats && (
        <div className="space-y-6">
          {/* KPI grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Membres" value={stats.totalMembres} icon={Users} sub={`${stats.membresActifs7j} actifs cette semaine`} />
            <StatCard label="Publications" value={stats.totalPosts} icon={Newspaper} accent="text-gold" sub={`${stats.posts7j} cette semaine`} />
            <StatCard label="Groupes" value={stats.totalGroupes} icon={UsersRound} />
            <StatCard label="Événements" value={stats.totalEvenements} icon={CalendarDays} accent="text-gold" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Réactions" value={stats.totalReactions} icon={MessageCircle} accent="text-gold" />
            <StatCard label="Commentaires" value={stats.totalCommentaires} icon={MessageCircle} />
            <StatCard label="Connexions" value={stats.totalConnexions} icon={Users} accent="text-gold" />
            <StatCard label="Engagement 7j" value={`${stats.tauxEngagement7j}%`} icon={TrendingUp} sub={`30j : ${stats.tauxEngagement30j}%`} />
          </div>

          {/* Top auteurs */}
          <div className="border border-border-brand bg-white">
            <div className="px-5 py-3 border-b border-border-brand">
              <h3 className="font-display text-[16px] font-light text-text-main">Top contributeurs</h3>
            </div>
            <div className="divide-y divide-border-brand">
              {stats.topAuteurs.map((u, i) => (
                <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="font-display text-[16px] text-gold w-6 text-center">{i + 1}</span>
                  <Avatar user={u} size={32} />
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-[13px] text-text-main truncate">{u.prenom} {u.nom}</p>
                  </div>
                  <span className="font-body text-[12px] text-text-muted-brand">{u.postsCount} publication{u.postsCount > 1 ? "s" : ""}</span>
                </div>
              ))}
              {stats.topAuteurs.length === 0 && (
                <p className="px-5 py-6 font-body text-[13px] text-text-muted-brand text-center">Aucune publication</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ━━━ Onglet Signalements ━━━ */}
      {tab === "signalements" && (
        <div className="space-y-4">
          {/* Filtre statut */}
          <div className="flex items-center gap-2">
            <span className="font-body text-[11px] uppercase tracking-wider text-text-muted-brand">Statut :</span>
            {(["EN_ATTENTE", "EN_COURS", "RESOLU", "REJETE"] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setFiltreStatut(s); fetchSignalements(s) }}
                className={`px-2.5 py-1 font-body text-[10px] uppercase tracking-wider border transition-colors ${
                  filtreStatut === s ? "border-primary-brand bg-primary-light text-primary-brand" : "border-border-brand text-text-muted-brand hover:text-text-mid"
                }`}
              >
                {STATUT_LABELS[s].label}
              </button>
            ))}
          </div>

          {sigLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gold" />
            </div>
          ) : signalements.length === 0 ? (
            <div className="border border-border-brand bg-white p-12 text-center">
              <Check size={36} className="mx-auto text-primary-brand mb-2" />
              <p className="font-body text-[14px] text-text-muted-brand">Aucun signalement {STATUT_LABELS[filtreStatut].label.toLowerCase()}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {signalements.map((sig) => (
                <div key={sig.id} className="border border-border-brand bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Type + raison */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 font-body text-[10px] uppercase tracking-wider bg-gold-light text-gold-dark">
                          {TYPE_LABELS[sig.type] || sig.type}
                        </span>
                        <span className={`px-2 py-0.5 font-body text-[10px] uppercase tracking-wider ${STATUT_LABELS[sig.statut]?.bg} ${STATUT_LABELS[sig.statut]?.text}`}>
                          {STATUT_LABELS[sig.statut]?.label}
                        </span>
                        <span className="font-body text-[11px] text-text-muted-brand">
                          {new Date(sig.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>

                      {/* Signaleur */}
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar user={sig.signaleur} size={24} />
                        <span className="font-body text-[12px] text-text-mid">
                          {sig.signaleur.prenom} {sig.signaleur.nom} a signalé
                        </span>
                        {sig.signaleUser && (
                          <span className="font-body text-[12px] font-medium text-text-main">
                            {sig.signaleUser.prenom} {sig.signaleUser.nom}
                          </span>
                        )}
                      </div>

                      {/* Raison */}
                      <p className="font-body text-[13px] text-text-main mb-1">{sig.raison}</p>
                      {sig.description && (
                        <p className="font-body text-[12px] text-text-muted-brand">{sig.description}</p>
                      )}

                      {/* Contenu signalé */}
                      {sig.post && (
                        <div className="mt-2 p-3 bg-bg-page border border-border-brand">
                          <p className="font-body text-[10px] uppercase tracking-wider text-text-muted-brand mb-1">Publication signalée</p>
                          <p className="font-body text-[12px] text-text-mid line-clamp-3">{sig.post.contenu}</p>
                        </div>
                      )}
                      {sig.commentaire && (
                        <div className="mt-2 p-3 bg-bg-page border border-border-brand">
                          <p className="font-body text-[10px] uppercase tracking-wider text-text-muted-brand mb-1">Commentaire signalé</p>
                          <p className="font-body text-[12px] text-text-mid line-clamp-3">{sig.commentaire.contenu}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {sig.statut === "EN_ATTENTE" && (
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <button
                          onClick={() => handleAction(sig.id, "RESOLU")}
                          disabled={actionLoading[sig.id]}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-primary-brand text-white font-body text-[10px] uppercase tracking-wider hover:bg-primary-dark disabled:opacity-50 transition-colors"
                          title="Marquer résolu"
                        >
                          <Check size={12} /> Résolu
                        </button>
                        <button
                          onClick={() => handleAction(sig.id, "REJETE")}
                          disabled={actionLoading[sig.id]}
                          className="flex items-center gap-1 px-2.5 py-1.5 border border-border-brand text-text-muted-brand font-body text-[10px] uppercase tracking-wider hover:text-text-mid disabled:opacity-50 transition-colors"
                          title="Rejeter"
                        >
                          <X size={12} /> Rejeter
                        </button>
                        {sig.post && (
                          <button
                            onClick={() => handleAction(sig.id, "RESOLU", "supprimer_post")}
                            disabled={actionLoading[sig.id]}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-danger text-white font-body text-[10px] uppercase tracking-wider hover:bg-red-700 disabled:opacity-50 transition-colors"
                            title="Supprimer la publication"
                          >
                            <Trash2 size={12} /> Supprimer
                          </button>
                        )}
                        {sig.commentaire && (
                          <button
                            onClick={() => handleAction(sig.id, "RESOLU", "supprimer_commentaire")}
                            disabled={actionLoading[sig.id]}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-danger text-white font-body text-[10px] uppercase tracking-wider hover:bg-red-700 disabled:opacity-50 transition-colors"
                            title="Supprimer le commentaire"
                          >
                            <Trash2 size={12} /> Supprimer
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
