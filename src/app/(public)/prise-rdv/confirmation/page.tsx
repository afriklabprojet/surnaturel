"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Calendar, Clock, MapPin, Check, Download, QrCode } from "lucide-react"
import { formatPrix, formatDate } from "@/lib/utils"
import { BtnArrow, BtnTextLine } from "@/components/ui/buttons"
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/animations"
import { SITE_URL } from "@/lib/site"
import QRCode from "react-qr-code"

const CONFETTI_ITEMS = [...Array(50)].map((_, i) => ({
  left: `${Math.random() * 100}%`,
  color: i % 2 === 0 ? "var(--color-primary-brand)" : "var(--color-gold)",
  rotateDir: Math.random() > 0.5 ? 1 : -1,
  delay: Math.random() * 0.5,
}))

function ConfirmationContent() {
  const searchParams = useSearchParams()
  const rdvId = searchParams.get("rdv")
  const [showQR, setShowQR] = useState(false)
  const [showConfetti, setShowConfetti] = useState(true)
  const [rdvData, setRdvData] = useState<{
    id: string
    soin: string
    date: Date
    duree: number
    prix: number
    adresse: string
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    async function loadRdv() {
      if (!rdvId) { setLoading(false); return }
      try {
        const [rdvRes, adresseRes] = await Promise.all([
          fetch(`/api/rdv/${rdvId}`),
          fetch("/api/config/adresse_institut"),
        ])
        if (rdvRes.ok) {
          const data = await rdvRes.json()
          const adresseData = adresseRes.ok ? await adresseRes.json() : null
          setRdvData({
            id: data.rdv.id,
            soin: data.rdv.soin,
            date: new Date(data.rdv.date),
            duree: data.rdv.duree,
            prix: data.rdv.prix,
            adresse: adresseData?.valeur || "Abidjan",
          })
        }
      } catch { /* fallback */ }
      setLoading(false)
    }
    loadRdv()
  }, [rdvId])

  return (
    <div className="relative min-h-screen bg-bg-page">
      {/* Loading */}
      {loading && (
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin border-2 border-gold border-t-transparent" />
        </div>
      )}

      {!loading && !rdvData && (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
          <Calendar size={48} className="text-text-muted-brand" />
          <p className="font-body text-[14px] text-text-muted-brand">Rendez-vous introuvable ou non autorisé.</p>
          <BtnArrow href="/prise-rdv">Prendre un rendez-vous</BtnArrow>
        </div>
      )}

      {/* Confettis animation */}
      {!loading && rdvData && showConfetti && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {CONFETTI_ITEMS.map((c, i) => (
            <motion.div
              key={i}
              className="absolute h-3 w-3"
              style={{ left: c.left, backgroundColor: c.color }}
              initial={{ y: -20, opacity: 1, rotate: 0 }}
              animate={{ y: "100vh", opacity: 0, rotate: 360 * c.rotateDir }}
              transition={{ duration: 3, delay: c.delay, ease: "easeOut" }}
            />
          ))}
        </div>
      )}

      {!loading && rdvData && (
      <section className="px-6 py-16 lg:px-10 lg:py-24">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {/* Icône succès animée */}
          <motion.div
            variants={fadeInUp}
            className="mx-auto flex h-24 w-24 items-center justify-center bg-primary-brand"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Calendar size={48} className="text-white" />
            </motion.div>
          </motion.div>

          {/* Titre */}
          <motion.h1
            variants={fadeInUp}
            className="mt-8 font-display text-[40px] font-light text-primary-brand"
          >
            Rendez-vous confirmé !
          </motion.h1>

          {/* Trait or */}
          <motion.div
            variants={fadeInUp}
            className="mx-auto mt-4 h-px w-16 bg-gold"
          />

          {/* Sous-titre */}
          <motion.p
            variants={fadeInUp}
            className="mt-4 font-body text-[14px] text-text-muted-brand"
          >
            Nous avons hâte de vous accueillir
          </motion.p>

          {/* Carte récapitulatif */}
          <motion.div
            variants={fadeInUp}
            className="mt-10 border border-border-brand border-t-[3px] border-t-gold bg-white p-8"
          >
            {/* Soin */}
            <div className="flex items-center justify-center gap-3">
              <Calendar size={20} className="text-gold" />
              <h2 className="font-display text-[22px] font-light text-text-main">
                {rdvData.soin}
              </h2>
            </div>

            {/* Date et heure */}
            <div className="mt-6 flex flex-col items-center gap-4 border-t border-b border-border-brand py-6 sm:flex-row sm:justify-center sm:gap-10">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-gold" />
                <span className="font-body text-[14px] text-text-mid">
                  {formatDate(rdvData.date)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-gold" />
                <span className="font-display text-[18px] font-light text-gold">
                  {rdvData.date.toLocaleTimeString("fr", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>

            {/* Durée et prix */}
            <div className="mt-4 flex items-center justify-center gap-6">
              <span className="font-body text-[13px] text-text-muted-brand">
                Durée : {rdvData.duree} min
              </span>
              <span className="font-display text-[20px] font-light text-primary-brand">
                {formatPrix(rdvData.prix)}
              </span>
            </div>

            {/* Adresse */}
            <div className="mt-6 flex items-center justify-center gap-2">
              <MapPin size={16} className="text-gold" />
              <span className="font-body text-[13px] text-text-mid">
                {rdvData.adresse}
              </span>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div variants={fadeInUp} className="mt-8 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <BtnArrow
                href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(rdvData.soin)}&dates=${rdvData.date.toISOString().replace(/[-:]/g, "").split(".")[0]}Z/${new Date(rdvData.date.getTime() + rdvData.duree * 60000).toISOString().replace(/[-:]/g, "").split(".")[0]}Z&location=${encodeURIComponent(rdvData.adresse)}`}
                className="justify-center"
              >
                Ajouter à Google Calendar
              </BtnArrow>
              <BtnArrow
                href={rdvId ? `/api/rdv/${rdvId}/ics` : "#"}
                className="justify-center"
              >
                Ajouter à Apple Calendar
              </BtnArrow>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <BtnArrow href="/mes-rdv" className="justify-center border-primary-brand bg-primary-brand text-white hover:bg-primary-dark hover:border-primary-dark hover:text-white">
                Voir mes rendez-vous
              </BtnArrow>
              <button
                onClick={() => setShowQR(true)}
                className="inline-flex items-center justify-center gap-2 border border-gold px-5 py-2.5 font-body text-xs uppercase tracking-[0.18em] text-gold transition-all duration-200 hover:bg-gold hover:text-white group"
              >
                <QrCode size={16} />
                QR code de check-in
                <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </button>
            </div>
          </motion.div>

          {/* Email */}
          <motion.p
            variants={fadeInUp}
            className="mt-10 flex items-center justify-center gap-2 font-body text-[12px] text-text-muted-brand"
          >
            <Check size={14} className="text-primary-brand" />
            Un email de confirmation vous a été envoyé
          </motion.p>
        </motion.div>
      </section>
      )}

      {/* Modal QR Code */}
      {rdvData && showQR && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowQR(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-center font-display text-[20px] font-light text-text-main">
              Votre QR code de check-in
            </h3>
            <div className="mt-6">
              <QRCode
                value={`${SITE_URL}/admin/rdv/scan/${rdvData.id}`}
                size={220}
                bgColor="var(--color-bg-card)"
                fgColor="var(--color-text-main)"
              />
            </div>
            <p className="mt-4 text-center font-body text-[12px] text-text-muted-brand">
              Présentez ce code à votre arrivée
            </p>
            <div className="mt-6 flex justify-center">
              <BtnTextLine onClick={() => setShowQR(false)}>
                Fermer
              </BtnTextLine>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default function PageConfirmationRDV() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin border-2 border-gold border-t-transparent" />
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  )
}
