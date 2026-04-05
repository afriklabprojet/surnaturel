import { typedLogger as logger } from "@/lib/logger"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { encrypt, decrypt } from "@/lib/crypto"

const ALLOWED_ROLES = ["CLIENT", "ACCOMPAGNATEUR_MEDICAL", "ADMIN"]

const QuestionnaireSchema = z.object({
  typeSoin: z.string().max(100).optional(),
  motif: z.string().min(3).max(2000),
  antecedents: z.string().max(3000).optional(),
  medicaments: z.string().max(2000).optional(),
  allergies: z.string().max(1000).optional(),
  ddr: z.string().max(20).optional(),   // date dernières règles YYYY-MM-DD
  parite: z.string().max(20).optional(), // ex: "G2P1"
  autresInfos: z.string().max(3000).optional(),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const questionnaires = await (prisma as any).questionnairePreConsultation.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    })

    const decrypted = questionnaires.map((q) => ({
      id: q.id,
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

    return NextResponse.json({ questionnaires: decrypted })
  } catch (error) {
    logger.error("Erreur GET questionnaire:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = QuestionnaireSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data

    const questionnaire = await (prisma as any).questionnairePreConsultation.create({
      data: {
        userId: session.user.id,
        typeSoin: data.typeSoin ?? null,
        motif: encrypt(data.motif),
        antecedents: data.antecedents ? encrypt(data.antecedents) : null,
        medicaments: data.medicaments ? encrypt(data.medicaments) : null,
        allergies: data.allergies ? encrypt(data.allergies) : null,
        ddr: data.ddr ? encrypt(data.ddr) : null,
        parite: data.parite ?? null,
        autresInfos: data.autresInfos ? encrypt(data.autresInfos) : null,
      },
    })

    // Notification praticienne (silencieuse)
    try {
      const admin = await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } })
      if (admin) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            titre: "Nouveau questionnaire pré-consultation",
            message: `${session.user.prenom} ${session.user.nom} a rempli un questionnaire.`,
            type: "NOUVEAU_MESSAGE" as any,
            lien: `/admin/sage-femme?tab=questionnaires`,
          },
        })
      }
    } catch {
      // non bloquant
    }

    return NextResponse.json({ questionnaire }, { status: 201 })
  } catch (error) {
    logger.error("Erreur POST questionnaire:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
