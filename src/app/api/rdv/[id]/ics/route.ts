import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { genererFichierICS } from "@/lib/calendrier"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id } = await params

    // Récupérer le rendez-vous
    const rdv = await prisma.rendezVous.findUnique({
      where: { id },
      include: {
        soin: true,
      },
    })

    if (!rdv) {
      return NextResponse.json(
        { error: "Rendez-vous non trouvé" },
        { status: 404 }
      )
    }

    // Vérifier que l'utilisateur a le droit de voir ce RDV
    if (rdv.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    // Générer le fichier ICS
    const icsContent = genererFichierICS({
      id: rdv.id,
      soin: rdv.soin?.nom || "Rendez-vous",
      date: rdv.dateHeure,
      duree: rdv.soin?.duree || 60,
      adresse: "Le Surnaturel de Dieu, Abidjan",
    })

    // Retourner le fichier ICS
    return new NextResponse(icsContent, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="rdv-${id.slice(0, 8)}.ics"`,
      },
    })
  } catch (error) {
    console.error("Erreur génération ICS:", error)
    return NextResponse.json(
      { error: "Erreur lors de la génération du fichier calendrier" },
      { status: 500 }
    )
  }
}
