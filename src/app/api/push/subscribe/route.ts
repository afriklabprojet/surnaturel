import { typedLogger as logger } from "@/lib/logger"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  userAgent: z.string().optional(),
})

// POST /api/push/subscribe — Enregistrer une subscription push
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

  const result = subscriptionSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: z.flattenError(result.error) }, { status: 400 })
  }

  const { endpoint, keys, userAgent } = result.data

  try {
    // Upsert pour éviter les doublons
    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: {
        userId: session.user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: userAgent || null,
      },
      update: {
        userId: session.user.id,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: userAgent || null,
      },
    })

    return NextResponse.json({ ok: true, id: subscription.id }, { status: 201 })
  } catch (error) {
    logger.error("[PUSH] Erreur enregistrement subscription:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement" },
      { status: 500 }
    )
  }
}

// DELETE /api/push/subscribe — Supprimer une subscription push
export async function DELETE(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  let body: { endpoint?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Les informations envoyées sont incorrectes. Veuillez réessayer." }, { status: 400 })
  }

  if (!body.endpoint) {
    return NextResponse.json({ error: "Endpoint requis" }, { status: 400 })
  }

  try {
    await prisma.pushSubscription.deleteMany({
      where: {
        userId: session.user.id,
        endpoint: body.endpoint,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    logger.error("[PUSH] Erreur suppression subscription:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    )
  }
}

// GET /api/push/subscribe — Vérifier si l'utilisateur a des subscriptions
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: session.user.id },
    select: { id: true, endpoint: true, userAgent: true, createdAt: true },
  })

  return NextResponse.json({ subscriptions })
}
