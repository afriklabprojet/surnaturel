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
    // Les admins vont toujours vers /admin, jamais /dashboard
    const role = (session.user as { role?: string }).role
    if (role === "ADMIN") redirect("/admin")

    const params = await searchParams
    const raw = params.callbackUrl ?? ""
    // Valider le callbackUrl — doit être un chemin relatif et PAS /connexion (anti-boucle)
    const safe =
      raw.startsWith("/") &&
      !raw.startsWith("//") &&
      !raw.startsWith("/\\") &&
      !raw.startsWith("/connexion")
        ? raw
        : "/dashboard"
    redirect(safe)
  }

  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary-brand/30 border-t-primary-brand" />
      </div>
    }>
      <ConnexionForm />
    </Suspense>
  )
}
