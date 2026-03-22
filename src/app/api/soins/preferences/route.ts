import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ authenticated: false })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      prenom: true,
      rendezVous: {
        where: { statut: "TERMINE" },
        include: { soin: { select: { nom: true, slug: true, categorie: true, prix: true } } },
        orderBy: { dateHeure: "desc" },
        take: 10,
      },
      favoris: {
        where: { soinId: { not: null } },
        include: { soin: { select: { nom: true, slug: true, categorie: true } } },
        take: 5,
      },
    },
  })

  if (!user) {
    return NextResponse.json({ authenticated: false })
  }

  // Determine preferred categories
  const catCount: Record<string, number> = {}
  for (const r of user.rendezVous) {
    catCount[r.soin.categorie] = (catCount[r.soin.categorie] || 0) + 1
  }
  const categoriesPreferees = Object.entries(catCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat)

  // Budget range from past appointments
  const prix = user.rendezVous.map((r) => r.soin.prix)
  const budgetMoyen = prix.length > 0 ? Math.round(prix.reduce((a, b) => a + b, 0) / prix.length) : null

  return NextResponse.json({
    authenticated: true,
    prenom: user.prenom,
    categoriesPreferees,
    budgetMoyen,
    derniersSoins: user.rendezVous.slice(0, 5).map((r) => r.soin.nom),
    favoris: user.favoris.map((f) => f.soin?.nom).filter(Boolean),
  })
}
