"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Check, Mail, Package, Truck, ShoppingBag } from "lucide-react"
import { formatPrix } from "@/lib/utils"
import { useCart } from "@/lib/cart-context"
import { BtnArrow, BtnTextLine } from "@/components/ui/buttons"
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/animations"

export default function PageSucces() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin border-2 border-gold border-t-transparent" /></div>}>
      <SuccesContent />
    </Suspense>
  )
}

function SuccesContent() {
  const searchParams = useSearchParams()
  const reference = searchParams.get("reference")
  const commandeId = searchParams.get("commande")
  const [showConfetti, setShowConfetti] = useState(true)
  const [loading, setLoading] = useState(true)
  const { clearCart } = useCart()
  const [commandeData, setCommandeData] = useState<{
    id: string
    total: number
    lignes: { quantite: number; prixUnitaire: number; produit: { nom: string } }[]
    user: { prenom?: string | null }
  } | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!commandeId) {
      setLoading(false)
      return
    }
    fetch(`/api/commandes/${commandeId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.commande) {
          setCommandeData(data.commande)
          clearCart()
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [commandeId])

  const articles = commandeData?.lignes ?? []
  const total = commandeData?.total ?? 0
  const prenom = commandeData?.user?.prenom ?? ""
  const displayId = commandeData?.id ?? reference ?? commandeId ?? ""

  return (
    <div className="relative min-h-screen bg-bg-page">
      {/* Confettis animation */}
      {showConfetti && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-3 w-3"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: i % 2 === 0 ? "var(--color-primary-brand)" : "var(--color-gold)",
              }}
              initial={{ y: -20, opacity: 1, rotate: 0 }}
              animate={{ y: "100vh", opacity: 0, rotate: 360 * (Math.random() > 0.5 ? 1 : -1) }}
              transition={{ duration: 3, delay: Math.random() * 0.5, ease: "easeOut" }}
            />
          ))}
        </div>
      )}

      <section className="px-6 py-16 lg:px-10 lg:py-24">
        <motion.div className="mx-auto max-w-xl text-center" variants={staggerContainer} initial="initial" animate="animate">
          {/* Icône succès animée */}
          <motion.div
            className="mx-auto flex h-24 w-24 items-center justify-center bg-primary-brand"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
          >
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 }}>
              <Check size={48} className="text-white" strokeWidth={3} />
            </motion.div>
          </motion.div>

          {/* Titre */}
          <motion.h1 variants={fadeInUp} className="mt-8 font-display text-[40px] font-light text-primary-brand">
            Paiement réussi !
          </motion.h1>
          <motion.div variants={fadeInUp} className="mx-auto mt-4 h-px w-16 bg-gold" />
          <motion.p variants={fadeInUp} className="mt-4 font-body text-[16px] text-text-mid">
            Merci pour votre confiance{prenom ? `, ${prenom}` : ""}
          </motion.p>
          <motion.p variants={fadeInUp} className="mt-2 font-body text-[13px] text-text-muted-brand">
            Commande n° {displayId}
          </motion.p>

          {/* Récapitulatif commande */}
          <motion.div variants={fadeInUp} className="mt-10 border border-gold bg-white p-6 text-left">
            <h2 className="font-body text-[11px] uppercase tracking-[0.15em] text-gold">
              Récapitulatif
            </h2>
            <div className="mt-4 space-y-3">
              {loading ? (
                <div className="h-6 w-48 animate-pulse bg-bg-page" />
              ) : articles.length > 0 ? (
                articles.map((ligne, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="font-body text-[13px] text-text-mid">
                      {ligne.produit.nom} x{ligne.quantite}
                    </span>
                    <span className="font-body text-[13px] text-text-main">
                      {formatPrix(ligne.prixUnitaire * ligne.quantite)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="font-body text-[13px] text-text-muted-brand">Détails indisponibles</p>
              )}
            </div>
            <div className="mt-4 border-t border-border-brand pt-4">
              <div className="flex items-center justify-between">
                <span className="font-display text-[16px] font-light text-gold">Total TTC</span>
                <span className="font-display text-[24px] font-light text-primary-brand">
                  {formatPrix(total)}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Prochaines étapes */}
          <motion.div variants={fadeInUp} className="mt-10">
            <h3 className="font-body text-[11px] uppercase tracking-[0.15em] text-gold">
              Prochaines étapes
            </h3>
            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              {[
                { icon: Mail, label: "Email de confirmation envoyé" },
                { icon: Package, label: "Préparation de votre commande" },
                { icon: Truck, label: "Livraison sous 3-5 jours" },
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center border border-border-brand bg-white">
                    <step.icon size={20} className="text-primary-brand" />
                  </div>
                  <p className="mt-3 font-body text-[12px] text-text-mid">{step.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div variants={fadeInUp} className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <BtnArrow href={commandeId ? `/commandes/${commandeId}` : "/boutique"} className="justify-center bg-primary-brand text-white border-primary-brand hover:bg-primary-dark hover:border-primary-dark hover:text-white">
              Suivre ma commande
            </BtnArrow>
            <BtnTextLine href="/boutique" className="justify-center">
              <ShoppingBag size={14} className="mr-2" />
              Continuer mes achats
            </BtnTextLine>
          </motion.div>
        </motion.div>
      </section>
    </div>
  )
}
