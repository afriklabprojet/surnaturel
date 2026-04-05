import { typedLogger as logger } from "@/lib/logger"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const ALLOWED_ROLES = ["CLIENT", "ACCOMPAGNATEUR_MEDICAL", "ADMIN"]

/**
 * GET /api/medical/comptes-rendus
 * Retourne les notes pro partagées par la praticienne avec le patient.
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const notes = await prisma.notePro.findMany({
      where: {
        clientId: session.user.id,
        partagePatient: true,
      } as any,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        auteur: { select: { prenom: true, nom: true } },
      },
    })

    const formatted = notes.map((n) => ({
      id: n.id,
      contenu: n.contenu,
      type: n.type,
      auteur: `${n.auteur.prenom} ${n.auteur.nom}`,
      createdAt: n.createdAt,
    }))

    return NextResponse.json({ compteRendus: formatted })
  } catch (error) {
    logger.error("Erreur GET comptes-rendus:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
