import { Suspense } from "react"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import ConnexionForm from "./connexion-form"

export const metadata: Metadata = {
  title: "Connexion | Le Surnaturel de Dieu",
}

export default async function PageConnexion({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const session = await auth()
  if (session?.user) {
    const params = await searchParams
    const raw = params.callbackUrl ?? ""
    const safe =
      raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/\\")
        ? raw
        : "/dashboard"
    redirect(safe)
  }

  return (
    <Suspense>
      <ConnexionForm />
    </Suspense>
  )
}
