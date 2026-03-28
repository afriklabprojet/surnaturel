import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Mentions légales",
}

export default function MentionsLegales() {
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
            <strong>Le Surnaturel de Dieu — Institut de Bien-Être</strong><br />
            Fondatrice : Marie Jeanne<br />
            Adresse : Cocody, Riviera Palmeraie — Abidjan, Côte d&apos;Ivoire<br />
            Téléphone : <a href="tel:+2250778520699" className="text-primary-brand hover:underline">+225 07 78 52 06 99</a><br />
            Email : <a href="mailto:contact@surnatureldedieu.com" className="text-primary-brand hover:underline">contact@surnatureldedieu.com</a>
          </p>
        </div>

        <div>
          <h2 className="mb-3 font-display text-xl font-light text-text-main">
            Hébergement
          </h2>
          <p>
            Le site est hébergé par <strong>Vercel Inc.</strong><br />
            440 N Baxter St, Coppell, TX 75019, États-Unis<br />
            Site web : <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-primary-brand hover:underline">vercel.com</a>
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
            à : <a href="mailto:contact@surnatureldedieu.com" className="text-primary-brand hover:underline">contact@surnatureldedieu.com</a>.
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
