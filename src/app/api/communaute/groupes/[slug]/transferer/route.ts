import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"
import { creerNotification } from "@/lib/notifications"

interface Params { params: Promise<{ slug: string }> }

const transferSchema = z.object({
  nouveauProprietaireId: z.string().min(1),
})

// POST — Transférer la propriété du groupe (admin principal uniquement)
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { slug } = await params
  const groupe = await prisma.groupe.findUnique({ where: { slug }, select: { id: true, nom: true, slug: true } })
  if (!groupe) return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 })

  // Vérifier que le requester est admin du groupe
  const myMembership = await prisma.membreGroupe.findUnique({
    where: { groupeId_userId: { groupeId: groupe.id, userId: session.user.id } },
  })
  if (!myMembership || myMembership.role !== "ADMIN") {
    return NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 })
  }

  const body = await req.json()
  const result = transferSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })

  const { nouveauProprietaireId } = result.data

  if (nouveauProprietaireId === session.user.id) {
    return NextResponse.json({ error: "Vous êtes déjà le propriétaire" }, { status: 400 })
  }

  // Vérifier que le nouveau propriétaire est membre du groupe
  const newOwnerMember = await prisma.membreGroupe.findUnique({
    where: { groupeId_userId: { groupeId: groupe.id, userId: nouveauProprietaireId } },
  })
  if (!newOwnerMember || !newOwnerMember.approuve) {
    return NextResponse.json({ error: "L'utilisateur doit être un membre approuvé du groupe" }, { status: 400 })
  }

  // Transférer : promouvoir le nouveau propriétaire et rétrograder l'ancien
  await prisma.$transaction([
    // Promouvoir le nouveau propriétaire en ADMIN
    prisma.membreGroupe.update({
      where: { id: newOwnerMember.id },
      data: { role: "ADMIN" },
    }),
    // Rétrograder l'ancien propriétaire en MEMBRE
    prisma.membreGroupe.update({
      where: { id: myMembership.id },
      data: { role: "MEMBRE" },
    }),
    // Journal de modération
    prisma.journalModeration.create({
      data: {
        groupeId: groupe.id,
        moderateurId: session.user.id,
        action: "TRANSFERT_PROPRIETE",
        cibleUserId: nouveauProprietaireId,
        details: `Propriété transférée à l'utilisateur ${nouveauProprietaireId}`,
      },
    }),
  ])

  // Notifier le nouveau propriétaire
  try {
    await creerNotification({
      userId: nouveauProprietaireId,
      type: "INVITATION_GROUPE",
      titre: "Transfert de propriété",
      message: `Vous êtes maintenant propriétaire du groupe "${groupe.nom}"`,
      lien: `/communaute/groupes/${groupe.slug}`,
    })
  } catch { /* notification optionnelle */ }

  return NextResponse.json({ success: true })
}
