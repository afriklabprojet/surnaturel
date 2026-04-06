import type { Metadata } from "next"
import { getConfig } from "@/lib/config"
import { prisma } from "@/lib/prisma"
import { Fragment } from "react"

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Politique de confidentialité du site Le Surnaturel de Dieu — Institut de bien-être à Abidjan. Protection de vos données personnelles.",
  alternates: { canonical: "/politique-confidentialite" },
}

interface Section { titre: string; contenu: string }

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  return parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : <Fragment key={i}>{part}</Fragment>))
}

function renderContenu(raw: string, config: { email: string; telephone: string; telephoneTel: string; adresseFull: string; nomCentre: string; fondatrice: string }) {
  const text = raw
    .replace(/\{\{nomCentre\}\}/g, config.nomCentre)
    .replace(/\{\{fondatrice\}\}/g, config.fondatrice)
    .replace(/\{\{adresse\}\}/g, config.adresseFull)
    .replace(/\{\{telephone\}\}/g, config.telephone)
    .replace(/\{\{email\}\}/g, config.email)

  const lines = text.split("\n")
  const elements: React.ReactNode[] = []
  let listItems: React.ReactNode[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith("- ")) {
      listItems.push(<li key={`li-${i}`}>{renderInline(line.slice(2))}</li>)
    } else {
      if (listItems.length > 0) {
        elements.push(<ul key={`ul-${i}`} className="mt-2 list-disc space-y-1 pl-5">{listItems}</ul>)
        listItems = []
      }
      if (line.trim()) {
        elements.push(<p key={`p-${i}`}>{renderInline(line)}</p>)
      }
    }
  }
  if (listItems.length > 0) {
    elements.push(<ul key="ul-last" className="mt-2 list-disc space-y-1 pl-5">{listItems}</ul>)
  }
  return elements
}

export default async function PolitiqueConfidentialite() {
  const config = await getConfig()

  let sections: Section[] = []
  try {
    const row = await prisma.appConfig.findUnique({ where: { cle: "politique_confidentialite" } })
    if (row) {
      const parsed = JSON.parse(row.valeur)
      if (Array.isArray(parsed) && parsed.length > 0) sections = parsed
    }
  } catch { /* use default hardcoded */ }

  if (sections.length > 0) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-20 lg:px-10">
        <h1 className="font-display text-3xl font-light text-text-main sm:text-4xl">
          Politique de confidentialité
        </h1>
        <p className="mt-4 font-body text-sm text-text-muted-brand">
          Dernière mise à jour : mars 2026
        </p>
        <div className="mt-10 space-y-8 font-body text-sm leading-relaxed text-text-mid">
          {sections.map((s, i) => (
            <div key={i}>
              <h2 className="mb-3 font-display text-xl font-light text-text-main">{s.titre}</h2>
              {renderContenu(s.contenu, config)}
            </div>
          ))}
        </div>
      </section>
    )
  }

  // Fallback: contenu par défaut hardcodé
  return (
    <section className="mx-auto max-w-3xl px-6 py-20 lg:px-10">
      <h1 className="font-display text-3xl font-light text-text-main sm:text-4xl">
        Politique de confidentialité
      </h1>
      <p className="mt-4 font-body text-sm text-text-muted-brand">
        Dernière mise à jour : mars 2026
      </p>

      <div className="mt-10 space-y-8 font-body text-sm leading-relaxed text-text-mid">
        <div>
          <h2 className="mb-3 font-display text-xl font-light text-text-main">
            1. Responsable du traitement
          </h2>
          <p>
            Le responsable du traitement de vos données personnelles est
            <strong> Le Surnaturel de Dieu</strong>, institut de bien-être situé
            à {config.adresseFull},
            représenté par {config.fondatrice}.
          </p>
        </div>

        <div>
          <h2 className="mb-3 font-display text-xl font-light text-text-main">
            2. Données collectées
          </h2>
          <p>Nous collectons les données suivantes :</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong>Inscription</strong> : nom, prénom, adresse email, mot de passe (chiffré)</li>
            <li><strong>Prise de rendez-vous</strong> : soin choisi, date et heure, notes optionnelles</li>
            <li><strong>Commandes</strong> : produits, adresse de livraison, méthode de paiement</li>
            <li><strong>Suivi médical</strong> : données de santé (chiffrées AES-256), consultations, mesures</li>
            <li><strong>Navigation</strong> : cookies de session, préférences de thème</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 font-display text-xl font-light text-text-main">
            3. Finalités du traitement
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Gestion de votre compte et de vos rendez-vous</li>
            <li>Traitement de vos commandes et paiements</li>
            <li>Suivi médical personnalisé (avec votre consentement explicite)</li>
            <li>Envoi de confirmations et rappels par email</li>
            <li>Programme de fidélité et parrainage</li>
            <li>Amélioration de nos services et analyse de fréquentation</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 font-display text-xl font-light text-text-main">
            4. Base légale
          </h2>
          <p>
            Le traitement de vos données repose sur : votre consentement (inscription,
            suivi médical), l&apos;exécution d&apos;un contrat (commandes, rendez-vous) et notre
            intérêt légitime (amélioration du service, sécurité).
          </p>
        </div>

        <div>
          <h2 className="mb-3 font-display text-xl font-light text-text-main">
            5. Sécurité des données
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Mots de passe chiffrés avec bcrypt</li>
            <li>Données médicales chiffrées AES-256 avec audit de chaque accès</li>
            <li>Communications HTTPS obligatoires (HSTS)</li>
            <li>Accès restreint par rôle (client, accompagnateur médical, administrateur)</li>
            <li>Protection contre les attaques par limitation du débit (rate limiting)</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 font-display text-xl font-light text-text-main">
            6. Partage des données
          </h2>
          <p>
            Vos données ne sont jamais vendues. Elles peuvent être partagées avec :
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong>Jeko Africa</strong> : traitement des paiements Mobile Money</li>
            <li><strong>Resend</strong> : envoi des emails transactionnels</li>
            <li><strong>Hostinger</strong> : hébergement du site</li>
            <li><strong>Neon</strong> : hébergement de la base de données</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 font-display text-xl font-light text-text-main">
            7. Durée de conservation
          </h2>
          <p>
            Vos données sont conservées pendant la durée de votre utilisation du service.
            À la suppression de votre compte, vos données personnelles sont effacées sous
            30 jours, à l&apos;exception des données comptables conservées conformément aux
            obligations légales (10 ans).
          </p>
        </div>

        <div>
          <h2 className="mb-3 font-display text-xl font-light text-text-main">
            8. Vos droits
          </h2>
          <p>
            Conformément à la loi ivoirienne n°2013-450, vous disposez des droits
            suivants :
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Droit d&apos;accès à vos données personnelles</li>
            <li>Droit de rectification des données inexactes</li>
            <li>Droit de suppression de vos données</li>
            <li>Droit d&apos;opposition au traitement</li>
            <li>Droit à la portabilité de vos données</li>
          </ul>
          <p className="mt-3">
            Pour exercer ces droits, contactez-nous à :
            <a href={`mailto:${config.email}`} className="ml-1 text-primary-brand hover:underline">
              {config.email}
            </a>
          </p>
        </div>

        <div>
          <h2 className="mb-3 font-display text-xl font-light text-text-main">
            9. Contact
          </h2>
          <p>
            Pour toute question relative à cette politique, vous pouvez nous contacter :<br />
            Email : <a href={`mailto:${config.email}`} className="text-primary-brand hover:underline">{config.email}</a><br />
            Téléphone : <a href={`tel:${config.telephoneTel}`} className="text-primary-brand hover:underline">{config.telephone}</a><br />
            Adresse : {config.adresseFull}
          </p>
        </div>
      </div>
    </section>
  )
}
