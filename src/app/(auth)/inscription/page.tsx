import type { Metadata } from "next"
import InscriptionForm from "./inscription-form"

export const metadata: Metadata = {
  title: "Créer un compte | Le Surnaturel de Dieu",
}

export default function PageInscription() {
  return <InscriptionForm />
}
