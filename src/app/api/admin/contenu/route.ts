import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

// ─── AppConfig keys managed here ─────────────────────────────────

const CONTENT_KEYS = [
  "homepage_hero",
  "homepage_services",
  "homepage_chiffres",
  "homepage_temoignages",
  "homepage_videos",
  "homepage_cta",
  "bio_fondatrice",
  "valeurs",
  "bio_sage_femme",
  "mentions_legales",
  "politique_confidentialite",
] as const

// ─── Zod schema ───────────────────────────────────────────────────

const contentSchema = z.object({
  // Homepage — hero
  heroTag: z.string().max(100).optional(),
  heroTitre: z.string().max(300).optional(),
  heroSousTitre: z.string().max(1000).optional(),
  heroCta1: z.string().max(100).optional(),
  heroCta2: z.string().max(100).optional(),
  heroBadge: z.string().max(100).optional(),
  // Homepage — services section
  servicesTag: z.string().max(100).optional(),
  servicesTitre: z.string().max(200).optional(),
  servicesSousTitre: z.string().max(500).optional(),
  // Homepage — chiffres (stat labels + founding year)
  chiffresLabel1: z.string().max(100).optional(),
  chiffresLabel2: z.string().max(100).optional(),
  chiffresLabel3: z.string().max(100).optional(),
  chiffresAnneeDebut: z.string().max(4).optional(),
  // Homepage — témoignages section
  temoignagesTag: z.string().max(100).optional(),
  temoignagesTitre: z.string().max(200).optional(),
  // Homepage — vidéos témoignages section
  videosTag: z.string().max(100).optional(),
  videosTitre: z.string().max(200).optional(),
  videosSousTitre: z.string().max(500).optional(),
  // Homepage — CTA finale
  ctaTitre: z.string().max(300).optional(),
  ctaSousTitre: z.string().max(500).optional(),
  ctaBouton: z.string().max(100).optional(),
  // À propos — fondatrice
  fondatriceNom: z.string().max(100).optional(),
  fondatriceTag: z.string().max(100).optional(),
  fondatricePara1: z.string().max(2000).optional(),
  fondatricePara2: z.string().max(2000).optional(),
  fondatricePara3: z.string().max(2000).optional(),
  // À propos — valeurs (4 cartes)
  valeur1Icon: z.string().max(50).optional(),
  valeur1Titre: z.string().max(100).optional(),
  valeur1Description: z.string().max(500).optional(),
  valeur2Icon: z.string().max(50).optional(),
  valeur2Titre: z.string().max(100).optional(),
  valeur2Description: z.string().max(500).optional(),
  valeur3Icon: z.string().max(50).optional(),
  valeur3Titre: z.string().max(100).optional(),
  valeur3Description: z.string().max(500).optional(),
  valeur4Icon: z.string().max(50).optional(),
  valeur4Titre: z.string().max(100).optional(),
  valeur4Description: z.string().max(500).optional(),
  // Sage-femme — bio
  sageFemmeNom: z.string().max(100).optional(),
  sageFemmeTitre: z.string().max(200).optional(),
  sageFemmePara1: z.string().max(2000).optional(),
  sageFemmePara2: z.string().max(2000).optional(),
  // Pages légales
  mentionsLegales: z.array(z.object({ titre: z.string().max(200), contenu: z.string().max(5000) })).optional(),
  politiqueConfidentialite: z.array(z.object({ titre: z.string().max(200), contenu: z.string().max(5000) })).optional(),
})

// ─── GET ──────────────────────────────────────────────────────────

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const rows = await prisma.appConfig.findMany({
    where: { cle: { in: [...CONTENT_KEYS] } },
  })

  const byKey: Record<string, unknown> = {}
  for (const row of rows) {
    try { byKey[row.cle] = JSON.parse(row.valeur) } catch { byKey[row.cle] = {} }
  }

  const hero = (byKey.homepage_hero ?? {}) as Record<string, string>
  const services = (byKey.homepage_services ?? {}) as Record<string, string>
  const chiffres = (byKey.homepage_chiffres ?? {}) as Record<string, string>
  const temoignages = (byKey.homepage_temoignages ?? {}) as Record<string, string>
  const videos = (byKey.homepage_videos ?? {}) as Record<string, string>
  const cta = (byKey.homepage_cta ?? {}) as Record<string, string>
  const fondatrice = (byKey.bio_fondatrice ?? {}) as Record<string, unknown>
  const paras = Array.isArray(fondatrice.paragraphes) ? (fondatrice.paragraphes as string[]) : []
  const valeurs = Array.isArray(byKey.valeurs) ? (byKey.valeurs as Array<Record<string, string>>) : []
  const sageFemmeBio = (byKey.bio_sage_femme ?? {}) as Record<string, unknown>
  const sageFemmeParas = Array.isArray(sageFemmeBio.paragraphes) ? (sageFemmeBio.paragraphes as string[]) : []

  return NextResponse.json({
    heroTag: hero.tag ?? "",
    heroTitre: hero.titre ?? "",
    heroSousTitre: hero.sousTitre ?? "",
    heroCta1: hero.cta1 ?? "",
    heroCta2: hero.cta2 ?? "",
    heroBadge: hero.badge ?? "",
    servicesTag: services.tag ?? "",
    servicesTitre: services.titre ?? "",
    servicesSousTitre: services.sousTitre ?? "",
    chiffresLabel1: chiffres.label1 ?? "",
    chiffresLabel2: chiffres.label2 ?? "",
    chiffresLabel3: chiffres.label3 ?? "",
    chiffresAnneeDebut: chiffres.anneeDebut ?? "2015",
    temoignagesTag: temoignages.tag ?? "",
    temoignagesTitre: temoignages.titre ?? "",
    videosTag: videos.tag ?? "",
    videosTitre: videos.titre ?? "",
    videosSousTitre: videos.sousTitre ?? "",
    ctaTitre: cta.titre ?? "",
    ctaSousTitre: cta.sousTitre ?? "",
    ctaBouton: cta.bouton ?? "",
    fondatriceNom: (fondatrice.nom as string) ?? "",
    fondatriceTag: (fondatrice.tag as string) ?? "",
    fondatricePara1: paras[0] ?? "",
    fondatricePara2: paras[1] ?? "",
    fondatricePara3: paras[2] ?? "",
    valeur1Icon: valeurs[0]?.icon ?? "Heart",
    valeur1Titre: valeurs[0]?.titre ?? "",
    valeur1Description: valeurs[0]?.description ?? "",
    valeur2Icon: valeurs[1]?.icon ?? "Shield",
    valeur2Titre: valeurs[1]?.titre ?? "",
    valeur2Description: valeurs[1]?.description ?? "",
    valeur3Icon: valeurs[2]?.icon ?? "Award",
    valeur3Titre: valeurs[2]?.titre ?? "",
    valeur3Description: valeurs[2]?.description ?? "",
    valeur4Icon: valeurs[3]?.icon ?? "Leaf",
    valeur4Titre: valeurs[3]?.titre ?? "",
    valeur4Description: valeurs[3]?.description ?? "",
    sageFemmeNom: (sageFemmeBio.nom as string) ?? "",
    sageFemmeTitre: (sageFemmeBio.titre as string) ?? "",
    sageFemmePara1: sageFemmeParas[0] ?? "",
    sageFemmePara2: sageFemmeParas[1] ?? "",
    mentionsLegales: Array.isArray(byKey.mentions_legales) ? byKey.mentions_legales : [],
    politiqueConfidentialite: Array.isArray(byKey.politique_confidentialite) ? byKey.politique_confidentialite : [],
  })
}

// ─── PUT ──────────────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const body = await req.json()
  const result = z.safeParse(contentSchema, body)
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  const d = result.data

  // Helper to upsert a single key
  async function upsert(cle: string, val: unknown) {
    await prisma.appConfig.upsert({
      where: { cle },
      create: { cle, valeur: JSON.stringify(val) },
      update: { valeur: JSON.stringify(val) },
    })
  }

  // Fetch existing values to merge
  const rows = await prisma.appConfig.findMany({
    where: { cle: { in: [...CONTENT_KEYS] } },
  })
  const existing: Record<string, Record<string, string>> = {}
  for (const row of rows) {
    try { existing[row.cle] = JSON.parse(row.valeur) } catch { existing[row.cle] = {} }
  }

  function merge(key: string, updates: Record<string, string | undefined>) {
    const base = existing[key] ?? {}
    const cleaned: Record<string, string> = {}
    for (const [k, v] of Object.entries(updates)) {
      if (v !== undefined) cleaned[k] = v
    }
    return { ...base, ...cleaned }
  }

  await Promise.all([
    upsert("homepage_hero", merge("homepage_hero", {
      tag: d.heroTag,
      titre: d.heroTitre,
      sousTitre: d.heroSousTitre,
      cta1: d.heroCta1,
      cta2: d.heroCta2,
      badge: d.heroBadge,
    })),
    upsert("homepage_services", merge("homepage_services", {
      tag: d.servicesTag,
      titre: d.servicesTitre,
      sousTitre: d.servicesSousTitre,
    })),
    upsert("homepage_chiffres", merge("homepage_chiffres", {
      label1: d.chiffresLabel1,
      label2: d.chiffresLabel2,
      label3: d.chiffresLabel3,
      anneeDebut: d.chiffresAnneeDebut,
    })),
    upsert("homepage_temoignages", merge("homepage_temoignages", {
      tag: d.temoignagesTag,
      titre: d.temoignagesTitre,
    })),
    upsert("homepage_videos", merge("homepage_videos", {
      tag: d.videosTag,
      titre: d.videosTitre,
      sousTitre: d.videosSousTitre,
    })),
    upsert("homepage_cta", merge("homepage_cta", {
      titre: d.ctaTitre,
      sousTitre: d.ctaSousTitre,
      bouton: d.ctaBouton,
    })),
    upsert("bio_fondatrice", {
      ...(existing.bio_fondatrice ?? {}),
      ...(d.fondatriceNom !== undefined ? { nom: d.fondatriceNom } : {}),
      ...(d.fondatriceTag !== undefined ? { tag: d.fondatriceTag } : {}),
      paragraphes: [
        d.fondatricePara1 ?? (existing.bio_fondatrice?.paragraphes as unknown as string[])?.[0] ?? "",
        d.fondatricePara2 ?? (existing.bio_fondatrice?.paragraphes as unknown as string[])?.[1] ?? "",
        d.fondatricePara3 ?? (existing.bio_fondatrice?.paragraphes as unknown as string[])?.[2] ?? "",
      ].filter(Boolean),
    }),
    upsert("valeurs", [
      { icon: d.valeur1Icon ?? "Heart", titre: d.valeur1Titre ?? "", description: d.valeur1Description ?? "" },
      { icon: d.valeur2Icon ?? "Shield", titre: d.valeur2Titre ?? "", description: d.valeur2Description ?? "" },
      { icon: d.valeur3Icon ?? "Award", titre: d.valeur3Titre ?? "", description: d.valeur3Description ?? "" },
      { icon: d.valeur4Icon ?? "Leaf", titre: d.valeur4Titre ?? "", description: d.valeur4Description ?? "" },
    ]),
    upsert("bio_sage_femme", {
      ...(existing["bio_sage_femme"] ?? {}),
      ...(d.sageFemmeNom !== undefined ? { nom: d.sageFemmeNom } : {}),
      ...(d.sageFemmeTitre !== undefined ? { titre: d.sageFemmeTitre } : {}),
      paragraphes: [
        d.sageFemmePara1 ?? (existing["bio_sage_femme"]?.paragraphes as unknown as string[])?.[0] ?? "",
        d.sageFemmePara2 ?? (existing["bio_sage_femme"]?.paragraphes as unknown as string[])?.[1] ?? "",
      ].filter(Boolean),
    }),
    ...(d.mentionsLegales ? [upsert("mentions_legales", d.mentionsLegales)] : []),
    ...(d.politiqueConfidentialite ? [upsert("politique_confidentialite", d.politiqueConfidentialite)] : []),
  ])

  return NextResponse.json({ ok: true })
}
