import { Suspense } from "react"
import type { Metadata } from "next"
import ConnexionForm from "./connexion-form"

export const metadata: Metadata = {
  title: "Connexion | Le Surnaturel de Dieu",
}

export default function PageConnexion() {
  return (
    <Suspense>
      <ConnexionForm />
    </Suspense>
  )
}
