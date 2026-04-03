import { typedLogger as logger } from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Récupérer le produit avec ses avis
    const produit = await prisma.produit.findUnique({
      where: { id },
    })

    if (!produit) {
      return NextResponse.json({ error: "Produit non trouvé" }, { status: 404 })
    }

    // Produits similaires (même catégorie)
    const similaires = await prisma.produit.findMany({
      where: {
        categorie: produit.categorie,
        id: { not: id },
        actif: true,
      },
      take: 4,
      select: {
        id: true,
        nom: true,
        description: true,
        prix: true,
        imageUrl: true,
        stock: true,
        categorie: true,
      },
    })

    // Compléter avec d'autres produits si pas assez
    const autresProduits =
      similaires.length < 4
        ? await prisma.produit.findMany({
            where: {
              id: { notIn: [id, ...similaires.map((p) => p.id)] },
              actif: true,
            },
            take: 4 - similaires.length,
            select: {
              id: true,
              nom: true,
              description: true,
              prix: true,
              imageUrl: true,
              stock: true,
              categorie: true,
            },
          })
        : []

    return NextResponse.json({
      produit: {
        id: produit.id,
        nom: produit.nom,
        description: produit.description,
        descriptionLongue: produit.descriptionLongue,
        prix: produit.prix,
        prixPromo: produit.prixPromo,
        stock: produit.stock,
        imageUrl: produit.imageUrl,
        categorie: produit.categorie,
        actif: produit.actif,
        createdAt: produit.createdAt,
      },
      similaires: [...similaires, ...autresProduits],
    })
  } catch (error) {
    logger.error("Erreur API produit:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération du produit" },
      { status: 500 }
    )
  }
}
