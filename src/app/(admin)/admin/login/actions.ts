"use server"

import { prisma } from "@/lib/prisma"

export async function getLoginStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [rdvAujourdhui, clientsActifs, commandesEnAttente, articlesPublies] =
    await Promise.all([
      prisma.rendezVous.count({
        where: { dateHeure: { gte: today, lt: tomorrow } },
      }),
      prisma.user.count({ where: { role: "CLIENT" } }),
      prisma.commande.count({ where: { statut: "EN_ATTENTE" } }),
      prisma.article.count({ where: { publie: true } }),
    ])

  return { rdvAujourdhui, clientsActifs, commandesEnAttente, articlesPublies }
}
