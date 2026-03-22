"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import Link from "next/link"
import { ArrowLeft, Save, Upload, Eye, EyeOff } from "lucide-react"

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false })

export default function AdminBlogEditorPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const isNew = params.id === "nouveau"

  const [titre, setTitre] = useState("")
  const [contenu, setContenu] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [publie, setPublie] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(!isNew)
  const [error, setError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/admin/articles/${params.id}`)
        .then((r) => r.json())
        .then((data) => {
          setTitre(data.titre)
          setContenu(data.contenu)
          setImageUrl(data.imageUrl || "")
          setPublie(data.publie)
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [isNew, params.id])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/upload", { method: "POST", body: fd })
    if (res.ok) {
      const data = await res.json()
      setImageUrl(data.url)
    }
    setUploading(false)
  }

  const handleSave = async (publish?: boolean) => {
    setSaving(true)
    setError("")

    const body = {
      titre,
      contenu,
      imageUrl: imageUrl || null,
      publie: publish !== undefined ? publish : publie,
    }
    const url = isNew ? "/api/admin/articles" : `/api/admin/articles/${params.id}`
    const method = isNew ? "POST" : "PATCH"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const d = await res.json()
      setError(d.error || "Erreur")
      setSaving(false)
      return
    }

    router.push("/admin/blog")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-4 border-primary-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/blog" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-brand transition-colors font-body">
          <ArrowLeft className="h-4 w-4" /> Retour au blog
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSave(false)}
            disabled={saving || !titre || !contenu}
            className="inline-flex items-center gap-2 px-4 py-2 border border-border-brand text-sm font-body text-gray-500 hover:bg-bg-page transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> Brouillon
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving || !titre || !contenu}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-brand text-white text-sm font-body hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {publie ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {saving ? "Enregistrement…" : isNew ? "Publier" : "Enregistrer & publier"}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 font-body">{error}</p>}

      {/* Title */}
      <div className="bg-white border border-border-brand p-6">
        <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-body mb-2">Titre de l&apos;article</label>
        <input
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          placeholder="Saisissez le titre…"
          className="w-full text-xl font-display text-text-main border-0 border-b border-border-brand pb-2 focus:outline-none focus:border-primary-brand bg-transparent"
        />
      </div>

      {/* Image */}
      <div className="bg-white border border-border-brand p-6">
        <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-body mb-2">Image de couverture</label>
        <div className="flex items-center gap-3">
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="URL de l'image…"
            className="flex-1 border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand"
          />
          <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-3 py-2 border border-border-brand text-sm font-body hover:bg-bg-page transition-colors disabled:opacity-50"
          >
            <Upload className="h-4 w-4" /> {uploading ? "Envoi…" : "Upload"}
          </button>
        </div>
        {imageUrl && (
          <img src={imageUrl} alt="Couverture" className="mt-3 max-h-48 object-cover" />
        )}
      </div>

      {/* Markdown editor */}
      <div className="bg-white border border-border-brand p-6" data-color-mode="light">
        <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-body mb-2">Contenu (Markdown)</label>
        <MDEditor
          value={contenu}
          onChange={(val) => setContenu(val || "")}
          height={500}
          preview="live"
        />
      </div>
    </div>
  )
}
