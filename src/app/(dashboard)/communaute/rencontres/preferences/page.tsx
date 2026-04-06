"use client"

import { useState, useEffect } from "react"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import FormulairePreferences from "@/components/rencontres/FormulairePreferences"
import { toast } from "sonner"

interface Preferences {
  intention: "AMITIE" | "RELATION_SERIEUSE" | "MARIAGE"
  ageMin: number
  ageMax: number
  distanceKm: number
  actif: boolean
  filtreVerifie: boolean
  filtreIntention: boolean
  filtreInterets: boolean
}

export default function PagePreferences() {
  const [prefs, setPrefs] = useState<Preferences | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/rencontres/preferences")
        if (!res.ok) throw new Error()
        const data = (await res.json()) as Preferences | null
        setPrefs(data)
      } catch {
        toast.error("Impossible de charger les préférences")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div className="max-w-lg lg:max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/communaute/rencontres"
          className="p-1.5 rounded-full text-text-muted-brand hover:bg-bg-page transition-colors"
          aria-label="Retour"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-heading text-xl font-semibold text-text-main">Mes préférences</h1>
          <p className="text-sm text-text-muted-brand">Personnalisez vos critères de rencontre</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-14 rounded-xl bg-bg-page animate-pulse" />
          ))}
        </div>
      ) : (
        <FormulairePreferences initial={prefs} onSaved={setPrefs} />
      )}
    </div>
  )
}
