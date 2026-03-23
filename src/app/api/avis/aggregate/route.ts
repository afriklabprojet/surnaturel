import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Returns aggregate rating data for Google structured data / public avis page
export async function GET() {
  const result = await prisma.avis.aggregate({
    _avg: { note: true },
    _count: { id: true },
    where: { publie: true },
  })

  const recentReviews = await prisma.avis.findMany({
    where: { publie: true },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      user: { select: { prenom: true, nom: true, photoUrl: true } },
      soin: { select: { nom: true } },
    },
  })

  // Distribution par note (1-5)
  const allNotes = await prisma.avis.groupBy({
    by: ["note"],
    _count: { id: true },
    where: { publie: true },
  })
  const distribution: Record<number, number> = {}
  for (const row of allNotes) {
    distribution[row.note] = row._count.id
  }

  const aggregateRating = {
    "@type": "AggregateRating",
    ratingValue: Number((result._avg.note ?? 0).toFixed(1)),
    reviewCount: result._count.id,
    bestRating: 5,
    worstRating: 1,
  }

  const reviews = recentReviews.map((a) => ({
    id: a.id,
    note: a.note,
    commentaire: a.commentaire || "",
    createdAt: a.createdAt.toISOString(),
    user: { prenom: a.user.prenom, nom: a.user.nom, photoUrl: a.user.photoUrl },
    soin: { nom: a.soin.nom },
  }))

  return NextResponse.json({ aggregateRating, reviews, distribution })
}
