import { typedLogger as logger } from "@/lib/logger"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { envoyerEmailRenouvellementAbonnement } from "@/lib/email"

/**
 * CRON pour renouveler les abonnements mensuels
 * - Réinitialise les soins restants chaque mois
 * - Crée les paiements à effectuer
 * 
 * À exécuter le 1er de chaque mois
 * node-cron (PM2): "0 0 1 * *"
 */
export async function GET(request: Request) {
  try {
    // Vérifier le secret CRON
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const now = new Date()
    const debutMois = new Date(now.getFullYear(), now.getMonth(), 1)

    // Trouver les abonnements actifs qui doivent être renouvelés
    const abonnementsAReneaveler = await prisma.abonnementMensuel.findMany({
      where: {
        statut: "ACTIF",
        dateProchainPaiement: {
          lte: now,
        },
      },
      include: {
        formule: true,
        user: {
          select: {
            id: true,
            email: true,
            prenom: true,
          },
        },
      },
    })

    let renouveles = 0
    let erreurs = 0
    const details: Array<{ id: string; success: boolean; error?: string }> = []

    for (const abonnement of abonnementsAReneaveler) {
      try {
        // Calculer la prochaine date de paiement
        const prochainPaiement = new Date(abonnement.dateProchainPaiement)
        switch (abonnement.frequence) {
          case "TRIMESTRIEL":
            prochainPaiement.setMonth(prochainPaiement.getMonth() + 3)
            break
          case "SEMESTRIEL":
            prochainPaiement.setMonth(prochainPaiement.getMonth() + 6)
            break
          case "ANNUEL":
            prochainPaiement.setFullYear(prochainPaiement.getFullYear() + 1)
            break
          default:
            prochainPaiement.setMonth(prochainPaiement.getMonth() + 1)
        }

        // Mettre à jour l'abonnement
        await prisma.abonnementMensuel.update({
          where: { id: abonnement.id },
          data: {
            soinsRestantsMois: abonnement.formule.nbSoinsParMois,
            moisEnCours: debutMois,
            dateProchainPaiement: prochainPaiement,
          },
        })

        // Créer le paiement pour ce mois
        await prisma.paiementAbonnement.create({
          data: {
            abonnementId: abonnement.id,
            montant: abonnement.formule.prixMensuel,
            moisConcerne: debutMois,
            statut: "EN_ATTENTE",
          },
        })

        renouveles++
        details.push({ id: abonnement.id, success: true })

        // Envoyer notification de renouvellement
        try {
          await envoyerEmailRenouvellementAbonnement({
            destinataire: abonnement.user.email,
            prenom: abonnement.user.prenom,
            formule: abonnement.formule.nom,
            montant: abonnement.formule.prixMensuel,
            prochainPaiement: prochainPaiement.toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }),
          })
        } catch {
          // Ne pas bloquer le renouvellement si l'email échoue
        }
      } catch (err) {
        erreurs++
        details.push({
          id: abonnement.id,
          success: false,
          error: err instanceof Error ? err.message : "Erreur inconnue",
        })
      }
    }

    // Marquer les abonnements expirés (paiement en échec depuis 3 tentatives)
    const paiementsEchecs = await prisma.paiementAbonnement.groupBy({
      by: ["abonnementId"],
      where: {
        statut: "ECHEC",
        createdAt: {
          gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 derniers jours
        },
      },
      _count: true,
      having: {
        abonnementId: {
          _count: {
            gte: 3,
          },
        },
      },
    })

    for (const echec of paiementsEchecs) {
      await prisma.abonnementMensuel.update({
        where: { id: echec.abonnementId },
        data: { statut: "EXPIRE" },
      })
    }

    return NextResponse.json({
      success: true,
      total: abonnementsAReneaveler.length,
      renouveles,
      erreurs,
      expires: paiementsEchecs.length,
      details,
    })
  } catch (error) {
    logger.error("Erreur CRON renouvellement abonnements:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}
