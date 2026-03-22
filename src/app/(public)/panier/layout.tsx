import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Mon panier",
  description:
    "Consultez et validez votre panier de produits naturels sur la boutique du Surnaturel de Dieu.",
}

export default function PanierLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
