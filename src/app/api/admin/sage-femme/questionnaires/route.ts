import { typedLogger as logger } from "@/lib/logger"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/crypto"

/**
 * GET /api/admin/sage-femme/questionnaires
 * Liste les questionnaires pré-consultation non traités (ou tous avec ?all=1).
 */
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SAGE_FEMME")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const all = searchParams.get("all") === "1"

    const questionnaires = await (prisma as any).questionnairePreConsultation.findMany({
      where: all ? {} : { traite: false },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { id: true, prenom: true, nom: true, telephone: true, email: true } },
      },
    })

    const formatted = questionnaires.map((q) => ({
      id: q.id,
      patient: { id: q.user.id, prenom: q.user.prenom, nom: q.user.nom, telephone: q.user.telephone, email: q.user.email },
      typeSoin: q.typeSoin,
      motif: decrypt(q.motif),
      antecedents: q.antecedents ? decrypt(q.antecedents) : null,
      medicaments: q.medicaments ? decrypt(q.medicaments) : null,
      allergies: q.allergies ? decrypt(q.allergies) : null,
      ddr: q.ddr ? decrypt(q.ddr) : null,
      parite: q.parite,
      autresInfos: q.autresInfos ? decrypt(q.autresInfos) : null,
      traite: q.traite,
      createdAt: q.createdAt,
    }))

    return NextResponse.json({ questionnaires: formatted })
  } catch (error) {
    logger.error("Erreur GET questionnaires admin:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SAGE_FEMME")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id, traite } = await request.json()
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 })

    const questionnaire = await (prisma as any).questionnairePreConsultation.update({
      where: { id },
      data: { traite: traite ?? true },
    })

    return NextResponse.json({ questionnaire: { id: questionnaire.id, traite: questionnaire.traite } })
  } catch (error) {
    logger.error("Erreur PATCH questionnaire admin:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
