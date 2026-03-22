import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { creerNotification } from "@/lib/notifications"

interface Params { params: Promise<{ id: string }> }

// POST — S'inscrire / Se désinscrire d'un événement
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id: evenementId } = await params
  const { statut } = await req.json() // INSCRIT | INTERESSE | ANNULE

  const evenement = await prisma.evenement.findUnique({
    where: { id: evenementId },
    include: { _count: { select: { participations: true } } },
  })
  if (!evenement) {
    return NextResponse.json({ error: "Événement introuvable" }, { status: 404 })
  }

  const existing = await prisma.participationEvenement.findUnique({
    where: { evenementId_userId: { evenementId, userId: session.user.id } },
  })

  if (statut === "ANNULE" && existing) {
    await prisma.participationEvenement.delete({ where: { id: existing.id } })
    return NextResponse.json({ statut: null })
  }

  // Vérifier capacité max
  if (
    evenement.maxParticipants &&
    !existing &&
    statut === "INSCRIT" &&
    evenement._count.participations >= evenement.maxParticipants
  ) {
    return NextResponse.json({ error: "Événement complet" }, { status: 400 })
  }

  if (existing) {
    await prisma.participationEvenement.update({
      where: { id: existing.id },
      data: { statut: statut || "INSCRIT" },
    })
  } else {
    await prisma.participationEvenement.create({
      data: { evenementId, userId: session.user.id, statut: statut || "INSCRIT" },
    })
  }

  // Notifier le créateur de l'événement si quelqu'un s'inscrit
  if (statut !== "ANNULE" && evenement.createurId !== session.user.id) {
    try {
      const createurPrefs = await prisma.user.findUnique({
        where: { id: evenement.createurId },
        select: { notifEvenements: true },
      })
      if (createurPrefs?.notifEvenements) {
        const participant = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { prenom: true, nom: true },
        })
        await creerNotification({
          userId: evenement.createurId,
          type: "EVENEMENT_RAPPEL",
          titre: "Nouvelle inscription",
          message: `${participant?.prenom} ${participant?.nom} s'est inscrit(e) à "${evenement.titre}"`,
          lien: "/communaute/evenements",
        })
      }
    } catch { /* notification optionnelle */ }
  }

  return NextResponse.json({ statut: statut || "INSCRIT" })
}

// DELETE — Supprimer un événement
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id: evenementId } = await params

  const evenement = await prisma.evenement.findUnique({ where: { id: evenementId } })
  if (!evenement) {
    return NextResponse.json({ error: "Événement introuvable" }, { status: 404 })
  }

  if (evenement.createurId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  // Notifier les participants avant suppression
  try {
    const participations = await prisma.participationEvenement.findMany({
      where: { evenementId, userId: { not: session.user.id } },
      select: { userId: true },
    })
    for (const p of participations) {
      const prefs = await prisma.user.findUnique({
        where: { id: p.userId },
        select: { notifEvenements: true },
      })
      if (prefs?.notifEvenements) {
        await creerNotification({
          userId: p.userId,
          type: "EVENEMENT_RAPPEL",
          titre: "Événement annulé",
          message: `L'événement "${evenement.titre}" a été annulé`,
          lien: "/communaute/evenements",
        })
      }
    }
  } catch { /* notifications optionnelles */ }

  await prisma.evenement.delete({ where: { id: evenementId } })

  return NextResponse.json({ success: true })
}
