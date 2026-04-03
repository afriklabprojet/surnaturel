import { typedLogger as logger } from "@/lib/logger"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Liste des formules d'abonnement (admin)
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const formules = await prisma.formuleAbonnement.findMany({
      orderBy: { ordre: "asc" },
      include: {
        _count: {
          select: { abonnements: true },
        },
      },
    })

    // Stats globales
    const stats = await prisma.abonnementMensuel.groupBy({
      by: ["statut"],
      _count: true,
    })

    const revenuMensuel = await prisma.paiementAbonnement.aggregate({
      where: {
        statut: "PAYE",
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: { montant: true },
    })

    return NextResponse.json({
      formules: formules.map((f) => ({
        ...f,
        nbAbonnes: f._count.abonnements,
      })),
      stats: {
        parStatut: stats.reduce(
          (acc, s) => ({ ...acc, [s.statut]: s._count }),
          {}
        ),
        revenuMensuel: revenuMensuel._sum.montant || 0,
      },
    })
  } catch (error) {
    logger.error("Erreur formules admin:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST - Créer une nouvelle formule
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const data = await request.json()
    const {
      nom,
      slug,
      description,
      prixMensuel,
      nbSoinsParMois,
      soinsInclus = [],
      avantages = [],
      populaire = false,
      ordre = 0,
    } = data

    if (!nom || !slug || !description || !prixMensuel || !nbSoinsParMois) {
      return NextResponse.json(
        { error: "Champs requis manquants" },
        { status: 400 }
      )
    }

    // Vérifier unicité du slug
    const existing = await prisma.formuleAbonnement.findUnique({
      where: { slug },
    })
    if (existing) {
      return NextResponse.json(
        { error: "Ce slug existe déjà" },
        { status: 400 }
      )
    }

    const formule = await prisma.formuleAbonnement.create({
      data: {
        nom,
        slug,
        description,
        prixMensuel: parseFloat(prixMensuel),
        nbSoinsParMois: parseInt(nbSoinsParMois),
        soinsInclus,
        avantages,
        populaire,
        ordre,
      },
    })

    return NextResponse.json({ formule })
  } catch (error) {
    logger.error("Erreur création formule:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// PUT - Modifier une formule
export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const data = await request.json()
    const { id, ...updateData } = data

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 })
    }

    // Convertir les types si nécessaire
    if (updateData.prixMensuel) {
      updateData.prixMensuel = parseFloat(updateData.prixMensuel)
    }
    if (updateData.nbSoinsParMois) {
      updateData.nbSoinsParMois = parseInt(updateData.nbSoinsParMois)
    }

    const formule = await prisma.formuleAbonnement.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ formule })
  } catch (error) {
    logger.error("Erreur modification formule:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// DELETE - Supprimer/Désactiver une formule
export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 })
    }

    // Vérifier s'il y a des abonnements actifs
    const abonnementsActifs = await prisma.abonnementMensuel.count({
      where: {
        formuleId: id,
        statut: "ACTIF",
      },
    })

    if (abonnementsActifs > 0) {
      // Désactiver plutôt que supprimer
      await prisma.formuleAbonnement.update({
        where: { id },
        data: { actif: false },
      })
      return NextResponse.json({
        success: true,
        message: "Formule désactivée (abonnements actifs existants)",
      })
    }

    // Supprimer si pas d'abonnements actifs
    await prisma.formuleAbonnement.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Erreur suppression formule:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
