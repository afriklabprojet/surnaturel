import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface Params { params: Promise<{ slug: string; id: string }> }

// POST — Voter sur un sondage
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { slug, id: sondageId } = await params
  const groupe = await prisma.groupe.findUnique({ where: { slug } })
  if (!groupe) return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 })

  const membre = await prisma.membreGroupe.findUnique({
    where: { groupeId_userId: { groupeId: groupe.id, userId: session.user.id } },
  })
  if (!membre?.approuve) return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 })

  const sondage = await prisma.sondage.findFirst({
    where: { id: sondageId, groupeId: groupe.id },
    include: { options: true },
  })
  if (!sondage) return NextResponse.json({ error: "Sondage introuvable" }, { status: 404 })

  // Vérifier expiration
  if (sondage.expireAt && new Date(sondage.expireAt) < new Date()) {
    return NextResponse.json({ error: "Ce sondage est terminé" }, { status: 400 })
  }

  const { optionIds } = await req.json()
  if (!optionIds || !Array.isArray(optionIds) || optionIds.length === 0) {
    return NextResponse.json({ error: "Sélectionnez au moins une option" }, { status: 400 })
  }

  // Vérifier que les options appartiennent au sondage
  const validIds = sondage.options.map((o) => o.id)
  const filtered = optionIds.filter((id: string) => validIds.includes(id))
  if (filtered.length === 0) return NextResponse.json({ error: "Options invalides" }, { status: 400 })

  // Si pas multi-choix, limiter à 1
  const toVote = sondage.multiChoix ? filtered : [filtered[0]]

  // Supprimer les votes existants de cet utilisateur sur ce sondage
  await prisma.voteSondage.deleteMany({
    where: {
      userId: session.user.id,
      option: { sondageId: sondage.id },
    },
  })

  // Créer les nouveaux votes
  await prisma.voteSondage.createMany({
    data: toVote.map((optionId: string) => ({
      optionId,
      userId: session.user.id,
    })),
  })

  return NextResponse.json({ success: true })
}

// DELETE — Supprimer un sondage (créateur ou admin/modérateur)
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { slug, id: sondageId } = await params
  const groupe = await prisma.groupe.findUnique({ where: { slug } })
  if (!groupe) return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 })

  const membre = await prisma.membreGroupe.findUnique({
    where: { groupeId_userId: { groupeId: groupe.id, userId: session.user.id } },
  })
  if (!membre?.approuve) return NextResponse.json({ error: "Accès interdit" }, { status: 403 })

  const sondage = await prisma.sondage.findFirst({
    where: { id: sondageId, groupeId: groupe.id },
  })
  if (!sondage) return NextResponse.json({ error: "Sondage introuvable" }, { status: 404 })

  // Seul le créateur ou un admin/modérateur peut supprimer
  if (sondage.createurId !== session.user.id && !["ADMIN", "MODERATEUR"].includes(membre.role)) {
    return NextResponse.json({ error: "Permission insuffisante" }, { status: 403 })
  }

  await prisma.sondage.delete({ where: { id: sondage.id } })

  return NextResponse.json({ success: true })
}
