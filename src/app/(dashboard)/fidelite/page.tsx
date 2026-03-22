"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { fadeInUp, staggerContainer, staggerItem, progressBar } from "@/lib/animations"
import { Star, Lock, Unlock, Gift, TrendingUp, TrendingDown, Loader2 } from "lucide-react"
import { BtnArrow } from "@/components/ui/buttons"

interface Palier {
  points: number
  nom: string
  recompense: string
}

interface HistoriqueItem {
  id: string
  points: number
  raison: string
  type: string
  createdAt: string
}

interface FideliteData {
  points: number
  palierActuel: Palier | null
  progression: {
    pourcentage: number
    restant: number
    prochain: Palier | null
  }
  paliers: Palier[]
  historique: HistoriqueItem[]
}

export default function FidelitePage() {
  const [data, setData] = useState<FideliteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [utilisant, setUtilisant] = useState<number | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/fidelite")
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function utiliserRecompense(palier: Palier) {
    if (!data || data.points < palier.points) return
    setUtilisant(palier.points)

    try {
      const res = await fetch("/api/fidelite/utiliser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          palierPoints: palier.points,
          recompense: palier.recompense,
        }),
      })

      if (res.ok) {
        fetchData()
      }
    } catch {
      // silently fail
    } finally {
      setUtilisant(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 size={24} className="animate-spin text-gold" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="font-body text-text-muted-brand">
          Erreur lors du chargement des données
        </p>
      </div>
    )
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-8"
    >
      {/* En-tête avec total points */}
      <motion.section
        variants={staggerItem}
        className="border border-border-brand border-t-2 border-t-gold bg-white p-8 text-center"
      >
        <p className="font-body text-[11px] font-medium uppercase tracking-widest text-text-muted-brand">
          Vos points fidélité
        </p>
        <p className="mt-2 font-display text-[56px] font-light leading-none text-gold">
          {data.points.toLocaleString("fr-FR")}
        </p>
        <p className="mt-1 font-body text-[12px] uppercase tracking-widest text-text-muted-brand">
          points
        </p>

        {/* Badge palier actuel */}
        {data.palierActuel && (
          <div className="mt-4 inline-flex items-center gap-2 bg-primary-light px-4 py-2">
            <Star size={14} className="text-gold" />
            <span className="font-body text-[12px] font-medium text-primary-brand">
              Statut {data.palierActuel.nom}
            </span>
          </div>
        )}

        {/* Barre de progression */}
        {data.progression.prochain && (
          <div className="mx-auto mt-6 max-w-md">
            <div className="flex items-center justify-between font-body text-[11px] text-text-muted-brand">
              <span>{data.palierActuel?.nom || "Débutant"}</span>
              <span>{data.progression.prochain.nom}</span>
            </div>
            <div className="relative mt-2 h-2 w-full overflow-hidden bg-border-brand">
              <motion.div
                className="absolute left-0 top-0 h-full bg-primary-brand"
                custom={data.progression.pourcentage}
                variants={progressBar}
                initial="initial"
                animate="animate"
              />
            </div>
            <p className="mt-2 font-body text-[12px] text-text-muted-brand">
              <span className="font-medium text-gold">
                {data.progression.restant}
              </span>{" "}
              points pour débloquer{" "}
              <span className="text-text-main">
                {data.progression.prochain.recompense}
              </span>
            </p>
          </div>
        )}
      </motion.section>

      {/* Paliers / Récompenses */}
      <motion.section variants={staggerItem}>
        <h2 className="mb-4 font-display text-[22px] font-light text-text-main">
          Récompenses
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.paliers.map((palier) => {
            const debloque = data.points >= palier.points
            const estUtilise = utilisant === palier.points

            return (
              <motion.div
                key={palier.points}
                variants={staggerItem}
                className={`border p-5 transition-colors ${
                  debloque
                    ? "border-primary-brand bg-white"
                    : "border-border-brand bg-bg-page"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center ${
                      debloque ? "bg-primary-light" : "bg-border-brand"
                    }`}
                  >
                    {debloque ? (
                      <Unlock size={18} className="text-primary-brand" />
                    ) : (
                      <Lock size={18} className="text-text-muted-brand" />
                    )}
                  </div>
                  <span className="font-body text-[11px] font-medium text-gold">
                    {palier.points.toLocaleString("fr-FR")} pts
                  </span>
                </div>

                <h3 className="mt-4 font-display text-[18px] font-normal text-text-main">
                  {palier.nom}
                </h3>
                <p className="mt-1 font-body text-[12px] font-light text-text-muted-brand">
                  {palier.recompense}
                </p>

                {debloque && (
                  <button
                    onClick={() => utiliserRecompense(palier)}
                    disabled={estUtilise}
                    className="mt-4 w-full border border-primary-brand py-2 font-body text-[12px] font-medium text-primary-brand transition-colors hover:bg-primary-brand hover:text-white disabled:opacity-50"
                  >
                    {estUtilise ? (
                      <Loader2 size={14} className="mx-auto animate-spin" />
                    ) : (
                      "Utiliser"
                    )}
                  </button>
                )}
              </motion.div>
            )
          })}
        </div>
      </motion.section>

      {/* Comment ça marche */}
      <motion.section
        variants={staggerItem}
        className="border border-border-brand bg-bg-page p-6"
      >
        <h2 className="mb-4 font-display text-[18px] font-light text-text-main">
          Comment gagner des points ?
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex gap-3">
            <Gift size={20} className="shrink-0 text-gold" />
            <div>
              <p className="font-body text-[13px] font-medium text-text-main">
                +50 points
              </p>
              <p className="font-body text-[11px] text-text-muted-brand">
                par rendez-vous terminé
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Gift size={20} className="shrink-0 text-gold" />
            <div>
              <p className="font-body text-[13px] font-medium text-text-main">
                +1 point / 100 FCFA
              </p>
              <p className="font-body text-[11px] text-text-muted-brand">
                sur vos commandes
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Gift size={20} className="shrink-0 text-gold" />
            <div>
              <p className="font-body text-[13px] font-medium text-text-main">
                +30 points
              </p>
              <p className="font-body text-[11px] text-text-muted-brand">
                par avis laissé
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Gift size={20} className="shrink-0 text-gold" />
            <div>
              <p className="font-body text-[13px] font-medium text-text-main">
                +200 points
              </p>
              <p className="font-body text-[11px] text-text-muted-brand">
                par parrainage actif
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Historique */}
      <motion.section variants={staggerItem}>
        <h2 className="mb-4 font-display text-[22px] font-light text-text-main">
          Historique
        </h2>

        {data.historique.length === 0 ? (
          <div className="border border-border-brand bg-white py-12 text-center">
            <Gift size={32} className="mx-auto text-border-brand" />
            <p className="mt-3 font-body text-[13px] text-text-muted-brand">
              Aucune activité pour l&apos;instant
            </p>
            <div className="mt-4">
              <BtnArrow href="/prise-rdv">Prendre un RDV</BtnArrow>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden border border-border-brand bg-white">
            <table className="w-full">
              <thead className="border-b border-border-brand bg-bg-page">
                <tr>
                  <th className="px-4 py-3 text-left font-body text-[11px] font-medium uppercase tracking-widest text-text-muted-brand">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left font-body text-[11px] font-medium uppercase tracking-widest text-text-muted-brand">
                    Raison
                  </th>
                  <th className="px-4 py-3 text-right font-body text-[11px] font-medium uppercase tracking-widest text-text-muted-brand">
                    Points
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.historique.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border-brand last:border-b-0"
                  >
                    <td className="px-4 py-3 font-body text-[12px] text-text-muted-brand">
                      {new Date(item.createdAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 font-body text-[13px] text-text-main">
                      {item.raison}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex items-center gap-1 font-body text-[13px] font-medium ${
                          item.points > 0 ? "text-primary-brand" : "text-danger"
                        }`}
                      >
                        {item.points > 0 ? (
                          <TrendingUp size={14} />
                        ) : (
                          <TrendingDown size={14} />
                        )}
                        {item.points > 0 ? "+" : ""}
                        {item.points}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.section>
    </motion.div>
  )
}
