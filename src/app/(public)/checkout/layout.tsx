import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Paiement",
  description:
    "Finalisez votre commande et payez en toute sécurité via Mobile Money ou carte bancaire.",
}

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
