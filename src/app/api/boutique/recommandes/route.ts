import { typedLogger as logger } from "@/lib/logger"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Get recommended products for user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const related = searchParams.get("related") // related product ID
    
    const session = await auth()
    const userId = session?.user?.id

    // If related product ID is provided, get similar products
    if (related) {
      const relatedProduct = await prisma.produit.findUnique({
        where: { id: related },
        select: { categorie: true },
      })

      if (relatedProduct) {
        const similarProducts = await prisma.produit.findMany({
          where: {
            actif: true,
            stock: { gt: 0 },
            id: { not: related },
            categorie: relatedProduct.categorie,
          },
          select: {
            id: true,
            nom: true,
            prix: true,
            prixPromo: true,
            imageUrl: true,
            categorie: true,
          },
          take: 6,
          orderBy: { createdAt: "desc" },
        })

        return NextResponse.json({ produits: similarProducts })
      }
    }

    // Get most popular products (by order count)
    const popularProducts = await prisma.produit.findMany({
      where: {
        actif: true,
        stock: { gt: 0 },
      },
      select: {
        id: true,
        nom: true,
        prix: true,
        prixPromo: true,
        imageUrl: true,
        categorie: true,
        _count: {
          select: { lignesCommande: true },
        },
        avisProduits: {
          where: { publie: true },
          select: { note: true },
        },
      },
      orderBy: [
        { lignesCommande: { _count: "desc" } },
      ],
      take: 12,
    })

    // If user is logged in, filter out products they've already purchased
    let purchasedIds: string[] = []
    if (userId) {
      const userOrders = await prisma.commande.findMany({
        where: { userId },
        select: {
          lignes: { select: { produitId: true } },
        },
      })
      purchasedIds = userOrders.flatMap(o => o.lignes.map(l => l.produitId))
    }

    // Calculate scores and filter
    const scoredProducts = popularProducts
      .filter(p => !purchasedIds.includes(p.id))
      .map(p => {
        const avgRating = p.avisProduits.length > 0
          ? p.avisProduits.reduce((sum, a) => sum + a.note, 0) / p.avisProduits.length
          : 0
        return {
          id: p.id,
          nom: p.nom,
          prix: p.prix,
          prixPromo: p.prixPromo,
          imageUrl: p.imageUrl,
          categorie: p.categorie,
          orderCount: p._count.lignesCommande,
          avgRating: Math.round(avgRating * 10) / 10,
        }
      })
      .sort((a, b) => {
        // Sort by combination of popularity and rating
        const scoreA = a.orderCount * 0.6 + a.avgRating * 2
        const scoreB = b.orderCount * 0.6 + b.avgRating * 2
        return scoreB - scoreA
      })

    return NextResponse.json({
      produits: scoredProducts.slice(0, 8),
    })
  } catch (error) {
    logger.error("Erreur produits recommandés:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
