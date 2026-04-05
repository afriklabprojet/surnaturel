"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { fadeInUp, staggerContainer, staggerItem, progressBar } from "@/lib/animations"
import { SkeletonFidelite } from "@/components/ui/skeletons"
import { Star, Lock, Unlock, Gift, TrendingUp, TrendingDown, Loader2, ShoppingBag, Percent, Sparkles, Package } from "lucide-react"
import { BtnArrow } from "@/components/ui/buttons"
import { toast } from "sonner"

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

interface Recompense {
  id: string
  nom: string
  description: string
  pointsRequis: number
  type: "REDUCTION" | "SOIN_GRATUIT" | "PRODUIT" | "EXPERIENCE" | "AUTRE"
  valeur: number | null
  imageUrl: string | null
  stock: number | null
  disponible: boolean
  accessible: boolean
  pointsManquants: number
}

interface EchangeEnCours {
  id: string
  codeUnique: string
  statut: string
  dateExpiration: string | null
  recompense: Recompense
}

const TYPE_ICONS: Record<string, typeof Gift> = {
  REDUCTION: Percent,
  SOIN_GRATUIT: Sparkles,
  PRODUIT: Package,
  EXPERIENCE: Star,
  AUTRE: Gift,
}

export default function FidelitePage() {
  const [data, setData] = useState<FideliteData | null>(null)
  const [recompenses, setRecompenses] = useState<Recompense[]>([])
  const [echangesEnCours, setEchangesEnCours] = useState<EchangeEnCours[]>([])
  const [loading, setLoading] = useState(true)
  const [utilisant, setUtilisant] = useState<number | null>(null)
  const [echangeant, setEchangeant] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [fideliteRes, recompensesRes] = await Promise.all([
        fetch("/api/fidelite"),
        fetch("/api/fidelite/recompenses"),
      ])
      
      if (fideliteRes.ok) {
        const json = await fideliteRes.json()
        setData(json)
      }
      
      if (recompensesRes.ok) {
        const json = await recompensesRes.json()
        setRecompenses(json.recompenses || [])
        setEchangesEnCours(json.echangesEnCours || [])
      }
    } catch {
      toast.error("Erreur lors du chargement des données")
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
        toast.success("Récompense utilisée !")
        fetchData()
      } else {
        const json = await res.json()
        toast.error(json.error || "Erreur lors de l'utilisation")
      }
    } catch {
      toast.error("Erreur réseau")
    } finally {
      setUtilisant(null)
    }
  }

  async function echangerRecompense(recompense: Recompense) {
    if (!data || data.points < recompense.pointsRequis || !recompense.disponible) return
    setEchangeant(recompense.id)

    try {
      const res = await fetch("/api/fidelite/recompenses/echanger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recompenseId: recompense.id }),
      })

      const json = await res.json()

      if (res.ok) {
        toast.success(json.message || "Récompense obtenue !")
        fetchData()
      } else {
        toast.error(json.error || "Erreur lors de l'échange")
      }
    } catch {
      toast.error("Erreur réseau")
    } finally {
      setEchangeant(null)
    }
  }

  if (loading) {
    return <SkeletonFidelite />
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
        <p className="font-body text-xs font-medium uppercase tracking-widest text-text-muted-brand">
          Vos points fidélité
        </p>
        <p className="mt-2 font-display text-[56px] font-light leading-none text-gold">
          {data.points.toLocaleString("fr")}
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
            <div className="flex items-center justify-between font-body text-xs text-text-muted-brand">
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
                  <span className="font-body text-xs font-medium text-gold">
                    {palier.points.toLocaleString("fr")} pts
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

      {/* Catalogue de récompenses */}
      {recompenses.length > 0 && (
        <motion.section variants={staggerItem}>
          <h2 className="mb-4 font-display text-[22px] font-light text-text-main">
            <ShoppingBag className="mr-2 inline-block h-5 w-5 text-gold" />
            Catalogue de récompenses
          </h2>
          
          {/* Échanges en cours */}
          {echangesEnCours.length > 0 && (
            <div className="mb-6 border border-gold/30 bg-gold/5 p-4">
              <p className="mb-3 font-body text-[12px] font-medium uppercase tracking-widest text-gold">
                Vos récompenses actives
              </p>
              <div className="space-y-2">
                {echangesEnCours.map((e) => (
                  <div key={e.id} className="flex items-center justify-between bg-white p-3">
                    <div>
                      <p className="font-body text-[14px] font-medium text-text-main">
                        {e.recompense.nom}
                      </p>
                      <p className="font-body text-[12px] text-text-muted-brand">
                        Code: <span className="font-mono font-medium text-primary-brand">{e.codeUnique}</span>
                      </p>
                    </div>
                    {e.dateExpiration && (
                      <p className="font-body text-xs text-text-muted-brand">
                        Expire le {new Date(e.dateExpiration).toLocaleDateString("fr")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recompenses.map((r) => {
              const TypeIcon = TYPE_ICONS[r.type] || Gift
              const estEchange = echangeant === r.id

              return (
                <motion.div
                  key={r.id}
                  variants={staggerItem}
                  className={`border transition-all ${
                    r.accessible && r.disponible
                      ? "border-primary-brand bg-white hover:shadow-md"
                      : "border-border-brand bg-bg-page opacity-70"
                  }`}
                >
                  {/* Image ou icône */}
                  <div className="relative aspect-[2/1] overflow-hidden bg-primary-light/20">
                    {r.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.imageUrl}
                        alt={r.nom}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <TypeIcon className="h-12 w-12 text-primary-brand/30" />
                      </div>
                    )}
                    {/* Badge en rupture */}
                    {!r.disponible && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <span className="font-body text-[12px] font-medium text-white">
                          Rupture de stock
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-display text-[16px] font-medium text-text-main line-clamp-1">
                      {r.nom}
                    </h3>
                    <p className="mt-1 line-clamp-2 font-body text-[12px] text-text-muted-brand">
                      {r.description}
                    </p>

                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <p className="font-display text-[24px] font-medium text-gold">
                          {r.pointsRequis.toLocaleString("fr")}
                        </p>
                        <p className="font-body text-xs uppercase tracking-wider text-text-muted-brand">
                          points
                        </p>
                      </div>

                      {r.accessible && r.disponible ? (
                        <button
                          onClick={() => echangerRecompense(r)}
                          disabled={estEchange}
                          className="bg-primary-brand px-4 py-2 font-body text-xs uppercase tracking-wider text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
                        >
                          {estEchange ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            "Échanger"
                          )}
                        </button>
                      ) : (
                        <p className="font-body text-xs text-text-muted-brand">
                          {!r.disponible
                            ? "Indisponible"
                            : `${r.pointsManquants.toLocaleString("fr")} pts manquants`}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.section>
      )}

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
              <p className="font-body text-xs text-text-muted-brand">
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
              <p className="font-body text-xs text-text-muted-brand">
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
              <p className="font-body text-xs text-text-muted-brand">
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
              <p className="font-body text-xs text-text-muted-brand">
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
          <div className="overflow-x-auto border border-border-brand bg-white">
            <table className="w-full min-w-[360px]">
              <thead className="border-b border-border-brand bg-bg-page">
                <tr>
                  <th className="px-4 py-3 text-left font-body text-xs font-medium uppercase tracking-widest text-text-muted-brand">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left font-body text-xs font-medium uppercase tracking-widest text-text-muted-brand">
                    Raison
                  </th>
                  <th className="px-4 py-3 text-right font-body text-xs font-medium uppercase tracking-widest text-text-muted-brand">
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
                      {new Date(item.createdAt).toLocaleDateString("fr", {
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
