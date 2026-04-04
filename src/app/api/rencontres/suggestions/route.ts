import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const PAGE_SIZE = 10

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const userId = session.user.id
  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get("cursor") ?? undefined

  // Récupérer les préférences + intérêts de l'utilisateur courant
  const [pref, currentUser] = await Promise.all([
    prisma.rencontrePreference.findUnique({ where: { userId } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { centresInteret: true },
    }),
  ])

  // Si le mode rencontre est désactivé, retourner liste vide
  if (pref && !pref.actif) {
    return NextResponse.json({ profiles: [], nextCursor: null })
  }

  const myInterests = currentUser?.centresInteret ?? []

  // IDs déjà likés/passés par cet user
  const dejaSwaipes = await prisma.rencontreLike.findMany({
    where: { fromUserId: userId },
    select: { toUserId: true },
  })
  const dejaSwaipesIds = dejaSwaipes.map((l) => l.toUserId)

  // IDs des utilisateurs qui ont bloqué ou ont été bloqués
  const blocages = await prisma.blocage.findMany({
    where: { OR: [{ bloqueurId: userId }, { bloqueId: userId }] },
    select: { bloqueurId: true, bloqueId: true },
  })
  const blocagesIds = blocages.flatMap((b) =>
    b.bloqueurId === userId ? [b.bloqueId] : [b.bloqueurId]
  )

  const exclus = [...new Set([userId, ...dejaSwaipesIds, ...blocagesIds])]

  // Filtrage par âge — les deux dates sont calculées ensemble depuis les prefs
  const now = new Date()
  const ageMinDate =
    pref?.ageMax !== undefined
      ? new Date(now.getFullYear() - pref.ageMax, now.getMonth(), now.getDate())
      : undefined
  const ageMaxDate =
    pref?.ageMin !== undefined
      ? new Date(now.getFullYear() - pref.ageMin, now.getMonth(), now.getDate())
      : undefined

  const profiles = await prisma.user.findMany({
    where: {
      id: { notIn: exclus },
      profilPublic: true,
      accesCommuaute: true,
      ...(ageMinDate && ageMaxDate
        ? { dateNaissance: { gte: ageMinDate, lte: ageMaxDate } }
        : {}),
      ...(cursor ? { id: { gt: cursor, notIn: exclus } } : {}),
    },
    select: {
      id: true,
      prenom: true,
      nom: true,
      pseudo: true,
      photoUrl: true,
      bio: true,
      ville: true,
      centresInteret: true,
      verificationStatus: true,
      dateNaissance: true,
      derniereVueAt: true,
      profilDetail: {
        select: { languesParlees: true, specialite: true },
      },
    },
    take: PAGE_SIZE + 1,
    orderBy: { id: "asc" },
  })

  const hasMore = profiles.length > PAGE_SIZE
  const page = hasMore ? profiles.slice(0, PAGE_SIZE) : profiles
  const nextCursor = hasMore ? page[page.length - 1].id : null

  // Calculer le score de compatibilité basé sur les intérêts communs
  const profilesWithScore = page.map((p) => {
    const common = p.centresInteret.filter((c) => myInterests.includes(c)).length
    const total = Math.max(myInterests.length, p.centresInteret.length)
    const compatibilityScore = total > 0 ? Math.round((common / total) * 100) : 0
    return {
      ...p,
      dateNaissance: p.dateNaissance?.toISOString() ?? null,
      derniereVueAt: p.derniereVueAt?.toISOString() ?? null,
      compatibilityScore,
    }
  })

  return NextResponse.json({ profiles: profilesWithScore, nextCursor })
}
