"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { ShoppingBag, Loader2, Download, Eye } from "lucide-react"
import { formatPrix, formatDate } from "@/lib/utils"
import { staggerContainer, staggerItem } from "@/lib/animations"

interface LigneCmd {
  produit: { nom: string; imageUrl: string | null }
  quantite: number
  prixUnitaire: number
}

interface Commande {
  id: string
  total: number
  statut: string
  createdAt: string
  lignes: LigneCmd[]
}

const STATUT_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  EN_ATTENTE: { label: "En attente", bg: "var(--color-gold-light)", text: "var(--color-gold-dark)" },
  PAYEE: { label: "Payée", bg: "var(--color-primary-light)", text: "var(--color-primary-dark)" },
  EN_PREPARATION: { label: "En préparation", bg: "var(--color-gold-light)", text: "var(--color-gold-dark)" },
  EXPEDIEE: { label: "Expédiée", bg: "var(--color-primary-light)", text: "var(--color-primary-dark)" },
  LIVREE: { label: "Livrée", bg: "#F1EFE8", text: "#5F5E5A" },
  ANNULEE: { label: "Annulée", bg: "#FEF2F2", text: "#7F1D1D" },
}

export default function PageCommandes() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/connexion?callbackUrl=/commandes")
  }, [status, router])

  useEffect(() => {
    if (status !== "authenticated") return
    fetch("/api/commandes")
      .then((r) => (r.ok ? r.json() : { commandes: [] }))
      .then((data) => setCommandes(data?.commandes ?? []))
      .finally(() => setLoading(false))
  }, [status])

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 size={24} className="animate-spin text-gold" />
      </div>
    )
  }

  if (commandes.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <ShoppingBag size={48} className="mb-4 text-border-brand" />
        <p className="font-body text-[14px] text-text-muted-brand">
          Aucune commande pour le moment.
        </p>
        <Link
          href="/boutique"
          className="mt-4 bg-primary-brand px-5 py-2.5 font-body text-[11px] uppercase tracking-[0.15em] text-white hover:bg-primary-dark transition-colors"
        >
          Découvrir la boutique
        </Link>
      </div>
    )
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-4"
    >
      {commandes.map((cmd) => {
        const badge = STATUT_BADGE[cmd.statut]
        const nbProduits = cmd.lignes.reduce((acc, l) => acc + l.quantite, 0)
        return (
          <motion.div
            key={cmd.id}
            variants={staggerItem}
            className="bg-white border border-border-brand hover:border-gold transition-colors"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border-brand px-5 py-3">
              <div className="flex items-center gap-3">
                <span className="font-body text-[12px] text-text-muted-brand">
                  N° {cmd.id.slice(-8).toUpperCase()}
                </span>
                <span className="font-body text-[11px] text-text-muted-brand">
                  {formatDate(new Date(cmd.createdAt))}
                </span>
              </div>
              <span
                className="px-2 py-0.5 font-body text-[10px]"
                style={{ backgroundColor: badge?.bg, color: badge?.text }}
              >
                {badge?.label}
              </span>
            </div>
            {/* Body */}
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {cmd.lignes.slice(0, 3).map((l, i) => (
                    <div
                      key={i}
                      className="h-10 w-10 bg-primary-light border border-white flex items-center justify-center"
                    >
                      <span className="font-body text-[9px] text-primary-brand">
                        {l.produit.nom.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
                <span className="font-body text-[12px] text-text-mid">
                  {nbProduits} article{nbProduits > 1 ? "s" : ""}
                </span>
              </div>
              <span className="font-display text-[18px] text-gold">
                {formatPrix(cmd.total)}
              </span>
            </div>
            {/* Actions */}
            <div className="flex items-center gap-3 border-t border-border-brand px-5 py-3">
              <Link
                href={`/commandes/${cmd.id}`}
                className="flex items-center gap-1 font-body text-[11px] text-primary-brand hover:text-primary-dark"
              >
                <Eye size={13} />
                Voir le détail
              </Link>
              <a
                href={`/api/commandes/${cmd.id}/facture`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 font-body text-[11px] text-text-muted-brand hover:text-text-mid"
              >
                <Download size={13} />
                Facture
              </a>
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
