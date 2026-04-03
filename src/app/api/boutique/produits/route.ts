import { typedLogger as logger } from "@/lib/logger"
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
    const recherche = searchParams.get("recherche")?.trim() || ""

    // ─── Filtre catégorie ────────────────────────────────────────
    let where: Record<string, unknown> = { actif: true }

    if (categorie !== "tout" && categorie !== "nouveautes") {
      // La valeur envoyée correspond directement à la valeur DB (ex : "Corps", "Grossesse & Post-natal")
      // Rétrocompatibilité : anciens slugs lowercase mappés vers leur valeur DB
      const legacyMap: Record<string, string> = {
        corps: "Corps",
        visage: "Visage",
        "bien-etre": "Bien-être",
      }
      const categorieDb = legacyMap[categorie] ?? categorie
      where = { ...where, categorie: categorieDb }
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

    // ─── Recherche textuelle ─────────────────────────────────────
    if (recherche) {
      where = {
        ...where,
        OR: [
          { nom: { contains: recherche, mode: "insensitive" } },
          { description: { contains: recherche, mode: "insensitive" } },
        ],
      }
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
    const [produits, total, avisStats] = await Promise.all([
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
      prisma.avisProduit.groupBy({
        by: ["produitId"],
        _avg: { note: true },
        _count: { note: true },
      }),
    ])

    // Check "nouveau" = created within last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Map avis stats by produitId
    const avisMap = new Map(
      avisStats.map((a) => [a.produitId, { avg: a._avg.note ?? 0, count: a._count.note }])
    )

    const produitsEnrichis = produits.map((p) => {
      const stats = avisMap.get(p.id)
      return {
        id: p.id,
        nom: p.nom,
        description: p.description,
        prix: p.prix,
        prixPromo: p.prixPromo,
        stock: p.stock,
        imageUrl: p.imageUrl,
        categorie: p.categorie,
        nouveau: p.createdAt >= thirtyDaysAgo,
        notesMoyenne: stats ? Math.round(stats.avg * 10) / 10 : 0,
        nombreAvis: stats?.count ?? 0,
      }
    })

    const pages = Math.ceil(total / limit)

    return NextResponse.json({
      produits: produitsEnrichis,
      total,
      pages,
      page,
    })
  } catch (error) {
    logger.error("Erreur GET /api/boutique/produits:", error)
    return NextResponse.json(
      { error: "Un souci technique est survenu. Réessayez dans quelques instants." },
      { status: 500 }
    )
  }
}
