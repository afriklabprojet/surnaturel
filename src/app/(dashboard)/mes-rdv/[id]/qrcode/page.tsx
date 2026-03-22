"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Download, ArrowLeft, Loader2, MapPin, Phone } from "lucide-react"
import QRCode from "react-qr-code"
import { formatDate } from "@/lib/utils"
import { BtnArrow, BtnTextLine } from "@/components/ui/buttons"

interface RDVData {
  id: string
  soin: string
  date: Date
  duree: number
  client: string
}

export default function PageQRCodeRDV() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const ticketRef = useRef<HTMLDivElement>(null)
  const [rdv, setRdv] = useState<RDVData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/connexion")
    }
  }, [status, router])

  useEffect(() => {
    if (status !== "authenticated" || !params.id) return

    // En production, fetch depuis l'API
    // Pour la démo, on utilise des données mockées
    setRdv({
      id: params.id,
      soin: "Hammam traditionnel",
      date: new Date("2024-03-25T14:30:00"),
      duree: 60,
      client: session?.user ? `${session.user.prenom || ''} ${session.user.nom || ''}`.trim() || 'Client' : 'Client',
    })
    setLoading(false)
  }, [status, params.id, session])

  async function handleDownload() {
    if (!ticketRef.current) return

    try {
      const html2canvas = (await import("html2canvas")).default
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        backgroundColor: "#FFFFFF",
      })
      const link = document.createElement("a")
      link.download = `rdv-${params.id?.slice(0, 8)}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    )
  }

  if (!rdv) {
    return (
      <div className="px-6 py-16 text-center lg:px-10">
        <p className="font-body text-[14px] text-text-muted-brand">
          Rendez-vous introuvable
        </p>
        <Link href="/mes-rdv" className="mt-4 inline-block">
          <BtnTextLine>Retour à mes rendez-vous</BtnTextLine>
        </Link>
      </div>
    )
  }

  const qrData = JSON.stringify({
    rdvId: rdv.id,
    soin: rdv.soin,
    date: rdv.date.toISOString(),
    client: rdv.client,
  })

  return (
    <div className="min-h-screen bg-bg-page px-6 py-8 lg:px-10 lg:py-12">
      <div className="mx-auto max-w-md">
        {/* Retour */}
        <Link
          href="/mes-rdv"
          className="mb-8 inline-flex items-center gap-2 font-body text-[12px] text-text-muted-brand transition-colors hover:text-primary-brand"
        >
          <ArrowLeft size={14} />
          Retour à mes rendez-vous
        </Link>

        {/* Billet */}
        <div
          ref={ticketRef}
          className="overflow-hidden border border-border-brand bg-white"
        >
          {/* En-tête du billet */}
          <div className="bg-primary-brand px-6 py-6 text-center">
            <p className="font-display text-[20px] font-light text-white">
              Le Surnaturel de Dieu
            </p>
            <p className="mt-1 font-body text-[10px] uppercase tracking-[0.15em] text-white/70">
              Votre billet de rendez-vous
            </p>
          </div>

          {/* Corps du billet */}
          <div className="px-6 py-8 text-center">
            {/* Nom du soin */}
            <h1 className="font-display text-[28px] font-light text-text-main">
              {rdv.soin}
            </h1>

            {/* Date */}
            <p className="mt-4 font-display text-[20px] font-light text-gold">
              {formatDate(rdv.date)}
            </p>

            {/* Heure */}
            <p className="mt-2 font-body text-[16px] text-text-mid">
              {rdv.date.toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>

            {/* Séparateur pointillé */}
            <div className="my-8 border-t-2 border-dashed border-gold/30" />

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="bg-white p-4">
                <QRCode value={qrData} size={220} level="M" />
              </div>
            </div>

            {/* Instructions */}
            <p className="mt-6 font-body text-[11px] text-text-muted-brand">
              Présentez ce QR code à votre arrivée
            </p>
          </div>

          {/* Pied du billet */}
          <div className="bg-gold-light/50 px-6 py-6 text-center">
            <div className="flex items-center justify-center gap-2">
              <MapPin size={14} className="text-gold" />
              <span className="font-body text-[11px] text-text-mid">
                Cocody, Riviera Palmeraie, Abidjan
              </span>
            </div>
            <div className="mt-2 flex items-center justify-center gap-2">
              <Phone size={14} className="text-gold" />
              <span className="font-body text-[11px] text-text-mid">
                +225 07 XX XX XX XX
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 space-y-4">
          <BtnArrow
            onClick={handleDownload}
            className="w-full justify-center bg-primary-brand text-white border-primary-brand hover:bg-primary-dark hover:border-primary-dark hover:text-white"
          >
            <Download size={16} className="mr-2" />
            Télécharger le billet
          </BtnArrow>
          <div className="text-center">
            <BtnTextLine href="/mes-rdv">Retour à mes RDV</BtnTextLine>
          </div>
        </div>
      </div>
    </div>
  )
}
