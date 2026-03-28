"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface Article {
  id: string
  titre: string
  publie: boolean
  createdAt: string
}

export default function AdminBlogPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  const fetchArticles = async () => {
    setLoading(true)
    const res = await fetch("/api/admin/articles")
    const data = await res.json()
    setArticles(data.articles)
    setLoading(false)
  }

  useEffect(() => { fetchArticles() }, [])

  const togglePublie = async (id: string, publie: boolean) => {
    await fetch(`/api/admin/articles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publie: !publie }),
    })
    fetchArticles()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet article ?")) return
    await fetch(`/api/admin/articles/${id}`, { method: "DELETE" })
    fetchArticles()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="font-body text-sm text-gray-500">{articles.length} article(s)</p>
        <Link href="/admin/blog/nouveau" className="flex items-center gap-2 px-4 py-2 bg-primary-brand text-white text-sm font-body hover:bg-primary-dark transition-colors">
          <Plus className="h-4 w-4" /> Nouvel article
        </Link>
      </div>

      <div className="bg-white border border-border-brand overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="h-6 w-6 border-4 border-primary-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead className="bg-bg-page">
                <tr>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-widest text-gray-500 font-medium">Titre</th>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-widest text-gray-500 font-medium">Date</th>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-widest text-gray-500 font-medium">Statut</th>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-widest text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article) => (
                  <tr key={article.id} className="border-t border-border-brand hover:bg-bg-page transition-colors">
                    <td className="px-4 py-3 font-medium text-text-main">{article.titre}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(article.createdAt).toLocaleDateString("fr")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-0.5 text-xs font-medium", article.publie ? "bg-primary-brand/10 text-primary-brand" : "bg-gray-100 text-gray-500")}>
                        {article.publie ? "Publié" : "Brouillon"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link href={`/admin/blog/${article.id}`} className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button onClick={() => togglePublie(article.id, article.publie)} className={cn("p-1.5 transition-colors", article.publie ? "bg-gold/10 text-gold hover:bg-gold/20" : "bg-primary-brand/10 text-primary-brand hover:bg-primary-brand/20")} title={article.publie ? "Dépublier" : "Publier"}>
                          {article.publie ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button onClick={() => handleDelete(article.id)} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {articles.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Aucun article</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
