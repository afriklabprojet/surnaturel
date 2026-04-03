import { typedLogger as logger } from "@/lib/logger"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Liste des formules d'abonnement disponibles
export async function GET() {
  try {
    const formules = await prisma.formuleAbonnement.findMany({
      where: { actif: true },
      orderBy: { ordre: "asc" },
    })

    return NextResponse.json({ formules })
  } catch (error) {
    logger.error("Erreur formules abonnement:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST - Souscrire à un abonnement
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 })
    }

    const { formuleId, frequence = "MENSUEL", moyenPaiement } = await request.json()

    if (!formuleId) {
      return NextResponse.json({ error: "formuleId requis" }, { status: 400 })
    }

    // Vérifier si l'utilisateur a déjà un abonnement actif
    const abonnementExistant = await prisma.abonnementMensuel.findFirst({
      where: {
        userId: session.user.id,
        statut: "ACTIF",
      },
    })

    if (abonnementExistant) {
      return NextResponse.json(
        { error: "Vous avez déjà un abonnement actif" },
        { status: 400 }
      )
    }

    // Récupérer la formule
    const formule = await prisma.formuleAbonnement.findUnique({
      where: { id: formuleId },
    })

    if (!formule || !formule.actif) {
      return NextResponse.json(
        { error: "Formule non disponible" },
        { status: 404 }
      )
    }

    // Calculer la prochaine date de paiement en fonction de la fréquence
    const dateProchainPaiement = new Date()
    switch (frequence) {
      case "TRIMESTRIEL":
        dateProchainPaiement.setMonth(dateProchainPaiement.getMonth() + 3)
        break
      case "SEMESTRIEL":
        dateProchainPaiement.setMonth(dateProchainPaiement.getMonth() + 6)
        break
      case "ANNUEL":
        dateProchainPaiement.setFullYear(dateProchainPaiement.getFullYear() + 1)
        break
      default:
        dateProchainPaiement.setMonth(dateProchainPaiement.getMonth() + 1)
    }

    // Créer l'abonnement
    const abonnement = await prisma.abonnementMensuel.create({
      data: {
        userId: session.user.id,
        formuleId,
        frequence: frequence as "MENSUEL" | "TRIMESTRIEL" | "SEMESTRIEL" | "ANNUEL",
        dateDebut: new Date(),
        dateProchainPaiement,
        soinsRestantsMois: formule.nbSoinsParMois,
        moyenPaiement,
      },
      include: {
        formule: true,
      },
    })

    // Créer le premier paiement (à traiter)
    await prisma.paiementAbonnement.create({
      data: {
        abonnementId: abonnement.id,
        montant: formule.prixMensuel,
        moisConcerne: new Date(),
        statut: "EN_ATTENTE",
      },
    })

    return NextResponse.json({
      success: true,
      abonnement: {
        id: abonnement.id,
        formule: abonnement.formule.nom,
        statut: abonnement.statut,
        soinsRestantsMois: abonnement.soinsRestantsMois,
        dateProchainPaiement: abonnement.dateProchainPaiement,
      },
    })
  } catch (error) {
    logger.error("Erreur souscription abonnement:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
