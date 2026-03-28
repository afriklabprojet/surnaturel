import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

interface Params { params: Promise<{ slug: string }> }

// GET — Liste des badges du groupe
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { slug } = await params
  const groupe = await prisma.groupe.findUnique({ where: { slug }, select: { id: true, badgesActifs: true } })
  if (!groupe) return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 })

  if (!groupe.badgesActifs) {
    return NextResponse.json({ error: "Les badges sont désactivés pour ce groupe" }, { status: 400 })
  }

  const badges = await prisma.badgeGroupe.findMany({
    where: { groupeId: groupe.id },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(badges)
}

const badgeSchema = z.object({
  nom: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  icone: z.string().max(10).optional(),
  automatique: z.boolean().optional(),
  critere: z.string().max(500).optional(),
})

// POST — Créer un badge personnalisé (admin uniquement)
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { slug } = await params
  const groupe = await prisma.groupe.findUnique({ where: { slug }, select: { id: true } })
  if (!groupe) return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 })

  const membre = await prisma.membreGroupe.findUnique({
    where: { groupeId_userId: { groupeId: groupe.id, userId: session.user.id } },
  })
  if (!membre || membre.role !== "ADMIN") {
    return NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 })
  }

  const body = await req.json()
  const result = badgeSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })

  const badge = await prisma.badgeGroupe.create({
    data: {
      groupeId: groupe.id,
      nom: result.data.nom,
      description: result.data.description,
      icone: result.data.icone,
      automatique: result.data.automatique ?? false,
      critere: result.data.critere,
    },
  })

  return NextResponse.json(badge, { status: 201 })
}

// PATCH — Attribuer/retirer un badge à un membre ou modifier un badge
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { slug } = await params
  const groupe = await prisma.groupe.findUnique({ where: { slug }, select: { id: true } })
  if (!groupe) return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 })

  const membre = await prisma.membreGroupe.findUnique({
    where: { groupeId_userId: { groupeId: groupe.id, userId: session.user.id } },
  })
  if (!membre || !["ADMIN", "MODERATEUR"].includes(membre.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const body = await req.json()

  // Attribuer un badge à un membre
  if (body.action === "attribuer") {
    const { userId, badgeNom } = body
    if (!userId || !badgeNom) {
      return NextResponse.json({ error: "userId et badgeNom requis" }, { status: 400 })
    }

    const targetMembre = await prisma.membreGroupe.findUnique({
      where: { groupeId_userId: { groupeId: groupe.id, userId } },
    })
    if (!targetMembre || !targetMembre.approuve) {
      return NextResponse.json({ error: "Membre introuvable" }, { status: 404 })
    }

    await prisma.membreGroupe.update({
      where: { id: targetMembre.id },
      data: { badge: badgeNom },
    })

    return NextResponse.json({ success: true })
  }

  // Retirer un badge d'un membre
  if (body.action === "retirer") {
    const { userId } = body
    if (!userId) return NextResponse.json({ error: "userId requis" }, { status: 400 })

    const targetMembre = await prisma.membreGroupe.findUnique({
      where: { groupeId_userId: { groupeId: groupe.id, userId } },
    })
    if (!targetMembre) return NextResponse.json({ error: "Membre introuvable" }, { status: 404 })

    await prisma.membreGroupe.update({
      where: { id: targetMembre.id },
      data: { badge: null },
    })

    return NextResponse.json({ success: true })
  }

  // Modifier un badge existant
  if (body.action === "modifier" && body.id) {
    const updateSchema = z.object({
      nom: z.string().min(1).max(100).optional(),
      description: z.string().max(500).optional(),
      icone: z.string().max(10).optional(),
      automatique: z.boolean().optional(),
      critere: z.string().max(500).optional(),
    })
    const result = updateSchema.safeParse(body)
    if (!result.success) return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })

    const badge = await prisma.badgeGroupe.findFirst({ where: { id: body.id, groupeId: groupe.id } })
    if (!badge) return NextResponse.json({ error: "Badge introuvable" }, { status: 404 })

    const updated = await prisma.badgeGroupe.update({
      where: { id: body.id },
      data: result.data,
    })

    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: "Action non reconnue" }, { status: 400 })
}

// DELETE — Supprimer un badge
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { slug } = await params
  const groupe = await prisma.groupe.findUnique({ where: { slug }, select: { id: true } })
  if (!groupe) return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 })

  const membre = await prisma.membreGroupe.findUnique({
    where: { groupeId_userId: { groupeId: groupe.id, userId: session.user.id } },
  })
  if (!membre || membre.role !== "ADMIN") {
    return NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID du badge requis" }, { status: 400 })

  const badge = await prisma.badgeGroupe.findFirst({ where: { id, groupeId: groupe.id } })
  if (!badge) return NextResponse.json({ error: "Badge introuvable" }, { status: 404 })

  // Retirer ce badge de tous les membres qui le portent
  await prisma.membreGroupe.updateMany({
    where: { groupeId: groupe.id, badge: badge.nom },
    data: { badge: null },
  })

  await prisma.badgeGroupe.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
