import { NextResponse } from "next/server"
import { z } from "zod"
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
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide." },
      { status: 400 }
    )
  }

  const result = commandeSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Données invalides." },
      { status: 400 }
    )
  }

  const { items } = result.data

  try {
    const commande = await prisma.$transaction(async (tx) => {
      // Fetch all products and validate stock
      const produitIds = items.map((i) => i.produitId)
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
          total,
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
      lignes: commande.lignes.map((l) => ({
        nom: l.produit.nom,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
      })),
    }).catch(console.error)

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
