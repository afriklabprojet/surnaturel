import { typedLogger as logger } from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const soin = await prisma.soin.findUnique({
      where: { slug },
    })

    if (!soin || !soin.actif) {
      return NextResponse.json({ error: "Soin non trouvé" }, { status: 404 })
    }

    // Avis publiés
    const avis = await prisma.avis.findMany({
      where: { soinId: soin.id, publie: true },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        note: true,
        commentaire: true,
        createdAt: true,
        user: { select: { prenom: true, nom: true } },
      },
    })

    const noteMoyenne = avis.length > 0
      ? avis.reduce((acc, a) => acc + a.note, 0) / avis.length
      : 0

    // Soins similaires (même catégorie)
    const similaires = await prisma.soin.findMany({
      where: { categorie: soin.categorie, slug: { not: slug }, actif: true },
      take: 3,
      orderBy: { ordre: "asc" },
      select: { slug: true, nom: true, description: true, prix: true, duree: true, categorie: true, icon: true },
    })

    // Compléter si pas assez
    const autresSoins = similaires.length < 3
      ? await prisma.soin.findMany({
          where: { slug: { notIn: [slug, ...similaires.map(s => s.slug)] }, actif: true },
          take: 3 - similaires.length,
          orderBy: { ordre: "asc" },
          select: { slug: true, nom: true, description: true, prix: true, duree: true, categorie: true, icon: true },
        })
      : []

    return NextResponse.json({
      soin: {
        slug: soin.slug,
        nom: soin.nom,
        description: soin.description,
        descriptionLongue: soin.descriptionLongue,
        prix: soin.prix,
        duree: soin.duree,
        categorie: soin.categorie,
        icon: soin.icon,
        badge: soin.badge,
        imageUrl: soin.imageUrl,
        bienfaits: soin.bienfaits,
        etapes: soin.etapes || [],
      },
      avis: avis.map(a => ({
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
    logger.error("Erreur API soin:", error)
    return NextResponse.json({ error: "Erreur lors de la récupération du soin" }, { status: 500 })
  }
}
