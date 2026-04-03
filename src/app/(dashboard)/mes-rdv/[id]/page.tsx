import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import QRCode from "qrcode"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { genererLienGoogle, genererLienOutlook } from "@/lib/calendrier"
import { formatPrix, formatDate } from "@/lib/utils"
import { ArrowLeft, Calendar, Clock, Download, ExternalLink, Sparkles } from "lucide-react"

const STATUT_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  CONFIRME: { bg: "bg-primary-light", text: "text-primary-brand", label: "Confirmé" },
  EN_ATTENTE: { bg: "bg-gold-light", text: "text-gold-dark", label: "En attente" },
  ANNULE: { bg: "bg-[#FEE2E2]", text: "text-red-800", label: "Annulé" },
  TERMINE: { bg: "bg-[#F1EFE8]", text: "text-[#5F5E5A]", label: "Terminé" },
}

export default async function PageBilletRDV({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect(`/connexion?callbackUrl=/mes-rdv`)

  const { id } = await params

  const rdv = await prisma.rendezVous.findUnique({
    where: { id },
    include: { soin: { select: { nom: true, duree: true, prix: true } } },
  })

  if (!rdv) notFound()
  if (rdv.userId !== session.user.id) notFound()

  // Génération QR code en data URL (côté serveur)
  // Payload = URL du billet (scannable par n'importe quel lecteur QR)
  const baseUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? ""
  const qrPayload = `${baseUrl}/mes-rdv/${rdv.id}`
  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    width: 220,
    margin: 2,
    color: { dark: "#1a1a1a", light: "#FAFAF7" },
  })

  // Liens calendrier
  const rdvCalendrier = {
    id: rdv.id,
    soin: rdv.soin.nom,
    date: rdv.dateHeure,
    duree: rdv.soin.duree,
  }
  const [googleLink, outlookLink] = await Promise.all([
    genererLienGoogle(rdvCalendrier),
    genererLienOutlook(rdvCalendrier),
  ])

  const badge = STATUT_BADGE[rdv.statut]
  const heure = rdv.dateHeure.toLocaleTimeString("fr", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Abidjan",
  })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Navigation */}
      <Link
        href="/mes-rdv"
        className="inline-flex items-center gap-2 font-body text-[12px] text-text-muted-brand hover:text-text-main transition-colors"
      >
        <ArrowLeft size={14} />
        Retour à mes rendez-vous
      </Link>

      {/* Billet */}
      <div className="border border-border-brand bg-white">
        {/* En-tête */}
        <div className="border-b border-border-brand bg-bg-page px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sparkles size={18} className="text-gold shrink-0" />
            <div>
              <h1 className="font-display text-[22px] font-light text-text-main">
                {rdv.soin.nom}
              </h1>
              <p className="font-body text-[12px] text-text-muted-brand">
                Le Surnaturel de Dieu, Abidjan
              </p>
            </div>
          </div>
          {badge && (
            <span
              className={`shrink-0 px-2.5 py-1 font-body text-xs uppercase tracking-wider ${badge.bg} ${badge.text}`}
            >
              {badge.label}
            </span>
          )}
        </div>

        {/* Corps */}
        <div className="p-6 sm:p-8 grid sm:grid-cols-2 gap-8 items-start">
          {/* Récapitulatif */}
          <div className="space-y-4">
            <div>
              <p className="font-body text-xs uppercase tracking-[0.12em] text-text-muted-brand mb-1">
                Date
              </p>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-gold shrink-0" />
                <p className="font-body text-[14px] text-text-main">
                  {formatDate(rdv.dateHeure)}
                </p>
              </div>
            </div>

            <div>
              <p className="font-body text-xs uppercase tracking-[0.12em] text-text-muted-brand mb-1">
                Heure
              </p>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-gold shrink-0" />
                <p className="font-body text-[14px] text-text-main">{heure}</p>
              </div>
            </div>

            <div>
              <p className="font-body text-xs uppercase tracking-[0.12em] text-text-muted-brand mb-1">
                Durée
              </p>
              <p className="font-body text-[14px] text-text-main">{rdv.soin.duree} min</p>
            </div>

            <div>
              <p className="font-body text-xs uppercase tracking-[0.12em] text-text-muted-brand mb-1">
                Montant
              </p>
              <p className="font-display text-[20px] text-gold">{formatPrix(rdv.soin.prix)}</p>
            </div>

            {rdv.notes && (
              <div>
                <p className="font-body text-xs uppercase tracking-[0.12em] text-text-muted-brand mb-1">
                  Notes
                </p>
                <p className="font-body text-[13px] text-text-mid leading-relaxed">{rdv.notes}</p>
              </div>
            )}

            <div className="pt-2">
              <p className="font-body text-xs uppercase tracking-[0.12em] text-text-muted-brand mb-1">
                Référence
              </p>
              <p className="font-body text-xs text-text-muted-brand font-mono">
                {rdv.id.slice(0, 12).toUpperCase()}
              </p>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center gap-3">
            <div className="border border-border-brand p-3 bg-[#FAFAF7]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt="QR code de votre rendez-vous"
                width={220}
                height={220}
                className="block"
              />
            </div>
            <p className="font-body text-xs text-center text-text-muted-brand max-w-[180px] leading-relaxed">
              Présentez ce code à l&apos;accueil lors de votre arrivée
            </p>
          </div>
        </div>
      </div>

      {/* Actions calendrier */}
      <div className="border border-border-brand bg-white p-5">
        <p className="font-body text-xs uppercase tracking-[0.12em] text-text-muted-brand mb-4">
          Ajouter à votre calendrier
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={`/api/rdv/${rdv.id}/ics`}
            download={`rdv-${rdv.id.slice(0, 8)}.ics`}
            className="inline-flex items-center gap-2 border border-border-brand px-4 py-2.5 font-body text-xs uppercase tracking-[0.12em] text-text-main hover:border-gold hover:text-gold transition-colors"
          >
            <Download size={13} />
            Télécharger .ics
          </a>

          <a
            href={googleLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-border-brand px-4 py-2.5 font-body text-xs uppercase tracking-[0.12em] text-text-main hover:border-gold hover:text-gold transition-colors"
          >
            <ExternalLink size={13} />
            Google Agenda
          </a>

          <a
            href={outlookLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-border-brand px-4 py-2.5 font-body text-xs uppercase tracking-[0.12em] text-text-main hover:border-gold hover:text-gold transition-colors"
          >
            <ExternalLink size={13} />
            Outlook
          </a>
        </div>
      </div>
    </div>
  )
}
