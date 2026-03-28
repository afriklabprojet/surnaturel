import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

const codePromoSchema = z.object({
  code: z.string().min(2).max(30).transform(s => s.toUpperCase()),
  description: z.string().max(200).nullable().optional(),
  type: z.enum(["POURCENTAGE", "MONTANT_FIXE"]).optional(),
  valeur: z.number().min(1).optional(),
  pourcentage: z.number().int().min(1).max(100).optional(), // Compatibilité
  montantMin: z.number().min(0).nullable().optional(),
  montantMax: z.number().min(0).nullable().optional(),
  usageMax: z.number().int().min(1).nullable().optional(),
  usageParUser: z.number().int().min(1).optional(),
  debutValidite: z.string().datetime().nullable().optional(),
  finValidite: z.string().datetime().nullable().optional(),
  premiereCommande: z.boolean().optional(),
  nouveauxClients: z.boolean().optional(),
  categoriesProduits: z.array(z.string()).optional(),
  produitsExclus: z.array(z.string()).optional(),
  cumulable: z.boolean().optional(),
  actif: z.boolean().optional(),
})

// GET /api/admin/promo — Lister tous les codes promo avec stats
export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const codesPromo = await prisma.codePromo.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { utilisations: true },
      },
    },
  })

  // Stats globales
  const stats = {
    total: codesPromo.length,
    actifs: codesPromo.filter(c => c.actif).length,
    totalUtilisations: codesPromo.reduce((acc, c) => acc + c.usageActuel, 0),
  }

  return NextResponse.json({ codesPromo, stats })
}

// POST /api/admin/promo — Créer un nouveau code promo
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 })
  }

  const result = codePromoSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }

  // Vérifier que le code n'existe pas déjà
  const existe = await prisma.codePromo.findUnique({
    where: { code: result.data.code },
  })
  if (existe) {
    return NextResponse.json(
      { error: "Ce code promo existe déjà" },
      { status: 409 }
    )
  }

  // Déterminer la valeur
  const valeur = result.data.valeur ?? result.data.pourcentage ?? 10
  const type = result.data.type ?? "POURCENTAGE"

  const codePromo = await prisma.codePromo.create({
    data: {
      code: result.data.code,
      description: result.data.description ?? null,
      type,
      valeur,
      pourcentage: type === "POURCENTAGE" ? valeur : null,
      montantMin: result.data.montantMin ?? null,
      montantMax: result.data.montantMax ?? null,
      usageMax: result.data.usageMax ?? null,
      usageParUser: result.data.usageParUser ?? 1,
      debutValidite: result.data.debutValidite
        ? new Date(result.data.debutValidite)
        : null,
      finValidite: result.data.finValidite
        ? new Date(result.data.finValidite)
        : null,
      premiereCommande: result.data.premiereCommande ?? false,
      nouveauxClients: result.data.nouveauxClients ?? false,
      categoriesProduits: result.data.categoriesProduits ?? [],
      produitsExclus: result.data.produitsExclus ?? [],
      cumulable: result.data.cumulable ?? false,
      actif: result.data.actif ?? true,
    },
  })

  return NextResponse.json({ codePromo }, { status: 201 })
}
