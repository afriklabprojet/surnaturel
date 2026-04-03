import { typedLogger as logger } from "@/lib/logger"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Get user onboarding status
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        onboardingStep: true,
        lastOnboardingEmail: true,
        telephone: true,
        photoUrl: true,
        ville: true,
        _count: {
          select: {
            rendezVous: true,
            commandes: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    // Calculate profile completion
    const profilFields = [user.telephone, user.photoUrl, user.ville]
    const profilComplet = profilFields.filter(Boolean).length >= 2

    return NextResponse.json({
      onboardingStep: user.onboardingStep,
      lastEmail: user.lastOnboardingEmail,
      profilComplet,
      hasRdv: user._count.rendezVous > 0,
      hasCommande: user._count.commandes > 0,
    })
  } catch (error) {
    logger.error("Erreur onboarding GET:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST - Update onboarding progress
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const { step, action, dismissed } = body

    // Update the onboarding step in database
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        onboardingStep: typeof step === "number" ? step : undefined,
      },
    })

    // Log the action for analytics (optional - could add to a tracking table)
    logger.info(`Onboarding: User ${session.user.id} - step: ${step}, action: ${action}, dismissed: ${dismissed}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Erreur onboarding POST:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
