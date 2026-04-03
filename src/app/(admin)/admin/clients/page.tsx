"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, Eye, Download, Calendar, ShoppingBag, Mail, Phone } from "lucide-react"
import {
  ResponsiveAdminTable,
  AdminPagination,
  AdminMobileActionButton,
} from "@/components/admin/ResponsiveAdminTable"

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

  // Avatar component for both mobile and desktop
  const ClientAvatar = ({ client }: { client: Client }) => (
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
          <span className="text-xs font-medium text-primary-brand">{initials(client)}</span>
        </div>
      )}
      <span className="font-medium text-text-main">
        {client.prenom} {client.nom}
      </span>
    </div>
  )

  // Mobile card render
  const renderMobileCard = (client: Client) => (
    <div className="space-y-3">
      {/* Header with avatar */}
      <ClientAvatar client={client} />

      {/* Contact info */}
      <div className="space-y-1.5 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Mail className="h-3.5 w-3.5" />
          <span className="truncate">{client.email}</span>
        </div>
        {client.telephone && (
          <div className="flex items-center gap-2 text-gray-600">
            <Phone className="h-3.5 w-3.5" />
            <span>{client.telephone}</span>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-primary-brand" />
          <span className="font-medium">{client._count.rendezVous}</span>
          <span className="text-gray-500">RDV</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ShoppingBag className="h-3.5 w-3.5 text-gold" />
          <span className="font-medium">{client._count.commandes}</span>
          <span className="text-gray-500">cmd</span>
        </div>
        <span className="ml-auto text-xs text-gray-400">
          Inscrit le {new Date(client.createdAt).toLocaleDateString("fr")}
        </span>
      </div>

      {/* Action */}
      <div className="pt-3 border-t border-border-brand">
        <AdminMobileActionButton
          href={`/admin/clients/${client.id}`}
          icon={<Eye className="h-4 w-4" />}
          label="Voir le profil"
        />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <p className="font-body text-sm text-gray-500">{total} client(s)</p>
          <button
            onClick={() => window.open("/api/admin/export?type=clients", "_blank")}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border-brand font-body text-xs uppercase tracking-widest text-text-mid hover:bg-bg-page transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
        </div>
        <form onSubmit={handleSearch} className="w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-4 py-2 border border-border-brand text-sm font-body bg-white focus:outline-none focus:border-primary-brand"
            />
          </div>
        </form>
      </div>

      {/* Table / Cards */}
      <ResponsiveAdminTable
        data={clients}
        keyExtractor={(c) => c.id}
        loading={loading}
        emptyMessage="Aucun client trouvé"
        mobileCard={renderMobileCard}
        columns={[
          {
            key: "nom",
            label: "Client",
            render: (c) => <ClientAvatar client={c} />,
          },
          {
            key: "email",
            label: "Email",
            render: (c) => <span className="text-gray-500">{c.email}</span>,
          },
          {
            key: "telephone",
            label: "Téléphone",
            hideOnMobile: true,
            render: (c) => <span className="text-gray-500">{c.telephone || "—"}</span>,
          },
          {
            key: "rdv",
            label: "RDV",
            render: (c) => c._count.rendezVous,
          },
          {
            key: "commandes",
            label: "Commandes",
            render: (c) => c._count.commandes,
          },
          {
            key: "createdAt",
            label: "Inscrit le",
            hideOnMobile: true,
            render: (c) => (
              <span className="text-gray-500">
                {new Date(c.createdAt).toLocaleDateString("fr")}
              </span>
            ),
          },
        ]}
        actionRender={(c) => (
          <Link
            href={`/admin/clients/${c.id}`}
            className="p-1.5 bg-primary-brand/10 text-primary-brand hover:bg-primary-brand/20 transition-colors inline-flex"
          >
            <Eye className="h-4 w-4" />
          </Link>
        )}
      />

      {/* Pagination */}
      <AdminPagination
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
        itemLabel="client"
      />
    </div>
  )
}
