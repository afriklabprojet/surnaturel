import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const PAGE_SIZE = 10
const POOL_SIZE = 60 // Pool élargi pour permettre un tri intelligent

// ── Scoring : pondération des critères ──────────────────────
// Total théorique max ≈ 100 points
const WEIGHTS = {
  compatibility: 40,  // intérêts communs (0-40)
  activity: 25,       // activité récente (0-25)
  completeness: 20,   // profil complet (0-20)
  verification: 10,   // profil vérifié (0 ou 10)
  likedYou: 5,        // bonus si cette personne vous a liké (0 ou 5)
} as const

function scoreActivity(derniereVueAt: Date | null): number {
  if (!derniereVueAt) return 0
  const diffHours = (Date.now() - derniereVueAt.getTime()) / 3_600_000
  if (diffHours < 1) return WEIGHTS.activity           // En ligne
  if (diffHours < 24) return WEIGHTS.activity * 0.8    // Aujourd'hui
  if (diffHours < 168) return WEIGHTS.activity * 0.5   // Cette semaine
  if (diffHours < 720) return WEIGHTS.activity * 0.2   // Ce mois
  return 0
}

function scoreCompleteness(p: {
  photoUrl: string | null
  bio: string | null
  centresInteret: string[]
  ville: string | null
}): number {
  let score = 0
  if (p.photoUrl) score += WEIGHTS.completeness * 0.45  // photo = le plus important
  if (p.bio && p.bio.length > 10) score += WEIGHTS.completeness * 0.25
  if (p.centresInteret.length >= 2) score += WEIGHTS.completeness * 0.2
  if (p.ville) score += WEIGHTS.completeness * 0.1
  return score
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const userId = session.user.id
  const { searchParams } = new URL(req.url)
  const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10) || 0)
  // Rétrocompatibilité : accepter aussi cursor (converti en page 0)
  const cursor = searchParams.get("cursor")

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
    return NextResponse.json({ profiles: [], nextCursor: null, page: 0, hasMore: false })
  }

  const myInterests = currentUser?.centresInteret ?? []
  const myInterestsSet = new Set(myInterests)

  // IDs déjà likés/passés par cet user + blocages (en parallèle)
  const [dejaSwaipes, blocages, likesVersUser] = await Promise.all([
    prisma.rencontreLike.findMany({
      where: { fromUserId: userId },
      select: { toUserId: true },
    }),
    prisma.blocage.findMany({
      where: { OR: [{ bloqueurId: userId }, { bloqueId: userId }] },
      select: { bloqueurId: true, bloqueId: true },
    }),
    // Qui m'a liké (pour le bonus de score)
    prisma.rencontreLike.findMany({
      where: { toUserId: userId, type: { in: ["LIKE", "SUPER_LIKE"] } },
      select: { fromUserId: true },
    }),
  ])

  const dejaSwaipesIds = dejaSwaipes.map((l) => l.toUserId)
  const blocagesIds = blocages.flatMap((b) =>
    b.bloqueurId === userId ? [b.bloqueId] : [b.bloqueurId]
  )
  const likedBySet = new Set(likesVersUser.map((l) => l.fromUserId))

  const exclus = [...new Set([userId, ...dejaSwaipesIds, ...blocagesIds])]

  // Filtrage par âge
  const now = new Date()
  const ageMinDate =
    pref?.ageMax !== undefined
      ? new Date(now.getFullYear() - pref.ageMax, now.getMonth(), now.getDate())
      : undefined
  const ageMaxDate =
    pref?.ageMin !== undefined
      ? new Date(now.getFullYear() - pref.ageMin, now.getMonth(), now.getDate())
      : undefined

  // Récupérer un pool élargi, priorisé par activité récente
  const pool = await prisma.user.findMany({
    where: {
      id: { notIn: exclus },
      profilPublic: true,
      accesCommuaute: true,
      ...(ageMinDate && ageMaxDate
        ? { dateNaissance: { gte: ageMinDate, lte: ageMaxDate } }
        : {}),
      // Filtre : uniquement profils vérifiés
      ...(pref?.filtreVerifie ? { verificationStatus: { not: "AUCUNE" } } : {}),
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
      // Galerie photos rencontres
      photosRencontre: {
        select: { url: true },
        orderBy: { ordre: "asc" },
        take: 6,
      },
      // Récupérer les préférences du profil cible pour filtrer par intention
      rencontrePreference: pref?.filtreIntention
        ? { select: { intention: true } }
        : false,
    },
    take: POOL_SIZE,
    orderBy: [
      { derniereVueAt: { sort: "desc", nulls: "last" } },
    ],
  })

  // ── Filtrage post-query ───────────────────────────
  let filtered = pool as (typeof pool[number] & { rencontrePreference?: { intention: string } | null })[]

  // Filtre intention : ne garder que ceux avec la même intention
  if (pref?.filtreIntention) {
    const myIntention = pref.intention
    filtered = filtered.filter(
      (p) => p.rencontrePreference?.intention === myIntention
    )
  }

  // Filtre intérêts communs : au moins 1 intérêt en commun
  if (pref?.filtreInterets && myInterests.length > 0) {
    filtered = filtered.filter(
      (p) => p.centresInteret.some((c) => myInterestsSet.has(c))
    )
  }

  // ── Scoring composite ─────────────────────────────
  const scored = filtered.map((p) => {
    // 1. Compatibilité (intérêts communs)
    const common = p.centresInteret.filter((c) => myInterestsSet.has(c)).length
    const total = Math.max(myInterests.length, p.centresInteret.length)
    const compatPct = total > 0 ? common / total : 0
    const compatScore = compatPct * WEIGHTS.compatibility

    // 2. Activité récente
    const activityScore = scoreActivity(p.derniereVueAt)

    // 3. Profil complet
    const completenessScore = scoreCompleteness(p)

    // 4. Vérification
    const verifScore = p.verificationStatus !== "AUCUNE" ? WEIGHTS.verification : 0

    // 5. Bonus « m'a liké »
    const likedBonus = likedBySet.has(p.id) ? WEIGHTS.likedYou : 0

    const totalScore = compatScore + activityScore + completenessScore + verifScore + likedBonus
    const compatibilityScore = total > 0 ? Math.round(compatPct * 100) : 0

    return { ...p, _score: totalScore, compatibilityScore }
  })

  // Trier par score décroissant (avec léger aléa pour varier les résultats)
  scored.sort((a, b) => {
    const diff = b._score - a._score
    // Si les scores sont proches (< 5pts), mélanger pour varier
    if (Math.abs(diff) < 5) return Math.random() - 0.5
    return diff
  })

  // Pagination par offset
  const offset = (cursor ? 0 : page) * PAGE_SIZE
  const pageResults = scored.slice(offset, offset + PAGE_SIZE)
  const hasMore = offset + PAGE_SIZE < scored.length

  const profilesWithScore = pageResults.map(({ _score, rencontrePreference, ...p }) => ({
    ...p,
    dateNaissance: p.dateNaissance?.toISOString() ?? null,
    derniereVueAt: p.derniereVueAt?.toISOString() ?? null,
  }))

  return NextResponse.json({
    profiles: profilesWithScore,
    // Rétrocompatibilité cursor + nouvelle pagination page
    nextCursor: hasMore ? "next" : null,
    page,
    hasMore,
  })
}
