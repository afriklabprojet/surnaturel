import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { envoyerEmailNewsletter } from "@/lib/email"

// GET — Liste des newsletters envoyées
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  
  // Vérifier le rôle admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })
  
  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const newsletters = await prisma.newsletter.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  // Statistiques globales
  const stats = {
    totalEnvoyes: newsletters.filter(n => n.envoye).length,
    totalDestinataires: newsletters.reduce((acc, n) => acc + n.nbDestinataires, 0),
    totalOuvertures: newsletters.reduce((acc, n) => acc + n.nbOuvertures, 0),
    tauxOuverture: newsletters.length > 0 
      ? Math.round(
          (newsletters.reduce((acc, n) => acc + n.nbOuvertures, 0) / 
           newsletters.reduce((acc, n) => acc + n.nbDestinataires, 0)) * 100
        ) || 0
      : 0,
  }

  // Nombre d'abonnés actifs
  const nbAbonnes = await prisma.user.count({
    where: {
      notifNewsletter: true,
    },
  })

  return NextResponse.json({
    newsletters,
    stats,
    nbAbonnes,
  })
}

// POST — Créer et envoyer une newsletter manuelle
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  
  // Vérifier le rôle admin
  const adminUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })
  
  if (adminUser?.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { sujet, messagePersonnalise, codePromo, envoyerMaintenant } = body

    // Récupérer les abonnés
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
      return NextResponse.json(
        { error: "Aucun abonné à la newsletter" },
        { status: 400 }
      )
    }

    // Récupérer les derniers articles
    const dateIlYA7Jours = new Date()
    dateIlYA7Jours.setDate(dateIlYA7Jours.getDate() - 7)

    const articles = await prisma.article.findMany({
      where: {
        publie: true,
        createdAt: { gte: dateIlYA7Jours },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    })

    // Récupérer les soins populaires
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
        })
      : []

    // Créer l'enregistrement newsletter
    const newsletter = await prisma.newsletter.create({
      data: {
        sujet: sujet || "🌿 Les actualités du Surnaturel de Dieu",
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
          codePromo: codePromo || undefined,
          messagePersonnalise: messagePersonnalise || undefined,
        }),
        type: "MANUEL",
        nbDestinataires: abonnes.length,
        envoye: false,
      },
    })

    if (envoyerMaintenant) {
      // Contenu à envoyer
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
        codePromo: codePromo || undefined,
        messagePersonnalise: messagePersonnalise || undefined,
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
            console.error(`Erreur envoi à ${abonne.email}:`, error)
            erreurs++
          }
        })
      )

      // Mettre à jour le statut
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
    }

    return NextResponse.json({
      success: true,
      newsletterId: newsletter.id,
      message: "Newsletter créée (non envoyée)",
      nbDestinataires: abonnes.length,
    })
  } catch (error) {
    console.error("Erreur création newsletter:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création de la newsletter" },
      { status: 500 }
    )
  }
}
