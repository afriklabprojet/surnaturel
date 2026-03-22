"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  CalendarCheck,
  Clock,
  Sparkles,
  Loader2,
  Plus,
} from "lucide-react"
import { formatPrix, formatDate } from "@/lib/utils"
import AnnulerButton from "./AnnulerButton"
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/animations"

interface RDV {
  id: string
  dateHeure: string
  statut: "EN_ATTENTE" | "CONFIRME" | "ANNULE" | "TERMINE"
  notes: string | null
  soin: { nom: string; duree: number; prix: number; categorie: string }
}

const TABS = [
  { id: "avenir", label: "À venir" },
  { id: "passes", label: "Passés" },
  { id: "annules", label: "Annulés" },
] as const

type TabId = (typeof TABS)[number]["id"]

const STATUT_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  EN_ATTENTE: { label: "En attente", bg: "var(--color-gold-light)", text: "var(--color-gold-dark)" },
  CONFIRME: { label: "Confirmé", bg: "var(--color-primary-light)", text: "var(--color-primary-dark)" },
  ANNULE: { label: "Annulé", bg: "#FEF2F2", text: "#7F1D1D" },
  TERMINE: { label: "Terminé", bg: "#F1EFE8", text: "#5F5E5A" },
}

export default function PageMesRDV() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [rdvs, setRdvs] = useState<RDV[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>("avenir")

  useEffect(() => {
    if (status === "unauthenticated") router.push("/connexion?callbackUrl=/mes-rdv")
  }, [status, router])

  useEffect(() => {
    if (status !== "authenticated") return
    fetch("/api/rdv")
      .then((r) => (r.ok ? r.json() : { rdvs: [] }))
      .then((data) => setRdvs(data?.rdvs ?? []))
      .finally(() => setLoading(false))
  }, [status])

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 size={24} className="animate-spin text-gold" />
      </div>
    )
  }

  const now = new Date()
  const filtered = rdvs.filter((r) => {
    const date = new Date(r.dateHeure)
    if (activeTab === "avenir") return date > now && r.statut !== "ANNULE"
    if (activeTab === "passes") return (date <= now || r.statut === "TERMINE") && r.statut !== "ANNULE"
    return r.statut === "ANNULE"
  })

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-0 border-b border-border-brand">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 font-body text-[12px] uppercase tracking-[0.15em] transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-gold text-text-main"
                : "text-text-muted-brand hover:text-text-mid"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <CalendarCheck size={48} className="mb-4 text-border-brand" />
          <p className="font-body text-[14px] text-text-muted-brand">
            {activeTab === "avenir" ? "Aucun rendez-vous à venir" : activeTab === "passes" ? "Aucun rendez-vous passé" : "Aucun rendez-vous annulé"}
          </p>
          {activeTab === "avenir" && (
            <Link
              href="/prise-rdv"
              className="mt-4 flex items-center gap-2 bg-primary-brand px-5 py-2.5 font-body text-[11px] uppercase tracking-[0.15em] text-white hover:bg-primary-dark transition-colors"
            >
              <Plus size={14} />
              Prendre rendez-vous
            </Link>
          )}
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-3"
        >
          {filtered.map((rdv) => {
            const dateRDV = new Date(rdv.dateHeure)
            const heure = dateRDV.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Abidjan" })
            const peutAnnuler =
              rdv.statut === "EN_ATTENTE" &&
              dateRDV.getTime() > now.getTime() + 24 * 60 * 60 * 1000
            const badge = STATUT_BADGE[rdv.statut]

            return (
              <motion.div
                key={rdv.id}
                variants={staggerItem}
                className="flex items-start gap-4 bg-white border border-border-brand p-5 border-l-2 border-l-gold hover:border-gold transition-colors"
              >
                <Sparkles size={18} className="mt-1 text-gold shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-display text-[18px] text-text-main">{rdv.soin.nom}</h3>
                    <span
                      className="px-2 py-0.5 font-body text-[10px]"
                      style={{ backgroundColor: badge?.bg, color: badge?.text }}
                    >
                      {badge?.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 font-body text-[12px] text-text-muted-brand">
                    <span className="flex items-center gap-1">
                      <CalendarCheck size={13} />
                      {formatDate(dateRDV)}
                    </span>
                    <span className="text-gold font-medium">{heure}</span>
                    <span className="flex items-center gap-1">
                      <Clock size={13} />
                      {rdv.soin.duree} min
                    </span>
                    <span className="font-display text-[14px] text-gold">
                      {formatPrix(rdv.soin.prix)}
                    </span>
                  </div>
                  {rdv.notes && (
                    <p className="mt-2 font-body text-[12px] text-text-mid">{rdv.notes}</p>
                  )}
                </div>
                <div className="shrink-0 flex flex-col gap-2">
                  {peutAnnuler && <AnnulerButton rdvId={rdv.id} />}
                  {rdv.statut === "CONFIRME" && (
                    <>
                      <Link
                        href={`/mes-rdv/${rdv.id}/qrcode`}
                        className="font-body text-[11px] text-gold hover:text-gold-dark underline"
                      >
                        Voir le billet QR
                      </Link>
                      <a
                        href={`/api/rdv/${rdv.id}/ics`}
                        download
                        className="font-body text-[11px] text-primary-brand hover:text-primary-dark underline"
                      >
                        Ajouter au calendrier
                      </a>
                    </>
                  )}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
