import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getPusherServeur, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher"
import { z } from "zod/v4"

const ecritureSchema = z.object({
  destinataireId: z.string().min(1),
  actif: z.boolean(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Les informations envoyées sont incorrectes. Veuillez réessayer." }, { status: 400 })
  }

  const result = ecritureSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: "Données invalides", details: z.prettifyError(result.error) },
      { status: 400 }
    )
  }

  const { destinataireId, actif } = result.data

  const channelName = PUSHER_CHANNELS.conversation(session.user.id, destinataireId)
  await getPusherServeur().trigger(channelName, PUSHER_EVENTS.ECRITURE_EN_COURS, {
    userId: session.user.id,
    actif,
  })

  return NextResponse.json({ success: true })
}
