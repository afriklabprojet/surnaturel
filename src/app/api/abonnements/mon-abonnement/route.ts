import { typedLogger as logger } from "@/lib/logger"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Mon abonnement actuel
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 })
    }

    const abonnement = await prisma.abonnementMensuel.findFirst({
      where: {
        userId: session.user.id,
        statut: { in: ["ACTIF", "EN_PAUSE"] },
      },
      include: {
        formule: true,
        utilisations: {
          orderBy: { dateUtilisation: "desc" },
          take: 10,
        },
        paiements: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    })

    if (!abonnement) {
      return NextResponse.json({ abonnement: null })
    }

    return NextResponse.json({
      abonnement: {
        id: abonnement.id,
        formule: {
          id: abonnement.formule.id,
          nom: abonnement.formule.nom,
          description: abonnement.formule.description,
          prixMensuel: abonnement.formule.prixMensuel,
          nbSoinsParMois: abonnement.formule.nbSoinsParMois,
          avantages: abonnement.formule.avantages,
        },
        statut: abonnement.statut,
        frequence: abonnement.frequence,
        dateDebut: abonnement.dateDebut,
        dateProchainPaiement: abonnement.dateProchainPaiement,
        soinsRestantsMois: abonnement.soinsRestantsMois,
        moisEnCours: abonnement.moisEnCours,
        utilisations: abonnement.utilisations.map((u) => ({
          id: u.id,
          soinId: u.soinId,
          date: u.dateUtilisation,
        })),
        paiements: abonnement.paiements.map((p) => ({
          id: p.id,
          montant: p.montant,
          statut: p.statut,
          moisConcerne: p.moisConcerne,
          createdAt: p.createdAt,
        })),
      },
    })
  } catch (error) {
    logger.error("Erreur mon abonnement:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// PATCH - Mettre en pause / Réactiver mon abonnement
export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 })
    }

    const { action } = await request.json() // "pause" | "reactiver"

    const abonnement = await prisma.abonnementMensuel.findFirst({
      where: {
        userId: session.user.id,
        statut: { in: ["ACTIF", "EN_PAUSE"] },
      },
    })

    if (!abonnement) {
      return NextResponse.json(
        { error: "Aucun abonnement trouvé" },
        { status: 404 }
      )
    }

    let newStatut: "ACTIF" | "EN_PAUSE"
    if (action === "pause") {
      if (abonnement.statut !== "ACTIF") {
        return NextResponse.json(
          { error: "L'abonnement n'est pas actif" },
          { status: 400 }
        )
      }
      newStatut = "EN_PAUSE"
    } else if (action === "reactiver") {
      if (abonnement.statut !== "EN_PAUSE") {
        return NextResponse.json(
          { error: "L'abonnement n'est pas en pause" },
          { status: 400 }
        )
      }
      newStatut = "ACTIF"
    } else {
      return NextResponse.json(
        { error: "Action invalide. Utilisez 'pause' ou 'reactiver'" },
        { status: 400 }
      )
    }

    const updated = await prisma.abonnementMensuel.update({
      where: { id: abonnement.id },
      data: { statut: newStatut },
    })

    return NextResponse.json({
      success: true,
      statut: updated.statut,
    })
  } catch (error) {
    logger.error("Erreur modification abonnement:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// DELETE - Annuler mon abonnement
export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 })
    }

    const abonnement = await prisma.abonnementMensuel.findFirst({
      where: {
        userId: session.user.id,
        statut: { in: ["ACTIF", "EN_PAUSE"] },
      },
    })

    if (!abonnement) {
      return NextResponse.json(
        { error: "Aucun abonnement actif" },
        { status: 404 }
      )
    }

    await prisma.abonnementMensuel.update({
      where: { id: abonnement.id },
      data: {
        statut: "ANNULE",
        dateFin: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Erreur annulation abonnement:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
