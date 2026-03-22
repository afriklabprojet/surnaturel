import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET — Recherche de membres pour @mention (autocomplete)
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const q = (searchParams.get("q") || "").trim()

  if (q.length < 1) {
    return NextResponse.json({ users: [] })
  }

  // Utilisateurs bloqués
  const blocages = await prisma.blocage.findMany({
    where: { OR: [{ bloqueurId: session.user.id }, { bloqueId: session.user.id }] },
    select: { bloqueurId: true, bloqueId: true },
  })
  const blockedIds = blocages.map((b) =>
    b.bloqueurId === session.user.id ? b.bloqueId : b.bloqueurId
  )

  const users = await prisma.user.findMany({
    where: {
      id: { notIn: [...blockedIds, session.user.id] },
      OR: [
        { pseudo: { contains: q, mode: "insensitive" } },
        { prenom: { contains: q, mode: "insensitive" } },
        { nom: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      nom: true,
      prenom: true,
      pseudo: true,
      photoUrl: true,
      statutProfil: true,
    },
    take: 8,
    orderBy: { prenom: "asc" },
  })

  return NextResponse.json({ users })
}
