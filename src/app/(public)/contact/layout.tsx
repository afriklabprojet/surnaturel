import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact | Le Surnaturel de Dieu — Institut de bien-être Abidjan",
  description:
    "Contactez Le Surnaturel de Dieu à Cocody Angré, Abidjan. Téléphone, email et formulaire de contact. Ouvert du lundi au samedi.",
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
