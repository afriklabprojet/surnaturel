"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { X, RefreshCcw, CreditCard, MessageCircle, Phone, Mail } from "lucide-react"
import { BtnArrow, BtnTextLine } from "@/components/ui/buttons"
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/animations"

export default function PageErreur() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin border-2 border-gold border-t-transparent" /></div>}>
      <ErreurContent />
    </Suspense>
  )
}

function ErreurContent() {
  const searchParams = useSearchParams()
  const reference = searchParams.get("reference")
  const commande = searchParams.get("commande")

  const causesPossibles = [
    "Solde insuffisant",
    "Transaction annulée",
    "Délai d'attente dépassé",
    "Problème de connexion réseau",
  ]

  return (
    <div className="min-h-screen bg-bg-page">
      <section className="px-6 py-16 lg:px-10 lg:py-24">
        <motion.div className="mx-auto max-w-xl text-center" variants={staggerContainer} initial="initial" animate="animate">
          {/* Icône erreur animée */}
          <motion.div
            className="mx-auto flex h-24 w-24 items-center justify-center bg-red-50"
            initial={{ x: 0 }}
            animate={{ x: [-5, 5, -5, 5, 0] }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <X size={48} className="text-danger" strokeWidth={2} />
          </motion.div>

          {/* Titre */}
          <motion.h1 variants={fadeInUp} className="mt-8 font-display text-[36px] font-light text-text-main">
            Paiement non abouti
          </motion.h1>
          <motion.div variants={fadeInUp} className="mx-auto mt-4 h-px w-16 bg-gold" />
          <motion.p variants={fadeInUp} className="mt-4 font-body text-[14px] text-text-muted-brand">
            Votre paiement n&apos;a pas pu être traité.
          </motion.p>

          {/* Causes possibles */}
          <motion.div variants={fadeInUp} className="mt-10 border border-border-brand bg-white p-6 text-left">
            <h2 className="font-body text-[11px] uppercase tracking-[0.15em] text-gold">
              Causes possibles
            </h2>
            <ul className="mt-4 space-y-3">
              {causesPossibles.map((cause, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="flex h-5 w-5 items-center justify-center bg-red-50 text-[10px] text-danger">
                    ·
                  </span>
                  <span className="font-body text-[13px] text-text-mid">{cause}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Actions */}
          <motion.div variants={fadeInUp} className="mt-10 flex flex-col gap-4">
            <BtnArrow href="/checkout" className="justify-center bg-primary-brand text-white border-primary-brand hover:bg-primary-dark hover:border-primary-dark hover:text-white">
              <RefreshCcw size={14} className="mr-2" />
              Réessayer le paiement
            </BtnArrow>
            <BtnArrow href="/checkout?methode=changer" className="justify-center">
              <CreditCard size={14} className="mr-2" />
              Choisir autre méthode
            </BtnArrow>
            <BtnTextLine href="/contact" className="justify-center">
              Contacter le support
            </BtnTextLine>
          </motion.div>

          {/* Aide */}
          <motion.div variants={fadeInUp} className="mt-10 border border-border-brand bg-primary-light/30 p-6">
            <h3 className="font-display text-[18px] font-light text-primary-brand">
              Besoin d&apos;aide ?
            </h3>
            <div className="mt-4 space-y-3">
              <a
                href="https://wa.me/2250707000000"
                className="flex items-center justify-center gap-2 font-body text-[13px] text-primary-brand transition-colors hover:text-primary-dark"
              >
                <Phone size={16} />
                +225 07 00 00 00 00 (WhatsApp)
              </a>
              <a
                href="mailto:support@lesurnatureldedieu.com"
                className="flex items-center justify-center gap-2 font-body text-[13px] text-primary-brand transition-colors hover:text-primary-dark"
              >
                <Mail size={16} />
                support@lesurnatureldedieu.com
              </a>
            </div>
          </motion.div>
        </motion.div>
      </section>
    </div>
  )
}
