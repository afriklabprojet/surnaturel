import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = "Le Surnaturel de Dieu <rdv@surnatureldedieu.com>"

export async function envoyerEmailConfirmationRDV(params: {
  destinataire: string
  nom: string
  soin: string
  date: string
  heure: string
  prix: string
}) {
  return resend.emails.send({
    from: FROM,
    to: params.destinataire,
    subject: "Votre rendez-vous est confirmé — Le Surnaturel de Dieu",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#1F2937;">
        <div style="background:#2D7A1F;padding:24px;border-radius:8px 8px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:20px;">
            Rendez-vous confirmé
          </h1>
        </div>
        <div style="background:#fff;border:1px solid #E5E7EB;
          border-top:none;padding:24px;border-radius:0 0 8px 8px;">
          <p>Bonjour <strong>${params.nom}</strong>,</p>
          <p>Votre rendez-vous a bien été enregistré.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr style="background:#E8F5E3;">
              <td style="padding:10px;font-weight:600;">Soin</td>
              <td style="padding:10px;">${params.soin}</td>
            </tr>
            <tr>
              <td style="padding:10px;font-weight:600;">Date</td>
              <td style="padding:10px;">${params.date}</td>
            </tr>
            <tr style="background:#E8F5E3;">
              <td style="padding:10px;font-weight:600;">Heure</td>
              <td style="padding:10px;">${params.heure}</td>
            </tr>
            <tr>
              <td style="padding:10px;font-weight:600;">Prix</td>
              <td style="padding:10px;">${params.prix}</td>
            </tr>
          </table>
          <p>À bientôt au centre <strong>Le Surnaturel de Dieu</strong>, Abidjan.</p>
          <p style="color:#6B7280;font-size:12px;">
            Pour annuler : connectez-vous sur votre espace et
            accédez à "Mes rendez-vous".
          </p>
        </div>
      </div>
    `,
  })
}

export async function envoyerEmailInscription(params: {
  destinataire: string
  prenom: string
}) {
  return resend.emails.send({
    from: FROM,
    to: params.destinataire,
    subject: "Bienvenue au Surnaturel de Dieu !",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#1F2937;">
        <div style="background:#2D7A1F;padding:24px;border-radius:8px 8px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:20px;">
            Bienvenue !
          </h1>
        </div>
        <div style="background:#fff;border:1px solid #E5E7EB;
          border-top:none;padding:24px;border-radius:0 0 8px 8px;">
          <p>Bonjour <strong>${params.prenom}</strong>,</p>
          <p>Votre compte a été créé avec succès.</p>
          <p>Vous pouvez dès maintenant réserver vos soins,
             découvrir notre boutique et rejoindre notre communauté.</p>
          <a href="${process.env.NEXTAUTH_URL}/soins"
             style="display:inline-block;background:#2D7A1F;color:#fff;
             padding:12px 24px;border-radius:8px;text-decoration:none;
             margin-top:16px;">
            Découvrir nos soins
          </a>
        </div>
      </div>
    `,
  })
}

export async function envoyerEmailMessageMedical(params: {
  destinataire: string
  prenomDestinataire: string
  prenomExpediteur: string
}) {
  const appUrl = process.env.NEXTAUTH_URL || "https://surnatureldedieu.com"
  return resend.emails.send({
    from: FROM,
    to: params.destinataire,
    subject: "Nouveau message médical — Le Surnaturel de Dieu",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#1F2937;">
        <div style="background:#2D7A1F;padding:24px;border-radius:8px 8px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:20px;">
            Nouveau message médical
          </h1>
        </div>
        <div style="background:#fff;border:1px solid #E5E7EB;
          border-top:none;padding:24px;border-radius:0 0 8px 8px;">
          <p>Bonjour <strong>${params.prenomDestinataire}</strong>,</p>
          <p>Vous avez reçu un nouveau message confidentiel de
             <strong>${params.prenomExpediteur}</strong>.</p>
          <p style="color:#6B7280;font-size:13px;">
            Pour des raisons de confidentialité, le contenu n'est pas affiché
            dans cet email.</p>
          <a href="${appUrl}/suivi-medical"
             style="display:inline-block;background:#2D7A1F;color:#fff;
             padding:12px 24px;border-radius:8px;text-decoration:none;
             margin-top:16px;">
            Lire le message
          </a>
        </div>
      </div>
    `,
  })
}

export async function envoyerEmailInvitationParrainage(params: {
  destinataire: string
  prenomParrain: string
  lienParrainage: string
}) {
  const appUrl = process.env.NEXTAUTH_URL || "https://surnatureldedieu.com"
  return resend.emails.send({
    from: FROM,
    to: params.destinataire,
    subject: `${params.prenomParrain} vous invite au Surnaturel de Dieu`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#1F2937;">
        <div style="background:#2D7A1F;padding:24px;border-radius:8px 8px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:20px;">
            Vous êtes invité(e) !
          </h1>
        </div>
        <div style="background:#fff;border:1px solid #E5E7EB;
          border-top:none;padding:24px;border-radius:0 0 8px 8px;">
          <p>Bonjour,</p>
          <p><strong>${params.prenomParrain}</strong> vous invite à rejoindre
             <strong>Le Surnaturel de Dieu</strong>, l'institut de bien-être
             d'Abidjan.</p>
          <p>En vous inscrivant via ce lien, vous et votre parrain bénéficiez
             tous les deux de <strong>200 points de fidélité</strong> offerts.</p>
          <a href="${params.lienParrainage}"
             style="display:inline-block;background:#2D7A1F;color:#fff;
             padding:12px 24px;border-radius:8px;text-decoration:none;
             margin-top:16px;">
            Créer mon compte
          </a>
          <p style="color:#6B7280;font-size:12px;margin-top:24px;">
            Si vous ne souhaitez pas créer de compte, ignorez cet email.
          </p>
        </div>
      </div>
    `,
  })
}

export async function envoyerEmailRappelRDV(params: {
  destinataire: string
  nom: string
  soin: string
  date: string
  heure: string
}) {
  const appUrl = process.env.NEXTAUTH_URL || "https://surnatureldedieu.com"
  return resend.emails.send({
    from: FROM,
    to: params.destinataire,
    subject: "Rappel : votre rendez-vous demain — Le Surnaturel de Dieu",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#1F2937;">
        <div style="background:#2D7A1F;padding:24px;border-radius:8px 8px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:20px;">
            Rappel de rendez-vous
          </h1>
        </div>
        <div style="background:#fff;border:1px solid #E5E7EB;
          border-top:none;padding:24px;border-radius:0 0 8px 8px;">
          <p>Bonjour <strong>${params.nom}</strong>,</p>
          <p>Nous vous rappelons que vous avez un rendez-vous <strong>demain</strong>.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr style="background:#E8F5E3;">
              <td style="padding:10px;font-weight:600;">Soin</td>
              <td style="padding:10px;">${params.soin}</td>
            </tr>
            <tr>
              <td style="padding:10px;font-weight:600;">Date</td>
              <td style="padding:10px;">${params.date}</td>
            </tr>
            <tr style="background:#E8F5E3;">
              <td style="padding:10px;font-weight:600;">Heure</td>
              <td style="padding:10px;">${params.heure}</td>
            </tr>
          </table>
          <p>À bientôt au centre <strong>Le Surnaturel de Dieu</strong>, Abidjan.</p>
          <a href="${appUrl}/mes-rdv"
             style="display:inline-block;background:#2D7A1F;color:#fff;
             padding:12px 24px;border-radius:8px;text-decoration:none;
             margin-top:8px;">
            Voir mes rendez-vous
          </a>
          <p style="color:#6B7280;font-size:12px;margin-top:16px;">
            Pour annuler ou modifier votre rendez-vous, connectez-vous
            sur votre espace.
          </p>
        </div>
      </div>
    `,
  })
}

export async function envoyerEmailCommandePayee(params: {
  destinataire: string
  prenom: string
  commandeId: string
  total: number
  methode?: string
  reference?: string
  lignes?: { nom: string; quantite: number; prixUnitaire: number }[]
}) {
  const appUrl = process.env.NEXTAUTH_URL || "https://surnatureldedieu.com"
  const ref = params.commandeId.slice(-8).toUpperCase()
  const date = new Date().toLocaleDateString("fr-CI", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const totalFormate = new Intl.NumberFormat("fr-CI", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  }).format(params.total)

  const lignesHtml = params.lignes?.length
    ? params.lignes
        .map(
          (l, i) =>
            `<tr style="background:${i % 2 === 0 ? "#E8F5E3" : "#fff"};">
              <td style="padding:10px;">${l.nom}</td>
              <td style="padding:10px;text-align:center;">${l.quantite}</td>
              <td style="padding:10px;text-align:right;">${new Intl.NumberFormat("fr-CI").format(l.prixUnitaire)} F</td>
            </tr>`
        )
        .join("")
    : ""

  const produitsTable = lignesHtml
    ? `<table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr style="background:#2D7A1F;color:#fff;">
          <th style="padding:10px;text-align:left;">Produit</th>
          <th style="padding:10px;text-align:center;">Qté</th>
          <th style="padding:10px;text-align:right;">Prix</th>
        </tr>
        ${lignesHtml}
        <tr style="border-top:2px solid #2D7A1F;">
          <td colspan="2" style="padding:10px;font-weight:700;">Total</td>
          <td style="padding:10px;text-align:right;font-weight:700;">${totalFormate}</td>
        </tr>
      </table>`
    : `<p>Total : <strong>${totalFormate}</strong></p>`

  const methodeHtml = params.methode
    ? `<tr><td style="padding:10px;font-weight:600;">Méthode</td><td style="padding:10px;">${params.methode}</td></tr>`
    : ""
  const refTransHtml = params.reference
    ? `<tr style="background:#E8F5E3;"><td style="padding:10px;font-weight:600;">Réf. transaction</td><td style="padding:10px;font-family:monospace;">${params.reference}</td></tr>`
    : ""

  return resend.emails.send({
    from: FROM,
    to: params.destinataire,
    subject: `Reçu de paiement #${ref} — Le Surnaturel de Dieu`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#1F2937;">
        <div style="background:#2D7A1F;padding:24px;border-radius:8px 8px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:20px;">
            Paiement confirmé
          </h1>
        </div>
        <div style="background:#fff;border:1px solid #E5E7EB;
          border-top:none;padding:24px;border-radius:0 0 8px 8px;">
          <p>Bonjour <strong>${params.prenom}</strong>,</p>
          <p>Votre paiement a été reçu et confirmé. Voici votre reçu :</p>

          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr style="background:#E8F5E3;">
              <td style="padding:10px;font-weight:600;">Commande</td>
              <td style="padding:10px;">#${ref}</td>
            </tr>
            <tr>
              <td style="padding:10px;font-weight:600;">Date</td>
              <td style="padding:10px;">${date}</td>
            </tr>
            ${methodeHtml}
            ${refTransHtml}
            <tr>
              <td style="padding:10px;font-weight:600;">Montant</td>
              <td style="padding:10px;font-weight:700;color:#2D7A1F;">${totalFormate}</td>
            </tr>
          </table>

          ${produitsTable}

          <div style="background:#FEF3CD;border:1px solid #B8972A;padding:12px;
            border-radius:6px;margin-top:16px;">
            <p style="margin:0;font-size:13px;color:#856404;">
              📄 Conservez ce reçu comme preuve de paiement.
            </p>
          </div>

          <p style="margin-top:16px;">Nous préparons votre commande. Vous recevrez
            une notification lorsqu'elle sera expédiée.</p>

          <a href="${appUrl}/commandes"
             style="display:inline-block;background:#2D7A1F;color:#fff;
             padding:12px 24px;border-radius:8px;text-decoration:none;
             margin-top:16px;">
            Suivre ma commande
          </a>
        </div>
      </div>
    `,
  })
}

export async function envoyerEmailConfirmationCommande(params: {
  destinataire: string
  prenom: string
  commandeId: string
  total: number
  lignes: { nom: string; quantite: number; prixUnitaire: number }[]
}) {
  const appUrl = process.env.NEXTAUTH_URL || "https://surnatureldedieu.com"
  const ref = params.commandeId.slice(-8).toUpperCase()

  const totalFormate = new Intl.NumberFormat("fr-CI", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  }).format(params.total)

  const lignesHtml = params.lignes
    .map(
      (l, i) =>
        `<tr style="background:${i % 2 === 0 ? "#E8F5E3" : "#fff"};">
          <td style="padding:10px;">${l.nom}</td>
          <td style="padding:10px;text-align:center;">${l.quantite}</td>
          <td style="padding:10px;text-align:right;">${new Intl.NumberFormat("fr-CI").format(l.prixUnitaire)} F</td>
        </tr>`
    )
    .join("")

  return resend.emails.send({
    from: FROM,
    to: params.destinataire,
    subject: `Commande #${ref} enregistrée — Le Surnaturel de Dieu`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#1F2937;">
        <div style="background:#2D7A1F;padding:24px;border-radius:8px 8px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:20px;">
            Commande enregistrée
          </h1>
        </div>
        <div style="background:#fff;border:1px solid #E5E7EB;
          border-top:none;padding:24px;border-radius:0 0 8px 8px;">
          <p>Bonjour <strong>${params.prenom}</strong>,</p>
          <p>Votre commande <strong>#${ref}</strong> a été enregistrée.
             Elle sera validée dès réception de votre paiement.</p>

          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr style="background:#2D7A1F;color:#fff;">
              <th style="padding:10px;text-align:left;">Produit</th>
              <th style="padding:10px;text-align:center;">Qté</th>
              <th style="padding:10px;text-align:right;">Prix</th>
            </tr>
            ${lignesHtml}
            <tr style="border-top:2px solid #2D7A1F;">
              <td colspan="2" style="padding:10px;font-weight:700;">Total à payer</td>
              <td style="padding:10px;text-align:right;font-weight:700;color:#2D7A1F;">
                ${totalFormate}
              </td>
            </tr>
          </table>

          <a href="${appUrl}/commandes/${params.commandeId}"
             style="display:inline-block;background:#2D7A1F;color:#fff;
             padding:12px 24px;border-radius:8px;text-decoration:none;
             margin-top:16px;">
            Suivre ma commande
          </a>

          <p style="color:#6B7280;font-size:12px;margin-top:24px;">
            Cette commande sera automatiquement annulée si le paiement
            n'est pas reçu dans les 24 heures.
          </p>
        </div>
      </div>
    `,
  })
}

export async function envoyerEmailResetMotDePasse(params: {
  destinataire: string
  prenom: string
  lienReset: string
}) {
  return resend.emails.send({
    from: FROM,
    to: params.destinataire,
    subject: "Réinitialisation de votre mot de passe — Le Surnaturel de Dieu",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#1F2937;">
        <div style="background:#2D7A1F;padding:24px;border-radius:8px 8px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:20px;">
            Réinitialisation du mot de passe
          </h1>
        </div>
        <div style="background:#fff;border:1px solid #E5E7EB;
          border-top:none;padding:24px;border-radius:0 0 8px 8px;">
          <p>Bonjour <strong>${params.prenom}</strong>,</p>
          <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
          <p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
             Ce lien expire dans <strong>1 heure</strong>.</p>
          <a href="${params.lienReset}"
             style="display:inline-block;background:#2D7A1F;color:#fff;
             padding:12px 24px;border-radius:8px;text-decoration:none;
             margin-top:16px;">
            Réinitialiser mon mot de passe
          </a>

          <div style="background:#FFF3CD;border:1px solid #B8972A;padding:12px;
            border-radius:6px;margin-top:24px;">
            <p style="margin:0;font-size:13px;color:#856404;">
              ⚠️ <strong>Vous n'êtes pas à l'origine de cette demande ?</strong><br/>
              Ignorez cet email — votre mot de passe reste inchangé.
              Si vous recevez plusieurs emails de ce type, changez votre
              mot de passe immédiatement et contactez-nous.
            </p>
          </div>

          <p style="color:#6B7280;font-size:12px;margin-top:16px;">
            Ce lien ne fonctionne qu'une seule fois et expire dans 1 heure.
            Ne le partagez avec personne.
          </p>
        </div>
      </div>
    `,
  })
}
