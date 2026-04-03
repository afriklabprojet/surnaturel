import { prisma } from "@/lib/prisma"
import type { Metadata } from "next"
import AbonnementFormules from "@/components/abonnements/AbonnementFormules"

export const metadata: Metadata = {
  title: "Abonnements — Le Surnaturel de Dieu",
  description:
    "Profitez de soins réguliers à prix avantageux avec nos formules d'abonnement mensuel. Choisissez la formule qui vous convient.",
  alternates: { canonical: "/abonnements" },
}

async function getFormules() {
  return prisma.formuleAbonnement.findMany({
    where: { actif: true },
    orderBy: { ordre: "asc" },
  })
}

async function getFaq() {
  return prisma.faq.findMany({
    where: { categorie: "abonnements", actif: true },
    orderBy: { ordre: "asc" },
  })
}

export default async function AbonnementsPage() {
  const [formules, faq] = await Promise.all([getFormules(), getFaq()])

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Header — rendu serveur */}
      <div className="text-center">
        <h1 className="font-display text-[36px] text-primary-brand md:text-[48px]">
          Nos Abonnements
        </h1>
        <p className="mx-auto mt-4 max-w-2xl font-body text-[16px] text-text-mid">
          Profitez de soins réguliers à prix avantageux avec nos formules d&apos;abonnement mensuel.
          Choisissez la formule qui vous convient et bénéficiez de réductions exclusives.
        </p>
      </div>

      {/* Grille interactive + Mon abonnement (client) */}
      <AbonnementFormules formules={formules} />

      {/* FAQ — rendu serveur, indexable par les moteurs de recherche */}
      {faq.length > 0 && (
        <div className="mx-auto mt-20 max-w-2xl">
          <h2 className="text-center font-display text-[28px] text-primary-brand">
            Questions fréquentes
          </h2>
          <div className="mt-8 space-y-6">
            {faq.map((item) => (
              <div key={item.id} className="border-b border-border-brand pb-4">
                <h3 className="font-medium text-text-main">{item.question}</h3>
                <p className="mt-2 text-[14px] text-text-mid">{item.reponse}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
