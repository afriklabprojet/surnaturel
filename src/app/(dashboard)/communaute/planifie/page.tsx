"use client"

import { useState, useEffect, FormEvent } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Loader2,
  Clock,
  ArrowLeft,
  Send,
  Trash2,
  Edit3,
  Calendar,
  X,
  Users,
} from "lucide-react"

interface PostPlanifie {
  id: string
  contenu: string
  scheduledAt: string
  status: string
  groupeId: string | null
  groupe?: { nom: string; slug: string } | null
  createdAt: string
}

export default function PagePublicationsPlanifiees() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [posts, setPosts] = useState<PostPlanifie[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [contenu, setContenu] = useState("")
  const [scheduledAt, setScheduledAt] = useState("")
  const [groupeId, setGroupeId] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editContenu, setEditContenu] = useState("")
  const [editDate, setEditDate] = useState("")
  const [mesGroupes, setMesGroupes] = useState<{ id: string; nom: string }[]>([])

  useEffect(() => {
    if (status === "unauthenticated") router.push("/connexion")
  }, [status, router])

  useEffect(() => {
    if (status !== "authenticated") return
    fetchPosts()
    fetchGroupes()
  }, [status])

  async function fetchPosts() {
    setLoading(true)
    try {
      const res = await fetch("/api/communaute/posts/planifie")
      if (res.ok) {
        const data = await res.json()
        setPosts(data.posts || [])
      }
    } finally {
      setLoading(false)
    }
  }

  async function fetchGroupes() {
    const res = await fetch("/api/communaute/groupes?type=joined")
    if (res.ok) {
      const data = await res.json()
      setMesGroupes((data.groupes || []).map((g: { id: string; nom: string }) => ({ id: g.id, nom: g.nom })))
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!contenu.trim() || !scheduledAt || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/communaute/posts/planifie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contenu: contenu.trim(),
          scheduledAt: new Date(scheduledAt).toISOString(),
          ...(groupeId ? { groupeId } : {}),
        }),
      })
      if (res.ok) {
        setContenu("")
        setScheduledAt("")
        setGroupeId("")
        setShowForm(false)
        fetchPosts()
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdate(id: string) {
    if (!editContenu.trim() || !editDate) return
    const res = await fetch(`/api/communaute/posts/planifie/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contenu: editContenu.trim(),
        scheduledAt: new Date(editDate).toISOString(),
      }),
    })
    if (res.ok) {
      setEditId(null)
      fetchPosts()
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/communaute/posts/planifie/${id}`, { method: "DELETE" })
    setPosts((prev) => prev.filter((p) => p.id !== id))
  }

  function startEdit(post: PostPlanifie) {
    setEditId(post.id)
    setEditContenu(post.contenu)
    setEditDate(new Date(post.scheduledAt).toISOString().slice(0, 16))
  }

  if (status === "loading" || loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 size={28} className="animate-spin text-gold" /></div>
  }

  return (
    <section className="mx-auto max-w-2xl space-y-5">
      <Link href="/communaute" className="inline-flex items-center gap-1.5 font-body text-[11px] text-text-muted-brand hover:text-text-mid transition-colors">
        <ArrowLeft size={14} />
        Retour à la communauté
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[22px] font-light text-text-main">Publications planifiées</h1>
          <p className="font-body text-[12px] text-text-muted-brand mt-0.5">Gérez vos publications à venir</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-4 py-2 font-body text-[11px] font-medium uppercase tracking-[0.1em] bg-primary-brand text-white hover:bg-primary-dark transition-colors"
        >
          <Clock size={13} />Planifier
        </button>
      </div>

      {/* Formulaire de création */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-border-brand p-5 space-y-4">
          <textarea
            value={contenu}
            onChange={(e) => setContenu(e.target.value)}
            placeholder="Rédigez votre publication..."
            className="w-full border border-border-brand p-3 font-body text-[13px] text-text-main placeholder:text-text-muted-brand focus:outline-none focus:border-primary-brand resize-none"
            rows={3}
            maxLength={2000}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-[11px] text-text-muted-brand uppercase tracking-wider block mb-1">Date et heure</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full border border-border-brand px-3 py-2 font-body text-[12px] text-text-main focus:outline-none focus:border-primary-brand"
                required
              />
            </div>
            <div>
              <label className="font-body text-[11px] text-text-muted-brand uppercase tracking-wider block mb-1">Groupe (optionnel)</label>
              <select
                value={groupeId}
                onChange={(e) => setGroupeId(e.target.value)}
                className="w-full border border-border-brand px-3 py-2 font-body text-[12px] text-text-main focus:outline-none focus:border-primary-brand"
              >
                <option value="">Fil principal</option>
                {mesGroupes.map((g) => (
                  <option key={g.id} value={g.id}>{g.nom}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 font-body text-[11px] text-text-muted-brand border border-border-brand hover:bg-bg-page transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={!contenu.trim() || !scheduledAt || submitting} className="px-4 py-1.5 font-body text-[11px] text-white bg-primary-brand hover:bg-primary-dark disabled:opacity-50 transition-colors uppercase tracking-[0.1em] flex items-center gap-1.5">
              {submitting ? <Loader2 size={12} className="animate-spin" /> : <Calendar size={12} />}
              Planifier
            </button>
          </div>
        </form>
      )}

      {/* Liste */}
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <Clock size={32} className="text-text-muted-brand/30 mx-auto mb-3" />
          <p className="font-body text-[12px] text-text-muted-brand">Aucune publication planifiée</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="bg-white border border-border-brand p-4 space-y-3">
              {editId === post.id ? (
                <>
                  <textarea
                    value={editContenu}
                    onChange={(e) => setEditContenu(e.target.value)}
                    className="w-full border border-border-brand p-2.5 font-body text-[13px] text-text-main focus:outline-none focus:border-primary-brand resize-none"
                    rows={3}
                  />
                  <input
                    type="datetime-local"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full border border-border-brand px-3 py-2 font-body text-[12px] text-text-main focus:outline-none focus:border-primary-brand"
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditId(null)} className="px-3 py-1.5 font-body text-[11px] text-text-muted-brand border border-border-brand">Annuler</button>
                    <button onClick={() => handleUpdate(post.id)} className="px-3 py-1.5 font-body text-[11px] text-white bg-primary-brand hover:bg-primary-dark uppercase tracking-[0.08em]">Enregistrer</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-[13px] text-text-main whitespace-pre-wrap">{post.contenu}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => startEdit(post)} className="text-text-muted-brand hover:text-gold transition-colors" title="Modifier">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => handleDelete(post.id)} className="text-text-muted-brand hover:text-danger transition-colors" title="Supprimer">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-2 border-t border-border-brand">
                    <span className="font-body text-[10px] text-gold flex items-center gap-1">
                      <Clock size={11} />
                      {new Date(post.scheduledAt).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {post.groupe && (
                      <span className="font-body text-[10px] text-primary-brand flex items-center gap-1">
                        <Users size={11} />{post.groupe.nom}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
