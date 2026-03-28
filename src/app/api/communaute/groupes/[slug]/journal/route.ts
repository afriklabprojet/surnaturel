import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface Params { params: Promise<{ slug: string }> }

// GET — Journal de modération (admin/modérateur uniquement)
export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { slug } = await params
  const groupe = await prisma.groupe.findUnique({ where: { slug }, select: { id: true } })
  if (!groupe) return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 })

  const membre = await prisma.membreGroupe.findUnique({
    where: { groupeId_userId: { groupeId: groupe.id, userId: session.user.id } },
  })
  if (!membre || !["ADMIN", "MODERATEUR"].includes(membre.role)) {
    return NextResponse.json({ error: "Réservé aux administrateurs et modérateurs" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")))
  const skip = (page - 1) * limit

  const [rawEntries, total] = await Promise.all([
    prisma.journalModeration.findMany({
      where: { groupeId: groupe.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.journalModeration.count({ where: { groupeId: groupe.id } }),
  ])

  // Récupérer les utilisateurs liés
  const userIds = new Set<string>()
  rawEntries.forEach(e => {
    userIds.add(e.moderateurId)
    if (e.cibleUserId) userIds.add(e.cibleUserId)
  })

  const users = await prisma.user.findMany({
    where: { id: { in: [...userIds] } },
    select: { id: true, nom: true, prenom: true, pseudo: true, photoUrl: true },
  })
  const userMap = new Map(users.map(u => [u.id, u]))

  const entries = rawEntries.map(e => ({
    ...e,
    moderateur: userMap.get(e.moderateurId) || null,
    cibleUser: e.cibleUserId ? userMap.get(e.cibleUserId) || null : null,
  }))

  return NextResponse.json({
    entries,
    total,
    pages: Math.ceil(total / limit),
    page,
  })
}
