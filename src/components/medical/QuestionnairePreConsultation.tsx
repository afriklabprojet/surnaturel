"use client"

import { useState, useEffect } from "react"
import { ClipboardList, CheckCircle, ChevronDown, ChevronUp } from "lucide-react"

// ── Types ────────────────────────────────────────────────────────────────────

interface Questionnaire {
  id: string
  typeSoin?: string | null
  motif: string
  antecedents?: string | null
  medicaments?: string | null
  allergies?: string | null
  ddr?: string | null
  parite?: string | null
  autresInfos?: string | null
  traite: boolean
  createdAt: string
}

const fmtD = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })

// ── Composant principal ───────────────────────────────────────────────────────

export default function QuestionnairePreConsultation() {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Champs du formulaire
  const [typeSoin, setTypeSoin] = useState("")
  const [motif, setMotif] = useState("")
  const [antecedents, setAntecedents] = useState("")
  const [medicaments, setMedicaments] = useState("")
  const [allergies, setAllergies] = useState("")
  const [ddr, setDdr] = useState("")
  const [parite, setParite] = useState("")
  const [autresInfos, setAutresInfos] = useState("")

  useEffect(() => {
    fetch("/api/medical/questionnaire")
      .then(r => r.json())
      .then(d => setQuestionnaires(d.questionnaires || []))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!motif.trim()) return
    setSubmitting(true)
    setError(null)

    const r = await fetch("/api/medical/questionnaire", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ typeSoin: typeSoin || null, motif, antecedents: antecedents || null, medicaments: medicaments || null, allergies: allergies || null, ddr: ddr || null, parite: parite || null, autresInfos: autresInfos || null }),
    })

    if (r.ok) {
      const { questionnaire } = await r.json()
      setQuestionnaires(prev => [questionnaire, ...prev])
      setSuccess(true)
      setShowForm(false)
      // Reset
      setTypeSoin(""); setMotif(""); setAntecedents(""); setMedicaments(""); setAllergies(""); setDdr(""); setParite(""); setAutresInfos("")
    } else {
      setError("Une erreur est survenue. Veuillez réessayer.")
    }
    setSubmitting(false)
  }

  const enCours = questionnaires.filter(q => !q.traite)
  const traites = questionnaires.filter(q => q.traite)

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
          <ClipboardList className="h-5 w-5 text-primary-brand" />
          <h2 className="font-display text-[20px] text-primary-brand">Questionnaire pré-consultation</h2>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary-brand px-4 py-2 text-[13px] text-white hover:bg-primary-brand/90">
            <ClipboardList size={16} /> Nouveau questionnaire
          </button>
        )}
      </div>

      {/* Info */}
      <div className="border border-primary-brand/20 bg-primary-light/30 p-4 text-[13px] text-text-mid">
        <p className="font-medium mb-1">Pourquoi remplir ce questionnaire ?</p>
        <p>Ce formulaire permet à votre sage-femme de préparer votre consultation et vous offrir un suivi personnalisé.
        Remplissez-le avant chaque rendez-vous pour un meilleur accompagnement.</p>
      </div>

      {success && (
        <div className="flex items-center gap-2 border border-green-300 bg-green-50 p-3 text-[13px] text-green-700">
          <CheckCircle size={16} /> Votre questionnaire a bien été envoyé. Votre sage-femme le consultera avant la consultation.
        </div>
      )}

      {error && <div className="border border-red-200 bg-red-50 p-3 text-[13px] text-red-700">{error}</div>}

      {/* Formulaire */}
      {showForm && (
        <form onSubmit={handleSubmit} className="border border-border-brand bg-gray-50 p-5 space-y-4">
          <p className="font-body text-[13px] uppercase tracking-wider text-text-muted-brand mb-2">Informations pré-consultation</p>

          {/* Type de soin */}
          <div>
            <label className="mb-1 block text-[13px] font-medium text-text-mid">Type de consultation souhaité</label>
            <select value={typeSoin} onChange={e => setTypeSoin(e.target.value)}
              className="w-full border border-border-brand px-3 py-2 text-[14px] focus:border-primary-brand focus:outline-none">
              <option value="">-- Sélectionner --</option>
              <option value="Suivi de grossesse">Suivi de grossesse</option>
              <option value="Suivi post-partum">Suivi post-partum</option>
              <option value="Suivi nourrisson">Suivi nourrisson</option>
              <option value="Suivi pédiatrique">Suivi pédiatrique</option>
              <option value="Consultation gynécologique">Consultation gynécologique</option>
              <option value="Première consultation">Première consultation</option>
              <option value="Autre">Autre</option>
            </select>
          </div>

          {/* Motif (obligatoire) */}
          <div>
            <label className="mb-1 block text-[13px] font-medium text-text-mid">Motif de consultation <span className="text-red-500">*</span></label>
            <textarea value={motif} onChange={e => setMotif(e.target.value)} rows={3} required
              placeholder="Décrivez la raison de votre consultation..."
              className="w-full border border-border-brand px-3 py-2 text-[14px] focus:border-primary-brand focus:outline-none" />
          </div>

          {/* Antécédents */}
          <div>
            <label className="mb-1 block text-[13px] font-medium text-text-mid">Antécédents médicaux / chirurgicaux</label>
            <textarea value={antecedents} onChange={e => setAntecedents(e.target.value)} rows={2}
              placeholder="Opérations, maladies chroniques, hospitalisations passées..."
              className="w-full border border-border-brand px-3 py-2 text-[14px] focus:border-primary-brand focus:outline-none" />
          </div>

          {/* Médicaments */}
          <div>
            <label className="mb-1 block text-[13px] font-medium text-text-mid">Médicaments actuels</label>
            <input type="text" value={medicaments} onChange={e => setMedicaments(e.target.value)}
              placeholder="Nom des médicaments en cours..."
              className="w-full border border-border-brand px-3 py-2 text-[14px] focus:border-primary-brand focus:outline-none" />
          </div>

          {/* Allergies */}
          <div>
            <label className="mb-1 block text-[13px] font-medium text-text-mid">Allergies connues</label>
            <input type="text" value={allergies} onChange={e => setAllergies(e.target.value)}
              placeholder="Médicaments, aliments, latex..."
              className="w-full border border-border-brand px-3 py-2 text-[14px] focus:border-primary-brand focus:outline-none" />
          </div>

          {/* DDR et Parité (optionnels si pertinents) */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[13px] font-medium text-text-mid">Date des dernières règles (DDR)</label>
              <input type="date" value={ddr} onChange={e => setDdr(e.target.value)}
                className="w-full border border-border-brand px-3 py-2 text-[14px] focus:border-primary-brand focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-medium text-text-mid">Parité (si applicable)</label>
              <input type="text" value={parite} onChange={e => setParite(e.target.value)} placeholder="ex: G2P1 ou 0 enfant"
                className="w-full border border-border-brand px-3 py-2 text-[14px] focus:border-primary-brand focus:outline-none" />
            </div>
          </div>

          {/* Autres infos */}
          <div>
            <label className="mb-1 block text-[13px] font-medium text-text-mid">Autres informations importantes</label>
            <textarea value={autresInfos} onChange={e => setAutresInfos(e.target.value)} rows={2}
              placeholder="Inquiétudes, questions, contexte particulier..."
              className="w-full border border-border-brand px-3 py-2 text-[14px] focus:border-primary-brand focus:outline-none" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="border border-border-brand px-4 py-2 text-[13px] hover:bg-gray-50">Annuler</button>
            <button type="submit" disabled={submitting || !motif.trim()}
              className="bg-primary-brand px-4 py-2 text-[13px] text-white hover:bg-primary-brand/90 disabled:opacity-60">
              {submitting ? "Envoi en cours..." : "Envoyer le questionnaire"}
            </button>
          </div>
        </form>
      )}

      {/* Questionnaires en attente */}
      {enCours.length > 0 && (
        <div>
          <p className="mb-3 font-body text-[13px] uppercase tracking-wider text-amber-600">
            {enCours.length} questionnaire(s) en attente de traitement
          </p>
          <div className="space-y-3">
            {enCours.map(q => (
              <div key={q.id} className="border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center justify-between mb-2">
                  {q.typeSoin && <span className="rounded bg-amber-200 px-2 py-0.5 text-[12px] text-amber-800">{q.typeSoin}</span>}
                  <span className="ml-auto text-[12px] text-text-muted-brand">{fmtD(q.createdAt)}</span>
                </div>
                <p className="text-[13px]"><span className="font-medium">Motif: </span>{q.motif}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historique traités */}
      {traites.length > 0 && (
        <div>
          <button onClick={() => setShowHistory(v => !v)} className="flex items-center gap-2 text-[13px] text-text-muted-brand hover:text-text-main">
            {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Historique ({traites.length} questionnaire(s) traité(s))
          </button>
          {showHistory && (
            <div className="mt-3 space-y-3">
              {traites.map(q => (
                <div key={q.id} className="border border-border-brand bg-white p-4 opacity-70">
                  <div className="flex items-center justify-between mb-2">
                    {q.typeSoin && <span className="rounded bg-gray-100 px-2 py-0.5 text-[12px] text-gray-600">{q.typeSoin}</span>}
                    <div className="ml-auto flex items-center gap-2 text-[12px] text-text-muted-brand">
                      <CheckCircle size={12} className="text-green-600" /> Traité · {fmtD(q.createdAt)}
                    </div>
                  </div>
                  <p className="text-[13px]"><span className="font-medium">Motif: </span>{q.motif}</p>
                  {q.antecedents && <p className="text-[12px] text-text-muted-brand mt-1">{q.antecedents}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {questionnaires.length === 0 && !showForm && !success && (
        <div className="py-12 text-center">
          <ClipboardList className="mx-auto h-12 w-12 text-text-muted-brand/30" />
          <p className="mt-4 font-medium text-text-mid">Aucun questionnaire envoyé</p>
          <p className="mt-2 text-[13px] text-text-muted-brand">Remplissez un questionnaire avant votre prochaine consultation.</p>
          <button onClick={() => setShowForm(true)} className="mt-4 text-[13px] text-primary-brand hover:underline">+ Remplir un questionnaire</button>
        </div>
      )}
    </div>
  )
}
