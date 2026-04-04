import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifierStatutPaiement } from "@/lib/jeko"
import { envoyerSmsAcomptePaye } from "@/lib/sms"
import { formatPrix } from "@/lib/utils"
import { SITE_URL } from "@/lib/site"

// GET /api/rdv/acompte/confirmer?reference=...&rdv=...
// Appelé après retour de la page de paiement Jeko
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const rdvId = searchParams.get("rdv")

  if (!rdvId) {
    return NextResponse.redirect(
      new URL("/mes-rdv?erreur=paiement", SITE_URL)
    )
  }

  const rdv = await prisma.rendezVous.findUnique({
    where: { id: rdvId },
    include: { soin: true, user: true },
  })

  if (!rdv || !rdv.paiementId) {
    return NextResponse.redirect(
      new URL("/mes-rdv?erreur=paiement", SITE_URL)
    )
  }

  // Vérifier le statut du paiement via Jeko
  try {
    const statut = await verifierStatutPaiement(rdv.paiementId)

    if (statut === "success") {
      await prisma.rendezVous.update({
        where: { id: rdvId },
        data: {
          acomptePaye: true,
          statut: "CONFIRME",
        },
      })

      // Envoyer SMS de confirmation si téléphone renseigné
      if (rdv.telephoneSms) {
        try {
          await envoyerSmsAcomptePaye({
            telephone: rdv.telephoneSms,
            prenom: rdv.user.prenom,
            montant: formatPrix(rdv.montantAcompte ?? 2000),
            soin: rdv.soin.nom,
          })
        } catch {
          // SMS non bloquant
        }
      }

      return NextResponse.redirect(
        new URL(`/mes-rdv?nouveau=ok&acompte=ok`, SITE_URL)
      )
    }

    // Paiement en attente ou échoué
    return NextResponse.redirect(
      new URL(`/mes-rdv?erreur=paiement&rdv=${rdvId}`, SITE_URL)
    )
  } catch {
    return NextResponse.redirect(
      new URL("/mes-rdv?erreur=paiement", SITE_URL)
    )
  }
}
