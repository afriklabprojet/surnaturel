import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

// ─── Types ───────────────────────────────────────────────────────

export interface ZoneLivraison {
  id: string
  nom: string
  description: string
  frais: number
  delai: string
  actif: boolean
}

export interface ConfigLivraison {
  zones: ZoneLivraison[]
  seuilGratuit: number | null // Montant min pour livraison gratuite (null = jamais)
  messageGratuit: string
  zoneDefautId: string
}

const CONFIG_KEY = "livraison"

// Config par défaut
const DEFAULT_CONFIG: ConfigLivraison = {
  zones: [
    {
      id: "abidjan",
      nom: "Abidjan",
      description: "Livraison dans Abidjan et communes (Cocody, Plateau, Marcory...)",
      frais: 0,
      delai: "24-48h",
      actif: true,
    },
    {
      id: "banlieue",
      nom: "Banlieue d'Abidjan",
      description: "Anyama, Bingerville, Grand-Bassam, Dabou...",
      frais: 1500,
      delai: "48-72h",
      actif: true,
    },
    {
      id: "interieur",
      nom: "Intérieur du pays",
      description: "Bouaké, Yamoussoukro, San-Pédro, Korhogo...",
      frais: 3000,
      delai: "3-5 jours",
      actif: true,
    },
  ],
  seuilGratuit: 50000, // Livraison gratuite à partir de 50 000 F CFA
  messageGratuit: "Livraison gratuite à partir de 50 000 F CFA",
  zoneDefautId: "abidjan",
}

// ─── GET — Récupérer la config de livraison ──────────────────────

export async function GET() {
  try {
    const config = await prisma.appConfig.findUnique({
      where: { cle: CONFIG_KEY },
    })

    if (!config) {
      return NextResponse.json(DEFAULT_CONFIG)
    }

    const parsed = JSON.parse(config.valeur) as ConfigLivraison
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json(DEFAULT_CONFIG)
  }
}

// ─── PUT — Mettre à jour la config (admin uniquement) ────────────

const zoneSchema = z.object({
  id: z.string().min(1),
  nom: z.string().min(1),
  description: z.string(),
  frais: z.number().min(0),
  delai: z.string().min(1),
  actif: z.boolean(),
})

const configSchema = z.object({
  zones: z.array(zoneSchema).min(1),
  seuilGratuit: z.number().nullable(),
  messageGratuit: z.string(),
  zoneDefautId: z.string(),
})

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = configSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: z.flattenError(parsed.error) },
        { status: 400 }
      )
    }

    // Vérifier que la zone par défaut existe
    const zoneDefautExiste = parsed.data.zones.some(
      (z) => z.id === parsed.data.zoneDefautId && z.actif
    )
    if (!zoneDefautExiste) {
      return NextResponse.json(
        { error: "La zone par défaut doit être une zone active" },
        { status: 400 }
      )
    }

    // Upsert la config
    await prisma.appConfig.upsert({
      where: { cle: CONFIG_KEY },
      create: {
        cle: CONFIG_KEY,
        valeur: JSON.stringify(parsed.data),
      },
      update: {
        valeur: JSON.stringify(parsed.data),
      },
    })

    return NextResponse.json({ success: true, config: parsed.data })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// ─── POST — Calculer les frais pour une commande ─────────────────

const calculSchema = z.object({
  zoneId: z.string(),
  montantCommande: z.number().min(0),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = calculSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 })
    }

    // Récupérer la config
    const config = await prisma.appConfig.findUnique({
      where: { cle: CONFIG_KEY },
    })

    const livraisonConfig: ConfigLivraison = config
      ? JSON.parse(config.valeur)
      : DEFAULT_CONFIG

    // Trouver la zone
    const zone = livraisonConfig.zones.find(
      (z) => z.id === parsed.data.zoneId && z.actif
    )

    if (!zone) {
      // Fallback à la zone par défaut
      const zoneDefaut = livraisonConfig.zones.find(
        (z) => z.id === livraisonConfig.zoneDefautId
      )
      if (!zoneDefaut) {
        return NextResponse.json({ frais: 0, gratuit: true, zone: null })
      }
      return NextResponse.json({
        frais: zoneDefaut.frais,
        gratuit: false,
        zone: zoneDefaut,
      })
    }

    // Vérifier si livraison gratuite applicable
    const gratuit =
      livraisonConfig.seuilGratuit !== null &&
      parsed.data.montantCommande >= livraisonConfig.seuilGratuit

    return NextResponse.json({
      frais: gratuit ? 0 : zone.frais,
      gratuit,
      zone,
      seuilGratuit: livraisonConfig.seuilGratuit,
      messageGratuit: livraisonConfig.messageGratuit,
    })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
