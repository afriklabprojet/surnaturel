"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  Calendar,
  Clock,
  User,
  Users,
  Phone,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Search,
  Filter,
  Plus,
  RefreshCw,
  BarChart2,
  Share2,
  AlertTriangle,
  Baby,
  ClipboardList,
  Eye,
  EyeOff,
  TrendingUp,
  X,
  type LucideIcon,
} from "lucide-react"
import { formatPrix } from "@/lib/utils"

// ── Types ────────────────────────────────────────────────────────────────────

interface RDV {
  id: string
  client: { id: string; nom: string; prenom: string; telephone: string; email: string; image?: string }
  soin: { id: string; nom: string; duree: number; prix: number }
  dateHeure: string
  duree: number
  statut: string
  notes?: string
  forfait?: { nom: string; seancesRestantes: number }
}

interface Patient {
  id: string; nom: string; prenom: string; telephone: string; email: string; image?: string
  _count: { rdvs: number; fiches: number }
  derniereVisite?: string
}

interface NotePro {
  id: string; clientId: string; clientNom: string; contenu: string; type: string
  partagePatient?: boolean; auteur?: string; createdAt: string
}

interface SuiviSpecialise {
  id: string; type: string; actif: boolean; prenomPatient?: string
  dpa?: string; terme?: string; grossesse?: number
  dateDebut?: string; notes?: string; nombreSeances?: number
  updatedAt?: string; semainesAmenorhee?: number; datePrevueAccouchement?: string
  parite?: string; poidsKg?: number; taillesConsultations?: string; tensionArterielle?: string
  examensRealises?: string[]; symptomes?: string; recommandations?: string
  tailleCm?: number; perimCranienCm?: number; dateNaissancePatient?: string
}

interface QuestionnaireItem {
  id: string; typeSoin?: string; motif: string; antecedents?: string
  medicaments?: string; allergies?: string; ddr?: string; parite?: string
  autresInfos?: string; createdAt: string
}

interface RdvItem {
  id: string; dateHeure: string; soin?: { nom: string }; statut: string; notes?: string
}

interface Questionnaire {
  id: string
  patient: { id: string; prenom: string; nom: string; telephone: string; email: string }
  typeSoin: string | null; motif: string; antecedents: string | null; medicaments: string | null
  allergies: string | null; ddr: string | null; parite: string | null; autresInfos: string | null
  traite: boolean; createdAt: string
}

interface FichePatient {
  patient: { id: string; nom: string; prenom: string; email: string; telephone: string; image?: string; createdAt: string; dateNaissance?: string }
  dossier: { id: string; groupeSanguin: string|null; pathologie: string|null; allergies: string|null; antecedents: string|null; medicaments: string|null } | null
  suiviSpecialises: SuiviSpecialise[]; questionnaires: QuestionnaireItem[]; rdvs: RdvItem[]; notes: NotePro[]
}

interface DashboardData {
  rdvDuJour: RDV[]; rdvEnAttente: number; rdvConfirmes: number; rdvAnnules: number; patientsActifs: number
  stats: { soinsAujourdhui: number; revenuPotentiel: number; dureeTotal: number }
}

interface StatsData {
  parMois: { mois: number; label: string; rdvTotal: number; rdvTermines: number; revenu: number }[]
  totaux: { rdvTotal: number; rdvTermines: number; revenu: number; tauxAnnulation: number }
  topSoins: { nom: string; count: number }[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmtH = (d: string) => new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
const fmtD = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
const fmtDL = (d: string) => new Date(d).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r }
const isoDate = (d: Date) => d.toISOString().split("T")[0]
const ageDe = (s?: string) => { if (!s) return null; const dn = new Date(s), n = new Date(); let a = n.getFullYear() - dn.getFullYear(); const m = n.getMonth() - dn.getMonth(); if (m < 0 || (m === 0 && n.getDate() < dn.getDate())) a--; return a }

const NOTE_COLORS: Record<string, { bg: string; text: string }> = {
  GENERALE: { bg: "bg-gray-100", text: "text-gray-700" },
  SUIVI:    { bg: "bg-blue-100", text: "text-blue-700" },
  ALERTE:   { bg: "bg-red-100",  text: "text-red-700"  },
}
const STATUT_COLORS: Record<string, string> = {
  EN_ATTENTE: "text-amber-600 bg-amber-100",
  CONFIRME:   "text-green-700 bg-green-100",
  TERMINE:    "text-blue-700 bg-blue-100",
  ANNULE:     "text-red-600 bg-red-100",
}
const TYPE_SUIVI_LABELS: Record<string, string> = {
  GROSSESSE: "Grossesse", POST_PARTUM: "Post-partum", NOURRISSON: "Nourrisson",
  PEDIATRIQUE: "Pédiatrique", GYNECOLOGIQUE: "Gynécologique", GENERAL: "Général",
}

// ── Modale fiche patient ─────────────────────────────────────────────────────

function FichePatientModal({ patientId, onClose }: { patientId: string; onClose: () => void }) {
  const [fiche, setFiche] = useState<FichePatient | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"rdv"|"notes"|"suivi"|"questionnaire">("rdv")

  useEffect(() => {
    fetch(`/api/admin/sage-femme/patients/${patientId}`)
      .then(r => r.json()).then(setFiche).finally(() => setLoading(false))
  }, [patientId])

  async function togglePartage(noteId: string, current: boolean) {
    await fetch("/api/admin/sage-femme/notes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: noteId, partagePatient: !current }) })
    setFiche(prev => prev ? { ...prev, notes: prev.notes.map(n => n.id === noteId ? { ...n, partagePatient: !current } : n) } : prev)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-10">
      <div className="relative w-full max-w-3xl bg-white">
        <div className="flex items-center justify-between border-b border-border-brand bg-gray-50 p-5">
          {fiche && (
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center bg-primary-brand/10 font-display text-primary-brand">
                {fiche.patient.prenom[0]}{fiche.patient.nom[0]}
              </div>
              <div>
                <p className="font-display text-[18px] text-text-main">{fiche.patient.prenom} {fiche.patient.nom}</p>
                <p className="text-[13px] text-text-muted-brand">
                  {fiche.patient.telephone}{fiche.patient.dateNaissance && ` · ${ageDe(fiche.patient.dateNaissance)} ans`}
                </p>
              </div>
            </div>
          )}
          <button onClick={onClose} className="text-text-muted-brand hover:text-text-main"><X size={20} /></button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-brand border-t-transparent" /></div>
        ) : !fiche ? (
          <p className="py-10 text-center text-text-muted-brand">Fiche introuvable</p>
        ) : (
          <>
            {fiche.dossier && (
              <div className="grid grid-cols-2 gap-3 border-b border-border-brand bg-primary-light/30 p-4 text-[13px] sm:grid-cols-4">
                {[
                  { label: "Groupe sanguin", val: fiche.dossier.groupeSanguin },
                  { label: "Allergies", val: fiche.dossier.allergies },
                  { label: "Pathologies", val: fiche.dossier.pathologie },
                  { label: "Médicaments", val: fiche.dossier.medicaments },
                ].map(({ label, val }) => (
                  <div key={label}><p className="text-[11px] uppercase tracking-wider text-text-muted-brand">{label}</p><p className="font-medium">{val || "—"}</p></div>
                ))}
              </div>
            )}

            <div className="flex gap-4 overflow-x-auto scrollbar-none border-b border-border-brand px-4 pt-2 whitespace-nowrap">
              {([
                { id: "rdv", label: `Consultations (${fiche.rdvs.length})` },
                { id: "notes", label: `Notes (${fiche.notes.length})` },
                { id: "suivi", label: `Suivi (${fiche.suiviSpecialises.length})` },
                { id: "questionnaire", label: `Questionnaires (${fiche.questionnaires.length})` },
              ] as const).map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`border-b-2 pb-2 text-[13px] transition-colors ${tab === t.id ? "border-primary-brand text-primary-brand" : "border-transparent text-text-muted-brand"}`}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="max-h-[50vh] overflow-y-auto p-4 space-y-2">
              {tab === "rdv" && (fiche.rdvs.length === 0 ? (
                <p className="py-6 text-center text-text-muted-brand">Aucune consultation</p>
              ) : fiche.rdvs.map(rdv => (
                <div key={rdv.id} className="flex items-start justify-between border border-border-brand p-3">
                  <div>
                    <p className="text-[13px] font-medium">{rdv.soin?.nom}</p>
                    <p className="text-[12px] text-text-muted-brand">{fmtDL(rdv.dateHeure)} · {fmtH(rdv.dateHeure)}</p>
                    {rdv.notes && <p className="mt-1 text-[12px] text-amber-700">{rdv.notes}</p>}
                  </div>
                  <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${STATUT_COLORS[rdv.statut] ?? "bg-gray-100 text-gray-600"}`}>{rdv.statut}</span>
                </div>
              )))}

              {tab === "notes" && (fiche.notes.length === 0 ? (
                <p className="py-6 text-center text-text-muted-brand">Aucune note</p>
              ) : fiche.notes.map((note) => {
                const cfg = NOTE_COLORS[note.type] ?? NOTE_COLORS.GENERALE
                return (
                  <div key={note.id} className="border border-border-brand p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] ${cfg.bg} ${cfg.text}`}>{note.type}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-text-muted-brand">{note.auteur} · {fmtD(note.createdAt)}</span>
                        <button onClick={() => togglePartage(note.id, note.partagePatient ?? false)}
                          className={`flex items-center gap-1 rounded px-2 py-0.5 text-[11px] transition-colors ${note.partagePatient ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {note.partagePatient ? <Eye size={11} /> : <EyeOff size={11} />}
                          {note.partagePatient ? "Visible patient" : "Privé"}
                        </button>
                      </div>
                    </div>
                    <p className="text-[13px] text-text-mid">{note.contenu}</p>
                  </div>
                )
              }))}

              {tab === "suivi" && (fiche.suiviSpecialises.length === 0 ? (
                <p className="py-6 text-center text-text-muted-brand">Aucun suivi spécialisé</p>
              ) : fiche.suiviSpecialises.map((s) => (
                <div key={s.id} className={`border p-4 ${s.actif ? "border-primary-brand bg-primary-light/20" : "border-border-brand opacity-60"}`}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-medium text-[14px]">{TYPE_SUIVI_LABELS[s.type] ?? s.type}</span>
                    {s.prenomPatient && <span className="text-[12px] text-text-muted-brand">— {s.prenomPatient}</span>}
                    {!s.actif && <span className="ml-auto text-[11px] text-text-muted-brand">Archivé</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[12px] text-text-mid sm:grid-cols-3">
                    {s.semainesAmenorhee && <div><span className="text-text-muted-brand">SA: </span>{s.semainesAmenorhee} SA</div>}
                    {s.datePrevueAccouchement && <div><span className="text-text-muted-brand">DPA: </span>{fmtD(s.datePrevueAccouchement)}</div>}
                    {s.parite && <div><span className="text-text-muted-brand">Parité: </span>{s.parite}</div>}
                    {s.poidsKg && <div><span className="text-text-muted-brand">Poids: </span>{s.poidsKg} kg</div>}
                    {s.tailleCm && <div><span className="text-text-muted-brand">Taille: </span>{s.tailleCm} cm</div>}
                    {s.perimCranienCm && <div><span className="text-text-muted-brand">PC: </span>{s.perimCranienCm} cm</div>}
                    {s.dateNaissancePatient && <div><span className="text-text-muted-brand">Né(e): </span>{fmtD(s.dateNaissancePatient)}</div>}
                  </div>
                  {s.notes && <p className="mt-2 text-[12px] italic text-text-mid">{s.notes}</p>}
                  {(s.examensRealises?.length ?? 0) > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {s.examensRealises?.map((e: string, i: number) => (
                        <span key={i} className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-text-muted-brand">{e}</span>
                      ))}
                    </div>
                  )}
                </div>
              )))}

              {tab === "questionnaire" && (fiche.questionnaires.length === 0 ? (
                <p className="py-6 text-center text-text-muted-brand">Aucun questionnaire</p>
              ) : fiche.questionnaires.map((q) => (
                <div key={q.id} className="border border-border-brand p-4 text-[13px] space-y-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] uppercase tracking-wider text-text-muted-brand">{fmtDL(q.createdAt)}</span>
                    {q.typeSoin && <span className="rounded bg-primary-light px-2 py-0.5 text-[11px] text-primary-brand">{q.typeSoin}</span>}
                  </div>
                  <div><span className="font-medium">Motif: </span>{q.motif}</div>
                  {q.antecedents && <div><span className="font-medium">Antécédents: </span>{q.antecedents}</div>}
                  {q.medicaments && <div><span className="font-medium">Médicaments: </span>{q.medicaments}</div>}
                  {q.allergies && <div><span className="font-medium">Allergies: </span>{q.allergies}</div>}
                  {q.ddr && <div><span className="font-medium">DDR: </span>{q.ddr}</div>}
                  {q.parite && <div><span className="font-medium">Parité: </span>{q.parite}</div>}
                  {q.autresInfos && <div><span className="font-medium">Autres: </span>{q.autresInfos}</div>}
                </div>
              )))}
            </div>

            <div className="flex justify-between border-t border-border-brand p-4">
              <Link href={`/admin/clients/${fiche.patient.id}`} className="text-[13px] text-primary-brand hover:underline">Voir profil complet →</Link>
              <button onClick={onClose} className="border border-border-brand px-4 py-2 text-[13px] hover:bg-gray-50">Fermer</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Vue Calendrier ────────────────────────────────────────────────────────────

function CalendrierVue({ onSelectRdv }: { onSelectRdv: (rdv: RDV) => void }) {
  const [rdvs, setRdvs] = useState<RDV[]>([])
  const [debut, setDebut] = useState<Date>(() => {
    const d = new Date(); const j = d.getDay() === 0 ? 7 : d.getDay()
    d.setDate(d.getDate() - j + 1); d.setHours(0, 0, 0, 0); return d
  })
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<"semaine"|"mois">("semaine")

  const fin = addDays(debut, mode === "semaine" ? 6 : 29)

  const charger = useCallback(async () => {
    setLoading(true)
    const r = await fetch(`/api/admin/sage-femme/planning?debut=${isoDate(debut)}&fin=${isoDate(fin)}`)
    if (r.ok) setRdvs((await r.json()).rdvs || [])
    setLoading(false)
  }, [debut, fin])

  useEffect(() => { charger() }, [charger])

  const jours = Array.from({ length: mode === "semaine" ? 7 : 30 }, (_, i) => addDays(debut, i))
  const rdvsDuJour = (j: Date) => rdvs.filter(r => r.dateHeure.startsWith(isoDate(j)))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setDebut(addDays(debut, mode === "semaine" ? -7 : -30))} className="rounded border border-border-brand p-2 hover:bg-gray-50"><ChevronLeft size={16} /></button>
          <span className="min-w-[160px] text-center text-[14px] font-medium">{fmtD(debut.toISOString())} — {fmtD(fin.toISOString())}</span>
          <button onClick={() => setDebut(addDays(debut, mode === "semaine" ? 7 : 30))} className="rounded border border-border-brand p-2 hover:bg-gray-50"><ChevronRight size={16} /></button>
          <button onClick={() => { const d = new Date(); const j = d.getDay() === 0 ? 7 : d.getDay(); d.setDate(d.getDate() - j + 1); d.setHours(0,0,0,0); setDebut(d) }}
            className="border border-border-brand px-3 py-1.5 text-[12px] hover:bg-gray-50">Aujourd&apos;hui</button>
        </div>
        <div className="flex gap-2">
          {(["semaine","mois"] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-3 py-1.5 text-[12px] capitalize ${mode === m ? "bg-primary-brand text-white" : "border border-border-brand hover:bg-gray-50"}`}>{m}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-brand border-t-transparent" /></div>
      ) : (
        <div className="overflow-x-auto">
        <div className="grid grid-cols-7 gap-1 min-w-[480px]">
          {jours.map(j => {
            const rdvsJ = rdvsDuJour(j)
            const isToday = isoDate(j) === isoDate(new Date())
            return (
              <div key={j.toISOString()} className={`min-h-[80px] border p-1 ${isToday ? "border-primary-brand bg-primary-light/20" : "border-border-brand"}`}>
                <p className={`mb-1 text-center text-[11px] font-medium ${isToday ? "text-primary-brand" : "text-text-muted-brand"}`}>
                  {j.toLocaleDateString("fr-FR", { weekday: "short" })} {j.getDate()}
                </p>
                {rdvsJ.map(rdv => (
                  <button key={rdv.id} onClick={() => onSelectRdv(rdv)}
                    className={`mb-0.5 w-full rounded p-1 text-left text-[10px] ${
                      rdv.statut === "ANNULE" ? "bg-red-50 text-red-700" :
                      rdv.statut === "TERMINE" ? "bg-blue-50 text-blue-700" :
                      rdv.statut === "CONFIRME" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                    }`}>
                    <p className="font-medium">{fmtH(rdv.dateHeure)}</p>
                    <p className="truncate">{rdv.client.prenom} {rdv.client.nom[0]}.</p>
                  </button>
                ))}
              </div>
            )
          })}
        </div>
        </div>
      )}
    </div>
  )
}

// ── Statistiques ─────────────────────────────────────────────────────────────

function StatsVue() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/sage-femme/stats").then(r => r.json()).then(setStats).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-brand border-t-transparent" /></div>
  if (!stats) return <p className="py-10 text-center text-text-muted-brand">Impossible de charger les statistiques</p>

  const maxRevenu = Math.max(...stats.parMois.map(m => m.revenu), 1)
  const maxRdv = Math.max(...stats.parMois.map(m => m.rdvTotal), 1)

  return (
    <div className="space-y-8">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Consultations terminées", value: stats.totaux.rdvTermines, sub: `sur ${stats.totaux.rdvTotal} total` },
          { label: "Revenus générés", value: formatPrix(stats.totaux.revenu), sub: "cette année" },
          { label: "Taux d'annulation", value: `${stats.totaux.tauxAnnulation}%`, sub: "des rendez-vous" },
        ].map(kpi => (
          <div key={kpi.label} className="border border-border-brand bg-white p-4">
            <p className="font-body text-xs uppercase tracking-wider text-text-muted-brand">{kpi.label}</p>
            <p className="mt-2 font-display text-[28px] text-primary-brand">{kpi.value}</p>
            <p className="text-[12px] text-text-muted-brand">{kpi.sub}</p>
          </div>
        ))}
        <div className="border border-border-brand bg-white p-4">
          <p className="font-body text-xs uppercase tracking-wider text-text-muted-brand">Top soin</p>
          <p className="mt-2 font-display text-[18px] text-primary-brand">{stats.topSoins[0]?.nom ?? "—"}</p>
          <p className="text-[12px] text-text-muted-brand">{stats.topSoins[0]?.count ?? 0} fois</p>
        </div>
      </div>

      {[
        { label: "Consultations par mois", data: stats.parMois.map(m => m.rdvTotal), max: maxRdv, color: "bg-primary-brand/80" },
        { label: "Revenus par mois (FCFA)", data: stats.parMois.map(m => m.revenu), max: maxRevenu, color: "bg-gold/70" },
      ].map(chart => (
        <div key={chart.label}>
          <p className="mb-3 font-body text-[13px] uppercase tracking-wider text-text-muted-brand">{chart.label}</p>
          <div className="flex items-end gap-1 border-b border-border-brand" style={{ height: 120 }}>
            {chart.data.map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center">
                <div className={`w-full ${chart.color} transition-all`} style={{ height: `${Math.round((v / chart.max) * 100)}%`, minHeight: v ? 4 : 0 }} />
              </div>
            ))}
          </div>
          <div className="mt-1 flex gap-1">
            {stats.parMois.map(m => <div key={m.mois} className="flex-1 text-center text-[9px] text-text-muted-brand">{m.label}</div>)}
          </div>
        </div>
      ))}

      {stats.topSoins.length > 0 && (
        <div>
          <p className="mb-3 font-body text-[13px] uppercase tracking-wider text-text-muted-brand">Top soins</p>
          <div className="space-y-2">
            {stats.topSoins.map((s, i) => (
              <div key={i} className="flex items-center gap-3 text-[13px]">
                <span className="w-4 text-right text-text-muted-brand">{i + 1}.</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span>{s.nom}</span>
                    <span className="font-medium text-primary-brand">{s.count} fois</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full bg-gray-100">
                    <div className="h-full bg-primary-brand/60" style={{ width: `${Math.round((s.count / (stats.topSoins[0]?.count || 1)) * 100)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Questionnaires admin ─────────────────────────────────────────────────────

function QuestionnairesVue({ onVoirPatient }: { onVoirPatient: (id: string) => void }) {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  const charger = useCallback(async () => {
    setLoading(true)
    const r = await fetch(`/api/admin/sage-femme/questionnaires${showAll ? "?all=1" : ""}`)
    if (r.ok) setQuestionnaires((await r.json()).questionnaires || [])
    setLoading(false)
  }, [showAll])

  useEffect(() => { charger() }, [charger])

  async function marquerTraite(id: string) {
    await fetch("/api/admin/sage-femme/questionnaires", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
    setQuestionnaires(prev => prev.filter(q => q.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-text-muted-brand">{questionnaires.length} questionnaire(s) {showAll ? "au total" : "non traité(s)"}</p>
        <button onClick={() => setShowAll(v => !v)} className="border border-border-brand px-3 py-1.5 text-[12px] hover:bg-gray-50">
          {showAll ? "Voir non traités" : "Voir tous"}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-brand border-t-transparent" /></div>
      ) : questionnaires.length === 0 ? (
        <div className="py-12 text-center"><ClipboardList className="mx-auto h-12 w-12 text-text-muted-brand/30" /><p className="mt-4 text-text-muted-brand">Aucun questionnaire</p></div>
      ) : (
        <div className="space-y-3">
          {questionnaires.map(q => (
            <div key={q.id} className={`border p-4 ${q.traite ? "border-border-brand opacity-70" : "border-amber-300 bg-amber-50"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{q.patient.prenom} {q.patient.nom}</p>
                    {!q.traite && <span className="rounded bg-amber-200 px-2 py-0.5 text-[11px] text-amber-800">Non traité</span>}
                  </div>
                  <p className="text-[12px] text-text-muted-brand">{q.patient.telephone} · {fmtD(q.createdAt)}</p>
                  {q.typeSoin && <p className="mt-1 text-[12px] text-primary-brand">{q.typeSoin}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onVoirPatient(q.patient.id)} className="flex items-center gap-1 border border-primary-brand px-3 py-1.5 text-[12px] text-primary-brand hover:bg-primary-brand/5">
                    <Eye size={13} /> Fiche patient
                  </button>
                  {!q.traite && (
                    <button onClick={() => marquerTraite(q.id)} className="flex items-center gap-1 bg-primary-brand px-3 py-1.5 text-[12px] text-white hover:bg-primary-brand/90">
                      <CheckCircle size={13} /> Marquer traité
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-3 text-[13px] space-y-0.5">
                <p><span className="font-medium">Motif: </span>{q.motif}</p>
                {q.antecedents && <p><span className="font-medium">Antécédents: </span>{q.antecedents}</p>}
                {q.allergies && <p><span className="font-medium">Allergies: </span>{q.allergies}</p>}
                {q.ddr && <p><span className="font-medium">DDR: </span>{q.ddr}</p>}
                {q.parite && <p><span className="font-medium">Parité: </span>{q.parite}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

type TabId = "rdv" | "patients" | "notes" | "calendrier" | "stats" | "questionnaires"

export default function SageFemmeDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [notes, setNotes] = useState<NotePro[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>("rdv")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatut, setFilterStatut] = useState("TOUS")
  const [filterNoteType, setFilterNoteType] = useState("TOUS")
  const [nouvelleNote, setNouvelleNote] = useState("")
  const [patientNote, setPatientNote] = useState("")
  const [typeNote, setTypeNote] = useState("GENERALE")
  const [fichePatientId, setFichePatientId] = useState<string | null>(null)
  const [rdvCalendrier, setRdvCalendrier] = useState<RDV | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [r1, r2, r3] = await Promise.all([
        fetch("/api/admin/sage-femme/dashboard"),
        fetch("/api/admin/sage-femme/patients"),
        fetch("/api/admin/sage-femme/notes"),
      ])
      if (r1.ok) setData(await r1.json())
      if (r2.ok) setPatients((await r2.json()).patients || [])
      if (r3.ok) setNotes((await r3.json()).notes || [])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function updateRdvStatut(rdvId: string, statut: string) {
    await fetch(`/api/admin/rdv/${rdvId}/statut`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ statut }) })
    fetchData()
  }

  async function addNote() {
    if (!nouvelleNote.trim() || !patientNote) return
    await fetch("/api/admin/sage-femme/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId: patientNote, contenu: nouvelleNote, type: typeNote }) })
    setNouvelleNote(""); setPatientNote(""); setTypeNote("GENERALE")
    fetchData()
  }

  const rdvFiltres = (data?.rdvDuJour ?? []).filter(rdv => {
    if (filterStatut !== "TOUS" && rdv.statut !== filterStatut) return false
    if (searchQuery) { const s = searchQuery.toLowerCase(); return rdv.client.nom.toLowerCase().includes(s) || rdv.client.prenom.toLowerCase().includes(s) || rdv.soin.nom.toLowerCase().includes(s) }
    return true
  })

  const notesFiltrees = notes.filter(n => {
    if (filterNoteType !== "TOUS" && n.type !== filterNoteType) return false
    if (searchQuery) return n.clientNom.toLowerCase().includes(searchQuery.toLowerCase())
    return true
  })

  const prochainRdv = data?.rdvDuJour.find(r => r.statut === "CONFIRME" && new Date(r.dateHeure) > new Date())

  const TABS = [
    { id: "rdv" as TabId, label: "RDV du jour", count: data?.rdvDuJour.length, icon: Calendar },
    { id: "calendrier" as TabId, label: "Calendrier", icon: Calendar },
    { id: "patients" as TabId, label: "Patients", count: patients.length, icon: Users },
    { id: "notes" as TabId, label: "Notes", count: notes.length, icon: FileText },
    { id: "questionnaires" as TabId, label: "Questionnaires", icon: ClipboardList },
    { id: "stats" as TabId, label: "Statistiques", icon: BarChart2 },
  ]

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-brand border-t-transparent" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-[28px] text-primary-brand">Tableau de bord Sage-Femme</h1>
          <p className="mt-1 font-body text-[14px] text-text-muted-brand">
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData} className="flex items-center gap-2 border border-border-brand px-4 py-2 text-[13px] hover:bg-gray-50"><RefreshCw size={16} /> Actualiser</button>
          <Link href="/admin/rdv/nouveau" className="flex items-center gap-2 bg-primary-brand px-4 py-2 text-[13px] text-white hover:bg-primary-brand/90"><Plus size={16} /> Nouveau RDV</Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="RDV aujourd'hui" value={data?.stats.soinsAujourdhui ?? 0} icon={Calendar} sub={`${data?.rdvConfirmes ?? 0} confirmés · ${data?.rdvEnAttente ?? 0} en attente`} />
        <StatCard label="Temps de soins" value={`${Math.round((data?.stats.dureeTotal ?? 0) / 60)}h`} icon={Clock} sub={`${data?.stats.dureeTotal ?? 0} min prévues`} />
        <StatCard label="Revenus prévus" value={formatPrix(data?.stats.revenuPotentiel ?? 0)} icon={Sparkles} />
        <StatCard label="Patients actifs" value={data?.patientsActifs ?? 0} icon={Users} />
      </div>

      {/* Prochain RDV */}
      {prochainRdv && (
        <div className="border-l-4 border-primary-brand bg-primary-brand/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-brand text-white"><Clock size={22} /></div>
              <div>
                <p className="font-body text-xs uppercase tracking-wider text-text-muted-brand">Prochain rendez-vous</p>
                <p className="font-display text-[18px] text-primary-brand">{prochainRdv.client.prenom} {prochainRdv.client.nom}</p>
                <p className="text-[13px] text-text-mid">{prochainRdv.soin.nom} · {fmtH(prochainRdv.dateHeure)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <a href={`tel:${prochainRdv.client.telephone}`} className="flex items-center gap-2 border border-primary-brand px-3 py-2 text-[13px] text-primary-brand hover:bg-primary-brand hover:text-white"><Phone size={14} /> Appeler</a>
              <button onClick={() => setFichePatientId(prochainRdv.client.id)} className="flex items-center gap-2 bg-primary-brand px-3 py-2 text-[13px] text-white hover:bg-primary-brand/90">Fiche patient <ChevronRight size={14} /></button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="overflow-x-auto border-b border-border-brand">
        <div className="flex min-w-max">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearchQuery("") }}
              className={`flex items-center gap-2 border-b-2 px-4 pb-3 text-[13px] font-medium transition-colors ${activeTab === tab.id ? "border-primary-brand text-primary-brand" : "border-transparent text-text-muted-brand hover:text-text-main"}`}>
              <tab.icon size={15} />{tab.label}
              {tab.count !== undefined && tab.count > 0 && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{tab.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ── RDV du jour ────────────────────────────────────────────────────── */}
      {activeTab === "rdv" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Rechercher un patient ou un soin..." />
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-text-muted-brand" />
              <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} className="border border-border-brand px-3 py-2 text-[14px]">
                <option value="TOUS">Tous les statuts</option>
                <option value="EN_ATTENTE">En attente</option>
                <option value="CONFIRME">Confirmé</option>
                <option value="TERMINE">Terminé</option>
                <option value="ANNULE">Annulé</option>
              </select>
            </div>
          </div>
          {rdvFiltres.length === 0 ? (
            <Empty icon={Calendar} message="Aucun rendez-vous" />
          ) : (
            <div className="space-y-3">
              {rdvFiltres.map(rdv => {
                const cfg = STATUT_CONFIG[rdv.statut] ?? STATUT_CONFIG.EN_ATTENTE
                return (
                  <div key={rdv.id} className={`border border-border-brand bg-white p-4 hover:bg-gray-50 ${new Date(rdv.dateHeure) < new Date() && rdv.statut !== "TERMINE" ? "opacity-60" : ""}`}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex gap-4">
                        <div className="flex h-14 w-14 flex-col items-center justify-center border border-border-brand bg-gray-50">
                          <span className="font-display text-[18px] text-primary-brand">{fmtH(rdv.dateHeure).split(":")[0]}</span>
                          <span className="text-xs text-text-muted-brand">:{fmtH(rdv.dateHeure).split(":")[1]}</span>
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-medium text-text-main">{rdv.client.prenom} {rdv.client.nom}</h3>
                            <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs ${STATUT_COLORS[rdv.statut] ?? "bg-gray-100 text-gray-700"}`}>{cfg.label}</span>
                          </div>
                          <p className="mt-1 text-[13px] text-text-mid"><Sparkles size={13} className="inline text-gold mr-1" />{rdv.soin.nom} · {rdv.duree || rdv.soin.duree} min</p>
                          {rdv.notes && <p className="mt-2 rounded bg-amber-50 p-2 text-[12px] text-amber-800">{rdv.notes}</p>}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <a href={`tel:${rdv.client.telephone}`} className="flex items-center gap-1 rounded border border-border-brand px-3 py-1.5 text-[12px] hover:border-primary-brand hover:text-primary-brand"><Phone size={13} />Appeler</a>
                        {rdv.statut === "EN_ATTENTE" && <button onClick={() => updateRdvStatut(rdv.id, "CONFIRME")} className="flex items-center gap-1 rounded bg-green-600 px-3 py-1.5 text-[12px] text-white hover:bg-green-700"><CheckCircle size={13} />Confirmer</button>}
                        {rdv.statut === "CONFIRME" && <button onClick={() => updateRdvStatut(rdv.id, "TERMINE")} className="flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-[12px] text-white hover:bg-blue-700"><CheckCircle size={13} />Terminer</button>}
                        <button onClick={() => setFichePatientId(rdv.client.id)} className="flex items-center gap-1 rounded border border-primary-brand px-3 py-1.5 text-[12px] text-primary-brand hover:bg-primary-brand hover:text-white"><FileText size={13} />Fiche</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Calendrier ──────────────────────────────────────────────────────── */}
      {activeTab === "calendrier" && <CalendrierVue onSelectRdv={setRdvCalendrier} />}

      {/* ── Patients ────────────────────────────────────────────────────────── */}
      {activeTab === "patients" && (
        <div className="space-y-4">
          <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Rechercher un patient..." />
          {patients.length === 0 ? <Empty icon={Users} message="Aucun patient" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-[14px]">
                <thead><tr className="border-b border-border-brand bg-gray-50">
                  <th className="p-3 text-left font-medium text-text-muted-brand">Patient</th>
                  <th className="hidden p-3 text-left font-medium text-text-muted-brand md:table-cell">Contact</th>
                  <th className="hidden p-3 text-center font-medium text-text-muted-brand lg:table-cell">RDV</th>
                  <th className="hidden p-3 text-center font-medium text-text-muted-brand lg:table-cell">Notes</th>
                  <th className="p-3 text-right font-medium text-text-muted-brand">Actions</th>
                </tr></thead>
                <tbody>
                  {patients.filter(p => !searchQuery || `${p.nom} ${p.prenom} ${p.email}`.toLowerCase().includes(searchQuery.toLowerCase())).map(patient => (
                    <tr key={patient.id} className="border-b border-border-brand hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-brand/10 text-primary-brand">
                            {patient.image ? <img src={patient.image} alt="" className="h-10 w-10 rounded-full object-cover" /> : <User size={18} />}
                          </div>
                          <div>
                            <p className="font-medium">{patient.prenom} {patient.nom}</p>
                            {patient.derniereVisite && <p className="text-[12px] text-text-muted-brand">Dernière visite: {fmtD(patient.derniereVisite)}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="hidden p-3 md:table-cell text-[13px]"><p>{patient.email}</p><p className="text-text-muted-brand">{patient.telephone}</p></td>
                      <td className="hidden p-3 text-center lg:table-cell"><span className="rounded bg-gray-100 px-2 py-1">{patient._count.rdvs}</span></td>
                      <td className="hidden p-3 text-center lg:table-cell"><span className="rounded bg-gray-100 px-2 py-1">{patient._count.fiches}</span></td>
                      <td className="p-3 text-right">
                        <button onClick={() => setFichePatientId(patient.id)} className="rounded bg-primary-brand px-3 py-1 text-[12px] text-white hover:bg-primary-brand/90">Fiche</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Notes ───────────────────────────────────────────────────────────── */}
      {activeTab === "notes" && (
        <div className="space-y-4">
          {/* Formulaire ajout note */}
          <div className="border border-border-brand bg-gray-50 p-4">
            <p className="mb-3 font-body text-[13px] font-medium uppercase tracking-wider text-text-muted-brand">Nouvelle note</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <select value={patientNote} onChange={e => setPatientNote(e.target.value)} className="border border-border-brand px-3 py-2 text-[14px]">
                <option value="">Sélectionner un patient</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>)}
              </select>
              <select value={typeNote} onChange={e => setTypeNote(e.target.value)} className="border border-border-brand px-3 py-2 text-[14px]">
                <option value="GENERALE">Générale</option>
                <option value="SUIVI">Suivi</option>
                <option value="ALERTE">Alerte</option>
              </select>
              <button onClick={addNote} disabled={!nouvelleNote.trim() || !patientNote}
                className="bg-primary-brand px-4 py-2 text-[13px] text-white disabled:opacity-50 hover:bg-primary-brand/90">Ajouter</button>
            </div>
            <textarea value={nouvelleNote} onChange={e => setNouvelleNote(e.target.value)} rows={3} placeholder="Contenu de la note..."
              className="mt-3 w-full border border-border-brand p-3 text-[14px] focus:border-primary-brand focus:outline-none" />
          </div>

          {/* Filtres notes */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select value={filterNoteType} onChange={e => setFilterNoteType(e.target.value)} className="border border-border-brand px-3 py-2 text-[14px]">
              <option value="TOUS">Tous les types</option>
              <option value="GENERALE">Générales</option>
              <option value="SUIVI">Suivi</option>
              <option value="ALERTE">Alertes</option>
            </select>
            <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Rechercher par patient..." />
          </div>

          {notesFiltrees.length === 0 ? <Empty icon={FileText} message="Aucune note" /> : (
            <div className="space-y-3">
              {notesFiltrees.map(note => {
                const cfg = NOTE_COLORS[note.type] ?? NOTE_COLORS.GENERALE
                return (
                  <div key={note.id} className={`border p-4 ${note.type === "ALERTE" ? "border-red-200" : "border-border-brand"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className={`rounded px-2 py-0.5 text-[11px] ${cfg.bg} ${cfg.text}`}>{note.type}</span>
                        <button onClick={() => setFichePatientId(note.clientId)} className="font-medium text-[13px] text-primary-brand hover:underline">{note.clientNom}</button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-text-muted-brand">{fmtD(note.createdAt)}</span>
                        <button
                          onClick={async () => {
                            await fetch("/api/admin/sage-femme/notes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: note.id, partagePatient: !note.partagePatient }) })
                            setNotes(prev => prev.map(n => n.id === note.id ? { ...n, partagePatient: !n.partagePatient } : n))
                          }}
                          className={`flex items-center gap-1 rounded px-2 py-0.5 text-[11px] transition-colors ${note.partagePatient ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          <Share2 size={10} />{note.partagePatient ? "Partagé" : "Privé"}
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-[13px] text-text-mid">{note.contenu}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Questionnaires ──────────────────────────────────────────────────── */}
      {activeTab === "questionnaires" && <QuestionnairesVue onVoirPatient={id => setFichePatientId(id)} />}

      {/* ── Statistiques ────────────────────────────────────────────────────── */}
      {activeTab === "stats" && <StatsVue />}

      {/* ── Modales ─────────────────────────────────────────────────────────── */}
      {fichePatientId && <FichePatientModal patientId={fichePatientId} onClose={() => setFichePatientId(null)} />}

      {rdvCalendrier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setRdvCalendrier(null)}>
          <div className="w-full max-w-sm bg-white p-5" onClick={e => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <p className="font-medium">{rdvCalendrier.client.prenom} {rdvCalendrier.client.nom}</p>
              <button onClick={() => setRdvCalendrier(null)}><X size={18} /></button>
            </div>
            <p className="text-[13px] text-text-muted-brand">{rdvCalendrier.soin.nom} · {fmtH(rdvCalendrier.dateHeure)} · {rdvCalendrier.duree} min</p>
            <span className={`mt-2 inline-block rounded px-2 py-0.5 text-[12px] ${STATUT_COLORS[rdvCalendrier.statut] ?? "bg-gray-100"}`}>{rdvCalendrier.statut}</span>
            {rdvCalendrier.notes && <p className="mt-2 text-[12px] text-amber-700">{rdvCalendrier.notes}</p>}
            <div className="mt-4 flex gap-2">
              <a href={`tel:${rdvCalendrier.client.telephone}`} className="flex items-center gap-1 border border-border-brand px-3 py-2 text-[12px] hover:border-primary-brand"><Phone size={13} />Appeler</a>
              <button onClick={() => { setFichePatientId(rdvCalendrier.client.id); setRdvCalendrier(null) }} className="flex items-center gap-1 bg-primary-brand px-3 py-2 text-[12px] text-white"><FileText size={13} />Fiche patient</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Petits composants réutilisables ──────────────────────────────────────────

const STATUT_CONFIG: Record<string, { label: string }> = {
  EN_ATTENTE: { label: "En attente" },
  CONFIRME:   { label: "Confirmé" },
  TERMINE:    { label: "Terminé" },
  ANNULE:     { label: "Annulé" },
}

function StatCard({ label, value, icon: Icon, sub }: { label: string; value: string|number; icon: LucideIcon; sub?: string }) {
  return (
    <div className="border border-border-brand bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-body text-xs uppercase tracking-wider text-text-muted-brand">{label}</p>
          <p className="mt-2 font-display text-[32px] text-primary-brand">{value}</p>
        </div>
        <Icon className="h-8 w-8 text-primary-brand/30" />
      </div>
      {sub && <p className="mt-3 text-[12px] text-text-muted-brand">{sub}</p>}
    </div>
  )
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted-brand" />
      <input type="text" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
        className="w-full border border-border-brand py-2 pl-10 pr-4 text-[14px] focus:border-primary-brand focus:outline-none" />
    </div>
  )
}

function Empty({ icon: Icon, message }: { icon: LucideIcon; message: string }) {
  return (
    <div className="py-12 text-center">
      <Icon className="mx-auto h-12 w-12 text-text-muted-brand/30" />
      <p className="mt-4 text-text-muted-brand">{message}</p>
    </div>
  )
}
