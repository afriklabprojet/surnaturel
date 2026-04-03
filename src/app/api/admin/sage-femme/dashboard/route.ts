import { typedLogger as logger } from "@/lib/logger"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SAGE_FEMME")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // RDV du jour
    const aujourdhui = new Date()
    aujourdhui.setHours(0, 0, 0, 0)
    const demain = new Date(aujourdhui)
    demain.setDate(demain.getDate() + 1)

    const rdvDuJour = await prisma.rendezVous.findMany({
      where: {
        dateHeure: {
          gte: aujourdhui,
          lt: demain,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            telephone: true,
            email: true,
            image: true,
          },
        },
        soin: {
          select: {
            id: true,
            nom: true,
            duree: true,
            prix: true,
          },
        },
      },
      orderBy: { dateHeure: "asc" },
    })

    // Stats
    const rdvConfirmes = rdvDuJour.filter((r) => r.statut === "CONFIRME").length
    const rdvEnAttente = rdvDuJour.filter((r) => r.statut === "EN_ATTENTE").length
    const rdvAnnules = rdvDuJour.filter((r) => r.statut === "ANNULE").length

    const soinsAujourdhui = rdvDuJour.filter(
      (r) => r.statut !== "ANNULE"
    ).length

    const revenuPotentiel = rdvDuJour
      .filter((r) => r.statut !== "ANNULE")
      .reduce((acc, rdv) => acc + (rdv.soin?.prix || 0), 0)

    const dureeTotal = rdvDuJour
      .filter((r) => r.statut !== "ANNULE")
      .reduce((acc, rdv) => acc + (rdv.soin?.duree || 0), 0)

    // Patients actifs (ayant eu au moins 1 RDV dans les 3 derniers mois)
    const troisMoisAvant = new Date()
    troisMoisAvant.setMonth(troisMoisAvant.getMonth() - 3)

    const patientsActifs = await prisma.user.count({
      where: {
        role: "CLIENT",
        rendezVous: {
          some: {
            dateHeure: { gte: troisMoisAvant },
          },
        },
      },
    })

    return NextResponse.json({
      rdvDuJour: rdvDuJour.map((rdv) => ({
        id: rdv.id,
        client: rdv.user,
        soin: rdv.soin,
        dateHeure: rdv.dateHeure,
        duree: rdv.soin?.duree,
        statut: rdv.statut,
        notes: rdv.notes,
        forfait: null,
      })),
      rdvConfirmes,
      rdvEnAttente,
      rdvAnnules,
      patientsActifs,
      stats: {
        soinsAujourdhui,
        revenuPotentiel,
        dureeTotal,
      },
    })
  } catch (error) {
    logger.error("Erreur dashboard sage-femme:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}
