import { typedLogger as logger } from "@/lib/logger"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"
import { envoyerEmailInvitationParrainage } from "@/lib/email"

// GET - Récupérer les parrainages de l'utilisateur
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Récupérer ou créer le code de parrainage
    let user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { codeParrainage: true },
    })

    // Si l'utilisateur n'a pas de code, en créer un
    if (!user?.codeParrainage) {
      const code = randomBytes(4).toString("hex").toUpperCase()
      await prisma.user.update({
        where: { id: session.user.id },
        data: { codeParrainage: code },
      })
      user = { codeParrainage: code }
    }

    // Récupérer les parrainages
    const parrainages = await prisma.parrainage.findMany({
      where: { parrainId: session.user.id },
      include: {
        filleul: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Statistiques
    const stats = {
      total: parrainages.length,
      enAttente: parrainages.filter((p) => p.statut === "EN_ATTENTE").length,
      actifs: parrainages.filter((p) => p.statut === "ACTIF").length,
      termines: parrainages.filter((p) => p.statut === "RECOMPENSE_ACCORDEE").length,
      pointsGagnes: parrainages
        .filter((p) => p.statut === "ACTIF" || p.statut === "RECOMPENSE_ACCORDEE")
        .length * 200,
    }

    return NextResponse.json({
      codeParrainage: user.codeParrainage,
      lienParrainage: `${process.env.NEXT_PUBLIC_APP_URL || "https://surnatureldedieu.com"}/inscription?parrain=${user.codeParrainage}`,
      parrainages,
      stats,
    })
  } catch (error) {
    logger.error("Erreur récupération parrainages:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des parrainages" },
      { status: 500 }
    )
  }
}

// POST - Inviter quelqu'un par email
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 })
    }

    // Vérifier que l'email n'est pas déjà un utilisateur
    const existant = await prisma.user.findUnique({
      where: { email },
    })

    if (existant) {
      return NextResponse.json(
        { error: "Cette personne a déjà un compte" },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur ne s'invite pas lui-même
    if (email === session.user.email) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas vous inviter vous-même" },
        { status: 400 }
      )
    }

    // Récupérer le code de parrainage et le prénom du parrain
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { codeParrainage: true, prenom: true, nom: true },
    })

    const lien = `${process.env.NEXT_PUBLIC_APP_URL || "https://surnatureldedieu.com"}/inscription?parrain=${user?.codeParrainage}`

    // Envoyer l'email d'invitation
    envoyerEmailInvitationParrainage({
      destinataire: email,
      prenomParrain: user?.prenom ?? user?.nom ?? "Un membre",
      lienParrainage: lien,
    }).catch(() => null)

    return NextResponse.json({
      success: true,
      message: "Invitation envoyée",
      lien,
    })
  } catch (error) {
    logger.error("Erreur envoi invitation:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de l'invitation" },
      { status: 500 }
    )
  }
}
