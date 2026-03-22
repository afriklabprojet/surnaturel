import { NextRequest, NextResponse } from "next/server"
import { SOINS_DATA, getSoinBySlug, BIENFAITS_SOINS, ETAPES_SOINS } from "@/lib/soins-data"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Récupérer le soin depuis les données mockées
    const soinMock = getSoinBySlug(slug)
    if (!soinMock) {
      return NextResponse.json({ error: "Soin non trouvé" }, { status: 404 })
    }

    // Essayer de récupérer les avis depuis la base de données
    let avis: Array<{
      id: string
      note: number
      commentaire: string | null
      createdAt: Date
      user: { prenom: string; nom: string }
    }> = []
    let noteMoyenne = 0

    try {
      // Trouver le soin en base qui correspond au slug
      const soinDB = await prisma.soin.findFirst({
        where: {
          nom: { contains: soinMock.nom, mode: "insensitive" },
        },
      })

      if (soinDB) {
        avis = await prisma.avis.findMany({
          where: {
            soinId: soinDB.id,
            publie: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            note: true,
            commentaire: true,
            createdAt: true,
            user: {
              select: {
                prenom: true,
                nom: true,
              },
            },
          },
        })

        if (avis.length > 0) {
          noteMoyenne = avis.reduce((acc, a) => acc + a.note, 0) / avis.length
        }
      }
    } catch {
      // Si DB non disponible, continuer sans avis
    }

    // Soins similaires (même catégorie)
    const similaires = SOINS_DATA.filter(
      (s) => s.categorie === soinMock.categorie && s.slug !== slug
    )
      .slice(0, 3)
      .map((s) => ({
        slug: s.slug,
        nom: s.nom,
        description: s.description,
        prix: s.prix,
        duree: s.duree,
        categorie: s.categorie,
      }))

    // Si pas assez de soins similaires, compléter avec d'autres
    const autresSoins =
      similaires.length < 3
        ? SOINS_DATA.filter((s) => s.slug !== slug && !similaires.find((sim) => sim.slug === s.slug))
            .slice(0, 3 - similaires.length)
            .map((s) => ({
              slug: s.slug,
              nom: s.nom,
              description: s.description,
              prix: s.prix,
              duree: s.duree,
              categorie: s.categorie,
            }))
        : []

    return NextResponse.json({
      soin: {
        slug: soinMock.slug,
        nom: soinMock.nom,
        description: soinMock.description,
        descriptionLongue: soinMock.descriptionLongue,
        prix: soinMock.prix,
        duree: soinMock.duree,
        categorie: soinMock.categorie,
        bienfaits: BIENFAITS_SOINS[slug] || [],
        etapes: ETAPES_SOINS[slug] || [],
      },
      avis: avis.map((a) => ({
        id: a.id,
        note: a.note,
        commentaire: a.commentaire,
        date: a.createdAt,
        nom: `${a.user.prenom} ${a.user.nom.charAt(0)}.`,
      })),
      noteMoyenne,
      nombreAvis: avis.length,
      similaires: [...similaires, ...autresSoins],
    })
  } catch (error) {
    console.error("Erreur API soin:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération du soin" },
      { status: 500 }
    )
  }
}
