import { Resend } from "resend"
import { getConfig } from "@/lib/config"

const resend = new Resend(process.env.RESEND_API_KEY)

/** Échappe les caractères HTML dangereux dans les données utilisateur.
 *  Empêche les injections HTML/XSS dans les emails transactionnels. */
function e(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
}

async function getFrom(): Promise<string> {
  const { nomCentre, emailRdv } = await getConfig()
  return `${nomCentre} <${emailRdv}>`
}

export async function envoyerEmailConfirmationRDV(params: {
  destinataire: string
  nom: string
  soin: string
  date: string
  heure: string
  prix: string
}) {
  return resend.emails.send({
    from: await getFrom(),
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
          <p>Bonjour <strong>${e(params.nom)}</strong>,</p>
          <p>Votre rendez-vous a bien été enregistré.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr style="background:#E8F5E3;">
              <td style="padding:10px;font-weight:600;">Soin</td>
              <td style="padding:10px;">${e(params.soin)}</td>
            </tr>
            <tr>
              <td style="padding:10px;font-weight:600;">Date</td>
              <td style="padding:10px;">${e(params.date)}</td>
            </tr>
            <tr style="background:#E8F5E3;">
              <td style="padding:10px;font-weight:600;">Heure</td>
              <td style="padding:10px;">${e(params.heure)}</td>
            </tr>
            <tr>
              <td style="padding:10px;font-weight:600;">Prix</td>
              <td style="padding:10px;">${e(params.prix)}</td>
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
  tokenVerification: string
}) {
  const lienVerification = `${process.env.NEXTAUTH_URL}/api/auth/verifier-email?token=${params.tokenVerification}`
  return resend.emails.send({
    from: await getFrom(),
    to: params.destinataire,
    subject: "Confirmez votre email — Le Surnaturel de Dieu",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#1F2937;">
        <div style="background:#2D7A1F;padding:24px;border-radius:8px 8px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:20px;">
            Confirmez votre adresse email
          </h1>
        </div>
        <div style="background:#fff;border:1px solid #E5E7EB;
          border-top:none;padding:24px;border-radius:0 0 8px 8px;">
          <p>Bonjour <strong>${e(params.prenom)}</strong>,</p>
          <p>Bienvenue au <strong>Surnaturel de Dieu</strong> !</p>
          <p>Pour activer votre compte, veuillez confirmer votre adresse
             email en cliquant sur le bouton ci-dessous :</p>
          <a href="${lienVerification}"
             style="display:inline-block;background:#2D7A1F;color:#fff;
             padding:12px 24px;border-radius:8px;text-decoration:none;
             margin-top:16px;">
            Confirmer mon email
          </a>
          <p style="color:#6B7280;font-size:12px;margin-top:20px;">
            Ce lien est valable 24 heures. Si vous n'avez pas créé de compte,
            ignorez cet email.
          </p>
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
    from: await getFrom(),
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
          <p>Bonjour <strong>${e(params.prenomDestinataire)}</strong>,</p>
          <p>Vous avez reçu un nouveau message confidentiel de
             <strong>${e(params.prenomExpediteur)}</strong>.</p>
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
    from: await getFrom(),
    to: params.destinataire,
    subject: `${e(params.prenomParrain)} vous invite au Surnaturel de Dieu`,
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
          <p><strong>${e(params.prenomParrain)}</strong> vous invite à rejoindre
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
    from: await getFrom(),
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
          <p>Bonjour <strong>${e(params.nom)}</strong>,</p>
          <p>Nous vous rappelons que vous avez un rendez-vous <strong>demain</strong>.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr style="background:#E8F5E3;">
              <td style="padding:10px;font-weight:600;">Soin</td>
              <td style="padding:10px;">${e(params.soin)}</td>
            </tr>
            <tr>
              <td style="padding:10px;font-weight:600;">Date</td>
              <td style="padding:10px;">${e(params.date)}</td>
            </tr>
            <tr style="background:#E8F5E3;">
              <td style="padding:10px;font-weight:600;">Heure</td>
              <td style="padding:10px;">${e(params.heure)}</td>
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
    from: await getFrom(),
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
          <p>Bonjour <strong>${e(params.prenom)}</strong>,</p>
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
    from: await getFrom(),
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
          <p>Bonjour <strong>${e(params.prenom)}</strong>,</p>
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
    from: await getFrom(),
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

// ─── Email invitation à laisser un avis après RDV terminé ────────
export async function envoyerEmailInvitationAvis(params: {
  destinataire: string
  prenom: string
  soin: string
  rdvId: string
}) {
  const appUrl = process.env.NEXTAUTH_URL || "https://surnatureldedieu.com"
  return resend.emails.send({
    from: await getFrom(),
    to: params.destinataire,
    subject: "Comment s'est passé votre soin ? — Le Surnaturel de Dieu",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#1F2937;">
        <div style="background:#B8972A;padding:24px;border-radius:8px 8px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:20px;">
            ⭐ Votre avis compte pour nous !
          </h1>
        </div>
        <div style="background:#fff;border:1px solid #E5E7EB;
          border-top:none;padding:24px;border-radius:0 0 8px 8px;">
          <p>Bonjour <strong>${params.prenom}</strong>,</p>
          <p>Nous espérons que votre soin <strong>${params.soin}</strong> vous a apporté
             bien-être et sérénité.</p>
          <p>Votre avis nous aide à améliorer nos services et guide d'autres clientes dans leur choix.
             Cela ne prend que 30 secondes !</p>
          
          <div style="text-align:center;margin:24px 0;">
            <a href="${appUrl}/avis/${params.rdvId}"
               style="display:inline-block;background:#2D7A1F;color:#fff;
               padding:14px 32px;border-radius:8px;text-decoration:none;
               font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">
              Donner mon avis
            </a>
          </div>

          <div style="background:#E8F5E3;padding:16px;border-radius:8px;margin-top:16px;">
            <p style="margin:0;font-size:14px;color:#2D7A1F;">
              🎁 <strong>Bonus :</strong> Chaque avis publié vous rapporte 
              <strong>50 points de fidélité</strong> !
            </p>
          </div>

          <p style="color:#6B7280;font-size:12px;margin-top:24px;">
            Merci de votre confiance.<br/>
            L'équipe du Surnaturel de Dieu
          </p>
        </div>
      </div>
    `,
  })
}

// Types pour la newsletter
interface ArticleBlog {
  titre: string
  extrait: string
  slug: string
  imageUrl?: string
}

interface SoinPopulaire {
  nom: string
  description: string
  slug: string
}

interface NewsletterContent {
  articles?: ArticleBlog[]
  soinsPopulaires?: SoinPopulaire[]
  codePromo?: {
    code: string
    reduction: string
    dateExpiration: string
  }
  messagePersonnalise?: string
}

export async function envoyerEmailNewsletter(
  email: string,
  prenom: string,
  contenu: NewsletterContent
): Promise<void> {
  const { articles = [], soinsPopulaires = [], codePromo, messagePersonnalise } = contenu
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://surnatureldedieu.com"
  
  const articlesHtml = articles.length > 0 ? `
    <div style="margin-top:24px;">
      <h2 style="font-family:'Cormorant Garamond',serif;color:#2D7A1F;font-size:20px;margin-bottom:16px;">
        📰 Nos derniers articles
      </h2>
      ${articles.map(article => `
        <div style="background:#FAFAFA;padding:16px;border-radius:8px;margin-bottom:12px;">
          ${article.imageUrl ? `<img src="${article.imageUrl}" alt="${article.titre}" style="width:100%;max-height:150px;object-fit:cover;border-radius:6px;margin-bottom:12px;" />` : ''}
          <h3 style="margin:0 0 8px 0;font-size:16px;color:#111827;">${article.titre}</h3>
          <p style="margin:0 0 12px 0;font-size:14px;color:#6B7280;">${article.extrait}</p>
          <a href="${BASE_URL}/blog/${article.slug}" style="color:#2D7A1F;font-size:14px;text-decoration:none;">
            Lire la suite →
          </a>
        </div>
      `).join('')}
    </div>
  ` : ''

  const soinsHtml = soinsPopulaires.length > 0 ? `
    <div style="margin-top:24px;">
      <h2 style="font-family:'Cormorant Garamond',serif;color:#2D7A1F;font-size:20px;margin-bottom:16px;">
        ✨ Soins populaires du moment
      </h2>
      <div style="display:flex;flex-wrap:wrap;gap:12px;">
        ${soinsPopulaires.map(soin => `
          <div style="flex:1;min-width:200px;background:#E8F5E3;padding:16px;border-radius:8px;">
            <h3 style="margin:0 0 8px 0;font-size:15px;color:#2D7A1F;">${soin.nom}</h3>
            <p style="margin:0 0 12px 0;font-size:13px;color:#374151;">${soin.description}</p>
            <a href="${BASE_URL}/prise-rdv?soin=${soin.slug}" style="background:#2D7A1F;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;font-size:13px;display:inline-block;">
              Réserver
            </a>
          </div>
        `).join('')}
      </div>
    </div>
  ` : ''

  const promoHtml = codePromo ? `
    <div style="margin-top:24px;background:linear-gradient(135deg,#B8972A 0%,#D4AF37 100%);padding:20px;border-radius:12px;text-align:center;">
      <p style="margin:0 0 8px 0;font-size:14px;color:#fff;opacity:0.9;">Offre exclusive newsletter</p>
      <p style="margin:0 0 12px 0;font-size:24px;font-weight:bold;color:#fff;">${codePromo.reduction}</p>
      <div style="background:#fff;padding:12px 24px;border-radius:8px;display:inline-block;">
        <span style="font-family:monospace;font-size:18px;color:#B8972A;font-weight:bold;">${codePromo.code}</span>
      </div>
      <p style="margin:12px 0 0 0;font-size:12px;color:#fff;opacity:0.8;">Valable jusqu'au ${codePromo.dateExpiration}</p>
    </div>
  ` : ''

  const messageHtml = messagePersonnalise ? `
    <div style="margin-top:24px;padding:16px;border-left:4px solid #B8972A;background:#FFFEF7;">
      <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">${messagePersonnalise}</p>
    </div>
  ` : ''

  await resend.emails.send({
    from: await getFrom(),
    to: email,
    subject: '🌿 Les actualités du Surnaturel de Dieu',
    html: `
      <div style="font-family:'Jost',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
        <div style="background:#2D7A1F;padding:24px;text-align:center;">
          <h1 style="font-family:'Cormorant Garamond',serif;color:#fff;margin:0;font-size:28px;">
            🌿 Le Surnaturel de Dieu
          </h1>
          <p style="color:#fff;opacity:0.9;margin:8px 0 0 0;font-size:14px;">
            Votre newsletter bien-être
          </p>
        </div>

        <div style="padding:32px 24px;">
          <p style="font-size:16px;color:#374151;line-height:1.6;">
            Bonjour ${prenom || 'cher(e) client(e)'} 👋
          </p>
          <p style="font-size:14px;color:#6B7280;line-height:1.6;">
            Retrouvez toutes les actualités de notre institut et nos conseils bien-être.
          </p>

          ${messageHtml}
          ${articlesHtml}
          ${soinsHtml}
          ${promoHtml}

          <div style="margin-top:32px;text-align:center;">
            <a href="${BASE_URL}/prise-rdv" style="background:#2D7A1F;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-size:15px;display:inline-block;">
              Prendre rendez-vous
            </a>
          </div>

          <div style="margin-top:32px;padding-top:24px;border-top:1px solid #E5E7EB;text-align:center;">
            <p style="color:#9CA3AF;font-size:12px;margin:0;">
              Vous recevez cet email car vous êtes inscrit(e) à notre newsletter.
            </p>
            <p style="margin:8px 0 0 0;">
              <a href="${BASE_URL}/profil?tab=notifications" style="color:#6B7280;font-size:12px;text-decoration:underline;">
                Se désabonner
              </a>
            </p>
          </div>
        </div>
      </div>
    `,
  })
}

// ─── Séquence d'onboarding (4 emails) ────────────────────────────

interface OnboardingEmailParams {
  destinataire: string
  prenom: string
  step: number // 0-3
}

const ONBOARDING_EMAILS = [
  // Step 0: Email de bienvenue (envoyé à l'inscription)
  {
    subject: "Bienvenue chez Le Surnaturel de Dieu — Votre bien-être commence ici",
    getHtml: (prenom: string, baseUrl: string) => `
      <div style="font-family:'Jost',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
        <div style="background:#2D7A1F;padding:32px 24px;text-align:center;">
          <h1 style="font-family:'Cormorant Garamond',serif;color:#fff;margin:0;font-size:32px;">
            🌿 Bienvenue, ${prenom} !
          </h1>
        </div>
        <div style="padding:32px 24px;">
          <p style="font-size:16px;color:#374151;line-height:1.8;">
            Nous sommes ravis de vous accueillir dans notre institut de bien-être à Abidjan.
          </p>
          <p style="font-size:15px;color:#6B7280;line-height:1.8;">
            Chez <strong style="color:#2D7A1F;">Le Surnaturel de Dieu</strong>, nous croyons que chaque 
            femme mérite de prendre soin d'elle. Notre équipe de professionnelles passionnées 
            est là pour vous accompagner dans votre parcours bien-être.
          </p>
          
          <div style="background:#E8F5E3;padding:20px;border-radius:8px;margin:24px 0;">
            <h2 style="font-size:18px;color:#2D7A1F;margin:0 0 12px 0;">
              🎁 Votre cadeau de bienvenue
            </h2>
            <p style="font-size:14px;color:#374151;margin:0;">
              Profitez de <strong>10% de réduction</strong> sur votre premier soin avec le code :
            </p>
            <div style="background:#fff;padding:12px 20px;border-radius:6px;text-align:center;margin-top:12px;">
              <span style="font-family:monospace;font-size:20px;color:#B8972A;font-weight:bold;">BIENVENUE10</span>
            </div>
          </div>

          <div style="text-align:center;margin-top:32px;">
            <a href="${baseUrl}/soins" style="background:#2D7A1F;color:#fff;padding:14px 32px;border-radius:0;text-decoration:none;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;display:inline-block;">
              Découvrir nos soins
            </a>
          </div>
        </div>
      </div>
    `,
  },
  // Step 1: Découverte des soins (J+2)
  {
    subject: "Découvrez nos soins signature — Hammam, Gommage & Plus",
    getHtml: (prenom: string, baseUrl: string) => `
      <div style="font-family:'Jost',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
        <div style="background:#2D7A1F;padding:32px 24px;text-align:center;">
          <h1 style="font-family:'Cormorant Garamond',serif;color:#fff;margin:0;font-size:28px;">
            ✨ Nos soins d'exception
          </h1>
        </div>
        <div style="padding:32px 24px;">
          <p style="font-size:16px;color:#374151;line-height:1.8;">
            Bonjour ${prenom},
          </p>
          <p style="font-size:15px;color:#6B7280;line-height:1.8;">
            Avez-vous eu l'occasion de parcourir notre carte de soins ? Voici nos 
            prestations les plus appréciées de nos clientes :
          </p>
          
          <div style="margin:24px 0;">
            <div style="border-bottom:1px solid #E8E4DC;padding:16px 0;">
              <h3 style="color:#2D7A1F;margin:0 0 8px 0;font-size:16px;">🔥 Hammam Royal</h3>
              <p style="color:#6B7280;font-size:14px;margin:0;">
                Une expérience de purification totale inspirée des traditions orientales.
              </p>
            </div>
            <div style="border-bottom:1px solid #E8E4DC;padding:16px 0;">
              <h3 style="color:#2D7A1F;margin:0 0 8px 0;font-size:16px;">✨ Gommage Corps Luxe</h3>
              <p style="color:#6B7280;font-size:14px;margin:0;">
                Exfoliation douce aux actifs naturels pour une peau soyeuse.
              </p>
            </div>
            <div style="border-bottom:1px solid #E8E4DC;padding:16px 0;">
              <h3 style="color:#2D7A1F;margin:0 0 8px 0;font-size:16px;">🌸 Soin Visage Éclat</h3>
              <p style="color:#6B7280;font-size:14px;margin:0;">
                Un soin complet pour révéler la luminosité de votre teint.
              </p>
            </div>
            <div style="padding:16px 0;">
              <h3 style="color:#2D7A1F;margin:0 0 8px 0;font-size:16px;">👶 Post-Accouchement</h3>
              <p style="color:#6B7280;font-size:14px;margin:0;">
                Un accompagnement dédié aux jeunes mamans pour retrouver forme et sérénité.
              </p>
            </div>
          </div>

          <div style="text-align:center;margin-top:32px;">
            <a href="${baseUrl}/prise-rdv" style="background:#2D7A1F;color:#fff;padding:14px 32px;border-radius:0;text-decoration:none;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;display:inline-block;">
              Réserver mon soin
            </a>
          </div>
        </div>
      </div>
    `,
  },
  // Step 2: Boutique (J+5)
  {
    subject: "Notre boutique en ligne — Prolongez votre bien-être chez vous",
    getHtml: (prenom: string, baseUrl: string) => `
      <div style="font-family:'Jost',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
        <div style="background:#B8972A;padding:32px 24px;text-align:center;">
          <h1 style="font-family:'Cormorant Garamond',serif;color:#fff;margin:0;font-size:28px;">
            🛍️ Notre boutique
          </h1>
        </div>
        <div style="padding:32px 24px;">
          <p style="font-size:16px;color:#374151;line-height:1.8;">
            ${prenom}, savez-vous que vous pouvez prolonger votre expérience bien-être chez vous ?
          </p>
          <p style="font-size:15px;color:#6B7280;line-height:1.8;">
            Notre boutique en ligne regroupe les meilleurs produits sélectionnés par nos 
            expertes pour prendre soin de vous au quotidien.
          </p>
          
          <div style="background:#FFFEF7;border:1px solid #E8E4DC;padding:20px;margin:24px 0;">
            <h3 style="color:#B8972A;margin:0 0 16px 0;font-size:16px;">Nos catégories :</h3>
            <ul style="margin:0;padding-left:20px;color:#374151;font-size:14px;line-height:2;">
              <li><strong>Soins du corps</strong> — Huiles, laits, gommages...</li>
              <li><strong>Soins du visage</strong> — Sérums, masques, crèmes...</li>
              <li><strong>Bien-être & santé</strong> — Compléments, tisanes...</li>
            </ul>
          </div>

          <p style="font-size:14px;color:#2D7A1F;font-style:italic;text-align:center;">
            💳 Paiement sécurisé par Mobile Money (Wave, Orange Money, MTN, Moov)
          </p>

          <div style="text-align:center;margin-top:32px;">
            <a href="${baseUrl}/boutique" style="background:#B8972A;color:#fff;padding:14px 32px;border-radius:0;text-decoration:none;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;display:inline-block;">
              Visiter la boutique
            </a>
          </div>
        </div>
      </div>
    `,
  },
  // Step 3: Communauté (J+7)
  {
    subject: "Rejoignez notre communauté de femmes inspirantes",
    getHtml: (prenom: string, baseUrl: string) => `
      <div style="font-family:'Jost',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
        <div style="background:#2D7A1F;padding:32px 24px;text-align:center;">
          <h1 style="font-family:'Cormorant Garamond',serif;color:#fff;margin:0;font-size:28px;">
            👭 Notre communauté
          </h1>
        </div>
        <div style="padding:32px 24px;">
          <p style="font-size:16px;color:#374151;line-height:1.8;">
            ${prenom}, Le Surnaturel de Dieu c'est bien plus qu'un institut...
          </p>
          <p style="font-size:15px;color:#6B7280;line-height:1.8;">
            C'est une communauté de femmes qui partagent les mêmes valeurs : 
            prendre soin de soi, s'entraider et s'inspirer mutuellement.
          </p>
          
          <div style="background:#E8F5E3;padding:20px;border-radius:8px;margin:24px 0;">
            <h3 style="color:#2D7A1F;margin:0 0 12px 0;font-size:16px;">
              Ce que vous pouvez faire dans notre espace communautaire :
            </h3>
            <ul style="margin:0;padding-left:20px;color:#374151;font-size:14px;line-height:2;">
              <li>Partager vos expériences et conseils</li>
              <li>Échanger avec d'autres clientes</li>
              <li>Participer à des événements exclusifs</li>
              <li>Accéder à des contenus bien-être réservés aux membres</li>
            </ul>
          </div>

          <div style="background:#FFFEF7;padding:20px;border-left:4px solid #B8972A;margin:24px 0;">
            <p style="font-size:14px;color:#374151;margin:0;">
              <strong style="color:#B8972A;">Programme de fidélité :</strong><br/>
              Gagnez des points à chaque réservation, achat ou avis déposé. 
              Échangez-les contre des réductions ou des soins gratuits !
            </p>
          </div>

          <div style="text-align:center;margin-top:32px;">
            <a href="${baseUrl}/communaute" style="background:#2D7A1F;color:#fff;padding:14px 32px;border-radius:0;text-decoration:none;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;display:inline-block;">
              Rejoindre la communauté
            </a>
          </div>

          <p style="font-size:13px;color:#9CA3AF;text-align:center;margin-top:32px;">
            Merci de faire partie de l'aventure Le Surnaturel de Dieu. 💚<br/>
            À très bientôt !
          </p>
        </div>
      </div>
    `,
  },
]

export async function envoyerEmailOnboarding({ destinataire, prenom, step }: OnboardingEmailParams) {
  const baseUrl = process.env.NEXTAUTH_URL || "https://surnatureldedieu.com"
  const emailConfig = ONBOARDING_EMAILS[step]

  if (!emailConfig) {
    throw new Error(`Étape d'onboarding invalide: ${step}`)
  }

  return resend.emails.send({
    from: await getFrom(),
    to: destinataire,
    subject: emailConfig.subject,
    html: emailConfig.getHtml(prenom, baseUrl),
  })
}

export async function envoyerEmailRenouvellementAbonnement(params: {
  destinataire: string
  prenom: string
  formule: string
  montant: number
  prochainPaiement: string
}) {
  const appUrl = process.env.NEXTAUTH_URL || "https://surnatureldedieu.com"
  const montantFormate = new Intl.NumberFormat("fr-CI", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  }).format(params.montant)

  return resend.emails.send({
    from: await getFrom(),
    to: params.destinataire,
    subject: "Renouvellement de votre abonnement — Le Surnaturel de Dieu",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#1F2937;">
        <div style="background:#2D7A1F;padding:24px;border-radius:8px 8px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:20px;">
            Abonnement renouvelé
          </h1>
        </div>
        <div style="background:#fff;border:1px solid #E5E7EB;
          border-top:none;padding:24px;border-radius:0 0 8px 8px;">
          <p>Bonjour <strong>${params.prenom}</strong>,</p>
          <p>Votre abonnement <strong>${params.formule}</strong> a été renouvelé avec succès.
             Vos soins mensuels ont été réinitialisés.</p>

          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr style="background:#E8F5E3;">
              <td style="padding:10px;font-weight:600;">Formule</td>
              <td style="padding:10px;">${params.formule}</td>
            </tr>
            <tr>
              <td style="padding:10px;font-weight:600;">Montant</td>
              <td style="padding:10px;font-weight:700;color:#2D7A1F;">${montantFormate}</td>
            </tr>
            <tr style="background:#E8F5E3;">
              <td style="padding:10px;font-weight:600;">Prochain paiement</td>
              <td style="padding:10px;">${params.prochainPaiement}</td>
            </tr>
          </table>

          <a href="${appUrl}/abonnements"
             style="display:inline-block;background:#2D7A1F;color:#fff;
             padding:12px 24px;border-radius:8px;text-decoration:none;
             margin-top:16px;">
            Voir mon abonnement
          </a>

          <p style="color:#6B7280;font-size:12px;margin-top:24px;">
            Si vous souhaitez modifier ou annuler votre abonnement, rendez-vous
            dans votre espace personnel.
          </p>
        </div>
      </div>
    `,
  })
}

export async function envoyerEmailReactivation(params: {
  destinataire: string
  prenom: string
  derniersSoins: string[]
  pointsFidelite: number
}) {
  const appUrl = process.env.NEXTAUTH_URL || "https://surnatureldedieu.com"

  const soinsHtml = params.derniersSoins.length > 0
    ? `<p>Vos derniers soins consultés :</p>
       <ul style="padding-left:20px;">${params.derniersSoins.map((s) => `<li style="margin:4px 0;">${s}</li>`).join("")}</ul>`
    : ""

  const pointsHtml = params.pointsFidelite > 0
    ? `<div style="background:#F5EDD6;padding:16px;border-radius:8px;margin:16px 0;text-align:center;">
         <p style="margin:0;font-size:14px;color:#1F2937;">Vous avez <strong style="color:#9A7B22;font-size:20px;">${params.pointsFidelite} points fidélité</strong> en attente !</p>
       </div>`
    : ""

  return resend.emails.send({
    from: await getFrom(),
    to: params.destinataire,
    subject: "Vous nous manquez ! — Le Surnaturel de Dieu",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#1F2937;">
        <div style="background:#2D7A1F;padding:24px;border-radius:8px 8px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:20px;">
            Nous pensons à vous ✨
          </h1>
        </div>
        <div style="background:#fff;border:1px solid #E5E7EB;
          border-top:none;padding:24px;border-radius:0 0 8px 8px;">
          <p>Bonjour <strong>${params.prenom}</strong>,</p>
          <p>Cela fait un moment que nous ne vous avons pas vue à l'institut.
             Votre bien-être nous tient à cœur et nous serions ravies de vous retrouver.</p>

          ${soinsHtml}
          ${pointsHtml}

          <a href="${appUrl}/prise-rdv"
             style="display:inline-block;background:#2D7A1F;color:#fff;
             padding:12px 24px;border-radius:8px;text-decoration:none;
             margin-top:16px;">
            Réserver un soin
          </a>

          <p style="color:#6B7280;font-size:12px;margin-top:24px;">
            Si vous ne souhaitez plus recevoir ces emails, vous pouvez
            désactiver les notifications dans votre
            <a href="${appUrl}/profil" style="color:#2D7A1F;">espace personnel</a>.
          </p>
        </div>
      </div>
    `,
  })
}
