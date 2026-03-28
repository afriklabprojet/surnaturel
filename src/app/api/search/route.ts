import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// ─── GET: Recherche globale ──────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q")?.trim()
    const type = searchParams.get("type") || "all" // all, produits, soins, blog
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 20)

    if (!q || q.length < 2) {
      return NextResponse.json({
        produits: [],
        soins: [],
        articles: [],
        total: 0,
      })
    }

    // Requête insensible à la casse
    const searchTerm = q.toLowerCase()

    // Recherche en parallèle
    const [produits, soins, articles] = await Promise.all([
      // Produits
      type === "all" || type === "produits"
        ? prisma.produit.findMany({
            where: {
              actif: true,
              OR: [
                { nom: { contains: searchTerm, mode: "insensitive" } },
                { description: { contains: searchTerm, mode: "insensitive" } },
                { categorie: { contains: searchTerm, mode: "insensitive" } },
              ],
            },
            take: limit,
            select: {
              id: true,
              nom: true,
              description: true,
              prix: true,
              prixPromo: true,
              imageUrl: true,
              categorie: true,
            },
          })
        : [],

      // Soins
      type === "all" || type === "soins"
        ? prisma.soin.findMany({
            where: {
              actif: true,
              OR: [
                { nom: { contains: searchTerm, mode: "insensitive" } },
                { description: { contains: searchTerm, mode: "insensitive" } },
              ],
            },
            take: limit,
            select: {
              id: true,
              nom: true,
              slug: true,
              description: true,
              prix: true,
              duree: true,
              imageUrl: true,
              categorie: true,
            },
          })
        : [],

      // Articles de blog
      type === "all" || type === "blog"
        ? prisma.article.findMany({
            where: {
              publie: true,
              OR: [
                { titre: { contains: searchTerm, mode: "insensitive" } },
                { contenu: { contains: searchTerm, mode: "insensitive" } },
                { categorie: { contains: searchTerm, mode: "insensitive" } },
              ],
            },
            take: limit,
            select: {
              id: true,
              titre: true,
              slug: true,
              contenu: true,
              categorie: true,
              imageUrl: true,
              tempsLecture: true,
            },
          })
        : [],
    ])

    // Formatter les résultats
    const formattedProduits = produits.map((p) => ({
      id: p.id,
      type: "produit" as const,
      titre: p.nom,
      description: p.description.slice(0, 100) + (p.description.length > 100 ? "..." : ""),
      prix: p.prixPromo || p.prix,
      prixOriginal: p.prixPromo ? p.prix : undefined,
      imageUrl: p.imageUrl,
      url: `/boutique/${p.id}`,
      categorie: p.categorie,
    }))

    const formattedSoins = soins.map((s) => ({
      id: s.id,
      type: "soin" as const,
      titre: s.nom,
      description: s.description.slice(0, 100) + (s.description.length > 100 ? "..." : ""),
      prix: s.prix,
      duree: s.duree,
      imageUrl: s.imageUrl,
      url: `/soins/${s.slug}`,
      categorie: s.categorie,
    }))

    const formattedArticles = articles.map((a) => ({
      id: a.id,
      type: "article" as const,
      titre: a.titre,
      description: a.contenu.slice(0, 100) + (a.contenu.length > 100 ? "..." : ""),
      imageUrl: a.imageUrl,
      url: `/blog/${a.slug}`,
      categorie: a.categorie,
      tempsLecture: a.tempsLecture,
    }))

    const total = formattedProduits.length + formattedSoins.length + formattedArticles.length

    return NextResponse.json({
      produits: formattedProduits,
      soins: formattedSoins,
      articles: formattedArticles,
      total,
      query: q,
    })
  } catch (error) {
    console.error("[API Search] Erreur:", error)
    return NextResponse.json(
      { error: "Erreur lors de la recherche" },
      { status: 500 }
    )
  }
}
