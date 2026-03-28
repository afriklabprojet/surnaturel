import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { envoyerEmailOnboarding } from "@/lib/email"

// ─── CRON: Envoi des emails d'onboarding ─────────────────────────
// Exécuté tous les jours à 10h
// Step 0: Bienvenue (à l'inscription - géré séparément)
// Step 1: Découverte soins (J+2)
// Step 2: Boutique (J+5)
// Step 3: Communauté (J+7)

const ONBOARDING_DELAYS = {
  1: 2, // 2 jours après inscription
  2: 5, // 5 jours après inscription
  3: 7, // 7 jours après inscription
}

export async function GET(request: Request) {
  // Vérifier l'authentification CRON
  const authHeader = request.headers.get("authorization")
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`

  if (authHeader !== expectedToken) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const now = new Date()
    const results = {
      step1: { sent: 0, errors: 0 },
      step2: { sent: 0, errors: 0 },
      step3: { sent: 0, errors: 0 },
    }

    // Traiter chaque étape d'onboarding
    for (const [stepStr, daysAfter] of Object.entries(ONBOARDING_DELAYS)) {
      const step = parseInt(stepStr) as 1 | 2 | 3
      const targetDate = new Date(now)
      targetDate.setDate(targetDate.getDate() - daysAfter)
      
      // Début et fin de la journée cible
      const startOfDay = new Date(targetDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(targetDate)
      endOfDay.setHours(23, 59, 59, 999)

      // Trouver les utilisateurs à cette étape
      const users = await prisma.user.findMany({
        where: {
          onboardingStep: step - 1, // Utilisateurs à l'étape précédente
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
          notifNewsletter: true, // Respecter les préférences
        },
        select: {
          id: true,
          email: true,
          prenom: true,
        },
      })

      // Envoyer les emails
      for (const user of users) {
        try {
          await envoyerEmailOnboarding({
            destinataire: user.email,
            prenom: user.prenom,
            step,
          })

          // Mettre à jour l'étape d'onboarding
          await prisma.user.update({
            where: { id: user.id },
            data: {
              onboardingStep: step,
              lastOnboardingEmail: now,
            },
          })

          results[`step${step}`].sent++
        } catch (error) {
          console.error(`[CRON Onboarding] Erreur envoi step ${step} à ${user.email}:`, error)
          results[`step${step}`].errors++
        }
      }
    }

    console.log("[CRON Onboarding] Résultats:", results)

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results,
    })
  } catch (error) {
    console.error("[CRON Onboarding] Erreur globale:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'envoi des emails d'onboarding" },
      { status: 500 }
    )
  }
}
