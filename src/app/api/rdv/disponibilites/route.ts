import { NextResponse, type NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const soinId = searchParams.get("soinId")
  const date = searchParams.get("date")

  if (!soinId || !date) {
    return NextResponse.json(
      { error: "Paramètres soinId et date requis." },
      { status: 400 }
    )
  }

  // Valider le format de date (YYYY-MM-DD)
  const dateObj = new Date(date + "T00:00:00")
  if (isNaN(dateObj.getTime())) {
    return NextResponse.json(
      { error: "Format de date invalide." },
      { status: 400 }
    )
  }

  const debutJour = new Date(date + "T00:00:00.000Z")
  const finJour = new Date(date + "T23:59:59.999Z")

  const rdvExistants = await prisma.rendezVous.findMany({
    where: {
      soinId,
      dateHeure: { gte: debutJour, lte: finJour },
      statut: { not: "ANNULE" },
    },
    select: { dateHeure: true },
  })

  // Extraire les heures réservées (0-23)
  const heuresReservees = rdvExistants.map((rdv) => rdv.dateHeure.getUTCHours())

  return NextResponse.json({ heuresReservees })
}
