import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

interface Params { params: Promise<{ slug: string }> }

// GET — Liste des sondages du groupe
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { slug } = await params
  const groupe = await prisma.groupe.findUnique({ where: { slug } })
  if (!groupe) return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 })

  // Vérifier que l'utilisateur est membre
  const membre = await prisma.membreGroupe.findUnique({
    where: { groupeId_userId: { groupeId: groupe.id, userId: session.user.id } },
  })
  if (!membre?.approuve) return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 })

  const sondages = await prisma.sondage.findMany({
    where: { groupeId: groupe.id },
    include: {
      options: {
        include: { votes: { select: { userId: true } } },
        orderBy: { ordre: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Ajouter les statistiques de votes
  const result = sondages.map((s) => {
    const totalVotes = s.options.reduce((sum, o) => sum + o.votes.length, 0)
    return {
      ...s,
      totalVotes,
      options: s.options.map((o) => ({
        id: o.id,
        texte: o.texte,
        ordre: o.ordre,
        votesCount: o.votes.length,
        pourcentage: totalVotes > 0 ? Math.round((o.votes.length / totalVotes) * 100) : 0,
        aVote: o.votes.some((v) => v.userId === session.user.id),
        // Masquer les votants si sondage anonyme
        ...(s.anonyme ? {} : { votants: o.votes.map((v) => v.userId) }),
      })),
      hasVoted: s.options.some((o) => o.votes.some((v) => v.userId === session.user.id)),
      isExpired: s.expireAt ? new Date(s.expireAt) < new Date() : false,
    }
  })

  return NextResponse.json({ sondages: result })
}

// POST — Créer un sondage
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { slug } = await params
  const groupe = await prisma.groupe.findUnique({ where: { slug } })
  if (!groupe) return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 })

  const membre = await prisma.membreGroupe.findUnique({
    where: { groupeId_userId: { groupeId: groupe.id, userId: session.user.id } },
  })
  if (!membre?.approuve) return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 })

  const schema = z.object({
    question: z.string().min(3).max(500),
    options: z.array(z.string().min(1).max(200)).min(2).max(10),
    multiChoix: z.boolean().optional().default(false),
    anonyme: z.boolean().optional().default(false),
    dureeHeures: z.number().int().min(1).max(168).optional(), // Max 1 semaine
  })

  const body = await req.json()
  const result = schema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })

  const { question, options, multiChoix, anonyme, dureeHeures } = result.data

  const sondage = await prisma.sondage.create({
    data: {
      groupeId: groupe.id,
      createurId: session.user.id,
      question,
      multiChoix,
      anonyme,
      expireAt: dureeHeures ? new Date(Date.now() + dureeHeures * 3600000) : undefined,
      options: {
        create: options.map((texte, i) => ({ texte, ordre: i })),
      },
    },
    include: {
      options: { orderBy: { ordre: "asc" } },
    },
  })

  return NextResponse.json(sondage, { status: 201 })
}
