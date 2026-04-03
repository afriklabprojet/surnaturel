import type { MetadataRoute } from "next"

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lesurnatureldedieu.com"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api/",
          "/dashboard",
          "/profil",
          "/mes-rdv",
          "/suivi-medical",
          "/commandes",
          "/favoris",
          "/fidelite",
          "/notifications",
          "/parrainage",
          "/checkout",
          "/panier",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
