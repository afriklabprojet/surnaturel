import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

const preferencesSchema = z.object({
  intention: z.enum(["AMITIE", "RELATION_SERIEUSE", "MARIAGE"]).optional(),
  ageMin: z.number().int().min(18).max(99).optional(),
  ageMax: z.number().int().min(18).max(99).optional(),
  distanceKm: z.number().int().min(1).max(500).optional(),
  actif: z.boolean().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const pref = await prisma.rencontrePreference.findUnique({
    where: { userId: session.user.id },
  })

  return NextResponse.json(pref ?? null)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 })
  }

  const result = preferencesSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: "Données invalides", details: z.prettifyError(result.error) },
      { status: 400 }
    )
  }

  const { ageMin, ageMax } = result.data
  if (ageMin !== undefined && ageMax !== undefined && ageMin > ageMax) {
    return NextResponse.json(
      { error: "L'âge minimum doit être inférieur à l'âge maximum" },
      { status: 400 }
    )
  }

  const pref = await prisma.rencontrePreference.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...result.data },
    update: result.data,
  })

  return NextResponse.json(pref)
}
