import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

const patchSchema = z.object({
  nom: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  visibilite: z.enum(["PUBLIC", "PRIVE", "SECRET"]).optional(),
  regles: z.string().max(2000).optional(),
  imageUrl: z.url().optional(),
  archivee: z.boolean().optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { id } = await params

  const groupe = await prisma.groupe.findUnique({
    where: { id },
    include: {
      membres: {
        include: { user: { select: { id: true, nom: true, prenom: true, email: true, photoUrl: true } } },
        orderBy: { createdAt: "asc" },
      },
      questions: { orderBy: { ordre: "asc" } },
      _count: { select: { posts: true, evenements: true } },
    },
  })

  if (!groupe) return NextResponse.json({ error: "Groupe non trouvé" }, { status: 404 })

  // Charger les demandes d'adhésion en attente (non approuvées)
  const demandesEnAttente = await prisma.membreGroupe.findMany({
    where: { groupeId: id, approuve: false },
    include: {
      user: { select: { id: true, nom: true, prenom: true, email: true, photoUrl: true } },
      reponses: { include: { question: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({
    ...groupe,
    nbPosts: groupe._count.posts,
    nbEvenements: groupe._count.evenements,
    demandesEnAttente: demandesEnAttente.map((d) => ({
      membreId: d.id,
      user: d.user,
      createdAt: d.createdAt,
      reponses: d.reponses.map((r) => ({
        question: r.question.texte,
        reponse: r.reponse,
      })),
    })),
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()

  // ── Action : approuver / refuser une demande d'adhésion ──
  if (body.action === "approuver" || body.action === "refuser") {
    const membreId = body.membreId as string | undefined
    if (!membreId) return NextResponse.json({ error: "membreId requis" }, { status: 400 })

    if (body.action === "approuver") {
      await prisma.membreGroupe.update({ where: { id: membreId }, data: { approuve: true } })
      return NextResponse.json({ ok: true, message: "Demande approuvée" })
    } else {
      await prisma.membreGroupe.delete({ where: { id: membreId } })
      return NextResponse.json({ ok: true, message: "Demande refusée" })
    }
  }

  // ── Action : changer le rôle d'un membre ──
  if (body.action === "changeRole") {
    const membreId = body.membreId as string | undefined
    const role = body.role as string | undefined
    if (!membreId || !["ADMIN", "MODERATEUR", "MEMBRE"].includes(role || "")) {
      return NextResponse.json({ error: "membreId et role (ADMIN|MODERATEUR|MEMBRE) requis" }, { status: 400 })
    }
    await prisma.membreGroupe.update({ where: { id: membreId }, data: { role: role as "ADMIN" | "MODERATEUR" | "MEMBRE" } })
    return NextResponse.json({ ok: true })
  }

  // ── Action : exclure un membre ──
  if (body.action === "kick") {
    const membreId = body.membreId as string | undefined
    if (!membreId) return NextResponse.json({ error: "membreId requis" }, { status: 400 })
    await prisma.membreGroupe.delete({ where: { id: membreId } })
    return NextResponse.json({ ok: true, message: "Membre exclu" })
  }

  // ── Action : créer une annonce ──
  if (body.action === "annonce") {
    const contenu = (body.contenu as string || "").trim()
    if (!contenu) return NextResponse.json({ error: "contenu requis" }, { status: 400 })

    const groupe = await prisma.groupe.findUnique({ where: { id } })
    if (!groupe) return NextResponse.json({ error: "Groupe non trouvé" }, { status: 404 })

    await prisma.post.create({
      data: {
        contenu,
        auteurId: session.user.id,
        groupeId: id,
        isAnnonce: true,
      },
    })
    return NextResponse.json({ ok: true, message: "Annonce publiée" })
  }

  // ── Sinon : mise à jour du groupe ──
  const result = z.safeParse(patchSchema, body)
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  const groupe = await prisma.groupe.update({ where: { id }, data: result.data })
  return NextResponse.json(groupe)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { id } = await params
  await prisma.groupe.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
