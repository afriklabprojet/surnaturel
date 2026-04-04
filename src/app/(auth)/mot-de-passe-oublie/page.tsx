import { Suspense } from "react"
import type { Metadata } from "next"
import ResetForm from "./reset-form"

export const metadata: Metadata = {
  title: "Mot de passe oublié | Le Surnaturel de Dieu",
}

export default function PageMotDePasseOublie() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary-brand/30 border-t-primary-brand" />
      </div>
    }>
      <ResetForm />
    </Suspense>
  )
}
