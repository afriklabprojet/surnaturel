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
}) {
  const totalFormate = new Intl.NumberFormat("fr-CI", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  }).format(params.total)

  return resend.emails.send({
    from: FROM,
    to: params.destinataire,
    subject: "Paiement confirmé — Le Surnaturel de Dieu",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#1F2937;">
        <div style="background:#2D7A1F;padding:24px;">
          <h1 style="color:#fff;margin:0;font-size:20px;">
            Paiement confirmé
          </h1>
        </div>
        <div style="background:#fff;border:1px solid #E5E7EB;
          border-top:none;padding:24px;">
          <p>Bonjour <strong>${params.prenom}</strong>,</p>
          <p>Votre paiement de <strong>${totalFormate}</strong> a été confirmé avec succès.</p>
          <p>Commande : <strong>#${params.commandeId.slice(-8).toUpperCase()}</strong></p>
          <p>Nous préparons votre commande. Vous recevrez une notification lorsqu'elle sera expédiée.</p>
          <a href="${process.env.NEXTAUTH_URL}/commandes"
             style="display:inline-block;background:#2D7A1F;color:#fff;
             padding:12px 24px;text-decoration:none;margin-top:16px;">
            Suivre ma commande
          </a>
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
          <p style="color:#6B7280;font-size:12px;margin-top:24px;">
            Si vous n'avez pas fait cette demande, ignorez simplement cet email.
          </p>
        </div>
      </div>
    `,
  })
}
