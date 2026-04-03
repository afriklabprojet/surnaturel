import { typedLogger as logger } from "@/lib/logger"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { envoyerEmailNewsletter } from "@/lib/email"

// GET — appelé par le cron Vercel chaque dimanche à 10h
export async function GET(request: Request) {
  // Protection par secret partagé
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    // Récupérer les utilisateurs abonnés à la newsletter
    const abonnes = await prisma.user.findMany({
      where: {
        notifNewsletter: true,
      },
      select: {
        id: true,
        email: true,
        prenom: true,
      },
    })

    if (abonnes.length === 0) {
      return NextResponse.json({
        message: "Aucun abonné à la newsletter",
        envoyes: 0,
      })
    }

    // Récupérer les derniers articles de blog (7 derniers jours)
    const dateIlYA7Jours = new Date()
    dateIlYA7Jours.setDate(dateIlYA7Jours.getDate() - 7)

    const articles = await prisma.article.findMany({
      where: {
        publie: true,
        createdAt: { gte: dateIlYA7Jours },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        titre: true,
        contenu: true,
        slug: true,
        imageUrl: true,
      },
    })

    // Récupérer les soins les plus populaires (basé sur les RDV récents)
    const soinsPopulaires = await prisma.rendezVous.groupBy({
      by: ["soinId"],
      _count: { id: true },
      where: {
        dateHeure: { gte: dateIlYA7Jours },
      },
      orderBy: { _count: { id: "desc" } },
      take: 3,
    })

    const soins = soinsPopulaires.length > 0 
      ? await prisma.soin.findMany({
          where: { id: { in: soinsPopulaires.map(s => s.soinId) } },
          select: { nom: true, description: true, slug: true },
        })
      : []

    // Récupérer un code promo actif (optionnel)
    const dateAujourdhui = new Date()
    const codePromoActif = await prisma.codePromo.findFirst({
      where: {
        actif: true,
        debutValidite: { lte: dateAujourdhui },
        finValidite: { gte: dateAujourdhui },
      },
      select: {
        code: true,
        pourcentage: true,
        finValidite: true,
      },
    })

    // Créer l'enregistrement newsletter
    const newsletter = await prisma.newsletter.create({
      data: {
        sujet: "🌿 Les actualités du Surnaturel de Dieu",
        contenu: JSON.stringify({
          articles: articles.map(a => ({
            titre: a.titre,
            extrait: a.contenu.substring(0, 150) + "...",
            slug: a.slug,
            imageUrl: a.imageUrl,
          })),
          soinsPopulaires: soins.map(s => ({
            nom: s.nom,
            description: s.description?.substring(0, 100) + "..." || "",
            slug: s.slug,
          })),
          codePromo: codePromoActif ? {
            code: codePromoActif.code,
            reduction: `${codePromoActif.pourcentage}% de réduction`,
            dateExpiration: codePromoActif.finValidite 
              ? new Intl.DateTimeFormat("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }).format(codePromoActif.finValidite)
              : "Sans limite",
          } : undefined,
        }),
        type: "HEBDOMADAIRE",
        nbDestinataires: abonnes.length,
        envoye: false,
      },
    })

    // Contenu de la newsletter
    const contenu = {
      articles: articles.map(a => ({
        titre: a.titre,
        extrait: a.contenu.substring(0, 150) + "...",
        slug: a.slug,
        imageUrl: a.imageUrl || undefined,
      })),
      soinsPopulaires: soins.map(s => ({
        nom: s.nom,
        description: s.description?.substring(0, 100) + "..." || "",
        slug: s.slug,
      })),
      codePromo: codePromoActif ? {
        code: codePromoActif.code,
        reduction: `${codePromoActif.pourcentage}% de réduction`,
        dateExpiration: codePromoActif.finValidite 
          ? new Intl.DateTimeFormat("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(codePromoActif.finValidite)
          : "Sans limite",
      } : undefined,
    }

    // Envoyer les emails
    let envoyes = 0
    let erreurs = 0

    await Promise.allSettled(
      abonnes.map(async (abonne) => {
        try {
          await envoyerEmailNewsletter(
            abonne.email,
            abonne.prenom || "",
            contenu
          )
          envoyes++
        } catch (error) {
          logger.error(`Erreur envoi newsletter à ${abonne.email}:`, error)
          erreurs++
        }
      })
    )

    // Mettre à jour l'enregistrement newsletter
    await prisma.newsletter.update({
      where: { id: newsletter.id },
      data: {
        envoye: true,
        dateEnvoi: new Date(),
        nbDestinataires: envoyes,
      },
    })

    return NextResponse.json({
      success: true,
      newsletterId: newsletter.id,
      envoyes,
      erreurs,
      total: abonnes.length,
    })
  } catch (error) {
    logger.error("Erreur cron newsletter:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de la newsletter" },
      { status: 500 }
    )
  }
}
