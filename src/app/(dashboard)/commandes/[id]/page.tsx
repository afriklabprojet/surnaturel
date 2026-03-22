"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Download,
  MessageCircle,
  Loader2,
  Check,
  ShoppingBag,
} from "lucide-react"
import { formatPrix } from "@/lib/utils"

interface LigneCommande {
  id: string
  quantite: number
  prixUnitaire: number
  produit: { nom: string; imageUrl: string | null }
}

interface Commande {
  id: string
  total: number
  statut: string
  paiementId: string | null
  createdAt: string
  lignes: LigneCommande[]
}

const STATUT_BADGE: Record<string, { label: string; className: string }> = {
  EN_ATTENTE: { label: "En attente", className: "bg-gold-light text-gold-dark" },
  PAYEE: { label: "Payée", className: "bg-primary-light text-primary-dark" },
  EN_PREPARATION: { label: "En préparation", className: "bg-gold-light text-gold-dark" },
  EXPEDIEE: { label: "Expédiée", className: "bg-primary-light text-primary-dark" },
  LIVREE: { label: "Livrée", className: "bg-stone-100 text-stone-500" },
  ANNULEE: { label: "Annulée", className: "bg-red-50 text-red-900" },
}

const TIMELINE_STEPS = [
  { statut: "EN_ATTENTE", label: "Commandé" },
  { statut: "PAYEE", label: "Payé" },
  { statut: "EN_PREPARATION", label: "En préparation" },
  { statut: "EXPEDIEE", label: "Expédié" },
  { statut: "LIVREE", label: "Livré" },
]

export default function PageDetailCommande() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [commande, setCommande] = useState<Commande | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/connexion")
  }, [status, router])

  useEffect(() => {
    if (status !== "authenticated" || !params.id) return
    fetch(`/api/commandes/${params.id}`)
      .then((r) => r.json())
      .then((d) => setCommande(d.commande ?? null))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [status, params.id])

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    )
  }

  if (!commande) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="font-body text-[14px] text-text-muted-brand">Commande introuvable</p>
        <Link href="/commandes" className="font-body text-[12px] text-primary-brand hover:underline">
          ← Retour aux commandes
        </Link>
      </div>
    )
  }

  const badge = STATUT_BADGE[commande.statut]
  const statutIndex = TIMELINE_STEPS.findIndex((s) => s.statut === commande.statut)

  const formatDateFr = (d: string) =>
    new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(d))

  return (
    <div className="space-y-8">
      {/* Retour */}
      <Link
        href="/commandes"
        className="inline-flex items-center gap-1.5 font-body text-[12px] text-text-muted-brand hover:text-primary-brand transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Retour aux commandes
      </Link>

      {/* Section 1 — Récapitulatif */}
      <div className="bg-white border border-border-brand p-6 space-y-3">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-display text-[24px] font-light text-text-main">
              Commande N° {commande.id.slice(0, 8)}
            </h2>
            <p className="font-body text-[13px] text-text-muted-brand">
              {formatDateFr(commande.createdAt)}
            </p>
          </div>
          <span
            className={`px-3 py-1.5 font-body text-[11px] uppercase tracking-widest ${badge?.className ?? ""}`}
          >
            {badge?.label ?? commande.statut}
          </span>
        </div>
      </div>

      {/* Section 2 — Articles */}
      <div className="bg-white border border-border-brand">
        <div className="p-4 border-b border-border-brand">
          <h3 className="font-display text-[18px] font-light text-text-main">
            Articles commandés
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-brand">
                <th className="text-left p-3 font-body text-[10px] uppercase tracking-widest text-text-muted-brand">
                  Produit
                </th>
                <th className="text-center p-3 font-body text-[10px] uppercase tracking-widest text-text-muted-brand">
                  Qté
                </th>
                <th className="text-right p-3 font-body text-[10px] uppercase tracking-widest text-text-muted-brand">
                  Prix unit.
                </th>
                <th className="text-right p-3 font-body text-[10px] uppercase tracking-widest text-text-muted-brand">
                  Sous-total
                </th>
              </tr>
            </thead>
            <tbody>
              {commande.lignes.map((l) => (
                <tr key={l.id} className="border-b border-border-brand">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-light flex items-center justify-center shrink-0">
                        <ShoppingBag className="h-4 w-4 text-primary-brand/40" />
                      </div>
                      <span className="font-body text-[13px] text-text-main">
                        {l.produit.nom}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 text-center font-body text-[13px] text-text-mid">
                    {l.quantite}
                  </td>
                  <td className="p-3 text-right font-body text-[13px] text-text-mid">
                    {formatPrix(l.prixUnitaire)}
                  </td>
                  <td className="p-3 text-right font-body text-[13px] text-text-main">
                    {formatPrix(l.prixUnitaire * l.quantite)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gold-light/30">
                <td colSpan={3} className="p-3 text-right font-body text-[12px] uppercase tracking-widest text-text-mid">
                  Total
                </td>
                <td className="p-3 text-right font-display text-[18px] text-gold">
                  {formatPrix(commande.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Section 3 — Livraison timeline */}
      <div className="bg-white border border-border-brand p-6 space-y-4">
        <h3 className="font-display text-[18px] font-light text-text-main">
          Suivi de livraison
        </h3>
        {commande.statut === "ANNULEE" ? (
          <p className="font-body text-[13px] text-red-900">
            Cette commande a été annulée.
          </p>
        ) : (
          <div className="flex items-center gap-0 overflow-x-auto py-4">
            {TIMELINE_STEPS.map((step, i) => {
              const done = i <= statutIndex
              const isCurrent = i === statutIndex
              return (
                <div key={step.statut} className="flex items-center">
                  <div className="flex flex-col items-center min-w-[80px]">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        done
                          ? "bg-primary-brand border-primary-brand"
                          : "bg-white border-border-brand"
                      } ${isCurrent ? "ring-2 ring-primary-brand/20" : ""}`}
                    >
                      {done && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <p
                      className={`mt-2 font-body text-[10px] text-center ${
                        done ? "text-primary-brand" : "text-text-muted-brand"
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                  {i < TIMELINE_STEPS.length - 1 && (
                    <div
                      className={`h-0.5 w-8 ${
                        i < statutIndex ? "bg-primary-brand" : "bg-border-brand"
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Section 4 — Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <a
          href={`/api/commandes/${commande.id}/facture`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary-brand text-white font-body text-[11px] uppercase tracking-[0.15em] hover:bg-primary-dark transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Télécharger la facture PDF
        </a>
        <Link
          href="/contact"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-border-brand text-text-mid font-body text-[11px] uppercase tracking-[0.15em] hover:border-gold transition-colors"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Contacter le support
        </Link>
      </div>
    </div>
  )
}
