import { typedLogger as logger } from "@/lib/logger"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/admin/sage-femme/planning?debut=YYYY-MM-DD&fin=YYYY-MM-DD
 * Retourne tous les RDV entre deux dates (vue semaine / mois).
 * Par défaut : semaine en cours (lun → dim).
 */
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SAGE_FEMME")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const debutParam = searchParams.get("debut")
    const finParam = searchParams.get("fin")

    // Calculer la semaine courante si pas de params
    const maintenant = new Date()
    const jourSemaine = maintenant.getDay() === 0 ? 7 : maintenant.getDay() // lun=1 … dim=7
    const lundi = new Date(maintenant)
    lundi.setDate(maintenant.getDate() - jourSemaine + 1)
    lundi.setHours(0, 0, 0, 0)

    const debut = debutParam ? new Date(debutParam) : lundi
    debut.setHours(0, 0, 0, 0)

    const fin = finParam ? new Date(finParam) : new Date(debut)
    if (!finParam) {
      fin.setDate(debut.getDate() + 6)
    }
    fin.setHours(23, 59, 59, 999)

    const rdvs = await prisma.rendezVous.findMany({
      where: { dateHeure: { gte: debut, lte: fin } },
      include: {
        user: {
          select: { id: true, nom: true, prenom: true, telephone: true, email: true, image: true },
        },
        soin: { select: { id: true, nom: true, duree: true, prix: true } },
      },
      orderBy: { dateHeure: "asc" },
    })

    const formatted = rdvs.map((rdv) => ({
      id: rdv.id,
      client: rdv.user,
      soin: rdv.soin,
      dateHeure: rdv.dateHeure,
      duree: rdv.soin?.duree ?? 60,
      statut: rdv.statut,
      notes: rdv.notes,
    }))

    return NextResponse.json({ rdvs: formatted, debut: debut.toISOString(), fin: fin.toISOString() })
  } catch (error) {
    logger.error("Erreur planning sage-femme:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
