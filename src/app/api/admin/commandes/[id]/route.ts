import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

const patchSchema = z.object({
  statut: z.enum([
    "EN_ATTENTE", "PAYEE", "EN_PREPARATION", "EXPEDIEE", "LIVREE", "ANNULEE",
  ]),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const result = z.safeParse(patchSchema, body)

  if (!result.success) {
    return NextResponse.json({ error: z.prettifyError(result.error) }, { status: 400 })
  }

  const commande = await prisma.commande.update({
    where: { id },
    data: { statut: result.data.statut },
  })

  return NextResponse.json({ id: commande.id, statut: commande.statut })
}
