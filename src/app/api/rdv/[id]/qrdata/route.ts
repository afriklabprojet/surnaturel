import { typedLogger as logger } from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id } = await params

    // Récupérer le RDV
    const rdv = await prisma.rendezVous.findUnique({
      where: { id },
      include: {
        soin: {
          select: {
            nom: true,
            duree: true,
          },
        },
        user: {
          select: {
            prenom: true,
            nom: true,
          },
        },
      },
    })

    if (!rdv) {
      return NextResponse.json({ error: "RDV non trouvé" }, { status: 404 })
    }

    // Vérifier que le RDV appartient à l'utilisateur
    if (rdv.userId !== session.user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    // Données pour le QR code
    const qrData = {
      rdvId: rdv.id,
      soin: rdv.soin?.nom || "Rendez-vous",
      date: rdv.dateHeure.toISOString(),
      client: `${rdv.user?.prenom || ""} ${rdv.user?.nom || ""}`.trim(),
      centre: "Le Surnaturel de Dieu",
    }

    return NextResponse.json({
      qrData,
      rdv: {
        id: rdv.id,
        soin: rdv.soin?.nom,
        date: rdv.dateHeure,
        duree: rdv.soin?.duree || 60,
        client: qrData.client,
      },
    })
  } catch (error) {
    logger.error("Erreur API QR data:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des données" },
      { status: 500 }
    )
  }
}
