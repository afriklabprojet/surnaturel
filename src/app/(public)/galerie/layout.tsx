import type { Metadata } from "next"
import { SITE_NAME, SITE_URL } from "@/lib/site"

export const metadata: Metadata = {
  title: "Galerie Avant / Après",
  description: `Découvrez les résultats de nos soins en images avant/après. ${SITE_NAME} vous montre les transformations de nos patientes à Abidjan.`,
  alternates: { canonical: `${SITE_URL}/galerie` },
  openGraph: {
    title: `Galerie Avant / Après — ${SITE_NAME}`,
    description: "Résultats visibles de nos soins : photos avant et après de nos patientes.",
    url: `${SITE_URL}/galerie`,
  },
}

export default function GalerieLayout({ children }: { children: React.ReactNode }) {
  return children
}
