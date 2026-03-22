import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Returns aggregate rating data for Google structured data / GMB sync
export async function GET() {
  const result = await prisma.avis.aggregate({
    _avg: { note: true },
    _count: { id: true },
    where: { publie: true },
  })

  const recentReviews = await prisma.avis.findMany({
    where: { publie: true },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      user: { select: { prenom: true, nom: true } },
      rdv: { select: { soin: { select: { nom: true } } } },
    },
  })

  const aggregateRating = {
    "@type": "AggregateRating",
    ratingValue: (result._avg.note ?? 0).toFixed(1),
    reviewCount: result._count.id,
    bestRating: 5,
    worstRating: 1,
  }

  const reviews = recentReviews.map((a) => ({
    "@type": "Review",
    author: { "@type": "Person", name: `${a.user.prenom} ${a.user.nom?.[0]}.` },
    reviewRating: { "@type": "Rating", ratingValue: a.note, bestRating: 5 },
    reviewBody: a.commentaire || "",
    datePublished: a.createdAt.toISOString().split("T")[0],
    ...(a.rdv?.soin?.nom ? { itemReviewed: { "@type": "Service", name: a.rdv.soin.nom } } : {}),
  }))

  return NextResponse.json({ aggregateRating, reviews })
}
