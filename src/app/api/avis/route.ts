import { typedLogger as logger } from "@/lib/logger"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { crediterAvis } from "@/lib/fidelite"
import { notifierPointsFidelite } from "@/lib/notifications"

// GET - Récupérer les avis de l'utilisateur ou les avis pour un soin
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const soinId = searchParams.get("soinId")
    const mesAvis = searchParams.get("mesAvis")

    if (mesAvis === "true") {
      // Récupérer les avis de l'utilisateur connecté
      const session = await auth()
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
      }

      const avis = await prisma.avis.findMany({
        where: { userId: session.user.id },
        include: {
          soin: {
            select: {
              id: true,
              nom: true,
              imageUrl: true,
            },
          },
          rdv: {
            select: {
              id: true,
              dateHeure: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })

      // RDVs terminés sans avis
      const rdvsSansAvis = await prisma.rendezVous.findMany({
        where: {
          userId: session.user.id,
          statut: "TERMINE",
          avis: null,
        },
        include: {
          soin: {
            select: {
              id: true,
              nom: true,
              imageUrl: true,
            },
          },
        },
        orderBy: { dateHeure: "desc" },
      })

      return NextResponse.json({ avis, rdvsSansAvis })
    }

    if (soinId) {
      // Récupérer les avis publics pour un soin
      const avis = await prisma.avis.findMany({
        where: {
          soinId,
          publie: true,
        },
        include: {
          user: {
            select: {
              nom: true,
              prenom: true,
              photoUrl: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })

      // Calcul de la moyenne
      const moyenne =
        avis.length > 0
          ? avis.reduce((sum, a) => sum + a.note, 0) / avis.length
          : 0

      return NextResponse.json({
        avis,
        stats: {
          total: avis.length,
          moyenne: Math.round(moyenne * 10) / 10,
        },
      })
    }

    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
  } catch (error) {
    logger.error("Erreur récupération avis:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des avis" },
      { status: 500 }
    )
  }
}

// POST - Créer un avis
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { rdvId, note, commentaire } = await request.json()

    if (!rdvId || !note) {
      return NextResponse.json(
        { error: "Rendez-vous et note requis" },
        { status: 400 }
      )
    }

    if (note < 1 || note > 5) {
      return NextResponse.json(
        { error: "La note doit être entre 1 et 5" },
        { status: 400 }
      )
    }

    // Vérifier que le RDV existe et appartient à l'utilisateur
    const rdv = await prisma.rendezVous.findUnique({
      where: { id: rdvId },
      include: {
        avis: true,
      },
    })

    if (!rdv) {
      return NextResponse.json(
        { error: "Rendez-vous non trouvé" },
        { status: 404 }
      )
    }

    if (rdv.userId !== session.user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    if (rdv.statut !== "TERMINE") {
      return NextResponse.json(
        { error: "Vous ne pouvez laisser un avis que pour un RDV terminé" },
        { status: 400 }
      )
    }

    if (rdv.avis) {
      return NextResponse.json(
        { error: "Vous avez déjà laissé un avis pour ce rendez-vous" },
        { status: 400 }
      )
    }

    // Créer l'avis
    const avis = await prisma.avis.create({
      data: {
        userId: session.user.id,
        soinId: rdv.soinId,
        rdvId,
        note,
        commentaire: commentaire || null,
        publie: true,
      },
      include: {
        soin: {
          select: {
            nom: true,
          },
        },
      },
    })

    // Créditer les points fidélité
    await crediterAvis(session.user.id, avis.soin?.nom || "Soin")

    // Envoyer une notification
    await notifierPointsFidelite(session.user.id, 30, "Avis laissé")

    return NextResponse.json(avis, { status: 201 })
  } catch (error) {
    logger.error("Erreur création avis:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création de l'avis" },
      { status: 500 }
    )
  }
}

// PATCH - Modifier un avis
export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { avisId, note, commentaire } = await request.json()

    if (!avisId) {
      return NextResponse.json({ error: "Avis ID requis" }, { status: 400 })
    }

    const avis = await prisma.avis.findUnique({
      where: { id: avisId },
    })

    if (!avis) {
      return NextResponse.json({ error: "Avis non trouvé" }, { status: 404 })
    }

    if (avis.userId !== session.user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const avisModifie = await prisma.avis.update({
      where: { id: avisId },
      data: {
        ...(note !== undefined && { note }),
        ...(commentaire !== undefined && { commentaire }),
      },
    })

    return NextResponse.json(avisModifie)
  } catch (error) {
    logger.error("Erreur modification avis:", error)
    return NextResponse.json(
      { error: "Erreur lors de la modification de l'avis" },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un avis
export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const avisId = searchParams.get("id")

    if (!avisId) {
      return NextResponse.json({ error: "Avis ID requis" }, { status: 400 })
    }

    const avis = await prisma.avis.findUnique({
      where: { id: avisId },
    })

    if (!avis) {
      return NextResponse.json({ error: "Avis non trouvé" }, { status: 404 })
    }

    if (avis.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    await prisma.avis.delete({
      where: { id: avisId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Erreur suppression avis:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'avis" },
      { status: 500 }
    )
  }
}
