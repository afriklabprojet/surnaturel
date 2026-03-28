import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

interface Params { params: Promise<{ slug: string }> }

// GET — Obtenir mots bloqués + paramètres de modération
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { slug } = await params
  const groupe = await prisma.groupe.findUnique({ where: { slug } })
  if (!groupe) return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 })

  const membre = await prisma.membreGroupe.findUnique({
    where: { groupeId_userId: { groupeId: groupe.id, userId: session.user.id } },
  })
  if (!membre || !["ADMIN", "MODERATEUR"].includes(membre.role)) {
    return NextResponse.json({ error: "Réservé aux administrateurs et modérateurs" }, { status: 403 })
  }

  const motsBloques = await prisma.motBloque.findMany({
    where: { groupeId: groupe.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({
    approvalRequired: groupe.approvalRequired,
    motsBloques,
  })
}

// POST — Ajouter un mot bloqué
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { slug } = await params
  const groupe = await prisma.groupe.findUnique({ where: { slug } })
  if (!groupe) return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 })

  const membre = await prisma.membreGroupe.findUnique({
    where: { groupeId_userId: { groupeId: groupe.id, userId: session.user.id } },
  })
  if (!membre || !["ADMIN", "MODERATEUR"].includes(membre.role)) {
    return NextResponse.json({ error: "Réservé aux administrateurs et modérateurs" }, { status: 403 })
  }

  const schema = z.object({
    mot: z.string().min(2).max(100).transform(s => s.toLowerCase().trim()),
    action: z.enum(["supprimer", "signaler"]).optional().default("supprimer"),
  })

  const body = await req.json()
  const result = schema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })

  // Vérifier doublon
  const existing = await prisma.motBloque.findUnique({
    where: { groupeId_mot: { groupeId: groupe.id, mot: result.data.mot } },
  })
  if (existing) return NextResponse.json({ error: "Ce mot est déjà bloqué" }, { status: 409 })

  const motBloque = await prisma.motBloque.create({
    data: { groupeId: groupe.id, mot: result.data.mot, action: result.data.action },
  })

  return NextResponse.json(motBloque, { status: 201 })
}

// PATCH — Toggle approbation des publications
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

  const { approvalRequired } = await req.json()
  if (typeof approvalRequired !== "boolean") {
    return NextResponse.json({ error: "Valeur invalide" }, { status: 400 })
  }

  await prisma.groupe.update({
    where: { slug },
    data: { approvalRequired },
  })

  return NextResponse.json({ approvalRequired })
}

// DELETE — Supprimer un mot bloqué
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { slug } = await params
  const groupe = await prisma.groupe.findUnique({ where: { slug } })
  if (!groupe) return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 })

  const membre = await prisma.membreGroupe.findUnique({
    where: { groupeId_userId: { groupeId: groupe.id, userId: session.user.id } },
  })
  if (!membre || !["ADMIN", "MODERATEUR"].includes(membre.role)) {
    return NextResponse.json({ error: "Réservé aux administrateurs et modérateurs" }, { status: 403 })
  }

  const { motId } = await req.json()
  if (!motId) return NextResponse.json({ error: "motId requis" }, { status: 400 })

  await prisma.motBloque.deleteMany({
    where: { id: motId, groupeId: groupe.id },
  })

  return NextResponse.json({ success: true })
}
