import type { Metadata } from "next"
import { getConfig } from "@/lib/config"
import { prisma } from "@/lib/prisma"
import { Fragment } from "react"

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales du site Le Surnaturel de Dieu — Institut de bien-être à Abidjan. Informations sur l'éditeur et l'hébergeur.",
  alternates: { canonical: "/mentions-legales" },
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

export default async function MentionsLegales() {
  const config = await getConfig()

  let sections: Section[] = []
  try {
    const row = await prisma.appConfig.findUnique({ where: { cle: "mentions_legales" } })
    if (row) {
      const parsed = JSON.parse(row.valeur)
      if (Array.isArray(parsed) && parsed.length > 0) sections = parsed
    }
  } catch { /* use default hardcoded */ }

  if (sections.length > 0) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-20 lg:px-10">
        <h1 className="font-display text-3xl font-light text-text-main sm:text-4xl">
          Mentions légales
        </h1>
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
        Mentions légales
      </h1>
      <div className="mt-10 space-y-8 font-body text-sm leading-relaxed text-text-mid">
        <div>
          <h2 className="mb-3 font-display text-xl font-light text-text-main">
            Éditeur du site
          </h2>
          <p>
            <strong>{config.nomCentre} — Institut de Bien-Être</strong><br />
            Fondatrice : {config.fondatrice}<br />
            Adresse : {config.adresseFull}<br />
            Téléphone : <a href={`tel:${config.telephoneTel}`} className="text-primary-brand hover:underline">{config.telephone}</a><br />
            Email : <a href={`mailto:${config.email}`} className="text-primary-brand hover:underline">{config.email}</a>
          </p>
        </div>

        <div>
          <h2 className="mb-3 font-display text-xl font-light text-text-main">
            Hébergement
          </h2>
          <p>
            Le site est hébergé par <strong>Hostinger International Ltd.</strong><br />
            61 Lordou Vironos str., 6023 Larnaca, Chypre<br />
            Site web : <a href="https://www.hostinger.fr" target="_blank" rel="noopener noreferrer" className="text-primary-brand hover:underline">hostinger.fr</a>
          </p>
        </div>

        <div>
          <h2 className="mb-3 font-display text-xl font-light text-text-main">
            Propriété intellectuelle
          </h2>
          <p>
            L&apos;ensemble des contenus présents sur le site (textes, images, logos, graphismes)
            sont la propriété exclusive de Le Surnaturel de Dieu, sauf mention contraire.
            Toute reproduction, représentation ou diffusion, en tout ou partie, du contenu de
            ce site sans l&apos;autorisation expresse de l&apos;éditeur est interdite et constituerait une
            contrefaçon sanctionnée par les articles L.335-2 et suivants du Code de la propriété intellectuelle.
          </p>
        </div>

        <div>
          <h2 className="mb-3 font-display text-xl font-light text-text-main">
            Données personnelles
          </h2>
          <p>
            Les informations recueillies via les formulaires du site sont nécessaires au traitement
            de vos demandes. Conformément à la loi ivoirienne n°2013-450 relative à la protection
            des données à caractère personnel, vous disposez d&apos;un droit d&apos;accès, de
            rectification et de suppression de vos données. Pour exercer ce droit, contactez-nous
            à : <a href={`mailto:${config.email}`} className="text-primary-brand hover:underline">{config.email}</a>.
          </p>
        </div>

        <div>
          <h2 className="mb-3 font-display text-xl font-light text-text-main">
            Cookies
          </h2>
          <p>
            Le site utilise des cookies techniques nécessaires à son bon fonctionnement
            (session d&apos;authentification, préférences de thème). Aucun cookie publicitaire
            ou de suivi tiers n&apos;est utilisé sans votre consentement.
          </p>
        </div>

        <div>
          <h2 className="mb-3 font-display text-xl font-light text-text-main">
            Limitation de responsabilité
          </h2>
          <p>
            L&apos;éditeur s&apos;efforce de fournir des informations aussi précises que possible.
            Toutefois, il ne pourra être tenu responsable des omissions, des inexactitudes
            ou des carences dans la mise à jour. L&apos;éditeur ne pourra être tenu responsable
            des dommages directs ou indirects résultant de l&apos;accès ou de l&apos;utilisation du site.
          </p>
        </div>
      </div>
    </section>
  )
}
