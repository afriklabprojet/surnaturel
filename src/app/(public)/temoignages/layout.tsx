import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Témoignages | Le Surnaturel de Dieu — Institut de bien-être Abidjan",
  description:
    "Découvrez les avis et témoignages de nos clients sur l'Institut Le Surnaturel de Dieu à Cocody Angré, Abidjan.",
  alternates: { canonical: "/temoignages" },
}

export default function TemoignagesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
