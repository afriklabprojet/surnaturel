import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

interface Params { params: Promise<{ slug: string }> }

// GET — Liste des règles du groupe
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { slug } = await params
  const groupe = await prisma.groupe.findUnique({ where: { slug }, select: { id: true } })
  if (!groupe) return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 })

  const regles = await prisma.regleGroupe.findMany({
    where: { groupeId: groupe.id },
    orderBy: { ordre: "asc" },
  })

  return NextResponse.json(regles)
}

const regleSchema = z.object({
  titre: z.string().min(1).max(200),
  contenu: z.string().min(1).max(2000),
  ordre: z.number().int().min(0).optional(),
})

// POST — Créer une règle (admin uniquement)
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
  const result = regleSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })

  // Si pas d'ordre spécifié, ajouter à la fin
  let ordre = result.data.ordre
  if (ordre === undefined) {
    const last = await prisma.regleGroupe.findFirst({
      where: { groupeId: groupe.id },
      orderBy: { ordre: "desc" },
      select: { ordre: true },
    })
    ordre = (last?.ordre ?? -1) + 1
  }

  const regle = await prisma.regleGroupe.create({
    data: {
      groupeId: groupe.id,
      titre: result.data.titre,
      contenu: result.data.contenu,
      ordre,
    },
  })

  await prisma.journalModeration.create({
    data: {
      groupeId: groupe.id,
      moderateurId: session.user.id,
      action: "REGLE_AJOUTEE",
      details: `Règle ajoutée : ${result.data.titre}`,
    },
  })

  return NextResponse.json(regle, { status: 201 })
}

// PATCH — Modifier une règle (admin uniquement)
export async function PATCH(req: NextRequest, { params }: Params) {
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
  const { id, ...rest } = body
  if (!id) return NextResponse.json({ error: "ID de la règle requis" }, { status: 400 })

  const updateSchema = z.object({
    titre: z.string().min(1).max(200).optional(),
    contenu: z.string().min(1).max(2000).optional(),
    ordre: z.number().int().min(0).optional(),
  })

  const result = updateSchema.safeParse(rest)
  if (!result.success) return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })

  const regle = await prisma.regleGroupe.findFirst({
    where: { id, groupeId: groupe.id },
  })
  if (!regle) return NextResponse.json({ error: "Règle introuvable" }, { status: 404 })

  const updated = await prisma.regleGroupe.update({
    where: { id },
    data: result.data,
  })

  return NextResponse.json(updated)
}

// DELETE — Supprimer une règle (admin uniquement)
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
  if (!id) return NextResponse.json({ error: "ID de la règle requis" }, { status: 400 })

  const regle = await prisma.regleGroupe.findFirst({
    where: { id, groupeId: groupe.id },
  })
  if (!regle) return NextResponse.json({ error: "Règle introuvable" }, { status: 404 })

  await prisma.regleGroupe.delete({ where: { id } })

  await prisma.journalModeration.create({
    data: {
      groupeId: groupe.id,
      moderateurId: session.user.id,
      action: "REGLE_SUPPRIMEE",
      details: `Règle supprimée : ${regle.titre}`,
    },
  })

  return NextResponse.json({ success: true })
}
