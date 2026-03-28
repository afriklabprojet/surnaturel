import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Package } from "lucide-react"
import { prisma } from "@/lib/prisma"
import ProduitDetailClient from "@/components/boutique/ProduitDetailClient"
import AvisProduit from "@/components/boutique/AvisProduit"
import type { Metadata } from "next"

// ─── Metadata dynamique pour le SEO ──────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const produit = await prisma.produit.findUnique({
    where: { id },
    select: { nom: true, description: true, imageUrl: true },
  })

  if (!produit) {
    return { title: "Produit introuvable | Le Surnaturel de Dieu" }
  }

  return {
    title: `${produit.nom} | Le Surnaturel de Dieu`,
    description: produit.description,
    openGraph: {
      title: produit.nom,
      description: produit.description,
      ...(produit.imageUrl && { images: [{ url: produit.imageUrl }] }),
    },
  }
}

// ─── Page SSR ────────────────────────────────────────────────────

export default async function PageDetailProduit({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const produit = await prisma.produit.findUnique({
    where: { id },
  })

  if (!produit || !produit.actif) {
    notFound()
  }

  // Produits similaires (même catégorie)
  const similaires = await prisma.produit.findMany({
    where: {
      categorie: produit.categorie,
      id: { not: id },
      actif: true,
    },
    take: 4,
    select: {
      id: true,
      nom: true,
      description: true,
      prix: true,
      imageUrl: true,
      stock: true,
      categorie: true,
    },
  })

  // Compléter si pas assez
  const autresProduits =
    similaires.length < 4
      ? await prisma.produit.findMany({
          where: {
            id: { notIn: [id, ...similaires.map((p) => p.id)] },
            actif: true,
          },
          take: 4 - similaires.length,
          select: {
            id: true,
            nom: true,
            description: true,
            prix: true,
            imageUrl: true,
            stock: true,
            categorie: true,
          },
        })
      : []

  const tousLesSimilaires = [...similaires, ...autresProduits]

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <Link
          href="/boutique"
          className="flex items-center gap-2 font-body text-[13px] text-text-muted-brand transition-colors duration-200 hover:text-primary-brand"
        >
          <ArrowLeft size={14} />
          Retour à la boutique
        </Link>
      </nav>

      <ProduitDetailClient
        produit={{
          id: produit.id,
          nom: produit.nom,
          description: produit.description,
          descriptionLongue: produit.descriptionLongue,
          prix: produit.prix,
          prixPromo: produit.prixPromo,
          stock: produit.stock,
          imageUrl: produit.imageUrl,
          categorie: produit.categorie,
        }}
        similaires={tousLesSimilaires}
      />

      {/* Section Avis Clients */}
      <AvisProduit produitId={produit.id} produitNom={produit.nom} />
    </section>
  )
}
