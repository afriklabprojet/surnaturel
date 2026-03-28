import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Liste de tous les abonnements (admin)
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const statut = searchParams.get("statut")
    const formuleId = searchParams.get("formule")

    const where: Record<string, unknown> = {}
    if (statut) where.statut = statut
    if (formuleId) where.formuleId = formuleId

    const abonnements = await prisma.abonnementMensuel.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            telephone: true,
          },
        },
        formule: {
          select: {
            id: true,
            nom: true,
            prixMensuel: true,
          },
        },
        _count: {
          select: {
            utilisations: true,
            paiements: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      abonnements: abonnements.map((a) => ({
        id: a.id,
        user: a.user,
        formule: a.formule,
        statut: a.statut,
        frequence: a.frequence,
        dateDebut: a.dateDebut,
        dateFin: a.dateFin,
        dateProchainPaiement: a.dateProchainPaiement,
        soinsRestantsMois: a.soinsRestantsMois,
        moisEnCours: a.moisEnCours,
        nbUtilisations: a._count.utilisations,
        nbPaiements: a._count.paiements,
        createdAt: a.createdAt,
      })),
    })
  } catch (error) {
    console.error("Erreur abonnements admin:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// PATCH - Modifier un abonnement (admin)
export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id, action, soinsRestantsMois } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 })
    }

    const abonnement = await prisma.abonnementMensuel.findUnique({
      where: { id },
    })

    if (!abonnement) {
      return NextResponse.json(
        { error: "Abonnement non trouvé" },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}

    // Modifier le statut
    if (action === "activer") {
      updateData.statut = "ACTIF"
    } else if (action === "pause") {
      updateData.statut = "EN_PAUSE"
    } else if (action === "annuler") {
      updateData.statut = "ANNULE"
      updateData.dateFin = new Date()
    }

    // Modifier les soins restants
    if (soinsRestantsMois !== undefined) {
      updateData.soinsRestantsMois = parseInt(soinsRestantsMois)
    }

    const updated = await prisma.abonnementMensuel.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, abonnement: updated })
  } catch (error) {
    console.error("Erreur modification abonnement admin:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
