import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notifierRDVAnnule } from "@/lib/notifications"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id } = await params

  const rdv = await prisma.rendezVous.findUnique({
    where: { id },
    include: { soin: { select: { nom: true, duree: true, prix: true } } },
  })

  if (!rdv) {
    return NextResponse.json({ error: "Rendez-vous introuvable." }, { status: 404 })
  }

  if (rdv.userId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 })
  }

  return NextResponse.json({
    rdv: {
      id: rdv.id,
      soin: rdv.soin.nom,
      date: rdv.dateHeure,
      duree: rdv.soin.duree,
      prix: rdv.soin.prix,
      statut: rdv.statut,
      notes: rdv.notes,
    },
  })
}

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id } = await params

  const rdv = await prisma.rendezVous.findUnique({
    where: { id },
    include: { soin: { select: { nom: true } } },
  })

  if (!rdv) {
    return NextResponse.json(
      { error: "Rendez-vous introuvable." },
      { status: 404 }
    )
  }

  // Vérifier que le RDV appartient à l'utilisateur
  if (rdv.userId !== session.user.id) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 })
  }

  // Vérifier que le statut est EN_ATTENTE
  if (rdv.statut !== "EN_ATTENTE") {
    return NextResponse.json(
      { error: "Seuls les rendez-vous en attente peuvent être annulés." },
      { status: 400 }
    )
  }

  // Vérifier que la date est dans plus de 24h
  const maintenant = new Date()
  const delai24h = new Date(maintenant.getTime() + 24 * 60 * 60 * 1000)
  if (rdv.dateHeure <= delai24h) {
    return NextResponse.json(
      {
        error:
          "L'annulation n'est possible que jusqu'à 24h avant le rendez-vous.",
      },
      { status: 400 }
    )
  }

  await prisma.rendezVous.update({
    where: { id },
    data: { statut: "ANNULE" },
  })

  // Notification in-app
  try {
    await notifierRDVAnnule(session.user.id, rdv.soin.nom)
  } catch { /* notification optionnelle */ }

  return NextResponse.json({ message: "Rendez-vous annulé avec succès." })
}
