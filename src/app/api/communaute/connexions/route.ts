import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { creerNotification } from "@/lib/notifications"

// GET — Liste des connexions et demandes
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type") || "all" // all | pending | sent

  const userId = session.user.id
  const select = {
    id: true,
    nom: true,
    prenom: true,
    pseudo: true,
    photoUrl: true,
    bio: true,
    statutProfil: true,
  }

  if (type === "pending") {
    const demandes = await prisma.connexion.findMany({
      where: { destinataireId: userId, statut: "EN_ATTENTE" },
      include: { demandeur: { select } },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ demandes })
  }

  if (type === "sent") {
    const envoyees = await prisma.connexion.findMany({
      where: { demandeurId: userId, statut: "EN_ATTENTE" },
      include: { destinataire: { select } },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ envoyees })
  }

  // Toutes les connexions acceptées
  const connexions = await prisma.connexion.findMany({
    where: {
      statut: "ACCEPTEE",
      OR: [{ demandeurId: userId }, { destinataireId: userId }],
    },
    include: {
      demandeur: { select },
      destinataire: { select },
    },
    orderBy: { updatedAt: "desc" },
  })

  const contacts = connexions.map((c) =>
    c.demandeurId === userId ? c.destinataire : c.demandeur
  )

  return NextResponse.json({ contacts })
}

// POST — Envoyer une demande de connexion
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { destinataireId } = await req.json()
  if (!destinataireId || destinataireId === session.user.id) {
    return NextResponse.json({ error: "Destination invalide" }, { status: 400 })
  }

  // Vérifier blocage
  const blocage = await prisma.blocage.findFirst({
    where: {
      OR: [
        { bloqueurId: session.user.id, bloqueId: destinataireId },
        { bloqueurId: destinataireId, bloqueId: session.user.id },
      ],
    },
  })
  if (blocage) {
    return NextResponse.json({ error: "Action impossible" }, { status: 403 })
  }

  // Vérifier si une connexion existe déjà
  const existing = await prisma.connexion.findFirst({
    where: {
      OR: [
        { demandeurId: session.user.id, destinataireId },
        { demandeurId: destinataireId, destinataireId: session.user.id },
      ],
    },
  })
  if (existing) {
    return NextResponse.json({ error: "Demande déjà existante", statut: existing.statut }, { status: 409 })
  }

  const connexion = await prisma.connexion.create({
    data: { demandeurId: session.user.id, destinataireId },
  })

  // Notifier le destinataire
  const demandeur = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { prenom: true, nom: true, notifConnexions: true },
  })

  const destinataire = await prisma.user.findUnique({
    where: { id: destinataireId },
    select: { notifConnexions: true },
  })

  if (destinataire?.notifConnexions) {
    await creerNotification({
      userId: destinataireId,
      type: "DEMANDE_CONNEXION",
      titre: "Nouvelle demande de connexion",
      message: `${demandeur?.prenom} ${demandeur?.nom} souhaite se connecter avec vous`,
      lien: "/communaute/reseau?tab=demandes",
    })
  }

  return NextResponse.json(connexion, { status: 201 })
}

// PATCH — Accepter ou refuser une demande
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { connexionId, action } = await req.json()
  if (!connexionId || !["accepter", "refuser"].includes(action)) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 })
  }

  const connexion = await prisma.connexion.findUnique({ where: { id: connexionId } })
  if (!connexion || connexion.destinataireId !== session.user.id) {
    return NextResponse.json({ error: "Demande introuvable" }, { status: 404 })
  }

  const updated = await prisma.connexion.update({
    where: { id: connexionId },
    data: { statut: action === "accepter" ? "ACCEPTEE" : "REFUSEE" },
  })

  if (action === "accepter") {
    const accepteur = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { prenom: true, nom: true },
    })
    const demandeurPrefs = await prisma.user.findUnique({
      where: { id: connexion.demandeurId },
      select: { notifConnexions: true },
    })
    if (demandeurPrefs?.notifConnexions) {
      await creerNotification({
        userId: connexion.demandeurId,
        type: "NOUVELLE_CONNEXION",
        titre: "Connexion acceptée !",
        message: `${accepteur?.prenom} ${accepteur?.nom} a accepté votre demande`,
        lien: "/communaute/reseau",
      })
    }
  }

  return NextResponse.json(updated)
}

// DELETE — Supprimer une connexion
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")
  if (!userId) {
    return NextResponse.json({ error: "userId requis" }, { status: 400 })
  }

  await prisma.connexion.deleteMany({
    where: {
      OR: [
        { demandeurId: session.user.id, destinataireId: userId },
        { demandeurId: userId, destinataireId: session.user.id },
      ],
    },
  })

  return NextResponse.json({ success: true })
}
