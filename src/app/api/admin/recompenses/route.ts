import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const recompenseSchema = z.object({
  nom: z.string().min(1, "Nom requis"),
  description: z.string().min(1, "Description requise"),
  pointsRequis: z.number().min(1, "Points minimum: 1"),
  type: z.enum(["REDUCTION", "SOIN_GRATUIT", "PRODUIT", "EXPERIENCE", "AUTRE"]),
  valeur: z.number().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  stock: z.number().min(0).optional().nullable(),
  actif: z.boolean().default(true),
})

// GET /api/admin/recompenses — Liste toutes les récompenses (admin)
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Vérifier le rôle admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const recompenses = await prisma.recompense.findMany({
      orderBy: { pointsRequis: "asc" },
      include: {
        _count: {
          select: { echanges: true },
        },
      },
    })

    // Stats globales
    const totalEchanges = await prisma.echangeRecompense.count()
    const pointsDepenses = await prisma.echangeRecompense.aggregate({
      _sum: { pointsUtilises: true },
    })

    return NextResponse.json({
      recompenses,
      stats: {
        totalRecompenses: recompenses.length,
        actives: recompenses.filter((r) => r.actif).length,
        totalEchanges,
        pointsDepenses: pointsDepenses._sum.pointsUtilises ?? 0,
      },
    })
  } catch (error) {
    console.error("Erreur récupération récompenses admin:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST /api/admin/recompenses — Créer une récompense
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Vérifier le rôle admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = recompenseSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.issues },
        { status: 400 }
      )
    }

    const data = parsed.data
    const recompense = await prisma.recompense.create({
      data: {
        nom: data.nom,
        description: data.description,
        pointsRequis: data.pointsRequis,
        type: data.type,
        valeur: data.valeur,
        imageUrl: data.imageUrl || null,
        stock: data.stock,
        actif: data.actif,
      },
    })

    return NextResponse.json({ success: true, recompense }, { status: 201 })
  } catch (error) {
    console.error("Erreur création récompense:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
