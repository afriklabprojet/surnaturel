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
}): Promise<{ redirectUrl: string; paiementId: string }> {
  const reference = `CMD-${params.commandeId}-${Date.now()}`

  const body = {
    storeId: params.storeId,
    amountCents: params.montantFCFA * 100,
    currency: "XOF",
    reference,
    paymentDetails: {
      type: "redirect",
      data: {
        paymentMethod: params.methodePaiement,
        successUrl: `${process.env.NEXTAUTH_URL}/commandes/succes?reference=${encodeURIComponent(reference)}&commande=${encodeURIComponent(params.commandeId)}`,
        errorUrl: `${process.env.NEXTAUTH_URL}/commandes/erreur?reference=${encodeURIComponent(reference)}&commande=${encodeURIComponent(params.commandeId)}`,
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
