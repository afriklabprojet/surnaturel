import { typedLogger as logger } from "@/lib/logger"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Get recommended services for user
export async function GET() {
  try {
    const session = await auth()
    const userId = session?.user?.id

    // Get most popular services (by number of appointments)
    const popularSoins = await prisma.soin.findMany({
      where: { actif: true },
      select: {
        slug: true,
        nom: true,
        categorie: true,
        prix: true,
        duree: true,
        _count: {
          select: { rendezVous: true, avis: true },
        },
        avis: {
          where: { publie: true },
          select: { note: true },
        },
      },
      orderBy: [
        { rendezVous: { _count: "desc" } },
      ],
      take: 10,
    })

    // If user is logged in, filter out services they've already booked
    let bookedSlugs: string[] = []
    if (userId) {
      const userRdvs = await prisma.rendezVous.findMany({
        where: { userId },
        select: { soin: { select: { slug: true } } },
      })
      bookedSlugs = userRdvs.map(r => r.soin.slug)
    }

    // Calculate average rating and sort by popularity + rating
    const soinsWithRating = popularSoins
      .filter(s => !bookedSlugs.includes(s.slug))
      .map(s => {
        const avgRating = s.avis.length > 0
          ? s.avis.reduce((sum, a) => sum + a.note, 0) / s.avis.length
          : 0
        return {
          slug: s.slug,
          nom: s.nom,
          categorie: s.categorie,
          prix: s.prix,
          duree: s.duree,
          rdvCount: s._count.rendezVous,
          avisCount: s._count.avis,
          avgRating: Math.round(avgRating * 10) / 10,
        }
      })
      .sort((a, b) => {
        // Sort by combination of popularity and rating
        const scoreA = a.rdvCount * 0.5 + a.avgRating * a.avisCount * 0.5
        const scoreB = b.rdvCount * 0.5 + b.avgRating * b.avisCount * 0.5
        return scoreB - scoreA
      })

    return NextResponse.json({
      soins: soinsWithRating.slice(0, 6),
    })
  } catch (error) {
    logger.error("Erreur soins recommandés:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
