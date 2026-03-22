import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST — Bloquer / Débloquer un utilisateur
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { bloqueId } = await req.json()
  if (!bloqueId || bloqueId === session.user.id) {
    return NextResponse.json({ error: "Paramètre invalide" }, { status: 400 })
  }

  const existing = await prisma.blocage.findUnique({
    where: { bloqueurId_bloqueId: { bloqueurId: session.user.id, bloqueId } },
  })

  if (existing) {
    await prisma.blocage.delete({ where: { id: existing.id } })
    return NextResponse.json({ blocked: false })
  }

  await prisma.blocage.create({
    data: { bloqueurId: session.user.id, bloqueId },
  })

  // Supprimer la connexion si elle existe
  await prisma.connexion.deleteMany({
    where: {
      OR: [
        { demandeurId: session.user.id, destinataireId: bloqueId },
        { demandeurId: bloqueId, destinataireId: session.user.id },
      ],
    },
  })

  // Supprimer l'abonnement si existant
  await prisma.abonnement.deleteMany({
    where: {
      OR: [
        { abonneId: session.user.id, suiviId: bloqueId },
        { abonneId: bloqueId, suiviId: session.user.id },
      ],
    },
  })

  return NextResponse.json({ blocked: true })
}

// GET — Liste des utilisateurs bloqués
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const blocages = await prisma.blocage.findMany({
    where: { bloqueurId: session.user.id },
    include: {
      bloque: {
        select: { id: true, nom: true, prenom: true, photoUrl: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ bloques: blocages.map((b) => b.bloque) })
}
