import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { typedLogger as logger } from "@/lib/logger"

/**
 * GET /api/cron/expiration-communaute
 * Appelé chaque jour à 2h par le processus cron PM2.
 * Désactive l'accès communauté pour les abonnements arrivés à expiration.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const maintenant = new Date()

    // Trouver tous les abonnements communauté expirés encore ACTIF
    const expires = await prisma.abonnementMensuel.findMany({
      where: {
        statut: "ACTIF",
        formule: { slug: "communaute" },
        dateProchainPaiement: { lte: maintenant },
      },
      select: { id: true, userId: true },
    })

    if (expires.length === 0) {
      return NextResponse.json({ ok: true, expires: 0 })
    }

    const userIds = expires.map((a) => a.userId)
    const abonnementIds = expires.map((a) => a.id)

    await prisma.$transaction([
      prisma.abonnementMensuel.updateMany({
        where: { id: { in: abonnementIds } },
        data: { statut: "EXPIRE" },
      }),
      prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: {
          accesCommuaute: false,
          accesCommuauteExpireAt: maintenant,
        },
      }),
    ])

    logger.info("Expiration communauté traitée", {
      count: expires.length,
      userIds,
    })

    return NextResponse.json({ ok: true, expires: expires.length })
  } catch (error) {
    logger.error("Erreur cron expiration communauté:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
