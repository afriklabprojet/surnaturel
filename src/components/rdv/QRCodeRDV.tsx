"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { fadeIn, fadeInUp } from "@/lib/animations"
import { X, QrCode, Download, Calendar, Clock, Sparkles } from "lucide-react"
import QRCode from "react-qr-code"

interface QRCodeRDVProps {
  rdv: {
    id: string
    date: string | Date
    soin: {
      nom: string
      duree?: number
    }
  }
  isOpen: boolean
  onClose: () => void
}

export default function QRCodeRDV({ rdv, isOpen, onClose }: QRCodeRDVProps) {
  const [downloading, setDownloading] = useState(false)

  const qrValue = `${process.env.NEXT_PUBLIC_APP_URL || "https://surnatureldedieu.com"}/admin/rdv/scan/${rdv.id}`

  const dateObj = new Date(rdv.date)
  const dateFormatted = dateObj.toLocaleDateString("fr", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  const heureFormatted = dateObj.toLocaleTimeString("fr", {
    hour: "2-digit",
    minute: "2-digit",
  })

  async function downloadQR() {
    setDownloading(true)

    try {
      const svg = document.getElementById("qr-code-svg")
      if (!svg) return

      const svgData = new XMLSerializer().serializeToString(svg)
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      const img = new Image()
      img.onload = () => {
        canvas.width = img.width * 2
        canvas.height = img.height * 2
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)

        const pngFile = canvas.toDataURL("image/png")
        const downloadLink = document.createElement("a")
        downloadLink.download = `qr-rdv-${rdv.id.slice(0, 8)}.png`
        downloadLink.href = pngFile
        downloadLink.click()
      }
      img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)))
    } finally {
      setDownloading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={fadeIn}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 z-50 bg-black/50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2"
          >
            <div className="mx-4 border border-border-brand bg-white p-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <QrCode size={20} className="text-primary-brand" />
                  <h3 className="font-display text-[18px] font-normal text-text-main">
                    QR Code du RDV
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 text-text-muted-brand transition-colors hover:text-text-main"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Informations RDV */}
              <div className="my-6 border border-border-brand bg-bg-page p-4">
                <div className="flex items-center gap-2 text-gold">
                  <Sparkles size={16} />
                  <span className="font-body text-[13px] font-medium">
                    {rdv.soin.nom}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-4 text-text-muted-brand">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    <span className="font-body text-[12px] capitalize">
                      {dateFormatted}
                    </span>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-4 text-text-muted-brand">
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} />
                    <span className="font-body text-[12px]">{heureFormatted}</span>
                  </div>
                  {rdv.soin.duree && (
                    <span className="font-body text-[12px]">
                      ({rdv.soin.duree} min)
                    </span>
                  )}
                </div>
              </div>

              {/* QR Code */}
              <div className="flex justify-center bg-white p-4">
                <QRCode
                  id="qr-code-svg"
                  value={qrValue}
                  size={200}
                  level="H"
                  fgColor="var(--color-primary-brand)"
                />
              </div>

              <p className="mt-4 text-center font-body text-xs text-text-muted-brand">
                Présentez ce QR Code à votre arrivée à l&apos;institut
              </p>

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={downloadQR}
                  disabled={downloading}
                  className="flex flex-1 items-center justify-center gap-2 border border-primary-brand py-2.5 font-body text-[12px] font-medium text-primary-brand transition-colors hover:bg-primary-brand hover:text-white disabled:opacity-50"
                >
                  <Download size={14} />
                  {downloading ? "..." : "Télécharger"}
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-primary-brand py-2.5 font-body text-[12px] font-medium text-white transition-colors hover:bg-primary-brand/90"
                >
                  Fermer
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
