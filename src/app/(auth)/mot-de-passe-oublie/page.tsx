import { Suspense } from "react"
import type { Metadata } from "next"
import ResetForm from "./reset-form"

export const metadata: Metadata = {
  title: "Mot de passe oublié | Le Surnaturel de Dieu",
}

export default function PageMotDePasseOublie() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  )
}
