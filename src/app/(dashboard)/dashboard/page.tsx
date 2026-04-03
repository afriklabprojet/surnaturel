import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getPalierActuel, getProgressionPalier } from "@/lib/fidelite"
import { calculerCompletion } from "@/lib/profil-completion"
import DashboardClient from "./DashboardClient"

export default async function PageDashboard() {
  const session = await auth()
  if (!session?.user?.id) redirect("/connexion?callbackUrl=/dashboard")

  const userId = session.user.id

  const [user, rdvsAVenirRaw, dernieresCommandesRaw, pointsFidelite, rdvsTerminesRaw] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        prenom: true,
        nom: true,
        email: true,
        telephone: true,
        photoUrl: true,
        ville: true,
        onboardingStep: true,
      },
    }),
    prisma.rendezVous.findMany({
      where: { userId, statut: { not: "ANNULE" }, dateHeure: { gt: new Date() } },
      include: { soin: { select: { nom: true, duree: true, prix: true, slug: true } } },
      orderBy: { dateHeure: "asc" },
      take: 3,
    }),
    prisma.commande.findMany({
      where: { userId },
      include: { lignes: { include: { produit: { select: { nom: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.pointsFidelite.findUnique({ where: { userId } }),
    prisma.rendezVous.findMany({
      where: { userId, statut: "TERMINE" },
      include: { soin: { select: { nom: true, duree: true, prix: true, slug: true } } },
      orderBy: { dateHeure: "desc" },
      take: 3,
    }),
  ])

  const prochainRdv = rdvsAVenirRaw[0] ?? null
  const derniereCommande = dernieresCommandesRaw[0] ?? null
  const points = pointsFidelite?.total ?? 0
  const palierActuel = getPalierActuel(points)
  const palier = palierActuel?.nom ?? "Bronze"
  const progression = getProgressionPalier(points)

  // Calculate profile completion
  const profilCompletion = user ? calculerCompletion({
    prenom: user.prenom,
    nom: user.nom,
    email: user.email,
    telephone: user.telephone,
    photoUrl: user.photoUrl,
    ville: user.ville,
  }) : { pourcentage: 0, manquants: [], complet: false }

  const rdvsAVenir = rdvsAVenirRaw.map((r) => ({
    id: r.id,
    dateHeure: r.dateHeure.toISOString(),
    statut: r.statut,
    soin: r.soin,
  }))

  const rdvsTermines = rdvsTerminesRaw.map((r) => ({
    id: r.id,
    dateHeure: r.dateHeure.toISOString(),
    soin: r.soin,
  }))

  const dernieresCommandes = dernieresCommandesRaw.map((c) => ({
    id: c.id,
    total: c.total,
    statut: c.statut,
    createdAt: c.createdAt.toISOString(),
    lignes: c.lignes,
  }))

  const prochainRdvSerialized = prochainRdv
    ? {
        id: prochainRdv.id,
        dateHeure: prochainRdv.dateHeure.toISOString(),
        statut: prochainRdv.statut,
        soin: prochainRdv.soin,
      }
    : null

  const derniereCommandeSerialized = derniereCommande
    ? {
        id: derniereCommande.id,
        total: derniereCommande.total,
        statut: derniereCommande.statut,
        createdAt: derniereCommande.createdAt.toISOString(),
        lignes: derniereCommande.lignes,
      }
    : null

  // Determine if user is new (no RDVs and no commands = new user)
  const isNewUser = rdvsAVenirRaw.length === 0 && dernieresCommandesRaw.length === 0 && rdvsTerminesRaw.length === 0
  const hasData = prochainRdv !== null || derniereCommande !== null

  const prenom = session.user.prenom || session.user.nom || "Client"

  const today = new Date().toLocaleDateString("fr", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <DashboardClient
      prenom={prenom}
      today={today}
      prochainRdv={prochainRdvSerialized}
      derniereCommande={derniereCommandeSerialized}
      points={points}
      palier={palier}
      progression={progression}
      rdvsAVenir={rdvsAVenir}
      rdvsTermines={rdvsTermines}
      dernieresCommandes={dernieresCommandes}
      hasData={hasData}
      isNewUser={isNewUser}
      profilComplet={profilCompletion.complet}
      hasRdv={rdvsAVenirRaw.length > 0 || rdvsTerminesRaw.length > 0}
      hasCommande={dernieresCommandesRaw.length > 0}
    />
  )
}
