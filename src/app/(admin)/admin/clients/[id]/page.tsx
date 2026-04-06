"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Calendar, ShoppingBag, TrendingUp, Star, MessageCircle, UserX, BarChart3, AlertTriangle, Clock } from "lucide-react"
import { formatPrix } from "@/lib/utils"
import { useConfirm } from "@/components/ui/confirm-dialog"
import { toast } from "sonner"

interface ResumeClient {
  resume: string
  stats: {
    totalRDV: number; rdvTermines: number; rdvAnnules: number
    tauxPresence: number; frequenceMensuelle: number
    totalDepense: number; panierMoyen: number
    noteMoyenne: number | null; joursSanVisite: number | null
    moisDepuisInscription: number
  }
  soinsPreferes: { nom: string; count: number }[]
  alertesSante: string[]
  categoriesVisitees: { categorie: string; count: number }[]
}

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
  const confirm = useConfirm()
  const [client, setClient] = useState<ClientDetail | null>(null)
  const [resume, setResume] = useState<ResumeClient | null>(null)
  const [loading, setLoading] = useState(true)
  const [resumeLoading, setResumeLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/clients/${id}`)
      .then((r) => r.json())
      .then(setClient)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  function loadResume() {
    setResumeLoading(true)
    fetch(`/api/admin/clients/${id}/resume`)
      .then((r) => r.json())
      .then(setResume)
      .catch(console.error)
      .finally(() => setResumeLoading(false))
  }

  const handleDeactivate = async () => {
    const confirmed = await confirm({
      title: "Désactiver le compte",
      description: "Désactiver ce compte client ? Cette action est réversible.",
      confirmLabel: "Désactiver",
      variant: "warning",
    })
    if (!confirmed) return
    const res = await fetch(`/api/admin/clients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "CLIENT" }),
    })
    if (res.ok) {
      toast.success("Compte mis à jour")
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
            <span className="text-xs uppercase tracking-widest text-gray-500">Téléphone</span>
            <p className="text-text-main mt-0.5">{client.telephone || "—"}</p>
          </div>
          <div>
            <span className="text-xs uppercase tracking-widest text-gray-500">Adresse</span>
            <p className="text-text-main mt-0.5">{client.adresse || "—"}</p>
          </div>
          <div>
            <span className="text-xs uppercase tracking-widest text-gray-500">Ville</span>
            <p className="text-text-main mt-0.5">{client.ville || "—"}</p>
          </div>
          <div>
            <span className="text-xs uppercase tracking-widest text-gray-500">Inscrit le</span>
            <p className="text-text-main mt-0.5">{new Date(client.createdAt).toLocaleDateString("fr")}</p>
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
                <p className="text-xs uppercase tracking-widest text-gray-500 font-body mt-1">{s.label}</p>
              </div>
              <s.icon className="h-5 w-5 text-gray-500" />
            </div>
          </div>
        ))}
      </div>

      {/* Synthèse client */}
      <div className="bg-white border border-border-brand p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-gold" />
            <h3 className="font-display text-lg text-text-main">Synthèse client</h3>
          </div>
          <button
            onClick={loadResume}
            disabled={resumeLoading}
            className="flex items-center gap-1.5 px-4 py-2 bg-gold text-white font-body text-xs uppercase tracking-widest hover:bg-gold-dark disabled:opacity-50 transition-colors"
          >
            {resumeLoading ? (
              <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <BarChart3 size={14} />
            )}
            {resume ? "Actualiser" : "Générer la synthèse"}
          </button>
        </div>

        {resume ? (
          <div className="space-y-4">
            <div className="bg-bg-page border border-border-brand p-4">
              {resume.resume.split("\n\n").map((p, i) => (
                <p key={i} className={`font-body text-[13px] text-text-main leading-relaxed ${i > 0 ? "mt-3" : ""}`}>{p}</p>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MiniStat icon={TrendingUp} label="Présence" value={`${resume.stats.tauxPresence}%`} />
              <MiniStat icon={Calendar} label="Fréquence" value={`${resume.stats.frequenceMensuelle}/mois`} />
              <MiniStat icon={ShoppingBag} label="Panier moyen" value={`${resume.stats.panierMoyen.toLocaleString("fr")} F`} />
              <MiniStat icon={Clock} label="Dernière visite" value={resume.stats.joursSanVisite !== null ? `${resume.stats.joursSanVisite}j` : "—"} />
            </div>
            {resume.soinsPreferes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {resume.soinsPreferes.map((s) => (
                  <span key={s.nom} className="px-3 py-1 bg-primary-brand/10 text-primary-brand font-body text-[12px]">
                    {s.nom} ({s.count}×)
                  </span>
                ))}
              </div>
            )}
            {resume.alertesSante.length > 0 && (
              <div className="border border-red-200 bg-red-50 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={14} className="text-red-600" />
                  <span className="font-body text-xs uppercase tracking-widest text-red-600 font-medium">Alertes santé</span>
                </div>
                {resume.alertesSante.map((a, i) => (
                  <p key={i} className="font-body text-[12px] text-red-700">{a}</p>
                ))}
              </div>
            )}
          </div>
        ) : (
          !resumeLoading && (
            <p className="font-body text-[13px] text-gray-500 italic">
              Cliquez sur « Générer le résumé » pour obtenir une analyse complète.
            </p>
          )
        )}
      </div>

      {/* Rendez-vous */}
      <div className="bg-white border border-border-brand p-6">
        <h3 className="font-display text-lg text-text-main mb-4">Rendez-vous ({client.rendezVous.length})</h3>
        {client.rendezVous.length > 0 ? (
          <div className="overflow-x-auto">
          <table className="w-full text-sm font-body min-w-100">
            <thead>
              <tr className="border-b border-border-brand">
                <th className="text-left py-2 text-xs uppercase tracking-widest text-gray-500 font-medium">Soin</th>
                <th className="text-left py-2 text-xs uppercase tracking-widest text-gray-500 font-medium">Date</th>
                <th className="text-left py-2 text-xs uppercase tracking-widest text-gray-500 font-medium">Prix</th>
                <th className="text-left py-2 text-xs uppercase tracking-widest text-gray-500 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {client.rendezVous.map((r) => (
                <tr key={r.id} className="border-b border-border-brand last:border-0">
                  <td className="py-2.5 text-text-main">{r.soin}</td>
                  <td className="py-2.5 text-gray-500">
                    {new Date(r.dateHeure).toLocaleDateString("fr")}
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
          </div>
        ) : (
          <p className="text-gray-500 text-sm font-body">Aucun rendez-vous</p>
        )}
      </div>

      {/* Commandes */}
      <div className="bg-white border border-border-brand p-6">
        <h3 className="font-display text-lg text-text-main mb-4">Commandes ({client.commandes.length})</h3>
        {client.commandes.length > 0 ? (
          <div className="overflow-x-auto">
          <table className="w-full text-sm font-body min-w-[320px]">
            <thead>
              <tr className="border-b border-border-brand">
                <th className="text-left py-2 text-xs uppercase tracking-widest text-gray-500 font-medium">Date</th>
                <th className="text-left py-2 text-xs uppercase tracking-widest text-gray-500 font-medium">Total</th>
                <th className="text-left py-2 text-xs uppercase tracking-widest text-gray-500 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {client.commandes.map((c) => (
                <tr key={c.id} className="border-b border-border-brand last:border-0">
                  <td className="py-2.5 text-gray-500">
                    {new Date(c.createdAt).toLocaleDateString("fr")}
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
          </div>
        ) : (
          <p className="text-gray-500 text-sm font-body">Aucune commande</p>
        )}
      </div>
    </div>
  )
}

function MiniStat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="bg-bg-page border border-border-brand p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={12} className="text-gold" />
        <span className="font-body text-xs uppercase tracking-widest text-gray-500">{label}</span>
      </div>
      <p className="font-body text-[14px] font-medium text-text-main">{value}</p>
    </div>
  )
}
