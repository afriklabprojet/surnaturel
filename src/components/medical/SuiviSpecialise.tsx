"use client"

import { useState, useEffect } from "react"
import { Baby, Plus, ChevronDown, ChevronUp, Edit2, Trash2, CheckCircle, X } from "lucide-react"

// ── Types ────────────────────────────────────────────────────────────────────

type TypeSuivi = "GROSSESSE" | "POST_PARTUM" | "NOURRISSON" | "PEDIATRIQUE" | "GYNECOLOGIQUE" | "GENERAL"

interface Suivi {
  id: string
  type: TypeSuivi
  actif: boolean
  dateDebutGrossesse?: string | null
  semainesAmenorhee?: number | null
  datePrevueAccouchement?: string | null
  parite?: string | null
  dateNaissancePatient?: string | null
  prenomPatient?: string | null
  poidsKg?: number | null
  tailleCm?: number | null
  perimCranienCm?: number | null
  notes?: string | null
  examensRealises?: string[]
  prochainControle?: string | null
  createdAt: string
}

// ── Constantes ───────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<TypeSuivi, string> = {
  GROSSESSE: "Grossesse",
  POST_PARTUM: "Post-partum",
  NOURRISSON: "Nourrisson (0–12 mois)",
  PEDIATRIQUE: "Pédiatrique (1–18 ans)",
  GYNECOLOGIQUE: "Gynécologique",
  GENERAL: "Suivi général",
}

const TYPE_COLORS: Record<TypeSuivi, string> = {
  GROSSESSE: "bg-pink-100 text-pink-800",
  POST_PARTUM: "bg-purple-100 text-purple-800",
  NOURRISSON: "bg-blue-100 text-blue-800",
  PEDIATRIQUE: "bg-cyan-100 text-cyan-800",
  GYNECOLOGIQUE: "bg-rose-100 text-rose-800",
  GENERAL: "bg-gray-100 text-gray-700",
}

const EXAMENS_SUGGESTIONS = [
  "Échographie", "Prise de sang", "Tension artérielle", "BCF (bruits du cœur fœtal)",
  "Mouvements actifs fœtaux", "Test de Perkins", "Glycémie", "Groupe sanguin",
  "Sérologies", "Frottis", "Bilan hormonal",
]

const fmtD = (d?: string | null) => d ? new Date(d).toLocaleDateString("fr-FR") : "—"
const toInput = (d?: string | null) => d ? d.split("T")[0] : ""

// ── Formulaire ────────────────────────────────────────────────────────────────

interface FormulaireProps {
  initial?: Partial<Suivi>
  onSubmit: (data: Partial<Suivi>) => Promise<void>
  onCancel: () => void
  isEdit?: boolean
}

function FormulaireSuivi({ initial = {}, onSubmit, onCancel, isEdit }: FormulaireProps) {
  const [type, setType] = useState<TypeSuivi>((initial.type as TypeSuivi) ?? "GENERAL")
  const [prenomPatient, setPrenomPatient] = useState(initial.prenomPatient ?? "")
  const [dateNaissancePatient, setDateNaissancePatient] = useState(toInput(initial.dateNaissancePatient))
  const [semainesAmenorhee, setSemainesAmenorhee] = useState(initial.semainesAmenorhee?.toString() ?? "")
  const [datePrevueAccouchement, setDatePrevueAccouchement] = useState(toInput(initial.datePrevueAccouchement))
  const [dateDebutGrossesse, setDateDebutGrossesse] = useState(toInput(initial.dateDebutGrossesse))
  const [parite, setParite] = useState(initial.parite ?? "")
  const [poidsKg, setPoidsKg] = useState(initial.poidsKg?.toString() ?? "")
  const [tailleCm, setTailleCm] = useState(initial.tailleCm?.toString() ?? "")
  const [perimCranienCm, setPerimCranienCm] = useState(initial.perimCranienCm?.toString() ?? "")
  const [notes, setNotes] = useState(initial.notes ?? "")
  const [prochainControle, setProchainControle] = useState(toInput(initial.prochainControle))
  const [examens, setExamens] = useState<string[]>(initial.examensRealises ?? [])
  const [autreExamen, setAutreExamen] = useState("")
  const [saving, setSaving] = useState(false)

  const isGrossesse = type === "GROSSESSE" || type === "POST_PARTUM"
  const isPediatrique = type === "NOURRISSON" || type === "PEDIATRIQUE"
  const showBiometrie = true

  function toggleExamen(e: string) {
    setExamens(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e])
  }

  function addAutreExamen() {
    const t = autreExamen.trim()
    if (t && !examens.includes(t)) { setExamens(prev => [...prev, t]); setAutreExamen("") }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSubmit({
      type,
      prenomPatient: isPediatrique ? prenomPatient || null : null,
      dateNaissancePatient: isPediatrique && dateNaissancePatient ? dateNaissancePatient : null,
      semainesAmenorhee: isGrossesse && semainesAmenorhee ? parseInt(semainesAmenorhee) : null,
      datePrevueAccouchement: isGrossesse && datePrevueAccouchement ? datePrevueAccouchement : null,
      dateDebutGrossesse: isGrossesse && dateDebutGrossesse ? dateDebutGrossesse : null,
      parite: isGrossesse && parite ? parite : null,
      poidsKg: poidsKg ? parseFloat(poidsKg) : null,
      tailleCm: tailleCm ? parseFloat(tailleCm) : null,
      perimCranienCm: perimCranienCm ? parseFloat(perimCranienCm) : null,
      notes: notes || null,
      prochainControle: prochainControle || null,
      examensRealises: examens,
    })
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type de suivi */}
      <div>
        <label className="mb-1 block text-[13px] font-medium text-text-mid">Type de suivi *</label>
        <select value={type} onChange={e => setType(e.target.value as TypeSuivi)}
          className="w-full border border-border-brand px-3 py-2 text-[14px] focus:border-primary-brand focus:outline-none">
          {(Object.entries(TYPE_LABELS) as [TypeSuivi, string][]).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {/* Champs pédiatriques */}
      {isPediatrique && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[13px] font-medium text-text-mid">Prénom de l&apos;enfant</label>
            <input type="text" value={prenomPatient} onChange={e => setPrenomPatient(e.target.value)} placeholder="Prénom"
              className="w-full border border-border-brand px-3 py-2 text-[14px] focus:border-primary-brand focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-[13px] font-medium text-text-mid">Date de naissance</label>
            <input type="date" value={dateNaissancePatient} onChange={e => setDateNaissancePatient(e.target.value)}
              className="w-full border border-border-brand px-3 py-2 text-[14px] focus:border-primary-brand focus:outline-none" />
          </div>
        </div>
      )}

      {/* Champs grossesse */}
      {isGrossesse && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[13px] font-medium text-text-mid">Semaines d&apos;aménorrhée (SA)</label>
            <input type="number" value={semainesAmenorhee} onChange={e => setSemainesAmenorhee(e.target.value)} min={0} max={50} placeholder="ex: 28"
              className="w-full border border-border-brand px-3 py-2 text-[14px] focus:border-primary-brand focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-[13px] font-medium text-text-mid">Date prévue d&apos;accouchement</label>
            <input type="date" value={datePrevueAccouchement} onChange={e => setDatePrevueAccouchement(e.target.value)}
              className="w-full border border-border-brand px-3 py-2 text-[14px] focus:border-primary-brand focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-[13px] font-medium text-text-mid">Début de grossesse</label>
            <input type="date" value={dateDebutGrossesse} onChange={e => setDateDebutGrossesse(e.target.value)}
              className="w-full border border-border-brand px-3 py-2 text-[14px] focus:border-primary-brand focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-[13px] font-medium text-text-mid">Parité (ex: G3P2)</label>
            <input type="text" value={parite} onChange={e => setParite(e.target.value)} placeholder="G3P2"
              className="w-full border border-border-brand px-3 py-2 text-[14px] focus:border-primary-brand focus:outline-none" />
          </div>
        </div>
      )}

      {/* Biométrie */}
      {showBiometrie && (
        <div>
          <p className="mb-2 text-[13px] font-medium text-text-mid">Biométrie</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-[12px] text-text-muted-brand">Poids (kg)</label>
              <input type="number" value={poidsKg} onChange={e => setPoidsKg(e.target.value)} step="0.1" placeholder="ex: 65.5"
                className="w-full border border-border-brand px-3 py-2 text-[14px] focus:border-primary-brand focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-[12px] text-text-muted-brand">Taille (cm)</label>
              <input type="number" value={tailleCm} onChange={e => setTailleCm(e.target.value)} step="0.1" placeholder="ex: 165"
                className="w-full border border-border-brand px-3 py-2 text-[14px] focus:border-primary-brand focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-[12px] text-text-muted-brand">
                {isPediatrique ? "Périmètre crânien (cm)" : "Périmètre abdominal (cm)"}
              </label>
              <input type="number" value={perimCranienCm} onChange={e => setPerimCranienCm(e.target.value)} step="0.1" placeholder="ex: 85"
                className="w-full border border-border-brand px-3 py-2 text-[14px] focus:border-primary-brand focus:outline-none" />
            </div>
          </div>
        </div>
      )}

      {/* Examens réalisés */}
      <div>
        <p className="mb-2 text-[13px] font-medium text-text-mid">Examens réalisés</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {EXAMENS_SUGGESTIONS.map(e => (
            <button key={e} type="button" onClick={() => toggleExamen(e)}
              className={`rounded px-2 py-1 text-[12px] transition-colors ${examens.includes(e) ? "bg-primary-brand text-white" : "bg-gray-100 text-text-mid hover:bg-gray-200"}`}>
              {examens.includes(e) ? <CheckCircle size={10} className="inline mr-1" /> : null}{e}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={autreExamen} onChange={e => setAutreExamen(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addAutreExamen() } }}
            placeholder="Autre examen... (Entrée pour ajouter)"
            className="flex-1 border border-border-brand px-3 py-2 text-[13px] focus:border-primary-brand focus:outline-none" />
          <button type="button" onClick={addAutreExamen} className="border border-border-brand px-3 py-2 text-[12px] hover:bg-gray-50">+</button>
        </div>
        {examens.filter(e => !EXAMENS_SUGGESTIONS.includes(e)).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {examens.filter(e => !EXAMENS_SUGGESTIONS.includes(e)).map(e => (
              <span key={e} className="flex items-center gap-1 rounded bg-primary-brand/10 px-2 py-0.5 text-[12px] text-primary-brand">
                {e}<button type="button" onClick={() => toggleExamen(e)}><X size={10} /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Prochain contrôle */}
      <div>
        <label className="mb-1 block text-[13px] font-medium text-text-mid">Prochain contrôle</label>
        <input type="date" value={prochainControle} onChange={e => setProchainControle(e.target.value)}
          className="w-full border border-border-brand px-3 py-2 text-[14px] focus:border-primary-brand focus:outline-none" />
      </div>

      {/* Notes */}
      <div>
        <label className="mb-1 block text-[13px] font-medium text-text-mid">Notes cliniques</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Observations, conseils, prescriptions..."
          className="w-full border border-border-brand px-3 py-2 text-[14px] focus:border-primary-brand focus:outline-none" />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="border border-border-brand px-4 py-2 text-[13px] hover:bg-gray-50">Annuler</button>
        <button type="submit" disabled={saving} className="bg-primary-brand px-4 py-2 text-[13px] text-white hover:bg-primary-brand/90 disabled:opacity-60">
          {saving ? "Enregistrement..." : isEdit ? "Modifier" : "Créer le suivi"}
        </button>
      </div>
    </form>
  )
}

// ── Carte suivi ───────────────────────────────────────────────────────────────

function CarteSuivi({ suivi, onEdit, onArchive }: { suivi: Suivi; onEdit: () => void; onArchive: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const badge = TYPE_COLORS[suivi.type] ?? "bg-gray-100 text-gray-700"

  return (
    <div className={`border p-4 transition-all ${suivi.actif ? "border-border-brand" : "border-border-brand opacity-60"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded px-2 py-0.5 text-[12px] font-medium ${badge}`}>{TYPE_LABELS[suivi.type]}</span>
          {suivi.prenomPatient && <span className="text-[13px] text-text-mid">— {suivi.prenomPatient}</span>}
          {!suivi.actif && <span className="text-[11px] text-text-muted-brand italic">Archivé</span>}
        </div>
        <div className="flex items-center gap-2">
          {suivi.actif && (
            <>
              <button onClick={onEdit} className="text-text-muted-brand hover:text-primary-brand"><Edit2 size={14} /></button>
              <button onClick={onArchive} className="text-text-muted-brand hover:text-amber-600"><Trash2 size={14} /></button>
            </>
          )}
          <button onClick={() => setExpanded(v => !v)} className="text-text-muted-brand">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Aperçu rapide */}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-text-mid">
        {suivi.semainesAmenorhee && <span><span className="text-text-muted-brand">SA: </span>{suivi.semainesAmenorhee}</span>}
        {suivi.datePrevueAccouchement && <span><span className="text-text-muted-brand">DPA: </span>{fmtD(suivi.datePrevueAccouchement)}</span>}
        {suivi.dateNaissancePatient && <span><span className="text-text-muted-brand">Né(e): </span>{fmtD(suivi.dateNaissancePatient)}</span>}
        {suivi.poidsKg && <span><span className="text-text-muted-brand">Poids: </span>{suivi.poidsKg} kg</span>}
        {suivi.tailleCm && <span><span className="text-text-muted-brand">Taille: </span>{suivi.tailleCm} cm</span>}
        {suivi.prochainControle && <span className="text-primary-brand font-medium"><span className="text-text-muted-brand">Prochain: </span>{fmtD(suivi.prochainControle)}</span>}
      </div>

      {/* Détails expansibles */}
      {expanded && (
        <div className="mt-3 border-t border-border-brand pt-3 text-[13px] space-y-2">
          {suivi.perimCranienCm && <p><span className="font-medium">Périmètre crânien/abdominal: </span>{suivi.perimCranienCm} cm</p>}
          {suivi.parite && <p><span className="font-medium">Parité: </span>{suivi.parite}</p>}
          {suivi.examensRealises && suivi.examensRealises.length > 0 && (
            <div>
              <p className="font-medium mb-1">Examens réalisés:</p>
              <div className="flex flex-wrap gap-1">
                {suivi.examensRealises.map((e, i) => (
                  <span key={i} className="rounded bg-gray-100 px-2 py-0.5 text-[11px]">{e}</span>
                ))}
              </div>
            </div>
          )}
          {suivi.notes && <p><span className="font-medium">Notes: </span>{suivi.notes}</p>}
          <p className="text-text-muted-brand text-[11px]">Créé le {fmtD(suivi.createdAt)}</p>
        </div>
      )}
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function SuiviSpecialise() {
  const [suivis, setSuivis] = useState<Suivi[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSuivi, setEditingSuivi] = useState<Suivi | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/medical/suivi-specialise")
      .then(r => r.json())
      .then(d => setSuivis(d.suivis || []))
      .catch(() => setError("Impossible de charger les suivis"))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(data: Partial<Suivi>) {
    const r = await fetch("/api/medical/suivi-specialise", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    })
    if (r.ok) {
      const { suivi } = await r.json()
      setSuivis(prev => [suivi, ...prev])
      setShowForm(false)
    } else {
      setError("Erreur lors de la création")
    }
  }

  async function handleEdit(data: Partial<Suivi>) {
    if (!editingSuivi) return
    const r = await fetch("/api/medical/suivi-specialise", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editingSuivi.id, ...data }),
    })
    if (r.ok) {
      const { suivi } = await r.json()
      setSuivis(prev => prev.map(s => s.id === suivi.id ? suivi : s))
      setEditingSuivi(null)
    } else {
      setError("Erreur lors de la modification")
    }
  }

  async function handleArchive(id: string) {
    const r = await fetch(`/api/medical/suivi-specialise?id=${id}`, { method: "DELETE" })
    if (r.ok) {
      setSuivis(prev => prev.map(s => s.id === id ? { ...s, actif: false } : s))
    }
  }

  const actifs = suivis.filter(s => s.actif)
  const archives = suivis.filter(s => !s.actif)

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-brand border-t-transparent" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Baby className="h-5 w-5 text-primary-brand" />
          <h2 className="font-display text-[20px] text-primary-brand">Suivi spécialisé</h2>
        </div>
        {!showForm && !editingSuivi && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary-brand px-4 py-2 text-[13px] text-white hover:bg-primary-brand/90">
            <Plus size={16} /> Nouveau suivi
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 border border-red-200 bg-red-50 p-3 text-[13px] text-red-700">
          <X size={14} /> {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700"><X size={14} /></button>
        </div>
      )}

      {/* Formulaire nouveau suivi */}
      {showForm && (
        <div className="border border-border-brand bg-gray-50 p-5">
          <p className="mb-4 font-display text-[16px] text-primary-brand">Nouveau suivi</p>
          <FormulaireSuivi onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Formulaire édition */}
      {editingSuivi && (
        <div className="border border-primary-brand/30 bg-primary-light/20 p-5">
          <p className="mb-4 font-display text-[16px] text-primary-brand">Modifier le suivi</p>
          <FormulaireSuivi initial={editingSuivi} onSubmit={handleEdit} onCancel={() => setEditingSuivi(null)} isEdit />
        </div>
      )}

      {/* Liste suivis actifs */}
      {actifs.length === 0 && !showForm ? (
        <div className="py-12 text-center">
          <Baby className="mx-auto h-12 w-12 text-text-muted-brand/30" />
          <p className="mt-4 text-text-muted-brand">Aucun suivi en cours</p>
          <button onClick={() => setShowForm(true)} className="mt-4 text-[13px] text-primary-brand hover:underline">+ Créer un suivi</button>
        </div>
      ) : (
        <div className="space-y-3">
          {actifs.map(s => (
            <CarteSuivi key={s.id} suivi={s} onEdit={() => setEditingSuivi(s)} onArchive={() => handleArchive(s.id)} />
          ))}
        </div>
      )}

      {/* Suivis archivés */}
      {archives.length > 0 && (
        <div>
          <button onClick={() => setShowArchived(v => !v)} className="flex items-center gap-2 text-[13px] text-text-muted-brand hover:text-text-main">
            {showArchived ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {archives.length} suivi(s) archivé(s)
          </button>
          {showArchived && (
            <div className="mt-3 space-y-3">
              {archives.map(s => (
                <CarteSuivi key={s.id} suivi={s} onEdit={() => {}} onArchive={() => {}} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
