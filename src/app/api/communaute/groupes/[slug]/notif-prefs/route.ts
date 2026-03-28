import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

interface Params { params: Promise<{ slug: string }> }

// GET — Obtenir mes préférences de notification pour ce groupe
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { slug } = await params
  const groupe = await prisma.groupe.findUnique({ where: { slug }, select: { id: true } })
  if (!groupe) return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 })

  const pref = await prisma.notifPrefGroupe.findUnique({
    where: { groupeId_userId: { groupeId: groupe.id, userId: session.user.id } },
  })

  return NextResponse.json(pref || { niveau: "TOUTES" })
}

const prefSchema = z.object({
  niveau: z.enum(["TOUTES", "AMIS_SEULEMENT", "ANNONCES_SEULEMENT", "AUCUNE"]),
})

// PATCH — Modifier mes préférences de notification pour ce groupe
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { slug } = await params
  const groupe = await prisma.groupe.findUnique({ where: { slug }, select: { id: true } })
  if (!groupe) return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 })

  // Vérifier que l'utilisateur est membre
  const membre = await prisma.membreGroupe.findUnique({
    where: { groupeId_userId: { groupeId: groupe.id, userId: session.user.id } },
  })
  if (!membre || !membre.approuve) {
    return NextResponse.json({ error: "Vous devez être membre du groupe" }, { status: 403 })
  }

  const body = await req.json()
  const result = prefSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })

  const pref = await prisma.notifPrefGroupe.upsert({
    where: { groupeId_userId: { groupeId: groupe.id, userId: session.user.id } },
    create: {
      groupeId: groupe.id,
      userId: session.user.id,
      niveau: result.data.niveau,
    },
    update: {
      niveau: result.data.niveau,
    },
  })

  return NextResponse.json(pref)
}
