import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

/* ━━━━━━━━━━ GET — Liste des professionnels avec stats ━━━━━━━━━━ */

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get("page") || 1))
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 20)))
  const search = searchParams.get("search")?.trim()
  const roleFilter = searchParams.get("role") // SAGE_FEMME, ACCOMPAGNATEUR_MEDICAL, ADMIN, or null (all)

  const roles = roleFilter
    ? [roleFilter]
    : ["SAGE_FEMME", "ADMIN", "ACCOMPAGNATEUR_MEDICAL"]

  const where: Record<string, unknown> = {
    role: { in: roles },
  }
  if (search) {
    where.OR = [
      { nom: { contains: search, mode: "insensitive" } },
      { prenom: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ]
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        photoUrl: true,
        role: true,
        verificationStatus: true,
        createdAt: true,
        profilDetail: true,
        _count: {
          select: {
            rendezVous: true,
            messagesMedicauxEnvoyes: true,
          },
        },
      },
      orderBy: { nom: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ])

  return NextResponse.json({ users, total })
}

/* ━━━━━━━━━━ PUT — Mise à jour profil professionnel ━━━━━━━━━━ */

const updateSchema = z.object({
  userId: z.string(),
  specialite: z.string().optional(),
  numeroOrdre: z.string().optional(),
  joursDisponibilite: z.array(z.string()).optional(),
  horairesDisponibilite: z.string().optional(),
  languesConsultation: z.array(z.string()).optional(),
})

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await req.json()
  const result = z.safeParse(updateSchema, body)
  if (!result.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 })
  }

  const { userId, ...data } = result.data

  const profil = await prisma.profilDetail.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  })

  return NextResponse.json(profil)
}

/* ━━━━━━━━━━ PATCH — Changement de rôle et vérification ━━━━━━━━━━ */

const patchSchema = z.object({
  userId: z.string(),
  action: z.enum(["changeRole", "changeVerification"]),
  role: z.enum(["ADMIN", "SAGE_FEMME", "ACCOMPAGNATEUR_MEDICAL", "CLIENT"]).optional(),
  verificationStatus: z.enum(["AUCUNE", "MEMBRE_VERIFIE", "PROFESSIONNEL_SANTE"]).optional(),
})

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await req.json()
  const result = z.safeParse(patchSchema, body)
  if (!result.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 })
  }

  const { userId, action, role, verificationStatus } = result.data

  // Empêcher l'admin de se dégrader lui-même
  if (userId === session.user.id && action === "changeRole" && role !== "ADMIN") {
    return NextResponse.json({ error: "Vous ne pouvez pas modifier votre propre rôle" }, { status: 403 })
  }

  if (action === "changeRole" && role) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role: role as "ADMIN" | "SAGE_FEMME" | "ACCOMPAGNATEUR_MEDICAL" | "CLIENT" },
      select: { id: true, nom: true, prenom: true, role: true, verificationStatus: true },
    })
    return NextResponse.json(user)
  }

  if (action === "changeVerification" && verificationStatus) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { verificationStatus: verificationStatus as "AUCUNE" | "MEMBRE_VERIFIE" | "PROFESSIONNEL_SANTE" },
      select: { id: true, nom: true, prenom: true, role: true, verificationStatus: true },
    })
    return NextResponse.json(user)
  }

  return NextResponse.json({ error: "Action invalide" }, { status: 400 })
}
