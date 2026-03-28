import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

const schema = z.object({
  code: z.string().min(1).max(50),
  montantPanier: z.number().optional(),
  produitIds: z.array(z.string()).optional(), // Pour vérifier les catégories
})

// POST /api/boutique/promo — Validate a promo code server-side (avancé)
export async function POST(request: Request) {
  const session = await auth()

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 })
  }

  const result = schema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: "Code promo requis." }, { status: 400 })
  }

  const { code, montantPanier, produitIds } = result.data
  const codeUpper = code.toUpperCase()
  const now = new Date()

  try {
    // 1. Chercher dans la table CodePromo (codes campagne)
    const codePromo = await prisma.codePromo.findUnique({
      where: { code: codeUpper },
      include: {
        utilisations: session?.user?.id ? {
          where: { userId: session.user.id },
        } : false,
      },
    })

    if (codePromo) {
      // Vérifications de base
      if (!codePromo.actif) {
        return NextResponse.json({ valide: false, error: "Ce code promo n'est plus actif." })
      }
      if (codePromo.debutValidite && now < codePromo.debutValidite) {
        return NextResponse.json({ valide: false, error: "Ce code promo n'est pas encore valide." })
      }
      if (codePromo.finValidite && now > codePromo.finValidite) {
        return NextResponse.json({ valide: false, error: "Ce code promo a expiré." })
      }
      if (codePromo.usageMax && codePromo.usageActuel >= codePromo.usageMax) {
        return NextResponse.json({ valide: false, error: "Ce code promo a atteint sa limite d'utilisation." })
      }
      if (codePromo.montantMin && montantPanier && montantPanier < codePromo.montantMin) {
        return NextResponse.json({ 
          valide: false, 
          error: `Montant minimum de panier : ${codePromo.montantMin.toLocaleString("fr-FR")} F CFA` 
        })
      }

      // Vérifications avancées (si utilisateur connecté)
      if (session?.user?.id) {
        // Vérifier la limite par utilisateur
        const utilisations = Array.isArray(codePromo.utilisations) ? codePromo.utilisations : []
        if (utilisations.length >= codePromo.usageParUser) {
          return NextResponse.json({ 
            valide: false, 
            error: "Vous avez déjà utilisé ce code promo." 
          })
        }

        // Vérifier si c'est pour la première commande seulement
        if (codePromo.premiereCommande) {
          const commandeExistante = await prisma.commande.findFirst({
            where: { userId: session.user.id, statut: { not: "ANNULEE" } },
          })
          if (commandeExistante) {
            return NextResponse.json({ 
              valide: false, 
              error: "Ce code est réservé à votre première commande." 
            })
          }
        }

        // Vérifier si c'est pour les nouveaux clients (inscrits < 30 jours)
        if (codePromo.nouveauxClients) {
          const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { createdAt: true },
          })
          if (user) {
            const joursDepuisInscription = Math.floor(
              (now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
            )
            if (joursDepuisInscription > 30) {
              return NextResponse.json({ 
                valide: false, 
                error: "Ce code est réservé aux nouveaux clients." 
              })
            }
          }
        }
      } else if (codePromo.premiereCommande || codePromo.nouveauxClients) {
        // Si le code nécessite une connexion
        return NextResponse.json({ 
          valide: false, 
          error: "Connectez-vous pour utiliser ce code promo." 
        })
      }

      // Vérifier les catégories de produits si spécifiées
      if (codePromo.categoriesProduits.length > 0 && produitIds && produitIds.length > 0) {
        const produits = await prisma.produit.findMany({
          where: { id: { in: produitIds } },
          select: { id: true, categorie: true },
        })
        const hasValidCategory = produits.some(p => 
          codePromo.categoriesProduits.includes(p.categorie)
        )
        if (!hasValidCategory) {
          return NextResponse.json({ 
            valide: false, 
            error: "Ce code n'est pas valide pour ces produits." 
          })
        }
      }

      // Vérifier les produits exclus
      if (codePromo.produitsExclus.length > 0 && produitIds) {
        const tousProduitsSontExclus = produitIds.every(id => 
          codePromo.produitsExclus.includes(id)
        )
        if (tousProduitsSontExclus) {
          return NextResponse.json({ 
            valide: false, 
            error: "Ce code n'est pas valide pour ces produits." 
          })
        }
      }

      // Calculer la réduction
      const pourcentage = codePromo.type === "POURCENTAGE" 
        ? codePromo.valeur 
        : (codePromo.pourcentage ?? 0)
      
      let reductionCalculee: number | undefined
      if (montantPanier) {
        if (codePromo.type === "POURCENTAGE") {
          reductionCalculee = Math.round(montantPanier * codePromo.valeur / 100)
          // Appliquer le plafond si défini
          if (codePromo.montantMax && reductionCalculee > codePromo.montantMax) {
            reductionCalculee = codePromo.montantMax
          }
        } else {
          reductionCalculee = codePromo.valeur
        }
      }

      return NextResponse.json({
        valide: true,
        code: codePromo.code,
        type: codePromo.type,
        valeur: codePromo.valeur,
        pourcentage: codePromo.type === "POURCENTAGE" ? codePromo.valeur : undefined,
        montantFixe: codePromo.type === "MONTANT_FIXE" ? codePromo.valeur : undefined,
        montantMax: codePromo.montantMax,
        reduction: reductionCalculee,
        detail: codePromo.description || (
          codePromo.type === "POURCENTAGE" 
            ? `${codePromo.valeur}% de réduction`
            : `${codePromo.valeur.toLocaleString("fr-FR")} F CFA de réduction`
        ),
        cumulable: codePromo.cumulable,
      })
    }

    // 2. Fallback : vérifier le code bienvenue depuis AppConfig
    const config = await prisma.appConfig.findUnique({
      where: { cle: "bandeau_promo" },
    })

    if (!config) {
      return NextResponse.json({ valide: false, error: "Code promo invalide." })
    }

    const promo: { actif: boolean; code: string; texte: string; detail: string } =
      JSON.parse(config.valeur)

    if (!promo.actif || codeUpper !== promo.code.toUpperCase()) {
      return NextResponse.json({ valide: false, error: "Code promo invalide." })
    }

    // Extract percentage from texte (e.g. "−10% sur votre 1er soin")
    const match = promo.texte.match(/(\d+)%/)
    const pourcentage = match ? parseInt(match[1], 10) : 10

    return NextResponse.json({
      valide: true,
      code: promo.code,
      type: "POURCENTAGE",
      valeur: pourcentage,
      pourcentage,
      detail: promo.detail,
    })
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la validation du code promo." },
      { status: 500 }
    )
  }
}
