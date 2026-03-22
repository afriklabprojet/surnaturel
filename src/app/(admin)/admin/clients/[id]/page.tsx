"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Calendar, ShoppingBag, TrendingUp, Star, MessageCircle, UserX } from "lucide-react"
import { formatPrix } from "@/lib/utils"

const statutLabels: Record<string, string> = {
  EN_ATTENTE: "En attente",
  CONFIRME: "Confirmé",
  ANNULE: "Annulé",
  TERMINE: "Terminé",
  PAYEE: "Payée",
  EN_PREPARATION: "En préparation",
  EXPEDIEE: "Expédiée",
  LIVREE: "Livrée",
  ANNULEE: "Annulée",
}

const statutColors: Record<string, string> = {
  EN_ATTENTE: "bg-gold/10 text-gold",
  CONFIRME: "bg-primary-brand/10 text-primary-brand",
  ANNULE: "bg-red-100 text-red-700",
  TERMINE: "bg-blue-100 text-blue-700",
  PAYEE: "bg-primary-brand/10 text-primary-brand",
  EN_PREPARATION: "bg-purple-100 text-purple-700",
  EXPEDIEE: "bg-indigo-100 text-indigo-700",
  LIVREE: "bg-emerald-100 text-emerald-700",
  ANNULEE: "bg-red-100 text-red-700",
}

interface ClientDetail {
  id: string
  nom: string
  prenom: string
  email: string
  telephone: string | null
  photoUrl: string | null
  adresse: string | null
  ville: string | null
  role: string
  createdAt: string
  stats: {
    nbRDV: number
    nbCommandes: number
    caGenere: number
    points: number
  }
  rendezVous: { id: string; soin: string; prix: number; dateHeure: string; statut: string }[]
  commandes: { id: string; total: number; statut: string; createdAt: string }[]
}

export default function AdminClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [client, setClient] = useState<ClientDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/clients/${id}`)
      .then((r) => r.json())
      .then(setClient)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const handleDeactivate = async () => {
    if (!confirm("Désactiver ce compte client ? Cette action est réversible.")) return
    const res = await fetch(`/api/admin/clients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "CLIENT" }),
    })
    if (res.ok) {
      alert("Compte mis à jour.")
      router.refresh()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-4 border-primary-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!client) return <p className="text-gray-500 font-body">Client introuvable</p>

  const initials = `${client.prenom?.[0] || ""}${client.nom?.[0] || ""}`.toUpperCase()

  const statsCards = [
    { label: "Rendez-vous", value: client.stats.nbRDV, icon: Calendar, color: "var(--color-primary-brand)" },
    { label: "Commandes", value: client.stats.nbCommandes, icon: ShoppingBag, color: "var(--color-gold)" },
    { label: "CA généré", value: formatPrix(client.stats.caGenere), icon: TrendingUp, color: "var(--color-primary-brand)" },
    { label: "Points fidélité", value: client.stats.points, icon: Star, color: "var(--color-gold)" },
  ]

  return (
    <div className="space-y-6">
      <Link href="/admin/clients" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-brand transition-colors font-body">
        <ArrowLeft className="h-4 w-4" /> Retour aux clients
      </Link>

      {/* Profile header */}
      <div className="bg-white border border-border-brand p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {client.photoUrl ? (
              <Image src={client.photoUrl} alt="" width={56} height={56} className="h-14 w-14 object-cover rounded-full" />
            ) : (
              <div className="h-14 w-14 rounded-full bg-primary-brand/10 flex items-center justify-center">
                <span className="text-lg font-medium text-primary-brand font-body">{initials}</span>
              </div>
            )}
            <div>
              <h2 className="font-display text-2xl text-text-main">
                {client.prenom} {client.nom}
              </h2>
              <p className="text-sm text-gray-500 font-body mt-1">{client.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/messages?client=${client.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-brand text-white text-sm font-body hover:bg-primary-dark transition-colors"
            >
              <MessageCircle className="h-4 w-4" /> Envoyer un message
            </Link>
            <button
              onClick={handleDeactivate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-body hover:bg-red-700 transition-colors"
            >
              <UserX className="h-4 w-4" /> Désactiver le compte
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm font-body">
          <div>
            <span className="text-[11px] uppercase tracking-widest text-gray-500">Téléphone</span>
            <p className="text-text-main mt-0.5">{client.telephone || "—"}</p>
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-widest text-gray-500">Adresse</span>
            <p className="text-text-main mt-0.5">{client.adresse || "—"}</p>
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-widest text-gray-500">Ville</span>
            <p className="text-text-main mt-0.5">{client.ville || "—"}</p>
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-widest text-gray-500">Inscrit le</span>
            <p className="text-text-main mt-0.5">{new Date(client.createdAt).toLocaleDateString("fr-FR")}</p>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((s) => (
          <div key={s.label} className="bg-white border border-border-brand p-4" style={{ borderTopWidth: 2, borderTopColor: s.color }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-2xl text-text-main">{s.value}</p>
                <p className="text-[11px] uppercase tracking-widest text-gray-500 font-body mt-1">{s.label}</p>
              </div>
              <s.icon className="h-5 w-5 text-gray-500" />
            </div>
          </div>
        ))}
      </div>

      {/* Rendez-vous */}
      <div className="bg-white border border-border-brand p-6">
        <h3 className="font-display text-lg text-text-main mb-4">Rendez-vous ({client.rendezVous.length})</h3>
        {client.rendezVous.length > 0 ? (
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border-brand">
                <th className="text-left py-2 text-[11px] uppercase tracking-widest text-gray-500 font-medium">Soin</th>
                <th className="text-left py-2 text-[11px] uppercase tracking-widest text-gray-500 font-medium">Date</th>
                <th className="text-left py-2 text-[11px] uppercase tracking-widest text-gray-500 font-medium">Prix</th>
                <th className="text-left py-2 text-[11px] uppercase tracking-widest text-gray-500 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {client.rendezVous.map((r) => (
                <tr key={r.id} className="border-b border-border-brand last:border-0">
                  <td className="py-2.5 text-text-main">{r.soin}</td>
                  <td className="py-2.5 text-gray-500">
                    {new Date(r.dateHeure).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="py-2.5 text-text-main">{formatPrix(r.prix)}</td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 text-xs font-medium ${statutColors[r.statut] || ""}`}>
                      {statutLabels[r.statut] || r.statut}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500 text-sm font-body">Aucun rendez-vous</p>
        )}
      </div>

      {/* Commandes */}
      <div className="bg-white border border-border-brand p-6">
        <h3 className="font-display text-lg text-text-main mb-4">Commandes ({client.commandes.length})</h3>
        {client.commandes.length > 0 ? (
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border-brand">
                <th className="text-left py-2 text-[11px] uppercase tracking-widest text-gray-500 font-medium">Date</th>
                <th className="text-left py-2 text-[11px] uppercase tracking-widest text-gray-500 font-medium">Total</th>
                <th className="text-left py-2 text-[11px] uppercase tracking-widest text-gray-500 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {client.commandes.map((c) => (
                <tr key={c.id} className="border-b border-border-brand last:border-0">
                  <td className="py-2.5 text-gray-500">
                    {new Date(c.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="py-2.5 text-text-main">{formatPrix(c.total)}</td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 text-xs font-medium ${statutColors[c.statut] || ""}`}>
                      {statutLabels[c.statut] || c.statut}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500 text-sm font-body">Aucune commande</p>
        )}
      </div>
    </div>
  )
}
