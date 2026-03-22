import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Boutique Produits Naturels | Le Surnaturel de Dieu — Abidjan",
  description:
    "Découvrez notre sélection de produits de beauté naturels pour le corps, le visage et le bien-être. Livraison à Abidjan et en Côte d'Ivoire.",
}

export default function BoutiqueLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
