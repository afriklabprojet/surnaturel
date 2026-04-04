import { SITE_URL } from "@/lib/site"

const JEKO_API_URL = "https://api.jeko.africa/partner_api"

const jekoHeaders = {
  "X-API-KEY": process.env.JEKO_API_KEY!,
  "X-API-KEY-ID": process.env.JEKO_API_KEY_ID!,
  "Content-Type": "application/json",
}

export type JekoPaymentMethod = "wave" | "orange" | "mtn" | "moov" | "djamo"

export type JekoPaymentStatus = "pending" | "success" | "error"

export const METHODES_PAIEMENT = [
  { id: "wave" as const, label: "Wave", logo: "/logos/wave.png" },
  { id: "orange" as const, label: "Orange Money", logo: "/logos/orange-money.png" },
  { id: "mtn" as const, label: "MTN MoMo", logo: "/logos/mtn.png" },
  { id: "moov" as const, label: "Moov Money", logo: "/logos/moov.png" },
  { id: "djamo" as const, label: "Djamo", logo: "/logos/djamo.png" },
] as const

export async function creerPaiement(params: {
  commandeId: string
  montantFCFA: number
  methodePaiement: JekoPaymentMethod
  storeId: string
  successUrl?: string
  errorUrl?: string
}): Promise<{ redirectUrl: string; paiementId: string }> {
  const reference = `CMD-${params.commandeId}-${Date.now()}`

  // URLs de retour : custom si fournies, sinon déterminées par le type de commandeId
  const isRDV = params.commandeId.startsWith("c") && !params.commandeId.includes("CMD")
  const resolvedSuccessUrl =
    params.successUrl ??
    (isRDV
      ? `${SITE_URL}/api/rdv/acompte/confirmer?reference=${encodeURIComponent(reference)}&rdv=${encodeURIComponent(params.commandeId)}`
      : `${SITE_URL}/commandes/succes?reference=${encodeURIComponent(reference)}&commande=${encodeURIComponent(params.commandeId)}`)
  const resolvedErrorUrl =
    params.errorUrl ??
    (isRDV
      ? `${SITE_URL}/mes-rdv?erreur=paiement&rdv=${encodeURIComponent(params.commandeId)}`
      : `${SITE_URL}/commandes/erreur?reference=${encodeURIComponent(reference)}&commande=${encodeURIComponent(params.commandeId)}`)

  const body = {
    storeId: params.storeId,
    amountCents: params.montantFCFA * 100,
    currency: "XOF",
    reference,
    paymentDetails: {
      type: "redirect",
      data: {
        paymentMethod: params.methodePaiement,
        successUrl: resolvedSuccessUrl,
        errorUrl: resolvedErrorUrl,
      },
    },
  }

  const res = await fetch(`${JEKO_API_URL}/payment_requests`, {
    method: "POST",
    headers: jekoHeaders,
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    throw new Error(`Jeko API error: ${res.status}`)
  }

  const data: { redirectUrl: string; id: string } = await res.json()
  return { redirectUrl: data.redirectUrl, paiementId: data.id }
}

export async function verifierStatutPaiement(
  paiementId: string
): Promise<JekoPaymentStatus> {
  const res = await fetch(
    `${JEKO_API_URL}/payment_requests/${encodeURIComponent(paiementId)}`,
    { headers: jekoHeaders }
  )

  if (!res.ok) {
    throw new Error(`Jeko API error: ${res.status}`)
  }

  const data: { status: JekoPaymentStatus } = await res.json()
  return data.status
}
