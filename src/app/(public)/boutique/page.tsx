import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { HeroBoutique, BoutiqueCatalogue } from "@/components/boutique/BoutiqueClientSections"

export default async function PageBoutique() {
  const LIMIT = 8

  const [produitsData, total, promoConfig] = await Promise.all([
    prisma.produit.findMany({
      where: { actif: true },
      orderBy: { createdAt: "desc" },
      take: LIMIT,
      select: {
        id: true,
        nom: true,
        description: true,
        prix: true,
        prixPromo: true,
        stock: true,
        imageUrl: true,
        categorie: true,
        createdAt: true,
      },
    }),
    prisma.produit.count({ where: { actif: true } }),
    prisma.appConfig.findUnique({ where: { cle: "bandeau_promo" } }),
  ])

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const produits = produitsData.map((p) => ({
    id: p.id,
    nom: p.nom,
    description: p.description,
    prix: p.prix,
    prixPromo: p.prixPromo,
    stock: p.stock,
    imageUrl: p.imageUrl,
    categorie: p.categorie,
    nouveau: p.createdAt >= thirtyDaysAgo,
  }))

  const pages = Math.ceil(total / LIMIT)

  const promo: { actif: boolean; code: string; texte: string; detail: string } | null =
    promoConfig ? JSON.parse(promoConfig.valeur) : null

  const codePromo = promo?.actif ? promo.code : ""
  const promoPourcentage = promo?.actif ? promo.texte.match(/\d+%/)?.[0] || "10%" : "10%"

  return (
    <Suspense>
      <HeroBoutique codePromo={codePromo} promoPourcentage={promoPourcentage} />
      <BoutiqueCatalogue
        produitsInitiaux={produits}
        totalInitial={total}
        pagesInitiales={pages}
      />
    </Suspense>
  )
}
