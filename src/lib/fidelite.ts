import { prisma } from "@/lib/prisma"
import { notifierPointsFidelite, notifierRecompenseFidelite } from "@/lib/notifications"
import type { TypeFidelite } from "@/generated/prisma/client"

// Paliers de récompenses
export const PALIERS = [
  { points: 500, nom: "Bronze", recompense: "10% sur prochain soin" },
  { points: 1000, nom: "Argent", recompense: "Soin gommage offert" },
  { points: 2000, nom: "Or", recompense: "Hammam + gommage offerts" },
  { points: 5000, nom: "Platine", recompense: "Soin VIP complet offert" },
] as const

// Règles de points
export const REGLES_POINTS = {
  RDV_TERMINE: 50,      // +50 pts par RDV terminé
  COMMANDE_PAR_100: 1,  // +1 pt par 100 FCFA de commande
  AVIS_LAISSE: 30,      // +30 pts par avis
  PARRAINAGE: 200,      // +200 pts par parrainage actif
} as const

export function getPalierActuel(points: number) {
  for (let i = PALIERS.length - 1; i >= 0; i--) {
    if (points >= PALIERS[i].points) {
      return PALIERS[i]
    }
  }
  return null
}

export function getProchainPalier(points: number) {
  for (const palier of PALIERS) {
    if (points < palier.points) {
      return palier
    }
  }
  return null
}

export function getProgressionPalier(points: number) {
  const prochain = getProchainPalier(points)
  if (!prochain) return { pourcentage: 100, restant: 0, prochain: null }

  const palierActuel = getPalierActuel(points)
  const base = palierActuel ? palierActuel.points : 0
  const pourcentage = Math.round(((points - base) / (prochain.points - base)) * 100)
  const restant = prochain.points - points

  return { pourcentage, restant, prochain }
}

export async function ajouterPoints(
  userId: string,
  points: number,
  raison: string,
  type: TypeFidelite
) {
  // Upsert PointsFidelite
  const fidel = await prisma.pointsFidelite.upsert({
    where: { userId },
    create: { userId, total: points },
    update: { total: { increment: points } },
  })

  // Créer l'historique
  await prisma.historiqueFidelite.create({
    data: {
      pointsId: fidel.id,
      points,
      raison,
      type,
    },
  })

  // Notification
  await notifierPointsFidelite(userId, points, raison)

  // Vérifier si nouveau palier atteint
  const ancienPalier = getPalierActuel(fidel.total - points)
  const nouveauPalier = getPalierActuel(fidel.total)

  if (nouveauPalier && (!ancienPalier || nouveauPalier.points > ancienPalier.points)) {
    await notifierRecompenseFidelite(userId, nouveauPalier.recompense)
  }

  return fidel
}

export async function depenserPoints(
  userId: string,
  points: number,
  recompense: string
) {
  const fidel = await prisma.pointsFidelite.findUnique({
    where: { userId },
  })

  if (!fidel || fidel.total < points) {
    throw new Error("Points insuffisants")
  }

  await prisma.pointsFidelite.update({
    where: { userId },
    data: { total: { decrement: points } },
  })

  await prisma.historiqueFidelite.create({
    data: {
      pointsId: fidel.id,
      points: -points,
      raison: `Récompense utilisée : ${recompense}`,
      type: "DEPOT_RECOMPENSE",
    },
  })

  return true
}

// Fonctions automatiques appelées par les autres modules
export async function crediterRDVTermine(userId: string, soinNom: string) {
  return ajouterPoints(
    userId,
    REGLES_POINTS.RDV_TERMINE,
    `Soin terminé : ${soinNom}`,
    "GAIN_RDV"
  )
}

export async function crediterCommande(userId: string, montant: number) {
  const points = Math.floor(montant / 100) * REGLES_POINTS.COMMANDE_PAR_100
  if (points > 0) {
    return ajouterPoints(
      userId,
      points,
      `Commande de ${montant.toLocaleString("fr-FR")} FCFA`,
      "GAIN_COMMANDE"
    )
  }
  return null
}

export async function crediterAvis(userId: string, soinNom: string) {
  return ajouterPoints(
    userId,
    REGLES_POINTS.AVIS_LAISSE,
    `Avis laissé pour : ${soinNom}`,
    "GAIN_AVIS"
  )
}

export async function crediterParrainage(userId: string, filleulPrenom: string) {
  return ajouterPoints(
    userId,
    REGLES_POINTS.PARRAINAGE,
    `Parrainage activé : ${filleulPrenom}`,
    "GAIN_PARRAINAGE"
  )
}
