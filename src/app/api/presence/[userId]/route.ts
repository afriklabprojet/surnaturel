import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET — Vérifier la présence d'un utilisateur (en ligne si vu il y a moins de 2 min)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { userId } = await params

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { derniereVueAt: true },
  })

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
  }

  const derniereVueLe = user.derniereVueAt?.toISOString() ?? null
  const enLigne = user.derniereVueAt
    ? Date.now() - new Date(user.derniereVueAt).getTime() < 2 * 60 * 1000
    : false

  return NextResponse.json({ enLigne, derniereVueLe })
}
