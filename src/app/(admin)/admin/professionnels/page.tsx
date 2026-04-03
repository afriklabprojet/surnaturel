"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Search, Loader2, ChevronLeft, ChevronRight, Stethoscope, Edit, X, Save,
  Calendar, Shield, ShieldCheck, ShieldAlert, Download, UserCog, Mail, Phone,
  Clock, Globe, FileText, CalendarDays, BadgeCheck, ChevronDown,
} from "lucide-react"

/* ── Types ── */

interface ProfilDetail {
  id: string
  specialite: string | null
  numeroOrdre: string | null
  joursDisponibilite: string[]
  horairesDisponibilite: string | null
  languesConsultation: string[]
}

interface UserPro {
  id: string
  nom: string
  prenom: string
  email: string
  telephone: string | null
  photoUrl: string | null
  role: string
  verificationStatus: string
  createdAt: string
  profilDetail: ProfilDetail | null
  _count: { rendezVous: number; messagesMedicauxEnvoyes: number }
}

type Tab = "all" | "SAGE_FEMME" | "ACCOMPAGNATEUR_MEDICAL" | "ADMIN"
type ModalType = "edit" | "role" | "verification" | null

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
const ROLES = [
  { value: "ADMIN", label: "Administrateur", color: "text-red-600 bg-red-50" },
  { value: "SAGE_FEMME", label: "Sage-femme", color: "text-primary-brand bg-primary-light" },
  { value: "ACCOMPAGNATEUR_MEDICAL", label: "Accompagnateur médical", color: "text-blue-600 bg-blue-50" },
  { value: "CLIENT", label: "Client", color: "text-gray-600 bg-gray-50" },
]
const VERIFICATIONS = [
  { value: "AUCUNE", label: "Non vérifié", icon: Shield, color: "text-gray-400" },
  { value: "MEMBRE_VERIFIE", label: "Membre vérifié", icon: ShieldCheck, color: "text-blue-500" },
  { value: "PROFESSIONNEL_SANTE", label: "Pro santé vérifié", icon: ShieldAlert, color: "text-green-600" },
]
const TABS: { value: Tab; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "SAGE_FEMME", label: "Sage-femmes" },
  { value: "ACCOMPAGNATEUR_MEDICAL", label: "Accompagnateurs" },
  { value: "ADMIN", label: "Administrateurs" },
]

function Avatar({ user, size = 36 }: { user: { prenom: string; nom: string; photoUrl: string | null }; size?: number }) {
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

function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 font-body text-xs uppercase tracking-widest ${className}`}>{children}</span>
}

function getRoleInfo(role: string) {
  return ROLES.find((r) => r.value === role) || ROLES[3]
}

function getVerifInfo(status: string) {
  return VERIFICATIONS.find((v) => v.value === status) || VERIFICATIONS[0]
}

/* ━━━━━━━━━━ Page principale ━━━━━━━━━━ */

export default function PageAdminProfessionnels() {
  const [users, setUsers] = useState<UserPro[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState<Tab>("all")
  const [exporting, setExporting] = useState(false)

  // Modals
  const [modalType, setModalType] = useState<ModalType>(null)
  const [selected, setSelected] = useState<UserPro | null>(null)
  const [saving, setSaving] = useState(false)
  const [actionSuccess, setActionSuccess] = useState("")

  // Edit form
  const [form, setForm] = useState({
    specialite: "",
    numeroOrdre: "",
    joursDisponibilite: [] as string[],
    horairesDisponibilite: "",
    languesConsultation: [] as string[],
    langueInput: "",
  })

  // Role/Verification selectors
  const [selectedRole, setSelectedRole] = useState("")
  const [selectedVerif, setSelectedVerif] = useState("")

  const limit = 20

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (search) params.set("search", search)
      if (tab !== "all") params.set("role", tab)
      const res = await fetch(`/api/admin/professionnels?${params}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
        setTotal(data.total)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [page, search, tab])

  useEffect(() => { fetchData() }, [fetchData])

  /* ── Actions ── */

  function openEdit(u: UserPro) {
    setSelected(u)
    setModalType("edit")
    const p = u.profilDetail
    setForm({
      specialite: p?.specialite || "",
      numeroOrdre: p?.numeroOrdre || "",
      joursDisponibilite: p?.joursDisponibilite || [],
      horairesDisponibilite: p?.horairesDisponibilite || "",
      languesConsultation: p?.languesConsultation || [],
      langueInput: "",
    })
  }

  function openRoleModal(u: UserPro) {
    setSelected(u)
    setSelectedRole(u.role)
    setModalType("role")
  }

  function openVerifModal(u: UserPro) {
    setSelected(u)
    setSelectedVerif(u.verificationStatus)
    setModalType("verification")
  }

  function closeModal() {
    setSelected(null)
    setModalType(null)
    setActionSuccess("")
  }

  async function handleSaveProfile() {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch("/api/admin/professionnels", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selected.id,
          specialite: form.specialite || undefined,
          numeroOrdre: form.numeroOrdre || undefined,
          joursDisponibilite: form.joursDisponibilite,
          horairesDisponibilite: form.horairesDisponibilite || undefined,
          languesConsultation: form.languesConsultation,
        }),
      })
      if (res.ok) {
        closeModal()
        fetchData()
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  async function handleChangeRole() {
    if (!selected || selectedRole === selected.role) return
    setSaving(true)
    try {
      const res = await fetch("/api/admin/professionnels", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selected.id, action: "changeRole", role: selectedRole }),
      })
      if (res.ok) {
        setActionSuccess(`Rôle changé en ${getRoleInfo(selectedRole).label}`)
        setTimeout(() => { closeModal(); fetchData() }, 1200)
      } else {
        const err = await res.json()
        setActionSuccess(err.error || "Erreur")
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  async function handleChangeVerification() {
    if (!selected || selectedVerif === selected.verificationStatus) return
    setSaving(true)
    try {
      const res = await fetch("/api/admin/professionnels", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selected.id, action: "changeVerification", verificationStatus: selectedVerif }),
      })
      if (res.ok) {
        setActionSuccess(`Statut changé : ${getVerifInfo(selectedVerif).label}`)
        setTimeout(() => { closeModal(); fetchData() }, 1200)
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch("/api/admin/export?type=professionnels")
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `professionnels-${new Date().toISOString().split("T")[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch { /* ignore */ }
    setExporting(false)
  }

  function toggleJour(j: string) {
    setForm((f) => ({
      ...f,
      joursDisponibilite: f.joursDisponibilite.includes(j)
        ? f.joursDisponibilite.filter((d) => d !== j)
        : [...f.joursDisponibilite, j],
    }))
  }

  function addLangue() {
    const l = form.langueInput.trim()
    if (l && !form.languesConsultation.includes(l)) {
      setForm((f) => ({ ...f, languesConsultation: [...f.languesConsultation, l], langueInput: "" }))
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-[22px] font-light text-text-main">Professionnels</h1>
          <p className="font-body text-[12px] text-text-muted-brand mt-0.5">Gestion des profils, rôles et vérifications</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 px-4 py-2 border border-border-brand font-body text-xs uppercase tracking-widest hover:bg-bg-page transition-colors disabled:opacity-50"
        >
          {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          Exporter CSV
        </button>
      </div>

      {/* ── Tabs filtrage par rôle ── */}
      <div className="flex gap-1 border-b border-border-brand">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => { setTab(t.value); setPage(1) }}
            className={`px-4 py-2 font-body text-xs uppercase tracking-widest border-b-2 transition-colors ${
              tab === t.value
                ? "border-primary-brand text-primary-brand"
                : "border-transparent text-text-muted-brand hover:text-text-mid"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Barre de recherche ── */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-brand" />
          <input
            type="text"
            placeholder="Rechercher par nom, prénom ou email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-3 py-2 border border-border-brand font-body text-[13px] bg-white focus:outline-none focus:border-primary-brand"
          />
        </div>
        <span className="ml-auto font-body text-[12px] text-text-muted-brand">{total} professionnel{total > 1 ? "s" : ""}</span>
      </div>

      {/* ── Cards grid ── */}
      {loading ? (
        <div className="flex items-center justify-center min-h-100">
          <Loader2 className="h-8 w-8 animate-spin text-primary-brand" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {users.map((u) => {
            const p = u.profilDetail
            const roleInfo = getRoleInfo(u.role)
            const verifInfo = getVerifInfo(u.verificationStatus)
            const VerifIcon = verifInfo.icon
            return (
              <div key={u.id} className="bg-white border border-border-brand p-5 space-y-3 group">
                {/* Header — Avatar + nom + badges */}
                <div className="flex items-start gap-3">
                  <Avatar user={u} />
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-[14px] font-medium text-text-main truncate">{u.prenom} {u.nom}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <Badge className={roleInfo.color}>{roleInfo.label}</Badge>
                      <Badge className={`${verifInfo.color} bg-transparent`}>
                        <VerifIcon size={10} /> {verifInfo.label}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-1 text-text-muted-brand">
                  <p className="font-body text-xs flex items-center gap-1.5"><Mail size={11} /> {u.email}</p>
                  {u.telephone && <p className="font-body text-xs flex items-center gap-1.5"><Phone size={11} /> {u.telephone}</p>}
                </div>

                {/* Profil professionnel */}
                {p?.specialite && (
                  <p className="font-body text-[12px] text-text-mid flex items-center gap-1.5"><Stethoscope size={12} /> {p.specialite}</p>
                )}
                {p?.numeroOrdre && (
                  <p className="font-body text-xs text-text-muted-brand flex items-center gap-1.5"><FileText size={11} /> N° Ordre : {p.numeroOrdre}</p>
                )}

                {/* Planning résumé */}
                {p?.joursDisponibilite && p.joursDisponibilite.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <CalendarDays size={11} className="text-text-muted-brand shrink-0" />
                    <div className="flex flex-wrap gap-1">
                      {p.joursDisponibilite.map((j) => (
                        <span key={j} className="px-1.5 py-0.5 font-body text-[9px] uppercase tracking-widest bg-primary-light text-primary-brand">{j.slice(0, 3)}</span>
                      ))}
                    </div>
                  </div>
                )}
                {p?.horairesDisponibilite && (
                  <p className="font-body text-xs text-text-muted-brand flex items-center gap-1.5"><Clock size={11} /> {p.horairesDisponibilite}</p>
                )}
                {p?.languesConsultation && p.languesConsultation.length > 0 && (
                  <p className="font-body text-xs text-text-muted-brand flex items-center gap-1.5"><Globe size={11} /> {p.languesConsultation.join(", ")}</p>
                )}

                {!p && (
                  <p className="font-body text-xs text-text-muted-brand italic">Profil professionnel non renseigné</p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 pt-1 border-t border-border-brand">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={11} className="text-text-muted-brand" />
                    <span className="font-body text-xs text-text-mid">{u._count.rendezVous} RDV</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileText size={11} className="text-text-muted-brand" />
                    <span className="font-body text-xs text-text-mid">{u._count.messagesMedicauxEnvoyes} msg méd.</span>
                  </div>
                  <span className="font-body text-xs text-text-muted-brand ml-auto">
                    Inscrit le {new Date(u.createdAt).toLocaleDateString("fr")}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button onClick={() => openEdit(u)} className="flex-1 py-1.5 flex items-center justify-center gap-1 border border-border-brand font-body text-xs uppercase tracking-widest text-text-muted-brand hover:text-primary-brand hover:border-primary-brand transition-colors">
                    <Edit size={12} /> Profil
                  </button>
                  <button onClick={() => openRoleModal(u)} className="flex-1 py-1.5 flex items-center justify-center gap-1 border border-border-brand font-body text-xs uppercase tracking-widest text-text-muted-brand hover:text-primary-brand hover:border-primary-brand transition-colors">
                    <UserCog size={12} /> Rôle
                  </button>
                  <button onClick={() => openVerifModal(u)} className="flex-1 py-1.5 flex items-center justify-center gap-1 border border-border-brand font-body text-xs uppercase tracking-widest text-text-muted-brand hover:text-primary-brand hover:border-primary-brand transition-colors">
                    <BadgeCheck size={12} /> Vérif.
                  </button>
                </div>
              </div>
            )
          })}
          {users.length === 0 && (
            <p className="col-span-full text-center font-body text-[13px] text-text-muted-brand py-8">Aucun professionnel trouvé</p>
          )}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="flex items-center gap-1 px-3 py-1.5 font-body text-xs uppercase tracking-widest border border-border-brand hover:bg-bg-page disabled:opacity-40 transition-colors">
            <ChevronLeft size={14} /> Préc.
          </button>
          <span className="font-body text-[12px] text-text-muted-brand">{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="flex items-center gap-1 px-3 py-1.5 font-body text-xs uppercase tracking-widest border border-border-brand hover:bg-bg-page disabled:opacity-40 transition-colors">
            Suiv. <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* ━━━━━━━━━━ Modal : Édition profil professionnel ━━━━━━━━━━ */}
      {modalType === "edit" && selected && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-white border border-border-brand w-full max-w-lg p-6 space-y-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-[18px] font-light text-text-main">
                Profil — {selected.prenom} {selected.nom}
              </h3>
              <button onClick={closeModal} className="text-text-muted-brand hover:text-text-mid"><X size={20} /></button>
            </div>

            <div>
              <label className="font-body text-xs uppercase tracking-widest text-text-muted-brand">Spécialité</label>
              <input
                type="text"
                value={form.specialite}
                onChange={(e) => setForm({ ...form, specialite: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-border-brand font-body text-[13px] focus:outline-none focus:border-primary-brand"
                placeholder="Ex: Sage-femme, Naturopathe…"
              />
            </div>

            <div>
              <label className="font-body text-xs uppercase tracking-widest text-text-muted-brand">N° Ordre</label>
              <input
                type="text"
                value={form.numeroOrdre}
                onChange={(e) => setForm({ ...form, numeroOrdre: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-border-brand font-body text-[13px] focus:outline-none focus:border-primary-brand"
              />
            </div>

            <div>
              <label className="font-body text-xs uppercase tracking-widest text-text-muted-brand">Jours de disponibilité</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {JOURS.map((j) => (
                  <button
                    key={j}
                    type="button"
                    onClick={() => toggleJour(j)}
                    className={`px-2 py-1 font-body text-xs border transition-colors ${
                      form.joursDisponibilite.includes(j)
                        ? "border-primary-brand bg-primary-light text-primary-brand"
                        : "border-border-brand text-text-muted-brand hover:text-text-mid"
                    }`}
                  >
                    {j}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-body text-xs uppercase tracking-widest text-text-muted-brand">Horaires</label>
              <input
                type="text"
                value={form.horairesDisponibilite}
                onChange={(e) => setForm({ ...form, horairesDisponibilite: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-border-brand font-body text-[13px] focus:outline-none focus:border-primary-brand"
                placeholder="Ex: 09:00 - 17:00"
              />
            </div>

            <div>
              <label className="font-body text-xs uppercase tracking-widest text-text-muted-brand">Langues de consultation</label>
              <div className="flex flex-wrap gap-1 mt-1">
                {form.languesConsultation.map((l) => (
                  <span key={l} className="inline-flex items-center gap-1 px-2 py-0.5 font-body text-xs bg-bg-page text-text-mid border border-border-brand">
                    {l}
                    <button type="button" onClick={() => setForm((f) => ({ ...f, languesConsultation: f.languesConsultation.filter((x) => x !== l) }))} className="text-text-muted-brand hover:text-red-500">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  value={form.langueInput}
                  onChange={(e) => setForm({ ...form, langueInput: e.target.value })}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLangue() } }}
                  className="flex-1 px-3 py-2 border border-border-brand font-body text-[13px] focus:outline-none focus:border-primary-brand"
                  placeholder="Ajouter une langue"
                />
                <button type="button" onClick={addLangue} className="px-3 py-2 border border-border-brand font-body text-xs text-text-muted-brand hover:bg-bg-page transition-colors">+</button>
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full py-2 bg-primary-brand text-white font-body text-xs uppercase tracking-widest hover:bg-primary-brand/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Enregistrer
            </button>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━ Modal : Changement de rôle ━━━━━━━━━━ */}
      {modalType === "role" && selected && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-white border border-border-brand w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-[18px] font-light text-text-main">Changer le rôle</h3>
              <button onClick={closeModal} className="text-text-muted-brand hover:text-text-mid"><X size={20} /></button>
            </div>

            <p className="font-body text-[13px] text-text-mid">
              {selected.prenom} {selected.nom} — actuellement <strong>{getRoleInfo(selected.role).label}</strong>
            </p>

            {actionSuccess && (
              <p className="font-body text-[12px] text-green-600 bg-green-50 px-3 py-2 border border-green-200">{actionSuccess}</p>
            )}

            <div className="space-y-2">
              {ROLES.map((r) => (
                <label key={r.value} className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${
                  selectedRole === r.value ? "border-primary-brand bg-primary-light/30" : "border-border-brand hover:bg-bg-page"
                }`}>
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={selectedRole === r.value}
                    onChange={() => setSelectedRole(r.value)}
                    className="accent-primary-brand"
                  />
                  <span className="font-body text-[13px] text-text-main">{r.label}</span>
                </label>
              ))}
            </div>

            <button
              onClick={handleChangeRole}
              disabled={saving || selectedRole === selected.role}
              className="w-full py-2 bg-primary-brand text-white font-body text-xs uppercase tracking-widest hover:bg-primary-brand/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <UserCog size={14} />} Appliquer le rôle
            </button>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━ Modal : Vérification ━━━━━━━━━━ */}
      {modalType === "verification" && selected && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-white border border-border-brand w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-[18px] font-light text-text-main">Statut de vérification</h3>
              <button onClick={closeModal} className="text-text-muted-brand hover:text-text-mid"><X size={20} /></button>
            </div>

            <p className="font-body text-[13px] text-text-mid">
              {selected.prenom} {selected.nom} — actuellement <strong>{getVerifInfo(selected.verificationStatus).label}</strong>
            </p>

            {actionSuccess && (
              <p className="font-body text-[12px] text-green-600 bg-green-50 px-3 py-2 border border-green-200">{actionSuccess}</p>
            )}

            <div className="space-y-2">
              {VERIFICATIONS.map((v) => {
                const VIcon = v.icon
                return (
                  <label key={v.value} className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${
                    selectedVerif === v.value ? "border-primary-brand bg-primary-light/30" : "border-border-brand hover:bg-bg-page"
                  }`}>
                    <input
                      type="radio"
                      name="verif"
                      value={v.value}
                      checked={selectedVerif === v.value}
                      onChange={() => setSelectedVerif(v.value)}
                      className="accent-primary-brand"
                    />
                    <VIcon size={16} className={v.color} />
                    <span className="font-body text-[13px] text-text-main">{v.label}</span>
                  </label>
                )
              })}
            </div>

            <button
              onClick={handleChangeVerification}
              disabled={saving || selectedVerif === selected.verificationStatus}
              className="w-full py-2 bg-primary-brand text-white font-body text-xs uppercase tracking-widest hover:bg-primary-brand/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />} Appliquer la vérification
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
