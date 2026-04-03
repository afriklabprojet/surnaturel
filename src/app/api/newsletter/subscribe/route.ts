import { typedLogger as logger } from "@/lib/logger"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST /api/newsletter/subscribe — Inscription newsletter visiteur
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email } = body

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email requis" },
        { status: 400 }
      )
    }

    // Validation basique de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Format d'email invalide" },
        { status: 400 }
      )
    }

    const emailLower = email.toLowerCase().trim()

    // Vérifier si l'email existe déjà
    const existant = await prisma.abonneNewsletter.findUnique({
      where: { email: emailLower },
    })

    if (existant) {
      if (existant.actif) {
        return NextResponse.json(
          { message: "Vous êtes déjà inscrit à notre newsletter !" },
          { status: 200 }
        )
      }
      // Réactiver si désabonné
      await prisma.abonneNewsletter.update({
        where: { email: emailLower },
        data: { actif: true },
      })
      return NextResponse.json({
        message: "Bienvenue à nouveau ! Vous êtes réinscrit à notre newsletter.",
      })
    }

    // Vérifier si c'est un utilisateur existant
    const userExistant = await prisma.user.findUnique({
      where: { email: emailLower },
    })

    if (userExistant) {
      // Activer la newsletter sur le compte existant
      if (!userExistant.notifNewsletter) {
        await prisma.user.update({
          where: { email: emailLower },
          data: { notifNewsletter: true },
        })
      }
      return NextResponse.json({
        message: "Newsletter activée sur votre compte !",
      })
    }

    // Créer nouvel abonné
    await prisma.abonneNewsletter.create({
      data: { email: emailLower },
    })

    return NextResponse.json({
      message: "Merci ! Vous recevrez bientôt nos actualités et offres exclusives.",
    })
  } catch (error) {
    logger.error("Erreur inscription newsletter:", error)
    return NextResponse.json(
      { error: "Une erreur est survenue. Veuillez réessayer." },
      { status: 500 }
    )
  }
}
