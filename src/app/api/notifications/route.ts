import { typedLogger as logger } from "@/lib/logger"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/notifications — Récupérer les notifications paginées
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const nonLues = searchParams.get("nonLues") === "true"
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")))
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const skip = (page - 1) * limit

    const where = {
      userId: session.user.id,
      ...(nonLues ? { lu: false } : {}),
    }

    const [notifications, total, totalNonLues] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId: session.user.id, lu: false },
      }),
    ])

    return NextResponse.json({
      notifications,
      totalNonLues,
      total,
      page,
      pages: Math.ceil(total / limit),
    })
  } catch (error) {
    logger.error("Erreur récupération notifications:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
