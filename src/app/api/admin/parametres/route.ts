import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

const settingsSchema = z.object({
  nomCentre: z.string().max(200).optional(),
  adresse: z.string().max(500).optional(),
  telephone: z.string().max(30).optional(),
  whatsappNumber: z.string().max(20).optional(),
  whatsappDisplay: z.string().max(30).optional(),
  whatsappMessage: z.string().max(500).optional(),
  email: z.email().optional(),
  emailRdv: z.email().optional(),
  horaires: z.string().max(1000).optional(),
  facebook: z.string().max(300).optional(),
  instagram: z.string().max(300).optional(),
  googlePlaceId: z.string().max(200).optional(),
  fondatrice: z.string().max(100).optional(),
  // Créneaux RDV
  creneauxMatin: z.array(z.number().min(6).max(12)).optional(),
  creneauxApresMidi: z.array(z.number().min(13).max(20)).optional(),
  // Sage-femme bio
  sageFemmeNom: z.string().max(100).optional(),
  sageFemmeTitre: z.string().max(200).optional(),
  sageFemmeExperience: z.string().max(50).optional(),
  sageFemmePara1: z.string().max(1000).optional(),
  sageFemmePara2: z.string().max(1000).optional(),
  sageFemmePara3: z.string().max(1000).optional(),
})

/** Mapping champ form → clé AppConfig */
const FIELD_TO_KEY: Record<string, string> = {
  nomCentre: "nom_centre",
  adresse: "adresse_institut",
  telephone: "telephone_contact",
  whatsappNumber: "whatsapp_number",
  whatsappDisplay: "whatsapp_contact",
  whatsappMessage: "whatsapp_message",
  email: "email_contact",
  emailRdv: "email_rdv",
  horaires: "horaires",
  facebook: "facebook_url",
  instagram: "instagram_url",
  googlePlaceId: "google_place_id",
  fondatrice: "fondatrice",
  creneauxMatin: "booking_creneaux_matin",
  creneauxApresMidi: "booking_creneaux_apres_midi",
}

const KEY_TO_FIELD = Object.fromEntries(
  Object.entries(FIELD_TO_KEY).map(([f, k]) => [k, f])
)

const BIO_SF_KEY = "bio_sage_femme"

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const rows = await prisma.appConfig.findMany({
    where: { cle: { in: [...Object.values(FIELD_TO_KEY), BIO_SF_KEY] } },
  })

  const result: Record<string, unknown> = {}
  for (const row of rows) {
    if (row.cle === BIO_SF_KEY) {
      try {
        const bio = JSON.parse(row.valeur)
        result.sageFemmeNom = bio.nom ?? ""
        result.sageFemmeTitre = bio.titre ?? ""
        result.sageFemmeExperience = bio.experience ?? ""
        result.sageFemmePara1 = bio.paragraphes?.[0] ?? ""
        result.sageFemmePara2 = bio.paragraphes?.[1] ?? ""
        result.sageFemmePara3 = bio.paragraphes?.[2] ?? ""
      } catch { /* ignore */ }
      continue
    }
    const field = KEY_TO_FIELD[row.cle]
    if (field) {
      try { result[field] = JSON.parse(row.valeur) } catch { result[field] = row.valeur }
    }
  }

  return NextResponse.json(result)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const body = await req.json()
  const result = z.safeParse(settingsSchema, body)
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  // Neutralise "</script>" dans les chaînes pour prévenir XSS dans les balises JSON-LD
  const sanitizeForJsonLd = (v: unknown): unknown => {
    if (typeof v === "string") return v.replace(/<\/script>/gi, "<\\/script>")
    if (Array.isArray(v)) return v.map(sanitizeForJsonLd)
    return v
  }

  const data = result.data
  const upserts = Object.entries(data)
    .filter(([, v]) => v !== undefined)
    .filter(([field]) => !field.startsWith("sageFemme"))
    .map(([field, value]) => {
      const cle = FIELD_TO_KEY[field]
      if (!cle) return null
      return prisma.appConfig.upsert({
        where: { cle },
        create: { cle, valeur: JSON.stringify(sanitizeForJsonLd(value)) },
        update: { valeur: JSON.stringify(sanitizeForJsonLd(value)) },
      })
    })
    .filter(Boolean)

  // Handle bio_sage_femme as a JSON object
  const hasBio = data.sageFemmeNom !== undefined || data.sageFemmeTitre !== undefined ||
    data.sageFemmeExperience !== undefined || data.sageFemmePara1 !== undefined ||
    data.sageFemmePara2 !== undefined || data.sageFemmePara3 !== undefined

  if (hasBio) {
    const existing = await prisma.appConfig.findUnique({ where: { cle: BIO_SF_KEY } })
    let current: Record<string, unknown> = {}
    if (existing) {
      try { current = JSON.parse(existing.valeur) } catch { /* ignore */ }
    }
    const paragraphes = [
      data.sageFemmePara1 ?? (current.paragraphes as string[])?.[0] ?? "",
      data.sageFemmePara2 ?? (current.paragraphes as string[])?.[1] ?? "",
      data.sageFemmePara3 ?? (current.paragraphes as string[])?.[2] ?? "",
    ].filter(Boolean)
    const bio = {
      nom: data.sageFemmeNom ?? current.nom ?? "",
      titre: data.sageFemmeTitre ?? current.titre ?? "",
      experience: data.sageFemmeExperience ?? current.experience ?? "",
      paragraphes,
    }
    upserts.push(
      prisma.appConfig.upsert({
        where: { cle: BIO_SF_KEY },
        create: { cle: BIO_SF_KEY, valeur: JSON.stringify(bio) },
        update: { valeur: JSON.stringify(bio) },
      })
    )
  }

  await Promise.all(upserts)

  return NextResponse.json({ success: true })
}

