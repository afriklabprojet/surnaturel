import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST — Suivre / Ne plus suivre
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { suiviId } = await req.json()
  if (!suiviId || suiviId === session.user.id) {
    return NextResponse.json({ error: "Paramètre invalide" }, { status: 400 })
  }

  const existing = await prisma.abonnement.findUnique({
    where: { abonneId_suiviId: { abonneId: session.user.id, suiviId } },
  })

  if (existing) {
    await prisma.abonnement.delete({ where: { id: existing.id } })
    return NextResponse.json({ following: false })
  }

  await prisma.abonnement.create({
    data: { abonneId: session.user.id, suiviId },
  })

  return NextResponse.json({ following: true })
}

// GET — Abonnements ou abonnés
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type") || "abonnements"
  const userId = searchParams.get("userId") || session.user.id
  const select = {
    id: true, nom: true, prenom: true, pseudo: true,
    photoUrl: true, bio: true, statutProfil: true,
  }

  if (type === "abonnes") {
    const abonnes = await prisma.abonnement.findMany({
      where: { suiviId: userId },
      include: { abonne: { select } },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ users: abonnes.map((a) => a.abonne) })
  }

  const abonnements = await prisma.abonnement.findMany({
    where: { abonneId: userId },
    include: { suivi: { select } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json({ users: abonnements.map((a) => a.suivi) })
}
