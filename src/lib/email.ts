import { Resend } from "resend"
import nodemailer from "nodemailer"
import { getConfig } from "@/lib/config"
import { SITE_URL } from "@/lib/site"

// ══════════════════════════════════════════════════════════════════════════════
// ██  DESIGN SYSTEM EMAIL - Le Surnaturel de Dieu                             ██
// ══════════════════════════════════════════════════════════════════════════════

const COLORS = {
  primary: "#1B5E14",        // Vert forêt profond
  primaryLight: "#2D7A1F",   // Vert principal
  primaryPale: "#E8F5E3",    // Vert très pâle
  gold: "#B8972A",           // Or signature
  goldLight: "#D4AF37",      // Or clair
  goldPale: "#FFFEF7",       // Or très pâle
  dark: "#1F2937",           // Texte principal
  gray: "#6B7280",           // Texte secondaire
  grayLight: "#9CA3AF",      // Texte tertiaire
  border: "#E5E7EB",         // Bordures
  background: "#FAFAFA",     // Fond gris
  white: "#FFFFFF",
  warning: "#FEF3CD",
  warningText: "#856404",
}

const FONTS = {
  heading: "'Georgia', 'Times New Roman', serif",
  body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
}

/** Génère le wrapper HTML complet pour tous les emails */
function emailWrapper(content: string, options?: { preheader?: string }): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Le Surnaturel de Dieu</title>
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
    .button { padding: 14px 28px !important; }
  </style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#F3F4F6;font-family:${FONTS.body};">
  ${options?.preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${options.preheader}</div>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F3F4F6;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:${COLORS.white};border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          ${content}
        </table>
        <!-- Footer -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;margin-top:24px;">
          <tr>
            <td align="center" style="padding:16px;">
              <p style="margin:0 0 8px;font-size:13px;color:${COLORS.grayLight};">
                Le Surnaturel de Dieu — Institut de bien-être, Abidjan
              </p>
              <p style="margin:0;font-size:12px;color:${COLORS.grayLight};">
                <a href="${SITE_URL}/profil?tab=notifications" style="color:${COLORS.gray};text-decoration:underline;">Gérer mes notifications</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/** Génère un header stylisé */
function emailHeader(title: string, icon: string, variant: 'primary' | 'gold' = 'primary'): string {
  const bgColor = variant === 'gold' ? `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldLight} 100%)` : `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryLight} 100%)`
  return `
    <tr>
      <td style="background:${bgColor};padding:40px 32px;text-align:center;">
        <div style="font-size:32px;margin-bottom:12px;">${icon}</div>
        <h1 style="margin:0;font-family:${FONTS.heading};font-size:24px;font-weight:600;color:${COLORS.white};letter-spacing:0.5px;">
          ${title}
        </h1>
      </td>
    </tr>`
}

/** Génère un bouton CTA */
function emailButton(text: string, href: string, variant: 'primary' | 'gold' = 'primary'): string {
  const bgColor = variant === 'gold' ? COLORS.gold : COLORS.primaryLight
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;">
      <tr>
        <td style="background:${bgColor};border-radius:50px;text-align:center;">
          <a href="${href}" target="_blank" style="display:inline-block;padding:14px 32px;font-family:${FONTS.body};font-size:14px;font-weight:600;color:${COLORS.white};text-decoration:none;letter-spacing:0.5px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>`
}

/** Génère une card informative */
function emailCard(content: string, variant: 'info' | 'success' | 'warning' | 'gold' = 'info'): string {
  const styles = {
    info: { bg: COLORS.background, border: COLORS.border, icon: 'ℹ️' },
    success: { bg: COLORS.primaryPale, border: '#A7D49B', icon: '✅' },
    warning: { bg: COLORS.warning, border: '#B8972A', icon: '⚠️' },
    gold: { bg: COLORS.goldPale, border: COLORS.gold, icon: '🎁' },
  }
  const style = styles[variant]
  return `
    <div style="background:${style.bg};border:1px solid ${style.border};border-radius:12px;padding:20px;margin:20px 0;">
      ${content}
    </div>`
}

/** Génère un tableau de données */
function emailTable(rows: { label: string; value: string; highlight?: boolean }[]): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-radius:12px;overflow:hidden;border:1px solid ${COLORS.border};">
      ${rows.map((row, i) => `
        <tr style="background:${i % 2 === 0 ? COLORS.primaryPale : COLORS.white};">
          <td style="padding:14px 16px;font-size:14px;font-weight:600;color:${COLORS.dark};width:40%;">${row.label}</td>
          <td style="padding:14px 16px;font-size:14px;color:${row.highlight ? COLORS.primaryLight : COLORS.dark};font-weight:${row.highlight ? '700' : '400'};">${row.value}</td>
        </tr>
      `).join('')}
    </table>`
}

// ── Resend (primary) ─────────────────────────────────────────────────────────
let _resend: Resend | null = null
function getResend(): Resend | null {
  if (!_resend && process.env.RESEND_API_KEY) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

// ── Nodemailer (Gmail SMTP - fallback) ───────────────────────────────────────
let _transporter: nodemailer.Transporter | null = null
function getNodemailerTransporter(): nodemailer.Transporter | null {
  if (_transporter) return _transporter
  
  const user = process.env.SMTP_USER || process.env.GMAIL_USER
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD
  
  if (!user || !pass) {
    console.warn("[EMAIL] SMTP_USER/SMTP_PASS non configurés, Nodemailer désactivé")
    return null
  }
  
  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  })
  
  return _transporter
}

/** Échappe les caractères HTML dangereux */
function e(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
}

async function getFrom(): Promise<string> {
  // Priorité 1: RESEND_FROM_EMAIL (pour Resend)
  if (process.env.RESEND_FROM_EMAIL) {
    const raw = process.env.RESEND_FROM_EMAIL
    if (!raw.includes("<")) return `Le Surnaturel de Dieu <${raw}>`
    return raw
  }
  // Priorité 2: SMTP_FROM (pour Nodemailer fallback)
  if (process.env.SMTP_FROM) {
    const raw = process.env.SMTP_FROM
    if (!raw.includes("<")) return `Le Surnaturel de Dieu <${raw}>`
    return raw
  }
  // Priorité 3: config BDD
  const { nomCentre, emailRdv } = await getConfig()
  return `${nomCentre} <${emailRdv}>`
}

/**
 * Envoi d'email avec double provider :
 * 1. Tente Resend en premier
 * 2. Si échec, bascule automatiquement sur Nodemailer (Gmail SMTP)
 */
export async function sendEmail(
  opts: Parameters<Resend["emails"]["send"]>[0]
) {
  // ── Essai 1 : Resend (primary) ────────────────────────────────────────────
  const resend = getResend()
  if (resend) {
    try {
      const { data, error } = await resend.emails.send(opts)
      if (error) {
        console.error("[EMAIL] ❌ Resend API error, bascule sur Nodemailer:", JSON.stringify(error))
        // Continue vers le fallback Nodemailer
      } else {
        console.log("[EMAIL] ✅ Envoyé via Resend:", data?.id)
        return data
      }
    } catch (resendError) {
      console.error("[EMAIL] ❌ Resend exception, bascule sur Nodemailer:", resendError)
      // Continue vers le fallback Nodemailer
    }
  }
  
  // ── Essai 2 : Nodemailer (fallback) ───────────────────────────────────────
  const transporter = getNodemailerTransporter()
  if (!transporter) {
    throw new Error("Aucun provider email configuré. Configurez RESEND_API_KEY ou SMTP_USER/SMTP_PASS")
  }
  
  const result = await transporter.sendMail({
    from: opts.from as string,
    to: Array.isArray(opts.to) ? opts.to.join(", ") : opts.to,
    subject: opts.subject,
    html: opts.html as string,
    text: opts.text as string | undefined,
  })
  console.log("[EMAIL] ✅ Envoyé via Nodemailer (fallback):", result.messageId)
  return { id: result.messageId }
}

export async function envoyerEmailConfirmationRDV(params: {
  destinataire: string
  nom: string
  soin: string
  date: string
  heure: string
  prix: string
}) {
  const html = emailWrapper(`
    ${emailHeader('Rendez-vous confirmé', '✅')}
    <tr>
      <td style="padding:32px;">
        <p style="margin:0 0 16px;font-size:16px;color:${COLORS.dark};line-height:1.6;">
          Bonjour <strong>${e(params.nom)}</strong>,
        </p>
        <p style="margin:0 0 24px;font-size:15px;color:${COLORS.gray};line-height:1.6;">
          Votre rendez-vous a été enregistré avec succès. Nous avons hâte de vous accueillir !
        </p>
        
        ${emailTable([
          { label: '💆 Soin', value: e(params.soin) },
          { label: '📅 Date', value: e(params.date) },
          { label: '🕐 Heure', value: e(params.heure) },
          { label: '💰 Prix', value: e(params.prix), highlight: true },
        ])}
        
        ${emailCard(`
          <p style="margin:0;font-size:14px;color:${COLORS.dark};">
            <strong>📍 Adresse :</strong><br/>
            Le Surnaturel de Dieu — Abidjan, Côte d'Ivoire
          </p>
        `, 'info')}
        
        ${emailButton('Voir mes rendez-vous', `${SITE_URL}/mes-rdv`)}
        
        <p style="margin:24px 0 0;font-size:13px;color:${COLORS.grayLight};text-align:center;">
          Pour annuler ou modifier, connectez-vous sur votre espace personnel.
        </p>
      </td>
    </tr>
  `, { preheader: `Votre RDV ${params.soin} le ${params.date} est confirmé` })

  return sendEmail({
    from: await getFrom(),
    to: params.destinataire,
    subject: "✅ Rendez-vous confirmé — Le Surnaturel de Dieu",
    html,
  })
}

export async function envoyerEmailInscription(params: {
  destinataire: string
  prenom: string
  tokenVerification: string
}) {
  const lienVerification = `${SITE_URL}/api/auth/verifier-email?token=${params.tokenVerification}`
  
  const html = emailWrapper(`
    ${emailHeader('Confirmez votre email', '📧')}
    <tr>
      <td style="padding:32px;">
        <p style="margin:0 0 16px;font-size:16px;color:${COLORS.dark};line-height:1.6;">
          Bonjour <strong>${e(params.prenom)}</strong> 👋
        </p>
        <p style="margin:0 0 24px;font-size:15px;color:${COLORS.gray};line-height:1.6;">
          Bienvenue au <strong style="color:${COLORS.primaryLight};">Surnaturel de Dieu</strong> !<br/>
          Pour activer votre compte, veuillez confirmer votre adresse email.
        </p>
        
        ${emailButton('Confirmer mon email', lienVerification)}
        
        ${emailCard(`
          <p style="margin:0;font-size:13px;color:${COLORS.gray};">
            ⏱️ Ce lien est valable <strong>24 heures</strong>.<br/>
            Si vous n'avez pas créé de compte, ignorez cet email.
          </p>
        `, 'info')}
        
        <p style="margin:24px 0 0;font-size:12px;color:${COLORS.grayLight};text-align:center;word-break:break-all;">
          Lien alternatif : <a href="${lienVerification}" style="color:${COLORS.primaryLight};">${lienVerification}</a>
        </p>
      </td>
    </tr>
  `, { preheader: 'Confirmez votre email pour activer votre compte' })

  return sendEmail({
    from: await getFrom(),
    to: params.destinataire,
    subject: "📧 Confirmez votre email — Le Surnaturel de Dieu",
    html,
  })
}

export async function envoyerEmailMessageMedical(params: {
  destinataire: string
  prenomDestinataire: string
  prenomExpediteur: string
}) {
  const html = emailWrapper(`
    ${emailHeader('Nouveau message confidentiel', '🔒')}
    <tr>
      <td style="padding:32px;">
        <p style="margin:0 0 16px;font-size:16px;color:${COLORS.dark};line-height:1.6;">
          Bonjour <strong>${e(params.prenomDestinataire)}</strong>,
        </p>
        <p style="margin:0 0 24px;font-size:15px;color:${COLORS.gray};line-height:1.6;">
          Vous avez reçu un nouveau message confidentiel de <strong style="color:${COLORS.primaryLight};">${e(params.prenomExpediteur)}</strong>.
        </p>
        
        ${emailCard(`
          <p style="margin:0;font-size:14px;color:${COLORS.gray};">
            🔐 Pour des raisons de confidentialité, le contenu du message n'est pas affiché dans cet email.
          </p>
        `, 'warning')}
        
        ${emailButton('Lire le message', `${SITE_URL}/suivi-medical`)}
      </td>
    </tr>
  `, { preheader: `Message confidentiel de ${params.prenomExpediteur}` })

  return sendEmail({
    from: await getFrom(),
    to: params.destinataire,
    subject: "🔒 Nouveau message médical — Le Surnaturel de Dieu",
    html,
  })
}

export async function envoyerEmailInvitationParrainage(params: {
  destinataire: string
  prenomParrain: string
  lienParrainage: string
}) {
  const html = emailWrapper(`
    ${emailHeader('Invitation spéciale', '🎁', 'gold')}
    <tr>
      <td style="padding:32px;">
        <p style="margin:0 0 16px;font-size:16px;color:${COLORS.dark};line-height:1.6;">
          Bonjour 👋
        </p>
        <p style="margin:0 0 24px;font-size:15px;color:${COLORS.gray};line-height:1.6;">
          <strong style="color:${COLORS.gold};">${e(params.prenomParrain)}</strong> vous invite à rejoindre 
          <strong>Le Surnaturel de Dieu</strong>, l'institut de bien-être d'Abidjan.
        </p>
        
        ${emailCard(`
          <div style="text-align:center;">
            <p style="margin:0 0 8px;font-size:20px;">🎉</p>
            <p style="margin:0;font-size:15px;color:${COLORS.dark};">
              En vous inscrivant via ce lien, vous et votre parrain recevez chacun<br/>
              <strong style="font-size:24px;color:${COLORS.gold};">200 points de fidélité</strong>
            </p>
          </div>
        `, 'gold')}
        
        ${emailButton('Créer mon compte', params.lienParrainage, 'gold')}
        
        <p style="margin:24px 0 0;font-size:13px;color:${COLORS.grayLight};text-align:center;">
          Si vous ne souhaitez pas créer de compte, ignorez simplement cet email.
        </p>
      </td>
    </tr>
  `, { preheader: `${params.prenomParrain} vous offre 200 points de fidélité` })

  return sendEmail({
    from: await getFrom(),
    to: params.destinataire,
    subject: `🎁 ${e(params.prenomParrain)} vous invite au Surnaturel de Dieu`,
    html,
  })
}

export async function envoyerEmailRappelRDV(params: {
  destinataire: string
  nom: string
  soin: string
  date: string
  heure: string
}) {
  const html = emailWrapper(`
    ${emailHeader('Rappel de rendez-vous', '⏰')}
    <tr>
      <td style="padding:32px;">
        <p style="margin:0 0 16px;font-size:16px;color:${COLORS.dark};line-height:1.6;">
          Bonjour <strong>${e(params.nom)}</strong>,
        </p>
        <p style="margin:0 0 24px;font-size:15px;color:${COLORS.gray};line-height:1.6;">
          Nous vous rappelons que vous avez un rendez-vous <strong style="color:${COLORS.gold};">demain</strong> !
        </p>
        
        ${emailTable([
          { label: '💆 Soin', value: e(params.soin) },
          { label: '📅 Date', value: e(params.date), highlight: true },
          { label: '🕐 Heure', value: e(params.heure), highlight: true },
        ])}
        
        ${emailCard(`
          <p style="margin:0;font-size:14px;color:${COLORS.dark};">
            <strong>📍 Adresse :</strong><br/>
            Le Surnaturel de Dieu — Abidjan, Côte d'Ivoire
          </p>
        `, 'info')}
        
        ${emailButton('Voir mes rendez-vous', `${SITE_URL}/mes-rdv`)}
        
        <p style="margin:24px 0 0;font-size:13px;color:${COLORS.grayLight};text-align:center;">
          Pour annuler ou modifier, connectez-vous sur votre espace personnel.
        </p>
      </td>
    </tr>
  `, { preheader: `Rappel : votre RDV ${params.soin} est demain à ${params.heure}` })

  return sendEmail({
    from: await getFrom(),
    to: params.destinataire,
    subject: "⏰ Rappel : votre rendez-vous demain — Le Surnaturel de Dieu",
    html,
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
    ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-radius:12px;overflow:hidden;border:1px solid ${COLORS.border};">
        <tr style="background:${COLORS.primaryLight};">
          <th style="padding:14px 16px;font-size:13px;font-weight:600;color:${COLORS.white};text-align:left;">Produit</th>
          <th style="padding:14px 16px;font-size:13px;font-weight:600;color:${COLORS.white};text-align:center;">Qté</th>
          <th style="padding:14px 16px;font-size:13px;font-weight:600;color:${COLORS.white};text-align:right;">Prix</th>
        </tr>
        ${params.lignes.map((l, i) => `
          <tr style="background:${i % 2 === 0 ? COLORS.primaryPale : COLORS.white};">
            <td style="padding:12px 16px;font-size:14px;color:${COLORS.dark};">${l.nom}</td>
            <td style="padding:12px 16px;font-size:14px;color:${COLORS.dark};text-align:center;">${l.quantite}</td>
            <td style="padding:12px 16px;font-size:14px;color:${COLORS.dark};text-align:right;">${new Intl.NumberFormat("fr-CI").format(l.prixUnitaire)} F</td>
          </tr>
        `).join('')}
        <tr style="background:${COLORS.primary};">
          <td colspan="2" style="padding:14px 16px;font-size:14px;font-weight:700;color:${COLORS.white};">Total</td>
          <td style="padding:14px 16px;font-size:16px;font-weight:700;color:${COLORS.white};text-align:right;">${totalFormate}</td>
        </tr>
      </table>`
    : ''

  const detailsRows = [
    { label: '🧾 Commande', value: `#${ref}` },
    { label: '📅 Date', value: date },
  ]
  if (params.methode) detailsRows.push({ label: '💳 Méthode', value: params.methode })
  if (params.reference) detailsRows.push({ label: '🔢 Réf. transaction', value: params.reference })
  detailsRows.push({ label: '💰 Montant', value: totalFormate, highlight: true } as { label: string; value: string; highlight?: boolean })

  const html = emailWrapper(`
    ${emailHeader('Paiement confirmé', '💚')}
    <tr>
      <td style="padding:32px;">
        <p style="margin:0 0 16px;font-size:16px;color:${COLORS.dark};line-height:1.6;">
          Bonjour <strong>${e(params.prenom)}</strong>,
        </p>
        <p style="margin:0 0 24px;font-size:15px;color:${COLORS.gray};line-height:1.6;">
          Votre paiement a été reçu et confirmé. Voici votre reçu :
        </p>
        
        ${emailTable(detailsRows)}
        ${lignesHtml}
        
        ${emailCard(`
          <p style="margin:0;font-size:14px;color:${COLORS.warningText};">
            📄 <strong>Conservez ce reçu</strong> comme preuve de paiement.
          </p>
        `, 'warning')}
        
        <p style="margin:20px 0;font-size:14px;color:${COLORS.gray};line-height:1.6;">
          Nous préparons votre commande. Vous recevrez une notification lors de l'expédition.
        </p>
        
        ${emailButton('Suivre ma commande', `${SITE_URL}/commandes`)}
      </td>
    </tr>
  `, { preheader: `Paiement #${ref} confirmé - ${totalFormate}` })

  return sendEmail({
    from: await getFrom(),
    to: params.destinataire,
    subject: `💚 Reçu de paiement #${ref} — Le Surnaturel de Dieu`,
    html,
  })
}

export async function envoyerEmailConfirmationCommande(params: {
  destinataire: string
  prenom: string
  commandeId: string
  total: number
  lignes: { nom: string; quantite: number; prixUnitaire: number }[]
}) {
  const ref = params.commandeId.slice(-8).toUpperCase()

  const totalFormate = new Intl.NumberFormat("fr-CI", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  }).format(params.total)

  const lignesHtml = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-radius:12px;overflow:hidden;border:1px solid ${COLORS.border};">
      <tr style="background:${COLORS.primaryLight};">
        <th style="padding:14px 16px;font-size:13px;font-weight:600;color:${COLORS.white};text-align:left;">Produit</th>
        <th style="padding:14px 16px;font-size:13px;font-weight:600;color:${COLORS.white};text-align:center;">Qté</th>
        <th style="padding:14px 16px;font-size:13px;font-weight:600;color:${COLORS.white};text-align:right;">Prix</th>
      </tr>
      ${params.lignes.map((l, i) => `
        <tr style="background:${i % 2 === 0 ? COLORS.primaryPale : COLORS.white};">
          <td style="padding:12px 16px;font-size:14px;color:${COLORS.dark};">${l.nom}</td>
          <td style="padding:12px 16px;font-size:14px;color:${COLORS.dark};text-align:center;">${l.quantite}</td>
          <td style="padding:12px 16px;font-size:14px;color:${COLORS.dark};text-align:right;">${new Intl.NumberFormat("fr-CI").format(l.prixUnitaire)} F</td>
        </tr>
      `).join('')}
      <tr style="background:${COLORS.gold};">
        <td colspan="2" style="padding:14px 16px;font-size:14px;font-weight:700;color:${COLORS.white};">Total à payer</td>
        <td style="padding:14px 16px;font-size:16px;font-weight:700;color:${COLORS.white};text-align:right;">${totalFormate}</td>
      </tr>
    </table>`

  const html = emailWrapper(`
    ${emailHeader('Commande enregistrée', '🛒', 'gold')}
    <tr>
      <td style="padding:32px;">
        <p style="margin:0 0 16px;font-size:16px;color:${COLORS.dark};line-height:1.6;">
          Bonjour <strong>${e(params.prenom)}</strong>,
        </p>
        <p style="margin:0 0 24px;font-size:15px;color:${COLORS.gray};line-height:1.6;">
          Votre commande <strong style="color:${COLORS.gold};">#${ref}</strong> a été enregistrée.<br/>
          Elle sera validée dès réception de votre paiement.
        </p>
        
        ${lignesHtml}
        
        ${emailCard(`
          <p style="margin:0;font-size:14px;color:${COLORS.warningText};">
            ⏳ Cette commande sera automatiquement annulée si le paiement n'est pas reçu dans les <strong>24 heures</strong>.
          </p>
        `, 'warning')}
        
        ${emailButton('Suivre ma commande', `${SITE_URL}/commandes/${params.commandeId}`, 'gold')}
      </td>
    </tr>
  `, { preheader: `Commande #${ref} en attente de paiement - ${totalFormate}` })

  return sendEmail({
    from: await getFrom(),
    to: params.destinataire,
    subject: `🛒 Commande #${ref} enregistrée — Le Surnaturel de Dieu`,
    html,
  })
}

export async function envoyerEmailResetMotDePasse(params: {
  destinataire: string
  prenom: string
  lienReset: string
}) {
  const html = emailWrapper(`
    ${emailHeader('Réinitialisation mot de passe', '🔑')}
    <tr>
      <td style="padding:32px;">
        <p style="margin:0 0 16px;font-size:16px;color:${COLORS.dark};line-height:1.6;">
          Bonjour <strong>${params.prenom}</strong>,
        </p>
        <p style="margin:0 0 24px;font-size:15px;color:${COLORS.gray};line-height:1.6;">
          Vous avez demandé la réinitialisation de votre mot de passe.<br/>
          Ce lien expire dans <strong style="color:${COLORS.gold};">1 heure</strong>.
        </p>
        
        ${emailButton('Réinitialiser mon mot de passe', params.lienReset)}
        
        ${emailCard(`
          <p style="margin:0;font-size:14px;color:${COLORS.warningText};">
            <strong>⚠️ Vous n'êtes pas à l'origine de cette demande ?</strong><br/>
            Ignorez cet email — votre mot de passe reste inchangé.
            Si vous recevez plusieurs emails de ce type, contactez-nous immédiatement.
          </p>
        `, 'warning')}
        
        <p style="margin:24px 0 0;font-size:13px;color:${COLORS.grayLight};text-align:center;">
          Ce lien ne fonctionne qu'une seule fois. Ne le partagez avec personne.
        </p>
      </td>
    </tr>
  `, { preheader: 'Réinitialisez votre mot de passe (valable 1h)' })

  return sendEmail({
    from: await getFrom(),
    to: params.destinataire,
    subject: "🔑 Réinitialisation de votre mot de passe — Le Surnaturel de Dieu",
    html,
  })
}

// ─── Email invitation à laisser un avis après RDV terminé ────────
export async function envoyerEmailInvitationAvis(params: {
  destinataire: string
  prenom: string
  soin: string
  rdvId: string
}) {
  const html = emailWrapper(`
    ${emailHeader('Votre avis compte !', '⭐', 'gold')}
    <tr>
      <td style="padding:32px;">
        <p style="margin:0 0 16px;font-size:16px;color:${COLORS.dark};line-height:1.6;">
          Bonjour <strong>${params.prenom}</strong>,
        </p>
        <p style="margin:0 0 24px;font-size:15px;color:${COLORS.gray};line-height:1.6;">
          Nous espérons que votre soin <strong style="color:${COLORS.primaryLight};">${params.soin}</strong> 
          vous a apporté bien-être et sérénité.
        </p>
        
        <div style="text-align:center;margin:24px 0;">
          <div style="font-size:36px;margin-bottom:12px;">⭐⭐⭐⭐⭐</div>
          <p style="margin:0;font-size:14px;color:${COLORS.gray};">
            Votre avis aide d'autres clientes à faire leur choix<br/>
            et nous permet d'améliorer nos services.
          </p>
        </div>
        
        ${emailButton('Donner mon avis', `${SITE_URL}/avis/${params.rdvId}`, 'gold')}
        
        ${emailCard(`
          <div style="text-align:center;">
            <p style="margin:0;font-size:14px;color:${COLORS.primaryLight};">
              🎁 <strong>Bonus :</strong> Chaque avis publié vous rapporte<br/>
              <strong style="font-size:20px;color:${COLORS.gold};">50 points de fidélité</strong>
            </p>
          </div>
        `, 'success')}
        
        <p style="margin:24px 0 0;font-size:13px;color:${COLORS.grayLight};text-align:center;">
          Merci de votre confiance. 💚<br/>
          L'équipe du Surnaturel de Dieu
        </p>
      </td>
    </tr>
  `, { preheader: 'Comment s\'est passé votre soin ? Gagnez 50 points !' })

  return sendEmail({
    from: await getFrom(),
    to: params.destinataire,
    subject: "⭐ Comment s'est passé votre soin ? — Le Surnaturel de Dieu",
    html,
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
  const BASE_URL = SITE_URL
  
  const articlesHtml = articles.length > 0 ? `
    <tr>
      <td style="padding:0 32px;">
        <h2 style="margin:32px 0 20px;font-family:${FONTS.heading};font-size:20px;color:${COLORS.primaryLight};">
          📰 Nos derniers articles
        </h2>
        ${articles.map(article => `
          <div style="background:${COLORS.background};border-radius:12px;padding:20px;margin-bottom:16px;">
            ${article.imageUrl ? `<img src="${article.imageUrl}" alt="${article.titre}" style="width:100%;max-height:150px;object-fit:cover;border-radius:8px;margin-bottom:16px;" />` : ''}
            <h3 style="margin:0 0 8px;font-size:16px;color:${COLORS.dark};">${article.titre}</h3>
            <p style="margin:0 0 12px;font-size:14px;color:${COLORS.gray};line-height:1.5;">${article.extrait}</p>
            <a href="${BASE_URL}/blog/${article.slug}" style="color:${COLORS.primaryLight};font-size:14px;text-decoration:none;font-weight:600;">
              Lire la suite →
            </a>
          </div>
        `).join('')}
      </td>
    </tr>
  ` : ''

  const soinsHtml = soinsPopulaires.length > 0 ? `
    <tr>
      <td style="padding:0 32px;">
        <h2 style="margin:32px 0 20px;font-family:${FONTS.heading};font-size:20px;color:${COLORS.primaryLight};">
          ✨ Soins populaires
        </h2>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            ${soinsPopulaires.map(soin => `
              <td style="width:${100/soinsPopulaires.length}%;padding:8px;vertical-align:top;">
                <div style="background:${COLORS.primaryPale};padding:20px;border-radius:12px;height:100%;">
                  <h3 style="margin:0 0 8px;font-size:15px;color:${COLORS.primaryLight};">${soin.nom}</h3>
                  <p style="margin:0 0 16px;font-size:13px;color:${COLORS.gray};line-height:1.5;">${soin.description}</p>
                  <a href="${BASE_URL}/prise-rdv?soin=${soin.slug}" style="background:${COLORS.primaryLight};color:${COLORS.white};padding:10px 16px;border-radius:50px;text-decoration:none;font-size:12px;font-weight:600;display:inline-block;">
                    Réserver
                  </a>
                </div>
              </td>
            `).join('')}
          </tr>
        </table>
      </td>
    </tr>
  ` : ''

  const promoHtml = codePromo ? `
    <tr>
      <td style="padding:32px;">
        <div style="background:linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldLight} 100%);padding:32px;border-radius:16px;text-align:center;">
          <p style="margin:0 0 8px;font-size:13px;color:${COLORS.white};opacity:0.9;letter-spacing:1px;text-transform:uppercase;">Offre exclusive newsletter</p>
          <p style="margin:0 0 16px;font-size:28px;font-weight:bold;color:${COLORS.white};">${codePromo.reduction}</p>
          <div style="background:${COLORS.white};padding:16px 32px;border-radius:8px;display:inline-block;">
            <span style="font-family:monospace;font-size:22px;color:${COLORS.gold};font-weight:bold;letter-spacing:2px;">${codePromo.code}</span>
          </div>
          <p style="margin:16px 0 0;font-size:12px;color:${COLORS.white};opacity:0.8;">Valable jusqu'au ${codePromo.dateExpiration}</p>
        </div>
      </td>
    </tr>
  ` : ''

  const messageHtml = messagePersonnalise ? `
    <tr>
      <td style="padding:0 32px;">
        <div style="padding:20px;border-left:4px solid ${COLORS.gold};background:${COLORS.goldPale};border-radius:0 12px 12px 0;margin:24px 0;">
          <p style="margin:0;font-size:14px;color:${COLORS.dark};line-height:1.6;">${messagePersonnalise}</p>
        </div>
      </td>
    </tr>
  ` : ''

  const html = emailWrapper(`
    <tr>
      <td style="background:linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryLight} 100%);padding:48px 32px;text-align:center;">
        <div style="font-size:40px;margin-bottom:16px;">🌿</div>
        <h1 style="margin:0;font-family:${FONTS.heading};font-size:28px;color:${COLORS.white};">
          Le Surnaturel de Dieu
        </h1>
        <p style="color:${COLORS.white};opacity:0.9;margin:12px 0 0;font-size:14px;letter-spacing:1px;">
          VOTRE NEWSLETTER BIEN-ÊTRE
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:32px;">
        <p style="margin:0 0 8px;font-size:18px;color:${COLORS.dark};">
          Bonjour ${prenom || 'cher(e) client(e)'} 👋
        </p>
        <p style="margin:0;font-size:15px;color:${COLORS.gray};line-height:1.6;">
          Retrouvez toutes les actualités de notre institut et nos conseils bien-être.
        </p>
      </td>
    </tr>
    ${messageHtml}
    ${articlesHtml}
    ${soinsHtml}
    ${promoHtml}
    <tr>
      <td style="padding:32px;text-align:center;">
        ${emailButton('Prendre rendez-vous', `${BASE_URL}/prise-rdv`)}
      </td>
    </tr>
  `, { preheader: 'Actualités et conseils bien-être du Surnaturel de Dieu' })

  await sendEmail({
    from: await getFrom(),
    to: email,
    subject: '🌿 Les actualités du Surnaturel de Dieu',
    html,
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
    subject: "🌿 Bienvenue chez Le Surnaturel de Dieu !",
    getHtml: (prenom: string, baseUrl: string) => emailWrapper(`
      <tr>
        <td style="background:linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryLight} 100%);padding:48px 32px;text-align:center;">
          <div style="font-size:48px;margin-bottom:16px;">🌿</div>
          <h1 style="margin:0;font-family:${FONTS.heading};font-size:32px;color:${COLORS.white};">
            Bienvenue, ${prenom} !
          </h1>
          <p style="color:${COLORS.white};opacity:0.9;margin:12px 0 0;font-size:15px;">
            Votre parcours bien-être commence ici
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:16px;color:${COLORS.dark};line-height:1.8;">
            Nous sommes ravis de vous accueillir dans notre institut de bien-être à Abidjan.
          </p>
          <p style="margin:0 0 24px;font-size:15px;color:${COLORS.gray};line-height:1.8;">
            Chez <strong style="color:${COLORS.primaryLight};">Le Surnaturel de Dieu</strong>, 
            nous croyons que chaque femme mérite de prendre soin d'elle. 
            Notre équipe de professionnelles passionnées est là pour vous accompagner.
          </p>
          
          <div style="background:linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldLight} 100%);padding:28px;border-radius:16px;text-align:center;margin:24px 0;">
            <div style="font-size:32px;margin-bottom:12px;">🎁</div>
            <p style="margin:0 0 8px;font-size:14px;color:${COLORS.white};opacity:0.9;">Votre cadeau de bienvenue</p>
            <p style="margin:0 0 16px;font-size:15px;color:${COLORS.white};">
              <strong>10% de réduction</strong> sur votre premier soin
            </p>
            <div style="background:${COLORS.white};padding:14px 28px;border-radius:8px;display:inline-block;">
              <span style="font-family:monospace;font-size:22px;color:${COLORS.gold};font-weight:bold;letter-spacing:2px;">BIENVENUE10</span>
            </div>
          </div>
          
          ${emailButton('Découvrir nos soins', `${baseUrl}/soins`)}
        </td>
      </tr>
    `, { preheader: 'Bienvenue ! Découvrez votre cadeau de 10% de réduction' }),
  },
  // Step 1: Découverte des soins (J+2)
  {
    subject: "✨ Découvrez nos soins signature",
    getHtml: (prenom: string, baseUrl: string) => emailWrapper(`
      ${emailHeader("Nos soins d'exception", '✨')}
      <tr>
        <td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:16px;color:${COLORS.dark};line-height:1.8;">
            Bonjour ${prenom},
          </p>
          <p style="margin:0 0 24px;font-size:15px;color:${COLORS.gray};line-height:1.8;">
            Avez-vous eu l'occasion de parcourir notre carte de soins ? 
            Voici nos prestations les plus appréciées :
          </p>
          
          <div style="margin:24px 0;">
            <div style="background:${COLORS.primaryPale};border-radius:12px;padding:20px;margin-bottom:12px;">
              <h3 style="color:${COLORS.primaryLight};margin:0 0 8px;font-size:16px;">🔥 Hammam Royal</h3>
              <p style="color:${COLORS.gray};font-size:14px;margin:0;line-height:1.5;">
                Une expérience de purification totale inspirée des traditions orientales.
              </p>
            </div>
            <div style="background:${COLORS.background};border-radius:12px;padding:20px;margin-bottom:12px;">
              <h3 style="color:${COLORS.primaryLight};margin:0 0 8px;font-size:16px;">✨ Gommage Corps Luxe</h3>
              <p style="color:${COLORS.gray};font-size:14px;margin:0;line-height:1.5;">
                Exfoliation douce aux actifs naturels pour une peau soyeuse.
              </p>
            </div>
            <div style="background:${COLORS.primaryPale};border-radius:12px;padding:20px;margin-bottom:12px;">
              <h3 style="color:${COLORS.primaryLight};margin:0 0 8px;font-size:16px;">🌸 Soin Visage Éclat</h3>
              <p style="color:${COLORS.gray};font-size:14px;margin:0;line-height:1.5;">
                Un soin complet pour révéler la luminosité de votre teint.
              </p>
            </div>
            <div style="background:${COLORS.background};border-radius:12px;padding:20px;">
              <h3 style="color:${COLORS.primaryLight};margin:0 0 8px;font-size:16px;">👶 Post-Accouchement</h3>
              <p style="color:${COLORS.gray};font-size:14px;margin:0;line-height:1.5;">
                Un accompagnement dédié aux jeunes mamans pour retrouver forme et sérénité.
              </p>
            </div>
          </div>
          
          ${emailButton('Réserver mon soin', `${baseUrl}/prise-rdv`)}
        </td>
      </tr>
    `, { preheader: 'Hammam, Gommage, Soin visage... Découvrez nos soins signature' }),
  },
  // Step 2: Boutique (J+5)
  {
    subject: "🛍️ Notre boutique — Prolongez votre bien-être",
    getHtml: (prenom: string, baseUrl: string) => emailWrapper(`
      ${emailHeader('Notre boutique', '🛍️', 'gold')}
      <tr>
        <td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:16px;color:${COLORS.dark};line-height:1.8;">
            ${prenom}, savez-vous que vous pouvez prolonger votre expérience bien-être chez vous ?
          </p>
          <p style="margin:0 0 24px;font-size:15px;color:${COLORS.gray};line-height:1.8;">
            Notre boutique en ligne regroupe les meilleurs produits sélectionnés par nos expertes.
          </p>
          
          <div style="background:${COLORS.goldPale};border:1px solid ${COLORS.border};border-radius:12px;padding:24px;margin:24px 0;">
            <h3 style="color:${COLORS.gold};margin:0 0 16px;font-size:16px;">🏷️ Nos catégories :</h3>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid ${COLORS.border};">
                  <strong style="color:${COLORS.dark};">Soins du corps</strong>
                  <span style="color:${COLORS.gray};font-size:13px;"> — Huiles, laits, gommages...</span>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid ${COLORS.border};">
                  <strong style="color:${COLORS.dark};">Soins du visage</strong>
                  <span style="color:${COLORS.gray};font-size:13px;"> — Sérums, masques, crèmes...</span>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;">
                  <strong style="color:${COLORS.dark};">Bien-être & santé</strong>
                  <span style="color:${COLORS.gray};font-size:13px;"> — Compléments, tisanes...</span>
                </td>
              </tr>
            </table>
          </div>
          
          <p style="font-size:14px;color:${COLORS.primaryLight};text-align:center;margin:20px 0;">
            💳 Paiement sécurisé par Mobile Money (Wave, Orange Money, MTN, Moov)
          </p>
          
          ${emailButton('Visiter la boutique', `${baseUrl}/boutique`, 'gold')}
        </td>
      </tr>
    `, { preheader: 'Découvrez notre boutique de produits bien-être' }),
  },
  // Step 3: Communauté (J+7)
  {
    subject: "👭 Rejoignez notre communauté",
    getHtml: (prenom: string, baseUrl: string) => emailWrapper(`
      ${emailHeader('Notre communauté', '👭')}
      <tr>
        <td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:16px;color:${COLORS.dark};line-height:1.8;">
            ${prenom}, Le Surnaturel de Dieu c'est bien plus qu'un institut...
          </p>
          <p style="margin:0 0 24px;font-size:15px;color:${COLORS.gray};line-height:1.8;">
            C'est une communauté de femmes qui partagent les mêmes valeurs : 
            prendre soin de soi, s'entraider et s'inspirer mutuellement.
          </p>
          
          <div style="background:${COLORS.primaryPale};padding:24px;border-radius:12px;margin:24px 0;">
            <h3 style="color:${COLORS.primaryLight};margin:0 0 16px;font-size:16px;">
              Dans notre espace communautaire :
            </h3>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:6px 0;font-size:14px;color:${COLORS.dark};">💬 Partager vos expériences et conseils</td></tr>
              <tr><td style="padding:6px 0;font-size:14px;color:${COLORS.dark};">🤝 Échanger avec d'autres clientes</td></tr>
              <tr><td style="padding:6px 0;font-size:14px;color:${COLORS.dark};">🎉 Participer à des événements exclusifs</td></tr>
              <tr><td style="padding:6px 0;font-size:14px;color:${COLORS.dark};">📚 Accéder à des contenus réservés aux membres</td></tr>
            </table>
          </div>
          
          <div style="background:${COLORS.goldPale};padding:20px;border-left:4px solid ${COLORS.gold};border-radius:0 12px 12px 0;margin:24px 0;">
            <p style="font-size:14px;color:${COLORS.dark};margin:0;">
              <strong style="color:${COLORS.gold};">🏆 Programme de fidélité :</strong><br/>
              Gagnez des points à chaque réservation, achat ou avis déposé. 
              Échangez-les contre des réductions ou des soins gratuits !
            </p>
          </div>
          
          ${emailButton('Rejoindre la communauté', `${baseUrl}/communaute`)}
          
          <p style="font-size:14px;color:${COLORS.grayLight};text-align:center;margin-top:32px;">
            Merci de faire partie de l'aventure. 💚<br/>
            À très bientôt !
          </p>
        </td>
      </tr>
    `, { preheader: 'Rejoignez notre communauté de femmes inspirantes' }),
  },
]

export async function envoyerEmailOnboarding({ destinataire, prenom, step }: OnboardingEmailParams) {
  const baseUrl = SITE_URL
  const emailConfig = ONBOARDING_EMAILS[step]

  if (!emailConfig) {
    throw new Error(`Étape d'onboarding invalide: ${step}`)
  }

  return sendEmail({
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
  const montantFormate = new Intl.NumberFormat("fr-CI", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  }).format(params.montant)

  const html = emailWrapper(`
    ${emailHeader('Abonnement renouvelé', '🔄')}
    <tr>
      <td style="padding:32px;">
        <p style="margin:0 0 16px;font-size:16px;color:${COLORS.dark};line-height:1.6;">
          Bonjour <strong>${params.prenom}</strong>,
        </p>
        <p style="margin:0 0 24px;font-size:15px;color:${COLORS.gray};line-height:1.6;">
          Votre abonnement a été renouvelé avec succès.<br/>
          Vos soins mensuels ont été réinitialisés.
        </p>
        
        ${emailTable([
          { label: '📦 Formule', value: params.formule },
          { label: '💰 Montant', value: montantFormate, highlight: true },
          { label: '📅 Prochain paiement', value: params.prochainPaiement },
        ])}
        
        ${emailCard(`
          <p style="margin:0;font-size:14px;color:${COLORS.primaryLight};">
            ✅ Vos soins mensuels sont maintenant disponibles. Réservez dès maintenant !
          </p>
        `, 'success')}
        
        ${emailButton('Voir mon abonnement', `${SITE_URL}/abonnements`)}
        
        <p style="margin:24px 0 0;font-size:13px;color:${COLORS.grayLight};text-align:center;">
          Pour modifier ou annuler votre abonnement, rendez-vous dans votre espace personnel.
        </p>
      </td>
    </tr>
  `, { preheader: `Abonnement ${params.formule} renouvelé - ${montantFormate}` })

  return sendEmail({
    from: await getFrom(),
    to: params.destinataire,
    subject: "🔄 Renouvellement de votre abonnement — Le Surnaturel de Dieu",
    html,
  })
}

export async function envoyerEmailReactivation(params: {
  destinataire: string
  prenom: string
  derniersSoins: string[]
  pointsFidelite: number
}) {
  const soinsHtml = params.derniersSoins.length > 0
    ? `
      <div style="margin:20px 0;">
        <p style="margin:0 0 12px;font-size:14px;color:${COLORS.dark};font-weight:600;">Vos derniers soins consultés :</p>
        ${params.derniersSoins.map(soin => `
          <div style="background:${COLORS.background};padding:12px 16px;border-radius:8px;margin-bottom:8px;font-size:14px;color:${COLORS.gray};">
            ✨ ${soin}
          </div>
        `).join('')}
      </div>
    ` : ""

  const pointsHtml = params.pointsFidelite > 0
    ? `
      <div style="background:linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldLight} 100%);padding:24px;border-radius:12px;margin:20px 0;text-align:center;">
        <p style="margin:0 0 8px;font-size:13px;color:${COLORS.white};opacity:0.9;">Vous avez</p>
        <p style="margin:0;font-size:32px;font-weight:bold;color:${COLORS.white};">${params.pointsFidelite} points</p>
        <p style="margin:8px 0 0;font-size:13px;color:${COLORS.white};opacity:0.9;">de fidélité en attente !</p>
      </div>
    ` : ""

  const html = emailWrapper(`
    ${emailHeader('Vous nous manquez !', '💚')}
    <tr>
      <td style="padding:32px;">
        <p style="margin:0 0 16px;font-size:16px;color:${COLORS.dark};line-height:1.6;">
          Bonjour <strong>${params.prenom}</strong>,
        </p>
        <p style="margin:0 0 24px;font-size:15px;color:${COLORS.gray};line-height:1.6;">
          Cela fait un moment que nous ne vous avons pas vue à l'institut.<br/>
          Votre bien-être nous tient à cœur et nous serions ravies de vous retrouver.
        </p>
        
        ${soinsHtml}
        ${pointsHtml}
        
        ${emailButton('Réserver un soin', `${SITE_URL}/prise-rdv`)}
        
        <p style="margin:24px 0 0;font-size:13px;color:${COLORS.grayLight};text-align:center;">
          Si vous ne souhaitez plus recevoir ces emails, vous pouvez
          <a href="${SITE_URL}/profil?tab=notifications" style="color:${COLORS.primaryLight};">désactiver les notifications</a>.
        </p>
      </td>
    </tr>
  `, { preheader: `${params.prenom}, nous pensons à vous ! ${params.pointsFidelite > 0 ? `${params.pointsFidelite} points vous attendent` : ''}` })

  return sendEmail({
    from: await getFrom(),
    to: params.destinataire,
    subject: "💚 Vous nous manquez ! — Le Surnaturel de Dieu",
    html,
  })
}
