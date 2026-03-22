import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id } = await params

  const commande = await prisma.commande.findUnique({
    where: { id },
    include: {
      lignes: {
        include: { produit: true },
      },
      user: {
        select: { prenom: true },
      },
    },
  })

  if (!commande) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })
  }

  if (commande.userId !== session.user.id) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  return NextResponse.json({ commande })
}
