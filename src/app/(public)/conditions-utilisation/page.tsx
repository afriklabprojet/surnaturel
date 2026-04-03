import type { Metadata } from "next"
import Link from "next/link"
import { getConfig } from "@/lib/config"

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation | Le Surnaturel de Dieu",
  description:
    "Conditions générales d'utilisation du site Le Surnaturel de Dieu — Institut de bien-être à Abidjan.",
  alternates: { canonical: "/conditions-utilisation" },
}

export default async function ConditionsUtilisation() {
  const config = await getConfig()
  return (
    <section className="mx-auto max-w-3xl px-6 py-20 lg:px-10">
      <h1 className="font-display text-3xl font-light text-text-main sm:text-4xl">
        Conditions générales d&apos;utilisation
      </h1>
      <p className="mt-4 font-body text-sm text-text-muted-brand">
        Dernière mise à jour : mars 2026
      </p>

      <div className="mt-10 space-y-8 font-body text-sm leading-relaxed text-text-mid">
        <div>
          <h2 className="mb-3 font-display text-xl font-light text-text-main">
            1. Objet
          </h2>
          <p>
            Les présentes conditions générales d&apos;utilisation (CGU) régissent l&apos;accès et
            l&apos;utilisation du site <strong>Le Surnaturel de Dieu</strong> (ci-après « le Site »),
            accessible à l&apos;adresse{" "}
            <a href="https://lesurnatureldedieu.ci" className="text-primary-brand hover:underline">
              lesurnatureldedieu.ci
            </a>.
            En accédant au Site, vous acceptez sans réserve les présentes CGU.
          </p>
        </div>

        <div>
          <h2 className="mb-3 font-display text-xl font-light text-text-main">
            2. Services proposés
          </h2>
          <p>Le Site permet :</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>La consultation du catalogue de soins et de la boutique en ligne</li>
            <li>La prise de rendez-vous en ligne pour des soins ou consultations sage-femme</li>
            <li>L&apos;achat de produits de bien-être avec paiement Mobile Money</li>
            <li>L&apos;accès à un espace suivi médical confidentiel (pour les client(e)s concerné(e)s)</li>
            <li>La participation à la communauté (groupes, publications, événements)</li>
            <li>La consultation d&apos;articles de blog santé et bien-être</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 font-display text-xl font-light text-text-main">
            3. Inscription et compte utilisateur
          </h2>
          <p>
            L&apos;inscription est gratuite et nécessite la fourniture d&apos;informations exactes
            (nom, prénom, adresse email). Vous êtes responsable de la confidentialité de
            vos identifiants de connexion. Toute activité réalisée depuis votre compte vous
            est imputée.
          </p>
          <p className="mt-2">
            Le Surnaturel de Dieu se réserve le droit de suspendre ou supprimer tout compte
            en cas de violation des présentes CGU.
          </p>
        </div>

        <div>
          <h2 className="mb-3 font-display text-xl font-light text-text-main">
            4. Prise de rendez-vous
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Les rendez-vous sont soumis à la disponibilité des créneaux</li>
            <li>Un acompte peut être demandé pour confirmer certaines réservations</li>
            <li>
              Toute annulation doit être effectuée au moins <strong>24 heures</strong> avant
              le rendez-vous. Au-delà, l&apos;acompte pourra être conservé
            </li>
            <li>
              Le Surnaturel de Dieu se réserve le droit de modifier ou annuler un rendez-vous
              en cas de force majeure, avec notification préalable
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 font-display text-xl font-light text-text-main">
            5. Boutique en ligne et commandes
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Les prix sont affichés en <strong>Francs CFA (XOF)</strong>, toutes taxes comprises</li>
            <li>Les commandes sont validées après réception du paiement via Jeko Africa</li>
            <li>
              Les méthodes de paiement acceptées sont : Wave, Orange Money, MTN MoMo,
              Moov Money et Djamo
            </li>
            <li>La livraison s&apos;effectue à Abidjan et ses environs selon les délais indiqués</li>
            <li>
              En cas de produit indisponible après validation, vous serez informé(e) et remboursé(e)
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 font-display text-xl font-light text-text-main">
            6. Droit de rétractation
          </h2>
          <p>
            Conformément à la réglementation en vigueur, vous disposez d&apos;un délai de
            <strong> 14 jours</strong> à compter de la réception de votre commande pour exercer
            votre droit de rétractation, à condition que les produits soient retournés dans leur
            état d&apos;origine, non ouverts et non utilisés. Les prestations de services (soins)
            effectuées ne sont pas remboursables.
          </p>
        </div>

        <div>
          <h2 className="mb-3 font-display text-xl font-light text-text-main">
            7. Espace médical confidentiel
          </h2>
          <p>
            L&apos;espace suivi médical est strictement réservé aux client(e)s suivi(e)s par
            la sage-femme ou l&apos;accompagnateur médical de l&apos;institut. Toutes les données
            de santé sont <strong>chiffrées (AES-256)</strong> et accessibles uniquement par les
            professionnels autorisés et le/la client(e) concerné(e).
          </p>
        </div>

        <div>
          <h2 className="mb-3 font-display text-xl font-light text-text-main">
            8. Communauté et contenu utilisateur
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Les utilisateurs s&apos;engagent à publier des contenus respectueux, sans propos
              haineux, discriminatoires ou illicites
            </li>
            <li>
              Le Surnaturel de Dieu se réserve le droit de modérer ou supprimer tout contenu
              inapproprié
            </li>
            <li>
              Vous conservez la propriété de vos contenus mais accordez une licence
              d&apos;utilisation au Surnaturel de Dieu pour les afficher sur le Site
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 font-display text-xl font-light text-text-main">
            9. Programme de fidélité
          </h2>
          <p>
            Le programme de fidélité permet de cumuler des points échangeables contre des
            récompenses. Le Surnaturel de Dieu se réserve le droit de modifier les conditions
            du programme à tout moment, avec notification préalable aux membres.
          </p>
        </div>

        <div>
          <h2 className="mb-3 font-display text-xl font-light text-text-main">
            10. Propriété intellectuelle
          </h2>
          <p>
            L&apos;ensemble des éléments du Site (textes, images, logos, design, code) est protégé
            par le droit de la propriété intellectuelle. Toute reproduction ou utilisation non autorisée
            est strictement interdite.
          </p>
        </div>

        <div>
          <h2 className="mb-3 font-display text-xl font-light text-text-main">
            11. Modification des CGU
          </h2>
          <p>
            Le Surnaturel de Dieu se réserve le droit de modifier les présentes CGU à tout moment.
            Les utilisateurs seront informés des modifications par une notification sur le Site.
            La poursuite de l&apos;utilisation du Site vaut acceptation des nouvelles CGU.
          </p>
        </div>

        <div>
          <h2 className="mb-3 font-display text-xl font-light text-text-main">
            12. Droit applicable et litiges
          </h2>
          <p>
            Les présentes CGU sont régies par le droit ivoirien. En cas de litige, les parties
            s&apos;engagent à rechercher une solution amiable. À défaut, les tribunaux d&apos;Abidjan
            seront seuls compétents.
          </p>
        </div>

        <div>
          <h2 className="mb-3 font-display text-xl font-light text-text-main">
            13. Contact
          </h2>
          <p>
            Pour toute question relative aux présentes CGU :<br />
            Email :{" "}
            <a href={`mailto:${config.email}`} className="text-primary-brand hover:underline">
              {config.email}
            </a><br />
            Téléphone :{" "}
            <a href={`tel:${config.telephoneTel}`} className="text-primary-brand hover:underline">
              {config.telephone}
            </a>
          </p>
        </div>

        <p className="pt-4 text-center font-body text-xs text-text-muted-brand">
          Voir aussi notre{" "}
          <Link href="/politique-confidentialite" className="text-primary-brand underline">
            politique de confidentialité
          </Link>{" "}
          et nos{" "}
          <Link href="/mentions-legales" className="text-primary-brand underline">
            mentions légales
          </Link>.
        </p>
      </div>
    </section>
  )
}
