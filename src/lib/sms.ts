// ── Service SMS — Rappels RDV et notifications ──────────────────
//
// Utilise l'API Africa's Talking pour envoyer des SMS en Côte d'Ivoire.
// Africa's Talking est optimisé pour l'Afrique de l'Ouest et n'est pas
// bloqué par les opérateurs locaux (Orange, MTN, Moov).
//
// Variables d'environnement requises :
//   AT_API_KEY        (clé API Africa's Talking)
//   AT_USERNAME       (username Africa's Talking, ex: "sandbox" pour test)
//   AT_SENDER_ID      (optionnel — nom expéditeur, ex: "SURNATUREL")
//
// Inscription : https://africastalking.com
// Si les variables ne sont pas configurées, les SMS sont ignorés
// silencieusement (pas d'erreur bloquante).

const AT_API_KEY = process.env.AT_API_KEY
const AT_USERNAME = process.env.AT_USERNAME
const AT_SENDER_ID = process.env.AT_SENDER_ID // optionnel

function isSmsConfigured(): boolean {
  return !!(AT_API_KEY && AT_USERNAME)
}

export async function envoyerSms(to: string, body: string): Promise<boolean> {
  if (!isSmsConfigured()) {
    console.warn("[SMS] Africa's Talking non configuré — SMS ignoré")
    return false
  }

  // Normaliser le numéro ivoirien (07 XX XX XX XX → +225 07 XX XX XX XX)
  let numero = to.replace(/\s+/g, "").replace(/-/g, "")
  if (numero.startsWith("0") && !numero.startsWith("00")) {
    numero = "+225" + numero
  }
  if (!numero.startsWith("+")) {
    numero = "+" + numero
  }

  try {
    const url = "https://api.africastalking.com/version1/messaging"

    const params = new URLSearchParams({
      username: AT_USERNAME!,
      to: numero,
      message: body,
    })

    // Sender ID personnalisé (affiché au lieu d'un numéro)
    if (AT_SENDER_ID) {
      params.set("from", AT_SENDER_ID)
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        apiKey: AT_API_KEY!,
      },
      body: params,
    })

    if (!res.ok) {
      const err = await res.text()
      console.error("[SMS] Erreur Africa's Talking:", res.status, err)
      return false
    }

    const data = await res.json()
    const recipients = data?.SMSMessageData?.Recipients ?? []

    if (recipients.length > 0 && recipients[0].statusCode === 101) {
      return true
    }

    console.error("[SMS] Envoi échoué:", JSON.stringify(data?.SMSMessageData))
    return false
  } catch (error) {
    console.error("[SMS] Erreur envoi:", error)
    return false
  }
}

// ── SMS de rappel RDV (envoyé la veille) ─────────────────────────

export async function envoyerSmsRappelRDV(params: {
  telephone: string
  prenom: string
  soin: string
  date: string
  heure: string
}): Promise<boolean> {
  const message =
    `Bonjour ${params.prenom}, rappel de votre RDV demain à ${params.heure} ` +
    `pour ${params.soin} au Surnaturel de Dieu. ` +
    `Adresse : Cocody, Riviera Palmeraie, Abidjan. ` +
    `Pour annuler : connectez-vous sur votre espace client.`

  return envoyerSms(params.telephone, message)
}

// ── SMS de confirmation RDV ──────────────────────────────────────

export async function envoyerSmsConfirmationRDV(params: {
  telephone: string
  prenom: string
  soin: string
  date: string
  heure: string
}): Promise<boolean> {
  const message =
    `${params.prenom}, votre RDV est confirmé ! ` +
    `${params.soin} le ${params.date} à ${params.heure}. ` +
    `Le Surnaturel de Dieu — Cocody, Riviera Palmeraie.`

  return envoyerSms(params.telephone, message)
}

// ── SMS de confirmation paiement acompte ─────────────────────────

export async function envoyerSmsAcomptePaye(params: {
  telephone: string
  prenom: string
  montant: string
  soin: string
}): Promise<boolean> {
  const message =
    `${params.prenom}, votre acompte de ${params.montant} pour ${params.soin} ` +
    `a été reçu. Votre RDV est garanti. Merci ! — Le Surnaturel de Dieu`

  return envoyerSms(params.telephone, message)
}
