import { typedLogger as logger } from "@/lib/logger"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SAGE_FEMME")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Patients avec RDV (pas tous les utilisateurs)
    const patients = await prisma.user.findMany({
      where: {
        role: "CLIENT",
        rendezVous: {
          some: {},
        },
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        telephone: true,
        email: true,
        image: true,
        _count: {
          select: {
            rendezVous: true,
            notesRecues: true,
          },
        },
        rendezVous: {
          orderBy: { dateHeure: "desc" },
          take: 1,
          select: {
            dateHeure: true,
          },
        },
      },
      orderBy: [
        { prenom: "asc" },
        { nom: "asc" },
      ],
    })

    // Formatter avec dernière visite
    const patientsFormatted = patients.map((p) => ({
      id: p.id,
      nom: p.nom || "",
      prenom: p.prenom || "",
      telephone: p.telephone || "",
      email: p.email || "",
      image: p.image,
      _count: {
        rdvs: p._count.rendezVous,
        fiches: p._count.notesRecues,
      },
      derniereVisite: p.rendezVous[0]?.dateHeure || null,
    }))

    return NextResponse.json({ patients: patientsFormatted })
  } catch (error) {
    logger.error("Erreur patients sage-femme:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}
