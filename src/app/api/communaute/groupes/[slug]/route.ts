import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

interface Params { params: Promise<{ slug: string }> }

// GET — Détail d'un groupe
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { slug } = await params

  const groupe = await prisma.groupe.findUnique({
    where: { slug },
    include: {
      membres: {
        where: { approuve: true },
        include: {
          user: {
            select: { id: true, nom: true, prenom: true, pseudo: true, photoUrl: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      evenements: {
        where: { dateDebut: { gte: new Date() } },
        orderBy: { dateDebut: "asc" },
        take: 5,
      },
      questions: { orderBy: { ordre: "asc" }, select: { id: true, texte: true, ordre: true } },
      _count: { select: { membres: { where: { approuve: true } }, posts: true } },
    },
  })

  if (!groupe) {
    return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 })
  }

  // Vérifier accès si secret
  const membership = groupe.membres.find((m) => m.userId === session.user.id)
  if (groupe.visibilite === "SECRET" && !membership) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  // Compter les demandes en attente (admin/modérateur)
  let pendingCount = 0
  if (membership && ["ADMIN", "MODERATEUR"].includes(membership.role)) {
    pendingCount = await prisma.membreGroupe.count({
      where: { groupeId: groupe.id, approuve: false },
    })
  }

  // Vérifier également l'adhésion non-approuvée
  let isPending = false
  if (!membership) {
    const pendingMembership = await prisma.membreGroupe.findUnique({
      where: { groupeId_userId: { groupeId: groupe.id, userId: session.user.id } },
    })
    isPending = !!pendingMembership && !pendingMembership.approuve
  }

  return NextResponse.json({
    ...groupe,
    isMember: !!membership,
    isPending,
    myRole: membership?.role ?? null,
    membresCount: groupe._count.membres,
    postsCount: groupe._count.posts,
    pendingCount,
  })
}

// PATCH — Modifier un groupe (admin uniquement)
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { slug } = await params
  const groupe = await prisma.groupe.findUnique({ where: { slug } })
  if (!groupe) {
    return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 })
  }

  const membership = await prisma.membreGroupe.findUnique({
    where: { groupeId_userId: { groupeId: groupe.id, userId: session.user.id } },
  })
  if (!membership || membership.role !== "ADMIN") {
    return NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 })
  }

  const updateSchema = z.object({
    nom: z.string().min(3).max(100).optional(),
    description: z.string().max(1000).optional(),
    imageUrl: z.string().url().optional(),
    visibilite: z.enum(["PUBLIC", "PRIVE", "SECRET"]).optional(),
    regles: z.string().max(2000).optional(),
  })

  const body = await req.json()
  const result = updateSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
  }

  const updated = await prisma.groupe.update({
    where: { slug },
    data: result.data,
  })

  return NextResponse.json(updated)
}

// DELETE — Supprimer un groupe (admin uniquement)
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { slug } = await params
  const groupe = await prisma.groupe.findUnique({ where: { slug } })
  if (!groupe) {
    return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 })
  }

  const membership = await prisma.membreGroupe.findUnique({
    where: { groupeId_userId: { groupeId: groupe.id, userId: session.user.id } },
  })
  if (!membership || membership.role !== "ADMIN") {
    return NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 })
  }

  await prisma.groupe.delete({ where: { slug } })

  return NextResponse.json({ success: true })
}
