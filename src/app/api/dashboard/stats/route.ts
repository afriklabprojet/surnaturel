import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const userId = session.user.id

    // Prochain RDV
    const prochainRdv = await prisma.rendezVous.findFirst({
      where: {
        userId,
        dateHeure: { gt: new Date() },
        statut: { notIn: ["ANNULE"] },
      },
      orderBy: { dateHeure: "asc" },
      include: {
        soin: {
          select: { nom: true, duree: true, prix: true },
        },
      },
    })

    // Dernière commande
    const derniereCommande = await prisma.commande.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        lignes: {
          take: 3,
          include: {
            produit: {
              select: { nom: true },
            },
          },
        },
      },
    })

    // Points fidélité
    const fidelite = await prisma.pointsFidelite.findUnique({
      where: { userId },
    })

    const points = fidelite?.total ?? 0

    // Palier actuel
    const paliers = [
      { points: 0, nom: "Bronze" },
      { points: 500, nom: "Argent" },
      { points: 1000, nom: "Or" },
      { points: 2000, nom: "Platine" },
    ]
    const palierActuel = [...paliers].reverse().find((p) => points >= p.points)

    // Messages non lus
    const messagesNonLus = await prisma.message.count({
      where: {
        destinataireId: userId,
        lu: false,
      },
    })

    // 3 soins recommandés (les plus populaires)
    const soinsRecommandes = await prisma.soin.findMany({
      where: { actif: true },
      take: 3,
      select: {
        id: true,
        nom: true,
        description: true,
        prix: true,
        duree: true,
        imageUrl: true,
        categorie: true,
      },
    })

    return NextResponse.json({
      prochainRdv: prochainRdv
        ? {
            id: prochainRdv.id,
            dateHeure: prochainRdv.dateHeure,
            statut: prochainRdv.statut,
            soin: prochainRdv.soin,
          }
        : null,
      derniereCommande: derniereCommande
        ? {
            id: derniereCommande.id,
            total: derniereCommande.total,
            statut: derniereCommande.statut,
            createdAt: derniereCommande.createdAt,
            lignes: derniereCommande.lignes.map((l) => ({
              produit: l.produit,
            })),
          }
        : null,
      points,
      palierActuel,
      messagesNonLus,
      soinsRecommandes,
    })
  } catch (error) {
    console.error("Erreur API dashboard/stats:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    )
  }
}
