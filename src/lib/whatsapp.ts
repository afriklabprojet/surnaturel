/**
 * Service WhatsApp Business API
 * Documentation: https://developers.facebook.com/docs/whatsapp/cloud-api
 * 
 * Variables d'environnement requises:
 * - WHATSAPP_PHONE_NUMBER_ID: ID du numéro de téléphone WhatsApp Business
 * - WHATSAPP_ACCESS_TOKEN: Token d'accès Meta
 * - WHATSAPP_BUSINESS_ID: ID du compte WhatsApp Business (optionnel)
 */

const WHATSAPP_API_URL = "https://graph.facebook.com/v18.0"
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN

interface WhatsAppMessageResponse {
  messaging_product: string
  contacts: Array<{ wa_id: string }>
  messages: Array<{ id: string }>
}

interface WhatsAppError {
  error: {
    message: string
    type: string
    code: number
  }
}

type MessageResult = 
  | { success: true; messageId: string }
  | { success: false; error: string }

/**
 * Formater un numéro de téléphone pour WhatsApp
 * Supprime les espaces, tirets et ajoute le code pays si nécessaire
 */
export function formatPhoneForWhatsApp(phone: string): string {
  // Supprimer tous les caractères non numériques sauf +
  let formatted = phone.replace(/[^\d+]/g, "")
  
  // Si le numéro commence par 0, le remplacer par +225 (Côte d'Ivoire)
  if (formatted.startsWith("0")) {
    formatted = "+225" + formatted.substring(1)
  }
  
  // Si pas de +, ajouter +225 par défaut
  if (!formatted.startsWith("+")) {
    formatted = "+225" + formatted
  }
  
  // Retirer le + pour l'API WhatsApp
  return formatted.replace("+", "")
}

/**
 * Envoyer un message texte simple via WhatsApp
 */
export async function envoyerWhatsAppTexte(
  telephone: string,
  message: string
): Promise<MessageResult> {
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    console.error("WhatsApp: Credentials manquantes")
    return { success: false, error: "Configuration WhatsApp manquante" }
  }

  const phoneNumber = formatPhoneForWhatsApp(telephone)

  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: phoneNumber,
          type: "text",
          text: { body: message },
        }),
      }
    )

    const data = await response.json() as WhatsAppMessageResponse | WhatsAppError

    if (!response.ok) {
      const error = data as WhatsAppError
      console.error("WhatsApp API Error:", error)
      return { success: false, error: error.error?.message || "Erreur API WhatsApp" }
    }

    const result = data as WhatsAppMessageResponse
    return { success: true, messageId: result.messages[0]?.id || "" }
  } catch (error) {
    console.error("WhatsApp send error:", error)
    return { success: false, error: "Erreur d'envoi WhatsApp" }
  }
}

/**
 * Envoyer une notification de confirmation de RDV
 */
export async function envoyerWhatsAppConfirmationRDV(
  telephone: string,
  prenom: string,
  soin: string,
  date: Date
): Promise<MessageResult> {
  const dateStr = date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  })

  const message = `✨ *Surnaturel de Dieu*

Bonjour ${prenom} !

Votre rendez-vous est confirmé :
📅 ${dateStr}
💆 ${soin}

📍 Adresse : [Votre adresse]

Pour modifier ou annuler, répondez à ce message ou appelez-nous.

À très bientôt !`

  return envoyerWhatsAppTexte(telephone, message)
}

/**
 * Envoyer un rappel de RDV
 */
export async function envoyerWhatsAppRappelRDV(
  telephone: string,
  prenom: string,
  soin: string,
  date: Date
): Promise<MessageResult> {
  const heureStr = date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  })

  const message = `⏰ *Rappel - Surnaturel de Dieu*

Bonjour ${prenom},

N'oubliez pas votre rendez-vous demain :
🕐 ${heureStr}
💆 ${soin}

À demain ! ✨`

  return envoyerWhatsAppTexte(telephone, message)
}

/**
 * Envoyer une notification de nouvelle commande
 */
export async function envoyerWhatsAppNouvelleCommande(
  telephone: string,
  prenom: string,
  numeroCommande: string,
  total: number
): Promise<MessageResult> {
  const message = `🛍️ *Surnaturel de Dieu*

Merci ${prenom} pour votre commande !

📦 Commande n°${numeroCommande}
💰 Total : ${total.toLocaleString("fr-FR")} FCFA

Nous vous tiendrons informé(e) de l'expédition.

Merci de votre confiance ! 💚`

  return envoyerWhatsAppTexte(telephone, message)
}

/**
 * Envoyer une notification d'expédition
 */
export async function envoyerWhatsAppExpedition(
  telephone: string,
  prenom: string,
  numeroCommande: string
): Promise<MessageResult> {
  const message = `🚚 *Surnaturel de Dieu*

Bonjour ${prenom},

Bonne nouvelle ! Votre commande n°${numeroCommande} a été expédiée.

Vous la recevrez dans les prochains jours.

Des questions ? Répondez à ce message ! 💚`

  return envoyerWhatsAppTexte(telephone, message)
}

/**
 * Vérifier si WhatsApp est configuré
 */
export function isWhatsAppConfigured(): boolean {
  return Boolean(PHONE_NUMBER_ID && ACCESS_TOKEN)
}

/**
 * Envoyer un message template (recommandé pour les messages transactionnels)
 * Les templates doivent être pré-approuvés par Meta
 */
export async function envoyerWhatsAppTemplate(
  telephone: string, 
  templateName: string,
  languageCode: string = "fr",
  components?: Array<{
    type: "body" | "header"
    parameters: Array<{ type: "text"; text: string }>
  }>
): Promise<MessageResult> {
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    return { success: false, error: "Configuration WhatsApp manquante" }
  }

  const phoneNumber = formatPhoneForWhatsApp(telephone)

  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: phoneNumber,
          type: "template",
          template: {
            name: templateName,
            language: { code: languageCode },
            components,
          },
        }),
      }
    )

    const data = await response.json() as WhatsAppMessageResponse | WhatsAppError

    if (!response.ok) {
      const error = data as WhatsAppError
      return { success: false, error: error.error?.message || "Erreur API WhatsApp" }
    }

    const result = data as WhatsAppMessageResponse
    return { success: true, messageId: result.messages[0]?.id || "" }
  } catch (error) {
    console.error("WhatsApp template error:", error)
    return { success: false, error: "Erreur d'envoi template WhatsApp" }
  }
}
