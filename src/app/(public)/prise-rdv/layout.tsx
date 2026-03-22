import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Prendre un rendez-vous",
  description:
    "Réservez votre soin en ligne au Surnaturel de Dieu, Abidjan. Choisissez votre prestation, votre date et votre créneau en quelques clics.",
}

export default function PriseRDVLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
