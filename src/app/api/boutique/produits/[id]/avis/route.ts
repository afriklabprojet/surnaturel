import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// ─── GET: Récupérer les avis d'un produit ────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: produitId } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const tri = searchParams.get("tri") || "recent" // recent, utile, note

    // Vérifier que le produit existe
    const produit = await prisma.produit.findUnique({
      where: { id: produitId },
      select: { id: true },
    })

    if (!produit) {
      return NextResponse.json(
        { error: "Produit introuvable" },
        { status: 404 }
      )
    }

    // Définir le tri
    const orderBy =
      tri === "utile"
        ? { utile: "desc" as const }
        : tri === "note"
          ? { note: "desc" as const }
          : { createdAt: "desc" as const }

    // Récupérer les avis
    const [avis, total, stats] = await Promise.all([
      prisma.avisProduit.findMany({
        where: {
          produitId,
          publie: true,
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          note: true,
          titre: true,
          commentaire: true,
          utile: true,
          verifie: true,
          createdAt: true,
          user: {
            select: {
              prenom: true,
              photoUrl: true,
            },
          },
        },
      }),
      prisma.avisProduit.count({
        where: { produitId, publie: true },
      }),
      // Statistiques des notes
      prisma.avisProduit.groupBy({
        by: ["note"],
        where: { produitId, publie: true },
        _count: { note: true },
      }),
    ])

    // Calculer la moyenne et la distribution
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    let somme = 0
    let count = 0

    stats.forEach((s) => {
      distribution[s.note] = s._count.note
      somme += s.note * s._count.note
      count += s._count.note
    })

    const moyenne = count > 0 ? Math.round((somme / count) * 10) / 10 : 0

    return NextResponse.json({
      avis: avis.map((a) => ({
        id: a.id,
        note: a.note,
        titre: a.titre,
        commentaire: a.commentaire,
        utile: a.utile,
        verifie: a.verifie,
        date: a.createdAt,
        auteur: {
          prenom: a.user.prenom,
          photoUrl: a.user.photoUrl,
        },
      })),
      total,
      pages: Math.ceil(total / limit),
      page,
      stats: {
        moyenne,
        total: count,
        distribution,
      },
    })
  } catch (error) {
    console.error("[API] Erreur récupération avis:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

// ─── POST: Soumettre un avis ─────────────────────────────────────

const avisSchema = z.object({
  note: z.number().min(1).max(5),
  titre: z.string().max(100).optional(),
  commentaire: z.string().max(1000).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Vous devez être connecté pour laisser un avis" },
        { status: 401 }
      )
    }

    const { id: produitId } = await params
    const body = await request.json()
    const result = avisSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: "Données invalides", details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { note, titre, commentaire } = result.data
    const userId = session.user.id

    // Vérifier que le produit existe
    const produit = await prisma.produit.findUnique({
      where: { id: produitId },
      select: { id: true },
    })

    if (!produit) {
      return NextResponse.json(
        { error: "Produit introuvable" },
        { status: 404 }
      )
    }

    // Vérifier si l'utilisateur a déjà laissé un avis
    const avisExistant = await prisma.avisProduit.findUnique({
      where: {
        userId_produitId: {
          userId,
          produitId,
        },
      },
    })

    if (avisExistant) {
      // Mettre à jour l'avis existant
      const avisModifie = await prisma.avisProduit.update({
        where: { id: avisExistant.id },
        data: {
          note,
          titre,
          commentaire,
          updatedAt: new Date(),
        },
      })

      return NextResponse.json({
        message: "Avis mis à jour avec succès",
        avis: avisModifie,
      })
    }

    // Vérifier si l'utilisateur a acheté le produit (pour badge "Achat vérifié")
    const achatVerifie = await prisma.ligneCommande.findFirst({
      where: {
        produitId,
        commande: {
          userId,
          statut: { in: ["PAYEE", "EN_PREPARATION", "EXPEDIEE", "LIVREE"] },
        },
      },
    })

    // Créer le nouvel avis
    const nouvelAvis = await prisma.avisProduit.create({
      data: {
        userId,
        produitId,
        note,
        titre,
        commentaire,
        verifie: !!achatVerifie,
        publie: true,
      },
    })

    // Accorder des points de fidélité pour l'avis
    const pointsFidelite = await prisma.pointsFidelite.findUnique({
      where: { userId },
    })

    if (pointsFidelite) {
      await prisma.$transaction([
        prisma.pointsFidelite.update({
          where: { userId },
          data: { total: { increment: 10 } },
        }),
        prisma.historiqueFidelite.create({
          data: {
            pointsId: pointsFidelite.id,
            points: 10,
            raison: "Avis produit déposé",
            type: "GAIN_AVIS",
          },
        }),
      ])
    }

    return NextResponse.json({
      message: "Avis créé avec succès",
      avis: nouvelAvis,
      pointsGagnes: pointsFidelite ? 10 : 0,
    })
  } catch (error) {
    console.error("[API] Erreur création avis:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

// ─── PATCH: Marquer un avis comme utile ──────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const avisId = searchParams.get("avisId")

    if (!avisId) {
      return NextResponse.json(
        { error: "ID de l'avis requis" },
        { status: 400 }
      )
    }

    const avis = await prisma.avisProduit.update({
      where: { id: avisId },
      data: { utile: { increment: 1 } },
    })

    return NextResponse.json({
      message: "Vote enregistré",
      utile: avis.utile,
    })
  } catch (error) {
    console.error("[API] Erreur vote avis:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}
