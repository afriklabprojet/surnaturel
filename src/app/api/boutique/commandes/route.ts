import logger from "@/lib/logger"
import { NextResponse } from "next/server"
import { z } from "zod/v4"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { envoyerEmailConfirmationCommande } from "@/lib/email"
import { captureApiError } from "@/lib/sentry"

const ligneSchema = z.object({
  produitId: z.string().min(1),
  quantite: z.number().int().min(1),
})

const commandeSchema = z.object({
  items: z.array(ligneSchema).min(1),
  codePromo: z.string().max(50).optional(),
  zoneId: z.string().optional(),
  fraisLivraison: z.number().min(0).optional(),
  nomDestinataire: z.string().min(1).max(200).optional(),
  adresseLivraison: z.string().min(5).max(500).optional(),
  telephoneLivraison: z.string().max(30).optional(),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Connectez-vous pour passer commande." }, { status: 401 })
  }

  // Vérifier que l'utilisateur a un numéro de téléphone valide
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { telephone: true },
  })

  if (!user?.telephone) {
    return NextResponse.json(
      { error: "Ajoutez votre numéro de téléphone dans votre profil avant de continuer." },
      { status: 400 }
    )
  }

  // Validation format téléphone Côte d'Ivoire (+225 ou 225 suivi de 10 chiffres)
  const cleanPhone = user.telephone.replace(/[\s\-().]/g, "")
  const phoneRegex = /^(\+?225)?[0-9]{10}$/
  if (!phoneRegex.test(cleanPhone)) {
    return NextResponse.json(
      { error: "Numéro de téléphone non reconnu. Vérifiez votre numéro dans votre profil (ex : 07 00 00 00 00)." },
      { status: 400 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Quelque chose ne va pas avec votre demande. Réessayez." },
      { status: 400 }
    )
  }

  const result = commandeSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    )
  }

  const { items, codePromo, zoneId, fraisLivraison: fraisLivraisonClient, nomDestinataire, adresseLivraison, telephoneLivraison } = result.data

  try {
    // Validate promo code server-side if provided
    let promoReduction = 0
    let promoCodeValide: string | null = null

    if (codePromo) {
      const config = await prisma.appConfig.findUnique({
        where: { cle: "bandeau_promo" },
      })
      if (config) {
        const promo: { actif: boolean; code: string; texte: string } =
          JSON.parse(config.valeur)
        if (promo.actif && codePromo.toUpperCase() === promo.code.toUpperCase()) {
          const match = promo.texte.match(/(\d+)%/)
          promoReduction = match ? parseInt(match[1], 10) : 0
          promoCodeValide = promo.code
        }
      }
    }

    // Calculer frais de livraison côté serveur pour éviter manipulation
    let fraisLivraison = 0
    let zoneLivraison: string | null = null

    if (zoneId) {
      const configLivraison = await prisma.appConfig.findUnique({
        where: { cle: "livraison" },
      })
      if (configLivraison) {
        const livraisonData = JSON.parse(configLivraison.valeur)
        const zone = livraisonData.zones?.find((z: { id: string; actif: boolean }) => z.id === zoneId && z.actif)
        if (zone) {
          zoneLivraison = zone.nom
          // Calculer total produits pour vérifier seuil gratuit
          const produitsTemp = await prisma.produit.findMany({
            where: { id: { in: items.map((i) => i.produitId) }, actif: true },
          })
          let totalTemp = 0
          for (const item of items) {
            const produit = produitsTemp.find((p) => p.id === item.produitId)
            if (produit) {
              const prix = produit.prixPromo && produit.prixPromo < produit.prix ? produit.prixPromo : produit.prix
              totalTemp += prix * item.quantite
            }
          }
          // Appliquer seuil gratuit
          if (livraisonData.seuilGratuit && totalTemp >= livraisonData.seuilGratuit) {
            fraisLivraison = 0
          } else {
            fraisLivraison = zone.frais || 0
          }
        }
      }
    } else if (fraisLivraisonClient !== undefined) {
      // Fallback au montant client si pas de zone (compatibilité)
      fraisLivraison = fraisLivraisonClient
    }

    const commande = await prisma.$transaction(async (tx) => {
      // Verrouiller les lignes produit pour éviter les achats simultanés du dernier stock
      const produitIds = items.map((i) => i.produitId)
      await tx.$executeRaw`SELECT id FROM "Produit" WHERE id = ANY(${produitIds}::text[]) FOR UPDATE`

      // Fetch all products and validate stock
      const produits = await tx.produit.findMany({
        where: { id: { in: produitIds }, actif: true },
      })

      const produitMap = new Map(produits.map((p) => [p.id, p]))

      const lignes: { produitId: string; quantite: number; prixUnitaire: number }[] = []
      let total = 0

      for (const item of items) {
        const produit = produitMap.get(item.produitId)
        if (!produit) {
          throw new Error(`Produit introuvable : ${item.produitId}`)
        }
        if (produit.stock < item.quantite) {
          throw new Error(
            `Stock insuffisant pour "${produit.nom}" (disponible : ${produit.stock}, demandé : ${item.quantite})`
          )
        }
        const prix = produit.prixPromo && produit.prixPromo < produit.prix
          ? produit.prixPromo
          : produit.prix
        lignes.push({
          produitId: item.produitId,
          quantite: item.quantite,
          prixUnitaire: prix,
        })
        total += prix * item.quantite
      }

      // Apply promo reduction
      const reduction = promoReduction > 0 ? Math.round(total * promoReduction / 100) : 0
      const totalFinal = total - reduction + fraisLivraison

      // Decrement stock
      for (const item of items) {
        await tx.produit.update({
          where: { id: item.produitId },
          data: { stock: { decrement: item.quantite } },
        })
      }

      // Create order
      return tx.commande.create({
        data: {
          userId: session.user!.id!,
          total: totalFinal,
          codePromo: promoCodeValide,
          reduction,
          fraisLivraison,
          zoneLivraison,
          nomDestinataire: nomDestinataire?.trim() || null,
          adresseLivraison: adresseLivraison?.trim() || null,
          telephoneLivraison: telephoneLivraison?.trim() || null,
          lignes: { create: lignes },
        },
        include: {
          lignes: { include: { produit: { select: { nom: true } } } },
          user: { select: { email: true, prenom: true } },
        },
      })
    })

    // Email de confirmation (non-bloquant)
    envoyerEmailConfirmationCommande({
      destinataire: commande.user.email,
      prenom: commande.user.prenom,
      commandeId: commande.id,
      total: commande.total,
      lignes: commande.lignes.map((l: { produit: { nom: string }; quantite: number; prixUnitaire: number }) => ({
        nom: l.produit.nom,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
      })),
    }).catch((e) => logger.error(e, "background task failed"))

    return NextResponse.json({ commandeId: commande.id }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur lors de la création de la commande"
    const isStockError = message.includes("Stock insuffisant") || message.includes("introuvable")
    if (!isStockError) {
      captureApiError(error, { route: "/api/boutique/commandes", method: "POST", userId: session.user?.id })
    }
    return NextResponse.json(
      { error: message },
      { status: isStockError ? 409 : 500 }
    )
  }
}
