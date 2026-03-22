import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Laisser un avis",
  description:
    "Partagez votre expérience suite à votre rendez-vous au Surnaturel de Dieu.",
  robots: { index: false },
}

export default function AvisLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
