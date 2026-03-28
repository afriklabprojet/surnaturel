import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Politique de confidentialité",
}

export default function PolitiqueConfidentialite() {
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
            à Cocody, Riviera Palmeraie — Abidjan, Côte d&apos;Ivoire,
            représenté par Marie Jeanne.
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
            <li><strong>Vercel</strong> : hébergement du site</li>
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
            <a href="mailto:contact@surnatureldedieu.ci" className="ml-1 text-primary-brand hover:underline">
              contact@surnatureldedieu.ci
            </a>
          </p>
        </div>

        <div>
          <h2 className="mb-3 font-display text-xl font-light text-text-main">
            9. Contact
          </h2>
          <p>
            Pour toute question relative à cette politique, vous pouvez nous contacter :<br />
            Email : <a href="mailto:contact@surnatureldedieu.ci" className="text-primary-brand hover:underline">contact@surnatureldedieu.ci</a><br />
            Téléphone : <a href="tel:+2250778520699" className="text-primary-brand hover:underline">+225 07 78 52 06 99</a><br />
            Adresse : Cocody, Riviera Palmeraie — Abidjan, Côte d&apos;Ivoire
          </p>
        </div>
      </div>
    </section>
  )
}
