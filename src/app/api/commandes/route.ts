import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const commandes = await prisma.commande.findMany({
    where: { userId: session.user.id },
    include: {
      lignes: {
        include: { produit: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ commandes })
}
