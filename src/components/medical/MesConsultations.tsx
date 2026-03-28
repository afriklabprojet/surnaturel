"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  Stethoscope,
  Loader2,
  CalendarCheck,
  Timer,
  CheckCircle,
  XCircle,
  ArrowRight,
} from "lucide-react"

interface Soin {
  nom: string
  categorie: string
  duree: number
  prix: number
}

interface RDV {
  id: string
  dateHeure: string
  statut: "EN_ATTENTE" | "CONFIRME" | "ANNULE" | "TERMINE"
  notes: string | null
  soin: Soin
}

const STATUT_CONFIG = {
  EN_ATTENTE: {
    label: "En attente",
    className: "bg-gold-light text-gold",
    icon: Timer,
  },
  CONFIRME: {
    label: "Confirmé",
    className: "bg-primary-light text-primary-brand",
    icon: CheckCircle,
  },
  ANNULE: {
    label: "Annulé",
    className: "bg-red-50 text-red-800",
    icon: XCircle,
  },
  TERMINE: {
    label: "Terminé",
    className: "bg-neutral-100 text-text-muted-brand",
    icon: CheckCircle,
  },
} as const

function formatDate(date: Date): string {
  return date.toLocaleDateString("fr", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default function MesConsultations() {
  const [rdvs, setRdvs] = useState<RDV[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRdvs = useCallback(async () => {
    try {
      const res = await fetch("/api/rdv")
      if (res.ok) {
        const data: { rdvs: RDV[] } = await res.json()
        setRdvs(data.rdvs)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRdvs()
  }, [fetchRdvs])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={22} className="animate-spin text-gold" />
      </div>
    )
  }

  return (
    <div className="border border-border-brand border-t-2 border-t-gold bg-white p-6 md:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-display text-[20px] font-light text-text-main">
            Mes consultations
          </h3>
          <p className="mt-1 font-body text-[12px] font-light text-text-muted-brand">
            {rdvs.length} consultation{rdvs.length !== 1 ? "s" : ""}
          </p>
        </div>

        <Link
          href="/prise-rdv"
          className="flex items-center gap-2 bg-primary-brand px-5 py-2.5 font-body text-[12px] uppercase tracking-widest text-white transition-colors hover:bg-primary-dark"
        >
          <Stethoscope size={14} />
          Nouveau RDV
        </Link>
      </div>

      {rdvs.length === 0 ? (
        <div className="py-12 text-center">
          <CalendarCheck size={28} className="mx-auto text-border-brand" />
          <p className="mt-4 font-body text-[13px] font-light text-text-muted-brand">
            Aucune consultation pour le moment.
          </p>
          <Link
            href="/prise-rdv"
            className="mt-5 inline-flex items-center gap-2 bg-primary-brand px-6 py-2.5 font-body text-[12px] uppercase tracking-widest text-white transition-colors hover:bg-primary-dark"
          >
            Prendre un RDV
            <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {rdvs.map((rdv) => {
            const cfg = STATUT_CONFIG[rdv.statut]
            const Icon = cfg.icon
            const date = new Date(rdv.dateHeure)

            return (
              <div
                key={rdv.id}
                className="flex items-start gap-4 border border-border-brand bg-white p-5 transition-colors hover:bg-bg-page"
              >
                {/* Date bloc */}
                <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center bg-primary-light">
                  <span className="font-display text-[16px] font-light text-primary-brand">
                    {date.toLocaleDateString("fr", { day: "2-digit" })}
                  </span>
                  <span className="font-body text-[9px] uppercase tracking-widest text-primary-brand">
                    {date.toLocaleDateString("fr", { month: "short" })}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-display text-[16px] font-light text-text-main">
                      {rdv.soin.nom}
                    </h4>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 font-body text-[10px] font-medium uppercase tracking-[0.05em] ${cfg.className}`}
                    >
                      <Icon size={10} />
                      {cfg.label}
                    </span>
                  </div>
                  <p className="mt-1 font-body text-[12px] font-light text-text-muted-brand">
                    {formatDate(date)}
                    {" à "}
                    {date.toLocaleTimeString("fr", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" — "}
                    {rdv.soin.duree} min
                  </p>
                  {rdv.notes && (
                    <p className="mt-2 font-body text-[12px] font-light italic text-text-mid">
                      Note : {rdv.notes}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
