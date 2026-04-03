import { NextResponse } from "next/server"
import { z } from "zod/v4"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const STORAGE_KEY = "panier"

const cartItemSchema = z.object({
  id: z.string(),
  nom: z.string(),
  prix: z.number(),
  quantite: z.number().min(1),
  imageUrl: z.string(),
  stock: z.number(),
})

const cartSchema = z.array(cartItemSchema)

// GET /api/panier — Récupérer le panier serveur
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ items: [] })
  }

  const config = await prisma.appConfig.findUnique({
    where: { cle: `${STORAGE_KEY}_${session.user.id}` },
  })

  if (!config) {
    return NextResponse.json({ items: [], updatedAt: null })
  }

  try {
    const raw = JSON.parse(config.valeur)
    // Support ancien format (tableau) et nouveau format (objet avec updatedAt)
    const items = Array.isArray(raw) ? raw : (raw.items ?? [])
    const updatedAt = Array.isArray(raw) ? null : (raw.updatedAt ?? null)
    return NextResponse.json({ items, updatedAt })
  } catch {
    return NextResponse.json({ items: [], updatedAt: null })
  }
}

// POST /api/panier — Sauvegarder le panier
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Les informations envoyées sont incorrectes. Veuillez réessayer." }, { status: 400 })
  }

  const result = cartSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: "Le format des informations est incorrect. Veuillez réessayer." }, { status: 400 })
  }

  const payload = JSON.stringify({
    items: result.data,
    updatedAt: new Date().toISOString(),
  })

  await prisma.appConfig.upsert({
    where: { cle: `${STORAGE_KEY}_${session.user.id}` },
    update: { valeur: payload },
    create: {
      cle: `${STORAGE_KEY}_${session.user.id}`,
      valeur: payload,
    },
  })

  return NextResponse.json({ success: true })
}

// DELETE /api/panier — Vider le panier
export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  await prisma.appConfig.deleteMany({
    where: { cle: `${STORAGE_KEY}_${session.user.id}` },
  })

  return NextResponse.json({ success: true })
}
