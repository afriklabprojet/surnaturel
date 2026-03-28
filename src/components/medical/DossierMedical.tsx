"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2, Lock, Edit3, Save, X, Heart, Pill, AlertTriangle, Droplets, Phone, FileText, Download } from "lucide-react"

interface DossierData {
  id: string
  pathologie: string
  notes: string
  allergies: string
  antecedents: string
  medicaments: string
  groupeSanguin: string
  contactUrgence: string
  updatedAt: string
}

const GROUPES_SANGUINS = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

export default function DossierMedical() {
  const [dossier, setDossier] = useState<DossierData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [form, setForm] = useState({
    pathologie: "",
    notes: "",
    allergies: "",
    antecedents: "",
    medicaments: "",
    groupeSanguin: "",
    contactUrgence: "",
  })

  const fetchDossier = useCallback(async () => {
    try {
      const res = await fetch("/api/medical/dossier")
      if (res.ok) {
        const data: { dossier: DossierData | null } = await res.json()
        setDossier(data.dossier)
        if (data.dossier) {
          setForm({
            pathologie: data.dossier.pathologie,
            notes: data.dossier.notes,
            allergies: data.dossier.allergies,
            antecedents: data.dossier.antecedents,
            medicaments: data.dossier.medicaments,
            groupeSanguin: data.dossier.groupeSanguin,
            contactUrgence: data.dossier.contactUrgence,
          })
        }
      }
    } catch {
      setError("Erreur de chargement du dossier")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDossier()
  }, [fetchDossier])

  function handleCancel() {
    setEditing(false)
    setError("")
    setSuccess("")
    if (dossier) {
      setForm({
        pathologie: dossier.pathologie,
        notes: dossier.notes,
        allergies: dossier.allergies,
        antecedents: dossier.antecedents,
        medicaments: dossier.medicaments,
        groupeSanguin: dossier.groupeSanguin,
        contactUrgence: dossier.contactUrgence,
      })
    } else {
      setForm({ pathologie: "", notes: "", allergies: "", antecedents: "", medicaments: "", groupeSanguin: "", contactUrgence: "" })
    }
  }

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }))
  }

  async function handleSave() {
    setError("")
    setSaving(true)
    setSuccess("")

    try {
      const payload = {
        pathologie: form.pathologie.trim() || undefined,
        notes: form.notes.trim() || undefined,
        allergies: form.allergies.trim() || undefined,
        antecedents: form.antecedents.trim() || undefined,
        medicaments: form.medicaments.trim() || undefined,
        groupeSanguin: form.groupeSanguin || undefined,
        contactUrgence: form.contactUrgence.trim() || undefined,
      }

      const res = await fetch("/api/medical/dossier", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setSuccess("Dossier médical mis à jour avec succès")
        setEditing(false)
        await fetchDossier()
      } else {
        const data = await res.json()
        setError(data.error ?? "Erreur lors de la sauvegarde")
      }
    } catch {
      setError("Erreur réseau")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={22} className="animate-spin text-gold" />
      </div>
    )
  }

  const hasContent = dossier && (dossier.pathologie || dossier.allergies || dossier.antecedents || dossier.medicaments || dossier.groupeSanguin || dossier.contactUrgence || dossier.notes)

  return (
    <div className="border border-border-brand border-t-2 border-t-gold bg-white p-6 md:p-8">
      {error && (
        <div className="mb-5 bg-red-50 px-4 py-3 font-body text-[13px] text-red-800">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-5 bg-primary-light px-4 py-3 font-body text-[13px] text-primary-brand">
          {success}
        </div>
      )}

      {/* Mode affichage */}
      {!editing && (
        <>
          {hasContent ? (
            <div className="space-y-6">
              {/* Groupe sanguin & Contact urgence — en-tête */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {dossier.groupeSanguin && (
                  <div className="flex items-center gap-3 border border-border-brand bg-bg-page p-4">
                    <Droplets size={18} className="shrink-0 text-red-600" />
                    <div>
                      <p className="font-body text-[10px] font-medium uppercase tracking-[0.15em] text-text-muted-brand">
                        Groupe sanguin
                      </p>
                      <p className="font-display text-[20px] font-light text-text-main">
                        {dossier.groupeSanguin}
                      </p>
                    </div>
                  </div>
                )}
                {dossier.contactUrgence && (
                  <div className="flex items-center gap-3 border border-border-brand bg-bg-page p-4">
                    <Phone size={18} className="shrink-0 text-gold" />
                    <div>
                      <p className="font-body text-[10px] font-medium uppercase tracking-[0.15em] text-text-muted-brand">
                        Contact d&apos;urgence
                      </p>
                      <p className="whitespace-pre-wrap font-body text-[14px] font-light text-text-main">
                        {dossier.contactUrgence}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Pathologie */}
              {dossier.pathologie && (
                <InfoBlock
                  icon={<Heart size={15} className="text-primary-brand" />}
                  label="Pathologie / Condition"
                  value={dossier.pathologie}
                />
              )}

              {/* Allergies */}
              {dossier.allergies && (
                <InfoBlock
                  icon={<AlertTriangle size={15} className="text-orange-600" />}
                  label="Allergies connues"
                  value={dossier.allergies}
                />
              )}

              {/* Antécédents */}
              {dossier.antecedents && (
                <InfoBlock
                  icon={<FileText size={15} className="text-blue-600" />}
                  label="Antécédents médicaux"
                  value={dossier.antecedents}
                />
              )}

              {/* Médicaments */}
              {dossier.medicaments && (
                <InfoBlock
                  icon={<Pill size={15} className="text-green-700" />}
                  label="Médicaments en cours"
                  value={dossier.medicaments}
                />
              )}

              {/* Notes */}
              {dossier.notes && (
                <InfoBlock
                  icon={<FileText size={15} className="text-text-muted-brand" />}
                  label="Notes personnelles"
                  value={dossier.notes}
                  muted
                />
              )}

              <p className="font-body text-[11px] text-text-muted-brand">
                Mise à jour le{" "}
                {new Date(dossier.updatedAt).toLocaleDateString("fr", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => { setEditing(true); setSuccess("") }}
                  className="flex items-center gap-2 border border-primary-brand px-5 py-2.5 font-body text-[12px] uppercase tracking-widest text-primary-brand transition-colors hover:bg-primary-light"
                >
                  <Edit3 size={14} />
                  Modifier
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 border border-border-brand px-5 py-2.5 font-body text-[12px] uppercase tracking-widest text-text-mid transition-colors hover:border-gold hover:text-gold"
                >
                  <Download size={14} />
                  Exporter PDF
                </button>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <Lock size={28} className="mx-auto text-border-brand" />
              <p className="mt-4 font-body text-[13px] font-light text-text-muted-brand">
                Aucun dossier médical enregistré.
              </p>
              <button
                onClick={() => setEditing(true)}
                className="mt-5 inline-flex items-center gap-2 bg-primary-brand px-6 py-2.5 font-body text-[12px] uppercase tracking-widest text-white transition-colors hover:bg-primary-dark"
              >
                Créer mon dossier
              </button>
            </div>
          )}

          <div className="mt-6 flex items-center gap-2 border-t border-border-brand pt-5">
            <Lock size={13} className="shrink-0 text-text-muted-brand" />
            <span className="font-body text-[11px] font-light text-text-muted-brand">
              Ces informations sont chiffrées et strictement confidentielles
            </span>
          </div>
        </>
      )}

      {/* Mode édition */}
      {editing && (
        <div className="space-y-5">
          {/* Groupe sanguin */}
          <div>
            <label htmlFor="groupeSanguin" className="mb-2 block font-body text-[10px] font-medium uppercase tracking-[0.15em] text-text-muted-brand">
              Groupe sanguin
            </label>
            <select
              id="groupeSanguin"
              value={form.groupeSanguin}
              onChange={update("groupeSanguin")}
              className="w-full border border-border-brand bg-bg-page px-4 py-3 font-body text-[14px] font-light text-text-main outline-none focus:border-gold focus:bg-white sm:w-48"
            >
              <option value="">Non renseigné</option>
              {GROUPES_SANGUINS.filter(Boolean).map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Contact urgence */}
          <FieldTextarea
            id="contactUrgence"
            label="Contact d'urgence"
            value={form.contactUrgence}
            onChange={update("contactUrgence")}
            rows={2}
            maxLength={2000}
            placeholder="Nom, lien, numéro de téléphone…"
          />

          {/* Pathologie */}
          <FieldTextarea
            id="pathologie"
            label="Pathologie / Condition"
            value={form.pathologie}
            onChange={update("pathologie")}
            rows={3}
            maxLength={5000}
            placeholder="Décrivez votre pathologie ou condition médicale…"
          />

          {/* Allergies */}
          <FieldTextarea
            id="allergies"
            label="Allergies connues"
            value={form.allergies}
            onChange={update("allergies")}
            rows={2}
            maxLength={5000}
            placeholder="Médicaments, aliments, substances…"
          />

          {/* Antécédents */}
          <FieldTextarea
            id="antecedents"
            label="Antécédents médicaux"
            value={form.antecedents}
            onChange={update("antecedents")}
            rows={3}
            maxLength={5000}
            placeholder="Chirurgies, maladies antérieures, hospitalisations…"
          />

          {/* Médicaments */}
          <FieldTextarea
            id="medicaments"
            label="Médicaments en cours"
            value={form.medicaments}
            onChange={update("medicaments")}
            rows={2}
            maxLength={5000}
            placeholder="Liste des médicaments actuels et posologie…"
          />

          {/* Notes */}
          <FieldTextarea
            id="notes"
            label="Notes personnelles (optionnel)"
            value={form.notes}
            onChange={update("notes")}
            rows={3}
            maxLength={10000}
            placeholder="Informations complémentaires…"
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="flex items-center gap-2 border border-border-brand px-5 py-2.5 font-body text-[12px] uppercase tracking-widest text-text-mid transition-colors hover:border-text-muted-brand"
            >
              <X size={14} />
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-primary-brand px-5 py-2.5 font-body text-[12px] uppercase tracking-widest text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Enregistrer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Sous-composants ──────────────────────────────────────────────── */

function InfoBlock({ icon, label, value, muted }: { icon: React.ReactNode; label: string; value: string; muted?: boolean }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        {icon}
        <span className="font-body text-[10px] font-medium uppercase tracking-[0.15em] text-text-muted-brand">
          {label}
        </span>
      </div>
      <p className={`whitespace-pre-wrap font-body text-[14px] font-light leading-relaxed ${muted ? "text-text-mid" : "text-text-main"}`}>
        {value}
      </p>
    </div>
  )
}

function FieldTextarea({
  id, label, value, onChange, rows, maxLength, placeholder,
}: {
  id: string; label: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; rows: number; maxLength: number; placeholder: string
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block font-body text-[10px] font-medium uppercase tracking-[0.15em] text-text-muted-brand">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        className="w-full border border-border-brand bg-bg-page px-4 py-3 font-body text-[14px] font-light text-text-main outline-none placeholder:text-text-muted-brand/60 focus:border-gold focus:bg-white"
      />
      <p className="mt-1 text-right font-body text-[10px] text-text-muted-brand">
        {value.length}/{maxLength}
      </p>
    </div>
  )
}
