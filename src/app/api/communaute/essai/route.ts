import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { typedLogger as logger } from "@/lib/logger"

const DUREE_ESSAI_JOURS = 7

/**
 * POST /api/communaute/essai
 * Active la période d'essai gratuite de 7 jours pour l'accès communauté.
 * Idempotent : si l'essai est déjà actif, retourne les infos sans erreur.
 * Erreur 403 si l'essai a déjà été utilisé (consommé une fois dans le passé).
 */
export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 })
    }

    const userId = session.user.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        essaiCommuauteUtilise: true,
        accesCommuaute: true,
        accesCommuauteExpireAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
    }

    // Essai déjà utilisé (consommé dans une session précédente)
    if (user.essaiCommuauteUtilise) {
      return NextResponse.json(
        { error: "Votre période d'essai gratuite a déjà été utilisée." },
        { status: 403 }
      )
    }

    // Essai déjà actif (idempotent)
    if (
      user.accesCommuaute &&
      user.accesCommuauteExpireAt &&
      user.accesCommuauteExpireAt > new Date()
    ) {
      return NextResponse.json({
        ok: true,
        expireAt: user.accesCommuauteExpireAt.toISOString(),
        dejaActif: true,
      })
    }

    const expireAt = new Date()
    expireAt.setDate(expireAt.getDate() + DUREE_ESSAI_JOURS)

    await prisma.user.update({
      where: { id: userId },
      data: {
        accesCommuaute: true,
        accesCommuauteExpireAt: expireAt,
        essaiCommuauteUtilise: true,
      },
    })

    logger.info("Essai communauté activé", { userId, expireAt: expireAt.toISOString() })

    return NextResponse.json({ ok: true, expireAt: expireAt.toISOString() })
  } catch (error) {
    logger.error("Erreur activation essai communauté:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
