import logger from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"
import { envoyerEmailConfirmationRDV } from "@/lib/email"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { formatPrix } from "@/lib/utils"
import { notifierRDVConfirme, notifierRDVAnnule } from "@/lib/notifications"
import { getPusherServeur, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher"
import { Resend } from "resend"
import type { StatutRDV } from "@/generated/prisma/client"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = "Le Surnaturel de Dieu <rdv@surnatureldedieu.com>"

const patchSchema = z.object({
  statut: z.enum(["EN_ATTENTE", "CONFIRME", "ANNULE", "TERMINE"]),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const result = z.safeParse(patchSchema, body)

  if (!result.success) {
    return NextResponse.json(
      { error: z.prettifyError(result.error) },
      { status: 400 }
    )
  }

  // Si annulation, on libère le créneau
  const updateData: { statut: StatutRDV; creneauCle?: null } = {
    statut: result.data.statut as StatutRDV,
  }
  if (result.data.statut === "ANNULE") {
    updateData.creneauCle = null
  }

  // Récupérer les infos avant mise à jour pour notification Pusher
  const rdvAvant = await prisma.rendezVous.findUnique({
    where: { id },
    select: { creneauCle: true, soinId: true, dateHeure: true },
  })

  const rdv = await prisma.rendezVous.update({
    where: { id },
    data: updateData,
    include: {
      user: { select: { id: true, email: true, nom: true, prenom: true } },
      soin: { select: { nom: true, prix: true } },
    },
  })

  const nom = `${rdv.user.prenom} ${rdv.user.nom}`
  const dateFormatee = format(rdv.dateHeure, "EEEE d MMMM yyyy", { locale: fr })
  const heureFormatee = format(rdv.dateHeure, "HH:mm")

  // Email + notification selon le statut
  if (result.data.statut === "CONFIRME") {
    envoyerEmailConfirmationRDV({
      destinataire: rdv.user.email,
      nom,
      soin: rdv.soin.nom,
      date: dateFormatee,
      heure: heureFormatee,
      prix: formatPrix(rdv.soin.prix),
    }).catch((e) => logger.error(e, "background task failed"))
    notifierRDVConfirme(rdv.user.id, rdv.soin.nom, rdv.dateHeure).catch((e) => logger.error(e, "background task failed"))
  }

  if (result.data.statut === "ANNULE") {
    // Notifier en temps réel que ce créneau est de nouveau disponible
    if (rdvAvant?.creneauCle) {
      try {
        const pusher = getPusherServeur()
        const dateStr = rdvAvant.dateHeure.toISOString().split("T")[0]
        await pusher.trigger(
          PUSHER_CHANNELS.creneaux(rdvAvant.soinId, dateStr),
          PUSHER_EVENTS.CRENEAU_LIBERE,
          {
            soinId: rdvAvant.soinId,
            dateHeure: rdvAvant.dateHeure.toISOString(),
            creneauCle: rdvAvant.creneauCle,
          }
        )
      } catch {
        // Notification temps réel optionnelle
      }
    }
    
    resend.emails.send({
      from: FROM,
      to: rdv.user.email,
      subject: "Votre rendez-vous a été annulé — Le Surnaturel de Dieu",
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#1C1C1C;">
          <div style="background:#DC2626;padding:24px;">
            <h1 style="color:#fff;margin:0;font-size:20px;">Rendez-vous annulé</h1>
          </div>
          <div style="background:#fff;border:1px solid #E8E4DC;border-top:none;padding:24px;">
            <p>Bonjour <strong>${nom}</strong>,</p>
            <p>Votre rendez-vous pour <strong>${rdv.soin.nom}</strong> prévu le <strong>${dateFormatee}</strong> à <strong>${heureFormatee}</strong> a été annulé.</p>
            <p>N'hésitez pas à reprendre rendez-vous sur votre espace client.</p>
            <p style="color:#8A8A8A;font-size:12px;">Le Surnaturel de Dieu — Abidjan</p>
          </div>
        </div>
      `,
    }).catch((e) => logger.error(e, "background task failed"))
    notifierRDVAnnule(rdv.user.id, rdv.soin.nom).catch((e) => logger.error(e, "background task failed"))
  }

  if (result.data.statut === "TERMINE") {
    resend.emails.send({
      from: FROM,
      to: rdv.user.email,
      subject: "Merci pour votre visite — Le Surnaturel de Dieu",
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#1C1C1C;">
          <div style="background:#2D7A1F;padding:24px;">
            <h1 style="color:#fff;margin:0;font-size:20px;">Merci pour votre visite !</h1>
          </div>
          <div style="background:#fff;border:1px solid #E8E4DC;border-top:none;padding:24px;">
            <p>Bonjour <strong>${nom}</strong>,</p>
            <p>Nous espérons que votre soin <strong>${rdv.soin.nom}</strong> vous a apporté satisfaction.</p>
            <p>Votre avis nous est précieux :</p>
            <a href="${process.env.NEXTAUTH_URL}/avis/${rdv.id}" style="display:inline-block;background:#2D7A1F;color:#fff;padding:12px 24px;text-decoration:none;margin-top:12px;font-size:14px;">
              Laisser un avis
            </a>
            <p style="color:#8A8A8A;font-size:12px;margin-top:24px;">Le Surnaturel de Dieu — Abidjan</p>
          </div>
        </div>
      `,
    }).catch((e) => logger.error(e, "background task failed"))
  }

  return NextResponse.json({ id: rdv.id, statut: rdv.statut })
}
