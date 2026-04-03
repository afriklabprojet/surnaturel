import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/site"

const BASE_URL = SITE_URL

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
