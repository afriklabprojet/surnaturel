import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// ─── GET /api/boutique/produits ──────────────────────────────────
// Params: categorie, tri, page, limit

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categorie = searchParams.get("categorie") || "tout"
    const tri = searchParams.get("tri") || "popularite"
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
    const limit = Math.min(24, Math.max(1, parseInt(searchParams.get("limit") || "8", 10)))
    const skip = (page - 1) * limit
    const prixMin = searchParams.get("prixMin") ? parseFloat(searchParams.get("prixMin")!) : undefined
    const prixMax = searchParams.get("prixMax") ? parseFloat(searchParams.get("prixMax")!) : undefined
    const enStock = searchParams.get("enStock") === "true"

    // ─── Filtre catégorie ────────────────────────────────────────
    let where: Record<string, unknown> = { actif: true }

    if (categorie !== "tout" && categorie !== "nouveautes") {
      // Map les catégories URL vers les valeurs DB
      const categorieMap: Record<string, string> = {
        corps: "Corps",
        visage: "Visage",
        "bien-etre": "Bien-être",
      }
      const categorieDb = categorieMap[categorie]
      if (categorieDb) {
        where = { ...where, categorie: categorieDb }
      }
    }

    // ─── Filtre prix ─────────────────────────────────────────────
    if (prixMin !== undefined && !isNaN(prixMin)) {
      where = { ...where, prix: { ...(where.prix as object || {}), gte: prixMin } }
    }
    if (prixMax !== undefined && !isNaN(prixMax)) {
      where = { ...where, prix: { ...(where.prix as object || {}), lte: prixMax } }
    }

    // ─── Filtre stock ────────────────────────────────────────────
    if (enStock) {
      where = { ...where, stock: { gt: 0 } }
    }

    // ─── Tri ─────────────────────────────────────────────────────
    let orderBy: Record<string, string>

    switch (tri) {
      case "prix-asc":
        orderBy = { prix: "asc" }
        break
      case "prix-desc":
        orderBy = { prix: "desc" }
        break
      case "nouveautes":
        orderBy = { createdAt: "desc" }
        break
      case "popularite":
      default:
        orderBy = { createdAt: "desc" }
        break
    }

    // ─── Requêtes ────────────────────────────────────────────────
    const [produits, total] = await Promise.all([
      prisma.produit.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          nom: true,
          description: true,
          prix: true,
          prixPromo: true,
          stock: true,
          imageUrl: true,
          categorie: true,
          createdAt: true,
        },
      }),
      prisma.produit.count({ where }),
    ])

    // Check "nouveau" = created within last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const produitsEnrichis = produits.map((p) => ({
      id: p.id,
      nom: p.nom,
      description: p.description,
      prix: p.prix,
      prixPromo: p.prixPromo,
      stock: p.stock,
      imageUrl: p.imageUrl,
      categorie: p.categorie,
      nouveau: p.createdAt >= thirtyDaysAgo,
    }))

    const pages = Math.ceil(total / limit)

    return NextResponse.json({
      produits: produitsEnrichis,
      total,
      pages,
      page,
    })
  } catch (error) {
    console.error("Erreur GET /api/boutique/produits:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des produits" },
      { status: 500 }
    )
  }
}
