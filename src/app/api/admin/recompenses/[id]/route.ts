import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const updateRecompenseSchema = z.object({
  nom: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  pointsRequis: z.number().min(1).optional(),
  type: z.enum(["REDUCTION", "SOIN_GRATUIT", "PRODUIT", "EXPERIENCE", "AUTRE"]).optional(),
  valeur: z.number().optional().nullable(),
  imageUrl: z.string().url().optional().or(z.literal("")).nullable(),
  stock: z.number().min(0).optional().nullable(),
  actif: z.boolean().optional(),
})

// GET /api/admin/recompenses/[id]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const recompense = await prisma.recompense.findUnique({
      where: { id },
      include: {
        echanges: {
          include: { user: { select: { nom: true, prenom: true, email: true } } },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        _count: { select: { echanges: true } },
      },
    })

    if (!recompense) {
      return NextResponse.json({ error: "Récompense non trouvée" }, { status: 404 })
    }

    return NextResponse.json(recompense)
  } catch (error) {
    console.error("Erreur récupération récompense:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// PATCH /api/admin/recompenses/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = updateRecompenseSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.issues },
        { status: 400 }
      )
    }

    const recompense = await prisma.recompense.update({
      where: { id },
      data: parsed.data,
    })

    return NextResponse.json({ success: true, recompense })
  } catch (error) {
    console.error("Erreur mise à jour récompense:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// DELETE /api/admin/recompenses/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    // Vérifier s'il y a des échanges actifs
    const echangesActifs = await prisma.echangeRecompense.count({
      where: { recompenseId: id, statut: "EN_COURS" },
    })

    if (echangesActifs > 0) {
      return NextResponse.json(
        { 
          error: "Impossible de supprimer cette récompense",
          message: `${echangesActifs} échange(s) actif(s) en cours`,
        },
        { status: 400 }
      )
    }

    // Supprimer les échanges expirés/utilisés d'abord
    await prisma.echangeRecompense.deleteMany({
      where: { recompenseId: id },
    })

    await prisma.recompense.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur suppression récompense:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
