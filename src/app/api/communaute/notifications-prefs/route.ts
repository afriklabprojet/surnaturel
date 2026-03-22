import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

const prefsSchema = z.object({
  notifLikes: z.boolean().optional(),
  notifCommentaires: z.boolean().optional(),
  notifConnexions: z.boolean().optional(),
  notifMessages: z.boolean().optional(),
  notifEvenements: z.boolean().optional(),
  notifGroupes: z.boolean().optional(),
})

// GET — Récupérer les préférences de notification
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      notifLikes: true,
      notifCommentaires: true,
      notifConnexions: true,
      notifMessages: true,
      notifEvenements: true,
      notifGroupes: true,
    },
  })

  return NextResponse.json(user)
}

// PATCH — Mettre à jour les préférences
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await req.json()
  const result = prefsSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: result.data,
    select: {
      notifLikes: true,
      notifCommentaires: true,
      notifConnexions: true,
      notifMessages: true,
      notifEvenements: true,
      notifGroupes: true,
    },
  })

  return NextResponse.json(user)
}
