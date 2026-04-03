"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { staggerContainer, staggerItem, fadeInUp } from "@/lib/animations"
import {
  Users,
  Copy,
  Check,
  Gift,
  Clock,
  CheckCircle,
  Send,
  Loader2,
  Share2,
} from "lucide-react"
import EmptyState from "@/components/ui/empty-states"
import { useFetch } from "@/lib/hooks/use-fetch"
import { SkeletonParrainage } from "@/components/ui/skeletons"

interface Parrainage {
  id: string
  statut: "EN_ATTENTE" | "ACTIF" | "TERMINE"
  createdAt: string
  filleul: {
    id: string
    name: string | null
    email: string | null
    createdAt: string
  }
}

interface ParrainageData {
  codeParrainage: string
  lienParrainage: string
  parrainages: Parrainage[]
  stats: {
    total: number
    enAttente: number
    actifs: number
    termines: number
    pointsGagnes: number
  }
}

export default function ParrainagePage() {
  const { data, loading, mutate: fetchData } = useFetch<ParrainageData>("/api/parrainage")
  const [copied, setCopied] = useState(false)
  const [email, setEmail] = useState("")
  const [envoyant, setEnvoyant] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  )

  async function copierCode() {
    if (!data) return

    try {
      await navigator.clipboard.writeText(data.lienParrainage)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const input = document.createElement("input")
      input.value = data.lienParrainage
      document.body.appendChild(input)
      input.select()
      document.execCommand("copy")
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function envoyerInvitation(e: React.FormEvent) {
    e.preventDefault()
    if (!email || envoyant) return

    setEnvoyant(true)
    setMessage(null)

    try {
      const res = await fetch("/api/parrainage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const json = await res.json()

      if (res.ok) {
        setMessage({ type: "success", text: "Invitation envoyée avec succès !" })
        setEmail("")
      } else {
        setMessage({ type: "error", text: json.error || "Erreur lors de l'envoi" })
      }
    } catch {
      setMessage({ type: "error", text: "Erreur lors de l'envoi" })
    } finally {
      setEnvoyant(false)
    }
  }

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "EN_ATTENTE":
        return (
          <span className="inline-flex items-center gap-1 bg-gold/10 px-2 py-1 font-body text-xs text-gold">
            <Clock size={12} />
            En attente
          </span>
        )
      case "ACTIF":
        return (
          <span className="inline-flex items-center gap-1 bg-primary-light px-2 py-1 font-body text-xs text-primary-brand">
            <CheckCircle size={12} />
            Actif
          </span>
        )
      case "TERMINE":
        return (
          <span className="inline-flex items-center gap-1 bg-border-brand px-2 py-1 font-body text-xs text-text-muted-brand">
            <Check size={12} />
            Terminé
          </span>
        )
      default:
        return null
    }
  }

  if (loading) {
    return <SkeletonParrainage />
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
      {/* Header */}
      <motion.div variants={staggerItem}>
        <div className="flex items-center gap-3">
          <Users size={20} className="text-primary-brand" />
          <h1 className="font-display text-[28px] font-light text-text-main">
            Parrainage
          </h1>
        </div>
        <p className="mt-2 font-body text-[13px] text-text-muted-brand">
          Invitez vos proches et gagnez{" "}
          <span className="font-medium text-gold">200 points</span> par parrainage
          actif !
        </p>
      </motion.div>

      {/* Statistiques */}
      <motion.div
        variants={staggerItem}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="border border-border-brand bg-white p-5">
          <p className="font-body text-xs font-medium uppercase tracking-widest text-text-muted-brand">
            Total invités
          </p>
          <p className="mt-2 font-display text-[32px] font-light text-text-main">
            {data.stats.total}
          </p>
        </div>
        <div className="border border-border-brand bg-white p-5">
          <p className="font-body text-xs font-medium uppercase tracking-widest text-text-muted-brand">
            En attente
          </p>
          <p className="mt-2 font-display text-[32px] font-light text-gold">
            {data.stats.enAttente}
          </p>
        </div>
        <div className="border border-border-brand bg-white p-5">
          <p className="font-body text-xs font-medium uppercase tracking-widest text-text-muted-brand">
            Actifs
          </p>
          <p className="mt-2 font-display text-[32px] font-light text-primary-brand">
            {data.stats.actifs}
          </p>
        </div>
        <div className="border border-border-brand bg-white p-5">
          <p className="font-body text-xs font-medium uppercase tracking-widest text-text-muted-brand">
            Points gagnés
          </p>
          <p className="mt-2 font-display text-[32px] font-light text-gold">
            +{data.stats.pointsGagnes}
          </p>
        </div>
      </motion.div>

      {/* Code de parrainage */}
      <motion.section
        variants={staggerItem}
        className="border border-border-brand border-t-2 border-t-gold bg-white p-6"
      >
        <div className="flex items-center gap-2">
          <Share2 size={18} className="text-gold" />
          <h2 className="font-display text-[18px] font-light text-text-main">
            Votre code de parrainage
          </h2>
        </div>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Code */}
          <div className="flex-1 border border-border-brand bg-bg-page p-4">
            <p className="font-body text-xs font-medium uppercase tracking-widest text-text-muted-brand">
              Code
            </p>
            <p className="mt-1 font-display text-[24px] font-medium tracking-wider text-primary-brand">
              {data.codeParrainage}
            </p>
          </div>

          {/* Bouton copier le lien */}
          <button
            onClick={copierCode}
            className="flex items-center justify-center gap-2 border border-primary-brand px-6 py-4 font-body text-[12px] font-medium text-primary-brand transition-colors hover:bg-primary-brand hover:text-white"
          >
            {copied ? (
              <>
                <Check size={16} />
                Copié !
              </>
            ) : (
              <>
                <Copy size={16} />
                Copier le lien
              </>
            )}
          </button>
        </div>

        <p className="mt-4 font-body text-[12px] text-text-muted-brand">
          Partagez ce lien à vos proches pour qu&apos;ils s&apos;inscrivent avec votre
          code de parrainage.
        </p>
      </motion.section>

      {/* Invitation par email */}
      <motion.section
        variants={staggerItem}
        className="border border-border-brand bg-white p-6"
      >
        <div className="flex items-center gap-2">
          <Send size={18} className="text-primary-brand" />
          <h2 className="font-display text-[18px] font-light text-text-main">
            Inviter par email
          </h2>
        </div>

        <form onSubmit={envoyerInvitation} className="mt-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemple.com"
              className="flex-1 border border-border-brand bg-white px-4 py-3 font-body text-[13px] placeholder:text-text-muted-brand focus:border-primary-brand focus:outline-none"
              required
            />
            <button
              type="submit"
              disabled={envoyant || !email}
              className="flex items-center justify-center gap-2 bg-primary-brand px-6 py-3 font-body text-[12px] font-medium text-white transition-colors hover:bg-primary-brand/90 disabled:opacity-50"
            >
              {envoyant ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <Send size={16} />
                  Envoyer
                </>
              )}
            </button>
          </div>
        </form>

        {message && (
          <motion.p
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            className={`mt-3 font-body text-[12px] ${
              message.type === "success" ? "text-primary-brand" : "text-danger"
            }`}
          >
            {message.text}
          </motion.p>
        )}
      </motion.section>

      {/* Comment ça marche */}
      <motion.section
        variants={staggerItem}
        className="border border-border-brand bg-bg-page p-6"
      >
        <div className="flex items-center gap-2">
          <Gift size={18} className="text-gold" />
          <h2 className="font-display text-[18px] font-light text-text-main">
            Comment ça marche ?
          </h2>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-primary-brand font-body text-[12px] font-medium text-white">
              1
            </div>
            <div>
              <p className="font-body text-[13px] font-medium text-text-main">
                Partagez votre lien
              </p>
              <p className="mt-1 font-body text-xs text-text-muted-brand">
                Envoyez votre lien de parrainage à vos proches
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-primary-brand font-body text-[12px] font-medium text-white">
              2
            </div>
            <div>
              <p className="font-body text-[13px] font-medium text-text-main">
                Ils s&apos;inscrivent
              </p>
              <p className="mt-1 font-body text-xs text-text-muted-brand">
                Vos filleuls créent leur compte avec votre code
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-gold font-body text-[12px] font-medium text-white">
              3
            </div>
            <div>
              <p className="font-body text-[13px] font-medium text-text-main">
                Gagnez 200 points
              </p>
              <p className="mt-1 font-body text-xs text-text-muted-brand">
                Après leur premier rendez-vous, vous gagnez 200 points !
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Liste des parrainages */}
      <motion.section variants={staggerItem}>
        <h2 className="mb-4 font-display text-[22px] font-light text-text-main">
          Mes filleuls
        </h2>

        {data.parrainages.length === 0 ? (
          <EmptyState type="parrainage" />
        ) : (
          <div className="overflow-hidden border border-border-brand bg-white">
            <table className="w-full">
              <thead className="border-b border-border-brand bg-bg-page">
                <tr>
                  <th className="px-4 py-3 text-left font-body text-xs font-medium uppercase tracking-widest text-text-muted-brand">
                    Filleul
                  </th>
                  <th className="hidden px-4 py-3 text-left font-body text-xs font-medium uppercase tracking-widest text-text-muted-brand sm:table-cell">
                    Date d&apos;inscription
                  </th>
                  <th className="px-4 py-3 text-right font-body text-xs font-medium uppercase tracking-widest text-text-muted-brand">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.parrainages.map((parrainage) => (
                  <tr
                    key={parrainage.id}
                    className="border-b border-border-brand last:border-b-0"
                  >
                    <td className="px-4 py-3">
                      <p className="font-body text-[13px] font-medium text-text-main">
                        {parrainage.filleul.name || "Nouveau membre"}
                      </p>
                      <p className="font-body text-xs text-text-muted-brand">
                        {parrainage.filleul.email}
                      </p>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <span className="font-body text-[12px] text-text-muted-brand">
                        {new Date(parrainage.filleul.createdAt).toLocaleDateString(
                          "fr",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {getStatutBadge(parrainage.statut)}
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
