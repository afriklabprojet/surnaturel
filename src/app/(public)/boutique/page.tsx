import { Suspense } from "react"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { HeroBoutique, BoutiqueCatalogue } from "@/components/boutique/BoutiqueClientSections"

export const revalidate = 300

export const metadata: Metadata = {
  title: "Boutique Naturelle | Le Surnaturel de Dieu — Abidjan",
  description:
    "Découvrez notre boutique de produits naturels à Abidjan : huiles, soins du corps, cosmétiques bio et produits de bien-être sélectionnés avec soin.",
  alternates: { canonical: "/boutique" },
}

export default async function PageBoutique() {
  const LIMIT = 8

  const [produitsData, total, promoConfig, categoriesConfig] = await Promise.all([
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
    prisma.appConfig.findUnique({ where: { cle: "categories_produit" } }),
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

  let categories: { label: string; value: string }[] = []
  try {
    if (categoriesConfig) {
      const parsed = JSON.parse(categoriesConfig.valeur)
      if (Array.isArray(parsed)) {
        categories = parsed.filter((c) => c.value && c.value !== "TOUS" && c.value !== "all")
      }
    }
  } catch { /* keep empty array */ }

  return (
    <Suspense>
      <HeroBoutique codePromo={codePromo} promoPourcentage={promoPourcentage} />
      <BoutiqueCatalogue
        produitsInitiaux={produits}
        totalInitial={total}
        pagesInitiales={pages}
        categoriesConfig={categories}
      />
    </Suspense>
  )
}
