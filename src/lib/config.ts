/**
 * Lecture de la configuration dynamique depuis la table AppConfig.
 * Toutes les valeurs métier (téléphone, adresse, réseaux sociaux…)
 * sont stockées en base et gérées depuis l'admin > Paramètres.
 */
import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"
import {
  SITE_NAME,
  BUSINESS_FOUNDING_YEAR,
  BUSINESS_FOUNDER,
  BUSINESS_PHONE_DISPLAY,
  BUSINESS_PHONE_TEL,
  BUSINESS_WHATSAPP_NUMBER,
  BUSINESS_WHATSAPP_DISPLAY,
  BUSINESS_WHATSAPP_MESSAGE,
  BUSINESS_EMAIL,
  BUSINESS_EMAIL_RDV,
  BUSINESS_ADDRESS,
  BUSINESS_CITY,
  BUSINESS_COUNTRY,
  BUSINESS_ADDRESS_FULL,
  BUSINESS_LATITUDE,
  BUSINESS_LONGITUDE,
  SOCIAL_FACEBOOK,
  SOCIAL_INSTAGRAM,
  TIMEZONE,
} from "@/lib/site"

export interface SiteConfig {
  nomCentre: string
  fondatrice: string
  anneeFondation: number
  adresse: string
  ville: string
  pays: string
  adresseFull: string
  latitude: number
  longitude: number
  telephone: string
  telephoneTel: string
  whatsappNumber: string
  whatsappDisplay: string
  whatsappMessage: string
  email: string
  emailRdv: string
  horaires: string
  facebook: string
  instagram: string
  googlePlaceId: string
  timezone: string
}

/** Valeurs de secours — utilisées si la DB n'a pas encore été configurée */
const DEFAULTS: SiteConfig = {
  nomCentre: SITE_NAME,
  fondatrice: BUSINESS_FOUNDER,
  anneeFondation: BUSINESS_FOUNDING_YEAR,
  adresse: BUSINESS_ADDRESS,
  ville: BUSINESS_CITY,
  pays: BUSINESS_COUNTRY,
  adresseFull: BUSINESS_ADDRESS_FULL,
  latitude: BUSINESS_LATITUDE,
  longitude: BUSINESS_LONGITUDE,
  telephone: BUSINESS_PHONE_DISPLAY,
  telephoneTel: BUSINESS_PHONE_TEL,
  whatsappNumber: BUSINESS_WHATSAPP_NUMBER,
  whatsappDisplay: BUSINESS_WHATSAPP_DISPLAY,
  whatsappMessage: BUSINESS_WHATSAPP_MESSAGE,
  email: BUSINESS_EMAIL,
  emailRdv: BUSINESS_EMAIL_RDV,
  horaires: "Lun — Ven : 08h00 — 18h00\nSam : 09h00 — 16h00\nDim : Fermé",
  facebook: SOCIAL_FACEBOOK,
  instagram: SOCIAL_INSTAGRAM,
  googlePlaceId: "",
  timezone: TIMEZONE,
}

/** Clé AppConfig → champ SiteConfig */
const KEY_MAP: Record<string, keyof SiteConfig> = {
  nom_centre: "nomCentre",
  fondatrice: "fondatrice",
  annee_fondation: "anneeFondation",
  adresse_institut: "adresse",
  ville_institut: "ville",
  pays_institut: "pays",
  telephone_contact: "telephone",
  whatsapp_contact: "whatsappDisplay",
  whatsapp_number: "whatsappNumber",
  whatsapp_message: "whatsappMessage",
  email_contact: "email",
  email_rdv: "emailRdv",
  horaires: "horaires",
  facebook_url: "facebook",
  instagram_url: "instagram",
  google_place_id: "googlePlaceId",
}

/**
 * Lit toute la configuration depuis AppConfig.
 * Mis en cache par React (une seule requête par request cycle).
 */
export const getConfig = unstable_cache(
  async (): Promise<SiteConfig> => {
  try {
    const rows = await prisma.appConfig.findMany({
      where: { cle: { in: Object.keys(KEY_MAP) } },
    })

    const config = { ...DEFAULTS }

    for (const row of rows) {
      const field = KEY_MAP[row.cle]
      if (!field) continue
      try {
        const value = JSON.parse(row.valeur)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(config as any)[field] = value
      } catch {
        // valeur corrompue — on garde le défaut
      }
    }

    // Reconstruire les champs dérivés
    config.adresseFull = `${config.adresse} — ${config.ville}, ${config.pays}`
    config.telephoneTel = config.telephone.replace(/\s+/g, "").replace(/^\+/, "+")
    // Si tableau stocké, extraire la valeur affichée pour whatsappDisplay
    // whatsappNumber (pour wa.me) est stocké séparément sous whatsapp_number

    return config
  } catch {
    return DEFAULTS
  }
  },
  ["site-config"],
  { revalidate: 600 } // 10 min
)
