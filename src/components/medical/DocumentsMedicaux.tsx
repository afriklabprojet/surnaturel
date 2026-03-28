"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Loader2, Plus, Trash2, FileText, Upload, X, ExternalLink,
  ClipboardList, Image, FileCheck, Award,
} from "lucide-react"

interface Document {
  id: string
  nom: string
  type: string
  fileUrl: string
  taille: number | null
  description: string
  createdAt: string
}

const TYPES = [
  { value: "ORDONNANCE", label: "Ordonnance", icon: ClipboardList, color: "text-blue-600" },
  { value: "ANALYSE", label: "Analyse", icon: FileCheck, color: "text-purple-600" },
  { value: "RADIO_IMAGERIE", label: "Radio / Imagerie", icon: Image, color: "text-orange-600" },
  { value: "COMPTE_RENDU", label: "Compte rendu", icon: FileText, color: "text-green-700" },
  { value: "CERTIFICAT", label: "Certificat", icon: Award, color: "text-gold" },
  { value: "AUTRE", label: "Autre", icon: FileText, color: "text-text-mid" },
] as const

function getTypeInfo(type: string) {
  return TYPES.find((t) => t.value === type) ?? TYPES[TYPES.length - 1]
}

function formatSize(bytes: number | null) {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

export default function DocumentsMedicaux() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [filterType, setFilterType] = useState("")

  const [form, setForm] = useState({
    nom: "",
    type: "ORDONNANCE",
    description: "",
    file: null as File | null,
  })

  const fetchDocuments = useCallback(async () => {
    try {
      const url = filterType
        ? `/api/medical/documents?type=${filterType}`
        : "/api/medical/documents"
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setDocuments(data.documents)
      }
    } catch {
      setError("Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }, [filterType])

  useEffect(() => {
    setLoading(true)
    fetchDocuments()
  }, [fetchDocuments])

  async function uploadToCloudinary(file: File): Promise<{ url: string; size: number }> {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", "medical_docs")

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`,
      { method: "POST", body: formData }
    )

    if (!res.ok) throw new Error("Échec upload")
    const data = await res.json()
    return { url: data.secure_url, size: data.bytes }
  }

  async function handleAdd() {
    if (!form.nom.trim() || !form.file) return
    setUploading(true)
    setError("")

    try {
      const { url, size } = await uploadToCloudinary(form.file)

      const res = await fetch("/api/medical/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: form.nom.trim(),
          type: form.type,
          fileUrl: url,
          taille: size,
          description: form.description.trim() || undefined,
        }),
      })

      if (res.ok) {
        setForm({ nom: "", type: "ORDONNANCE", description: "", file: null })
        setShowForm(false)
        await fetchDocuments()
      } else {
        const data = await res.json()
        setError(data.error ?? "Erreur")
      }
    } catch {
      setError("Erreur lors de l'upload")
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/medical/documents?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        setDocuments((p) => p.filter((d) => d.id !== id))
      }
    } catch {
      /* silent */
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={22} className="animate-spin text-gold" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 px-4 py-3 font-body text-[13px] text-red-800">{error}</div>
      )}

      {/* Filtres & bouton ajouter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border border-border-brand bg-white px-3 py-2 font-body text-[13px] text-text-main outline-none focus:border-gold"
        >
          <option value="">Tous les types</option>
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary-brand px-4 py-2 font-body text-[12px] uppercase tracking-widest text-white transition-colors hover:bg-primary-dark"
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? "Fermer" : "Ajouter un document"}
        </button>
      </div>

      {/* Formulaire d'ajout */}
      {showForm && (
        <div className="border border-border-brand border-t-2 border-t-gold bg-white p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block font-body text-[10px] font-medium uppercase tracking-[0.15em] text-text-muted-brand">
                Nom du document <span className="text-red-800">*</span>
              </label>
              <input
                type="text"
                value={form.nom}
                onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))}
                placeholder="Ordonnance Dr. Konan"
                maxLength={255}
                className="w-full border border-border-brand bg-bg-page px-3 py-2.5 font-body text-[13px] text-text-main outline-none placeholder:text-text-muted-brand/60 focus:border-gold"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-body text-[10px] font-medium uppercase tracking-[0.15em] text-text-muted-brand">
                Type
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                className="w-full border border-border-brand bg-bg-page px-3 py-2.5 font-body text-[13px] text-text-main outline-none focus:border-gold"
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block font-body text-[10px] font-medium uppercase tracking-[0.15em] text-text-muted-brand">
              Fichier <span className="text-red-800">*</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3 border border-dashed border-border-brand bg-bg-page px-4 py-4 transition-colors hover:border-gold">
              <Upload size={20} className="shrink-0 text-text-muted-brand" />
              <span className="font-body text-[13px] text-text-mid">
                {form.file ? form.file.name : "Cliquer pour sélectionner un fichier (PDF, image…)"}
              </span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null
                  setForm((p) => ({ ...p, file }))
                }}
              />
            </label>
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block font-body text-[10px] font-medium uppercase tracking-[0.15em] text-text-muted-brand">
              Description (optionnel, chiffré)
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={2}
              maxLength={5000}
              placeholder="Notes sur ce document…"
              className="w-full border border-border-brand bg-bg-page px-3 py-2.5 font-body text-[13px] text-text-main outline-none placeholder:text-text-muted-brand/60 focus:border-gold"
            />
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleAdd}
              disabled={uploading || !form.nom.trim() || !form.file}
              className="flex items-center gap-2 bg-primary-brand px-5 py-2.5 font-body text-[12px] uppercase tracking-widest text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploading ? "Envoi en cours…" : "Envoyer"}
            </button>
          </div>
        </div>
      )}

      {/* Liste de documents */}
      {documents.length === 0 ? (
        <div className="border border-border-brand bg-white py-12 text-center">
          <FileText size={28} className="mx-auto text-border-brand" />
          <p className="mt-4 font-body text-[13px] font-light text-text-muted-brand">
            Aucun document médical
          </p>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 inline-flex items-center gap-2 bg-primary-brand px-5 py-2.5 font-body text-[12px] uppercase tracking-widest text-white transition-colors hover:bg-primary-dark"
            >
              <Plus size={14} />
              Ajouter mon premier document
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {documents.map((doc) => {
            const info = getTypeInfo(doc.type)
            const Icon = info.icon
            return (
              <div
                key={doc.id}
                className="flex items-start gap-3 border border-border-brand bg-white p-4 transition-colors hover:bg-bg-page"
              >
                <Icon size={20} className={`mt-0.5 shrink-0 ${info.color}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-[15px] font-light text-text-main">
                    {doc.nom}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 font-body text-[11px] text-text-muted-brand">
                    <span className="bg-bg-page px-2 py-0.5 font-medium uppercase tracking-[0.08em]">
                      {info.label}
                    </span>
                    {doc.taille && <span>{formatSize(doc.taille)}</span>}
                    <span>
                      {new Date(doc.createdAt).toLocaleDateString("fr", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  {doc.description && (
                    <p className="mt-1 line-clamp-2 font-body text-[12px] font-light text-text-mid">
                      {doc.description}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-text-muted-brand transition-colors hover:text-primary-brand"
                    title="Ouvrir"
                  >
                    <ExternalLink size={14} />
                  </a>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-1 text-text-muted-brand transition-colors hover:text-red-600"
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
