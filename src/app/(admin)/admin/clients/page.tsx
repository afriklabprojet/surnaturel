"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, Eye, Download } from "lucide-react"

interface Client {
  id: string
  nom: string
  prenom: string
  email: string
  telephone: string | null
  photoUrl: string | null
  createdAt: string
  _count: { rendezVous: number; commandes: number }
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  const fetchClients = async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (search) params.set("search", search)
    const res = await fetch(`/api/admin/clients?${params}`)
    const data = await res.json()
    setClients(data.clients)
    setTotal(data.total)
    setLoading(false)
  }

  useEffect(() => { fetchClients() }, [page])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchClients()
  }

  const totalPages = Math.ceil(total / limit)

  const initials = (c: Client) =>
    `${c.prenom?.[0] || ""}${c.nom?.[0] || ""}`.toUpperCase()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="font-body text-sm text-gray-500">{total} client(s) inscrit(s)</p>
          <button
            onClick={() => window.open("/api/admin/export?type=clients", "_blank")}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border-brand font-body text-[11px] uppercase tracking-widest text-text-mid hover:bg-bg-page transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
        </div>
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Rechercher un client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-border-brand text-sm font-body bg-white w-64 focus:outline-none focus:border-primary-brand"
            />
          </div>
        </form>
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
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-widest text-gray-500 font-medium">Client</th>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-widest text-gray-500 font-medium">Email</th>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-widest text-gray-500 font-medium">Téléphone</th>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-widest text-gray-500 font-medium">RDV</th>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-widest text-gray-500 font-medium">Commandes</th>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-widest text-gray-500 font-medium">Inscrit le</th>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-widest text-gray-500 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-t border-border-brand hover:bg-bg-page transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {client.photoUrl ? (
                          <Image
                            src={client.photoUrl}
                            alt=""
                            width={32}
                            height={32}
                            className="h-8 w-8 object-cover rounded-full"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary-brand/10 flex items-center justify-center">
                            <span className="text-[11px] font-medium text-primary-brand">{initials(client)}</span>
                          </div>
                        )}
                        <span className="font-medium text-text-main">
                          {client.prenom} {client.nom}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{client.email}</td>
                    <td className="px-4 py-3 text-gray-500">{client.telephone || "—"}</td>
                    <td className="px-4 py-3 text-text-main">{client._count.rendezVous}</td>
                    <td className="px-4 py-3 text-text-main">{client._count.commandes}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(client.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/clients/${client.id}`}
                        className="p-1.5 bg-primary-brand/10 text-primary-brand hover:bg-primary-brand/20 transition-colors inline-flex"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {clients.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">Aucun client trouvé</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border-brand">
            <p className="text-sm text-gray-500 font-body">{total} client(s)</p>
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 text-sm border border-border-brand disabled:opacity-50 font-body hover:bg-bg-page transition-colors">Préc.</button>
              <span className="text-sm text-gray-500 font-body">{page}/{totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 text-sm border border-border-brand disabled:opacity-50 font-body hover:bg-bg-page transition-colors">Suiv.</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
