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
  CreditCard,
  Plus,
  Pencil,
  ToggleLeft,
  ToggleRight,
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

interface FormuleData {
  id: string
  nom: string
  slug: string
  description: string
  prixMensuel: number
  nbSoinsParMois: number
  avantages: string[]
  populaire: boolean
  actif: boolean
  ordre: number
  nbAbonnes: number
}

interface StatsAbo {
  parStatut: Record<string, number>
  revenuMensuel: number
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
        <span className="font-body text-xs uppercase tracking-wider text-text-muted-brand">{label}</span>
      </div>
      <p className={`font-display text-[28px] ${accent}`}>{value}</p>
      {sub && <p className="font-body text-xs text-text-muted-brand mt-0.5">{sub}</p>}
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
  const [tab, setTab] = useState<"stats" | "signalements" | "abonnements">("stats")

  // Abonnements state
  const [formules, setFormules] = useState<FormuleData[]>([])
  const [statsAbo, setStatsAbo] = useState<StatsAbo | null>(null)
  const [formulesLoading, setFormulesLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState<Record<string, boolean>>({})
  const [toggleLoading, setToggleLoading] = useState<Record<string, boolean>>({})
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingFormule, setEditingFormule] = useState<FormuleData | null>(null)

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

  const fetchFormules = useCallback(async () => {
    setFormulesLoading(true)
    try {
      const res = await fetch("/api/admin/abonnements/formules")
      if (res.ok) {
        const data = await res.json()
        setFormules(data.formules || [])
        setStatsAbo(data.stats || null)
      }
    } finally {
      setFormulesLoading(false)
    }
  }, [])

  async function handleToggleActif(formule: FormuleData) {
    setToggleLoading((prev) => ({ ...prev, [formule.id]: true }))
    try {
      const res = await fetch("/api/admin/abonnements/formules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: formule.id, actif: !formule.actif }),
      })
      if (res.ok) fetchFormules()
    } finally {
      setToggleLoading((prev) => ({ ...prev, [formule.id]: false }))
    }
  }

  async function handleDeleteFormule(id: string) {
    if (!confirm("Supprimer ou désactiver cette formule ?")) return
    setDeleteLoading((prev) => ({ ...prev, [id]: true }))
    try {
      const res = await fetch(`/api/admin/abonnements/formules?id=${id}`, { method: "DELETE" })
      if (res.ok) fetchFormules()
    } finally {
      setDeleteLoading((prev) => ({ ...prev, [id]: false }))
    }
  }

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
      <div className="flex items-center justify-center min-h-100">
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
          { key: "abonnements" as const, label: "Abonnements", icon: CreditCard },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key)
              if (t.key === "signalements") fetchSignalements(filtreStatut)
              if (t.key === "abonnements") fetchFormules()
            }}
            className={`flex items-center gap-1.5 px-4 py-2.5 font-body text-xs uppercase tracking-wider border-b-2 transition-colors ${
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
            <span className="font-body text-xs uppercase tracking-wider text-text-muted-brand">Statut :</span>
            {(["EN_ATTENTE", "EN_COURS", "RESOLU", "REJETE"] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setFiltreStatut(s); fetchSignalements(s) }}
                className={`px-2.5 py-1 font-body text-xs uppercase tracking-wider border transition-colors ${
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
                        <span className="px-2 py-0.5 font-body text-xs uppercase tracking-wider bg-gold-light text-gold-dark">
                          {TYPE_LABELS[sig.type] || sig.type}
                        </span>
                        <span className={`px-2 py-0.5 font-body text-xs uppercase tracking-wider ${STATUT_LABELS[sig.statut]?.bg} ${STATUT_LABELS[sig.statut]?.text}`}>
                          {STATUT_LABELS[sig.statut]?.label}
                        </span>
                        <span className="font-body text-xs text-text-muted-brand">
                          {new Date(sig.createdAt).toLocaleDateString("fr", { day: "numeric", month: "short", year: "numeric" })}
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
                          <p className="font-body text-xs uppercase tracking-wider text-text-muted-brand mb-1">Publication signalée</p>
                          <p className="font-body text-[12px] text-text-mid line-clamp-3">{sig.post.contenu}</p>
                        </div>
                      )}
                      {sig.commentaire && (
                        <div className="mt-2 p-3 bg-bg-page border border-border-brand">
                          <p className="font-body text-xs uppercase tracking-wider text-text-muted-brand mb-1">Commentaire signalé</p>
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
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-primary-brand text-white font-body text-xs uppercase tracking-wider hover:bg-primary-dark disabled:opacity-50 transition-colors"
                          title="Marquer résolu"
                        >
                          <Check size={12} /> Résolu
                        </button>
                        <button
                          onClick={() => handleAction(sig.id, "REJETE")}
                          disabled={actionLoading[sig.id]}
                          className="flex items-center gap-1 px-2.5 py-1.5 border border-border-brand text-text-muted-brand font-body text-xs uppercase tracking-wider hover:text-text-mid disabled:opacity-50 transition-colors"
                          title="Rejeter"
                        >
                          <X size={12} /> Rejeter
                        </button>
                        {sig.post && (
                          <button
                            onClick={() => handleAction(sig.id, "RESOLU", "supprimer_post")}
                            disabled={actionLoading[sig.id]}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-danger text-white font-body text-xs uppercase tracking-wider hover:bg-red-700 disabled:opacity-50 transition-colors"
                            title="Supprimer la publication"
                          >
                            <Trash2 size={12} /> Supprimer
                          </button>
                        )}
                        {sig.commentaire && (
                          <button
                            onClick={() => handleAction(sig.id, "RESOLU", "supprimer_commentaire")}
                            disabled={actionLoading[sig.id]}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-danger text-white font-body text-xs uppercase tracking-wider hover:bg-red-700 disabled:opacity-50 transition-colors"
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

      {/* ━━━ Onglet Abonnements ━━━ */}
      {tab === "abonnements" && (
        <div className="space-y-5">
          {/* KPI rapides */}
          {statsAbo && (
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard
                label="Abonnés actifs"
                value={statsAbo.parStatut["ACTIF"] ?? 0}
                icon={Users}
                accent="text-primary-brand"
              />
              <StatCard
                label="En pause"
                value={statsAbo.parStatut["EN_PAUSE"] ?? 0}
                icon={Users}
                accent="text-text-muted-brand"
              />
              <StatCard
                label="Revenu du mois"
                value={`${(statsAbo.revenuMensuel).toLocaleString("fr")} F`}
                icon={CreditCard}
                accent="text-gold"
              />
            </div>
          )}

          {/* Barre d'action */}
          <div className="flex items-center justify-between">
            <h3 className="font-display text-[16px] font-light text-text-main">Formules d&apos;abonnement</h3>
            <button
              onClick={() => { setEditingFormule(null); setShowFormModal(true) }}
              className="flex items-center gap-1.5 bg-primary-brand px-4 py-2 font-body text-xs font-medium uppercase tracking-wider text-white hover:bg-primary-dark transition-colors"
            >
              <Plus size={13} />
              Nouvelle formule
            </button>
          </div>

          {/* Liste des formules */}
          {formulesLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-gold" />
            </div>
          ) : formules.length === 0 ? (
            <div className="border border-border-brand bg-white p-12 text-center">
              <CreditCard size={36} className="mx-auto text-text-muted-brand mb-2" />
              <p className="font-body text-[13px] text-text-muted-brand">Aucune formule configurée</p>
            </div>
          ) : (
            <div className="space-y-3">
              {formules.map((f) => (
                <div key={f.id} className={`border bg-white p-5 ${f.actif ? "border-border-brand" : "border-dashed border-border-brand opacity-60"}`}>
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-body text-[14px] font-medium text-text-main">{f.nom}</h4>
                        {f.populaire && (
                          <span className="px-2 py-0.5 bg-gold-light font-body text-[9px] font-medium uppercase tracking-wider text-gold rounded-full">Populaire</span>
                        )}
                        <span className={`px-2 py-0.5 font-body text-[9px] uppercase tracking-wider rounded-full ${f.actif ? "bg-primary-light text-primary-brand" : "bg-bg-page text-text-muted-brand"}`}>
                          {f.actif ? "Actif" : "Inactif"}
                        </span>
                        <span className="font-body text-xs text-text-muted-brand">slug: <code className="font-mono text-[11px]">{f.slug}</code></span>
                      </div>
                      <p className="font-body text-[12px] text-text-mid mb-2">{f.description}</p>
                      <div className="flex flex-wrap items-center gap-4 text-xs font-body text-text-muted-brand">
                        <span className="font-medium text-text-main text-[14px]">{f.prixMensuel.toLocaleString("fr")} F/mois</span>
                        <span>{f.nbSoinsParMois} soin{f.nbSoinsParMois > 1 ? "s" : ""}/mois</span>
                        <span className="flex items-center gap-1"><Users size={11} />{f.nbAbonnes} abonné{f.nbAbonnes > 1 ? "s" : ""}</span>
                        <span>Ordre : {f.ordre}</span>
                      </div>
                      {f.avantages.length > 0 && (
                        <ul className="mt-2 flex flex-wrap gap-1.5">
                          {f.avantages.map((a, i) => (
                            <li key={i} className="flex items-center gap-1 px-2 py-0.5 bg-bg-page border border-border-brand font-body text-[10px] text-text-mid">
                              <Check size={9} className="text-primary-brand shrink-0" />
                              {a}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        onClick={() => { setEditingFormule(f); setShowFormModal(true) }}
                        className="flex items-center gap-1 px-2.5 py-1.5 border border-border-brand font-body text-xs text-text-mid hover:border-gold hover:text-gold transition-colors"
                        title="Modifier"
                      >
                        <Pencil size={12} /> Éditer
                      </button>
                      <button
                        onClick={() => handleToggleActif(f)}
                        disabled={toggleLoading[f.id]}
                        className="flex items-center gap-1 px-2.5 py-1.5 border border-border-brand font-body text-xs text-text-mid hover:border-primary-brand hover:text-primary-brand transition-colors disabled:opacity-40"
                        title={f.actif ? "Désactiver" : "Activer"}
                      >
                        {toggleLoading[f.id] ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : f.actif ? (
                          <ToggleRight size={12} className="text-primary-brand" />
                        ) : (
                          <ToggleLeft size={12} />
                        )}
                        {f.actif ? "Désactiver" : "Activer"}
                      </button>
                      {f.nbAbonnes === 0 && (
                        <button
                          onClick={() => handleDeleteFormule(f.id)}
                          disabled={deleteLoading[f.id]}
                          className="flex items-center gap-1 px-2.5 py-1.5 border border-danger/30 font-body text-xs text-danger hover:bg-red-50 transition-colors disabled:opacity-40"
                          title="Supprimer"
                        >
                          {deleteLoading[f.id] ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                          Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal formule */}
      {showFormModal && (
        <FormuleModal
          formule={editingFormule}
          onClose={() => setShowFormModal(false)}
          onSaved={() => { setShowFormModal(false); fetchFormules() }}
        />
      )}
    </div>
  )
}

/* ━━━ Modal Formule ━━━ */

function FormuleModal({
  formule,
  onClose,
  onSaved,
}: {
  formule: FormuleData | null
  onClose: () => void
  onSaved: () => void
}) {
  const [nom, setNom] = useState(formule?.nom ?? "")
  const [slug, setSlug] = useState(formule?.slug ?? "")
  const [description, setDescription] = useState(formule?.description ?? "")
  const [prixMensuel, setPrixMensuel] = useState(String(formule?.prixMensuel ?? ""))
  const [nbSoinsParMois, setNbSoinsParMois] = useState(String(formule?.nbSoinsParMois ?? "0"))
  const [avantages, setAvantages] = useState<string[]>(formule?.avantages ?? [])
  const [avantageInput, setAvantageInput] = useState("")
  const [populaire, setPopulaire] = useState(formule?.populaire ?? false)
  const [actif, setActif] = useState(formule?.actif ?? true)
  const [ordre, setOrdre] = useState(String(formule?.ordre ?? "0"))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function autoSlug(val: string) {
    return val
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  }

  function handleNomChange(val: string) {
    setNom(val)
    if (!formule) setSlug(autoSlug(val))
  }

  function addAvantage() {
    const v = avantageInput.trim()
    if (v && !avantages.includes(v)) {
      setAvantages([...avantages, v])
      setAvantageInput("")
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!nom.trim() || !slug.trim() || !description.trim() || !prixMensuel) {
      setError("Tous les champs obligatoires doivent être remplis.")
      return
    }
    setLoading(true)
    try {
      const payload = {
        ...(formule ? { id: formule.id } : {}),
        nom: nom.trim(),
        slug: slug.trim(),
        description: description.trim(),
        prixMensuel: parseFloat(prixMensuel),
        nbSoinsParMois: parseInt(nbSoinsParMois),
        avantages,
        populaire,
        actif,
        ordre: parseInt(ordre),
      }
      const method = formule ? "PUT" : "POST"
      const res = await fetch("/api/admin/abonnements/formules", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        onSaved()
      } else {
        const data = await res.json()
        setError(data.error || "Erreur lors de la sauvegarde")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white border border-border-brand shadow-xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-[18px] font-light text-text-main">
            {formule ? "Modifier la formule" : "Nouvelle formule"}
          </h2>
          <button onClick={onClose} className="p-1 text-text-muted-brand hover:text-text-mid">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-body text-xs uppercase tracking-wider text-text-muted-brand mb-1">Nom *</label>
              <input
                value={nom}
                onChange={(e) => handleNomChange(e.target.value)}
                maxLength={80}
                className="w-full border border-border-brand bg-bg-page px-3 py-2 font-body text-[13px] focus:border-gold focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block font-body text-xs uppercase tracking-wider text-text-muted-brand mb-1">Slug *</label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                disabled={!!formule}
                maxLength={60}
                className="w-full border border-border-brand bg-bg-page px-3 py-2 font-mono text-[12px] focus:border-gold focus:outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block font-body text-xs uppercase tracking-wider text-text-muted-brand mb-1">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={500}
              className="w-full resize-none border border-border-brand bg-bg-page px-3 py-2 font-body text-[12px] focus:border-gold focus:outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-body text-xs uppercase tracking-wider text-text-muted-brand mb-1">Prix/mois (F) *</label>
              <input
                type="number"
                value={prixMensuel}
                onChange={(e) => setPrixMensuel(e.target.value)}
                min="0"
                className="w-full border border-border-brand bg-bg-page px-3 py-2 font-body text-[13px] focus:border-gold focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block font-body text-xs uppercase tracking-wider text-text-muted-brand mb-1">Soins/mois</label>
              <input
                type="number"
                value={nbSoinsParMois}
                onChange={(e) => setNbSoinsParMois(e.target.value)}
                min="0"
                className="w-full border border-border-brand bg-bg-page px-3 py-2 font-body text-[13px] focus:border-gold focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block font-body text-xs uppercase tracking-wider text-text-muted-brand mb-1">Ordre</label>
              <input
                type="number"
                value={ordre}
                onChange={(e) => setOrdre(e.target.value)}
                min="0"
                className="w-full border border-border-brand bg-bg-page px-3 py-2 font-body text-[13px] focus:border-gold focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Avantages */}
          <div>
            <label className="block font-body text-xs uppercase tracking-wider text-text-muted-brand mb-1">Avantages</label>
            <div className="flex gap-2 mb-2">
              <input
                value={avantageInput}
                onChange={(e) => setAvantageInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAvantage() } }}
                placeholder="Ajouter un avantage puis Entrée..."
                className="flex-1 border border-border-brand bg-bg-page px-3 py-2 font-body text-[12px] focus:border-gold focus:outline-none transition-colors"
              />
              <button type="button" onClick={addAvantage} className="px-3 py-2 bg-bg-page border border-border-brand font-body text-xs text-text-mid hover:border-gold transition-colors">
                <Plus size={13} />
              </button>
            </div>
            {avantages.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {avantages.map((a, i) => (
                  <li key={i} className="flex items-center gap-1 px-2 py-1 bg-primary-light border border-border-brand font-body text-[11px] text-primary-brand">
                    {a}
                    <button type="button" onClick={() => setAvantages(avantages.filter((_, j) => j !== i))} className="text-danger hover:text-red-700 ml-0.5">
                      <X size={10} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={populaire} onChange={(e) => setPopulaire(e.target.checked)} className="cursor-pointer" />
              <span className="font-body text-xs text-text-mid">Formule populaire</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={actif} onChange={(e) => setActif(e.target.checked)} className="cursor-pointer" />
              <span className="font-body text-xs text-text-mid">Formule active</span>
            </label>
          </div>

          {error && <p className="font-body text-xs text-danger">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-primary-brand py-2.5 font-body text-xs font-medium uppercase tracking-wider text-white hover:bg-primary-dark transition-colors disabled:opacity-40"
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              {formule ? "Enregistrer" : "Créer"}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 border border-border-brand font-body text-xs text-text-mid hover:border-gold transition-colors">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
