import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Nos Soins & Services | Le Surnaturel de Dieu — Institut de bien-être Abidjan",
  description:
    "Hammam royal, gommage corps luxe, soin visage éclat, programme post-accouchement et conseil esthétique. Découvrez nos soins d'exception à Abidjan.",
}

export default function SoinsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
