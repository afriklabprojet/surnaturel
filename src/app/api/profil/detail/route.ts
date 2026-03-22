import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

const profilDetailSchema = z.object({
  ville: z.string().max(100).optional(),
  languesParlees: z.array(z.string().max(50)).max(10).optional(),
  // Champs professionnels
  specialite: z.string().max(200).optional(),
  numeroOrdre: z.string().max(100).optional(),
  joursDisponibilite: z.array(z.string()).max(7).optional(),
  horairesDisponibilite: z.string().max(100).optional(),
  languesConsultation: z.array(z.string().max(50)).max(10).optional(),
})

// GET — Récupérer le profil détaillé de l'utilisateur courant
export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const detail = await prisma.profilDetail.findUnique({
    where: { userId: session.user.id },
  })

  return NextResponse.json(detail || {})
}

// PUT — Créer ou mettre à jour le profil détaillé
export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await req.json()
  const result = profilDetailSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
  }

  // Seuls les professionnels de santé vérifiés peuvent modifier les champs pro
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { verificationStatus: true },
  })

  const data: Record<string, unknown> = {
    ville: result.data.ville,
    languesParlees: result.data.languesParlees,
  }

  if (user?.verificationStatus === "PROFESSIONNEL_SANTE") {
    data.specialite = result.data.specialite
    data.numeroOrdre = result.data.numeroOrdre
    data.joursDisponibilite = result.data.joursDisponibilite
    data.horairesDisponibilite = result.data.horairesDisponibilite
    data.languesConsultation = result.data.languesConsultation
  }

  const detail = await prisma.profilDetail.upsert({
    where: { userId: session.user.id },
    update: data,
    create: { userId: session.user.id, ...data },
  })

  return NextResponse.json(detail)
}
