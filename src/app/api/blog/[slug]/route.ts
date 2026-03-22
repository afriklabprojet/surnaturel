import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Récupérer l'article (slug = id dans notre schéma)
    const article = await prisma.article.findUnique({
      where: { id: slug, publie: true },
    })

    if (!article) {
      return NextResponse.json({ error: "Article non trouvé" }, { status: 404 })
    }

    // Articles similaires (autres articles publiés)
    const similaires = await prisma.article.findMany({
      where: {
        publie: true,
        id: { not: slug },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        titre: true,
        imageUrl: true,
        createdAt: true,
      },
    })

    // Calculer le temps de lecture (environ 200 mots par minute)
    const wordCount = article.contenu.split(/\s+/).length
    const tempsLecture = Math.ceil(wordCount / 200)

    return NextResponse.json({
      article: {
        id: article.id,
        titre: article.titre,
        contenu: article.contenu,
        imageUrl: article.imageUrl,
        createdAt: article.createdAt,
        tempsLecture,
      },
      similaires,
    })
  } catch (error) {
    console.error("Erreur API article:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'article" },
      { status: 500 }
    )
  }
}
