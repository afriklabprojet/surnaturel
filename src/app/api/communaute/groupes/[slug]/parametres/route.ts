import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

interface Params { params: Promise<{ slug: string }> }

// PATCH — Modifier les paramètres du groupe (admin uniquement)
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { slug } = await params
  const groupe = await prisma.groupe.findUnique({ where: { slug } })
  if (!groupe) return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 })

  const membre = await prisma.membreGroupe.findUnique({
    where: { groupeId_userId: { groupeId: groupe.id, userId: session.user.id } },
  })
  if (!membre || membre.role !== "ADMIN") {
    return NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 })
  }

  const schema = z.object({
    nom: z.string().min(3).max(100).optional(),
    description: z.string().max(1000).optional(),
    imageUrl: z.string().url().optional().or(z.literal("")),
    visibilite: z.enum(["PUBLIC", "PRIVE", "SECRET"]).optional(),
    regles: z.string().max(2000).optional(),
    categorie: z.enum(["SANTE", "BIEN_ETRE", "SPORT", "EDUCATION", "BUSINESS", "FAMILLE", "CULTURE", "SPIRITUALITE", "AUTRE"]).optional(),
    approvalRequired: z.boolean().optional(),
    tags: z.array(z.string().max(50)).max(10).optional(),
    quiPeutPublier: z.enum(["TOUS", "ADMINS_SEULEMENT"]).optional(),
    quiPeutCommenter: z.enum(["TOUS", "MEMBRES_SEULEMENT"]).optional(),
    reactionsActivees: z.boolean().optional(),
    invitationsParMembres: z.boolean().optional(),
    suggestionsActivees: z.boolean().optional(),
    partagesExternes: z.boolean().optional(),
    slowModeMinutes: z.number().int().min(0).max(1440).optional(),
    badgesActifs: z.boolean().optional(),
  })

  const body = await req.json()
  const result = schema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })

  const data = result.data
  // Si imageUrl vide → null
  if (data.imageUrl === "") data.imageUrl = undefined

  const updated = await prisma.groupe.update({
    where: { slug },
    data: {
      ...data,
      imageUrl: data.imageUrl === "" ? null : data.imageUrl,
    },
  })

  return NextResponse.json(updated)
}
