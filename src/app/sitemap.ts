import { MetadataRoute } from "next"
import { prisma } from "@/lib/prisma"
import { SITE_URL } from "@/lib/site"

const BASE_URL = SITE_URL

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Pages statiques
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/soins`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/boutique`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/a-propos`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/sage-femme`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/prise-rdv`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/avis`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/decouvrir-communaute`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.6,
    },
  ]

  // Pages dynamiques — Soins
  let soinPages: MetadataRoute.Sitemap = []
  try {
    const soins = await prisma.soin.findMany({
      where: { actif: true },
      select: { slug: true },
    })
    soinPages = soins.map((soin) => ({
      url: `${BASE_URL}/soins/${soin.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }))
  } catch {
    // DB non disponible au build — pages dynamiques omises
  }

  // Pages dynamiques — Produits
  let produitPages: MetadataRoute.Sitemap = []
  try {
    const produits = await prisma.produit.findMany({
      where: { actif: true },
      select: { id: true },
    })
    produitPages = produits.map((produit) => ({
      url: `${BASE_URL}/boutique/${produit.id}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }))
  } catch {
    // Silently fail if DB not available
  }

  // Pages dynamiques — Articles blog
  let articlePages: MetadataRoute.Sitemap = []
  try {
    const articles = await prisma.article.findMany({
      where: { publie: true },
      select: { id: true, createdAt: true },
    })
    articlePages = articles.map((article) => ({
      url: `${BASE_URL}/blog/${article.id}`,
      lastModified: article.createdAt || new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }))
  } catch {
    // Silently fail if DB not available
  }

  return [...staticPages, ...soinPages, ...produitPages, ...articlePages]
}
