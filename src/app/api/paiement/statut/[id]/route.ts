import { NextResponse } from "next/server"
import { auth, verifyActiveJti } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { verifierStatutPaiement } from "@/lib/jeko"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  // Vérifier que la session n'a pas été révoquée (jti check)
  if (session.jti) {
    const active = await verifyActiveJti(session.jti)
    if (!active) {
      return NextResponse.json({ error: "Session révoquée. Reconnectez-vous." }, { status: 401 })
    }
  }

  const { id } = await params

  if (!id) {
    return NextResponse.json(
      { error: "ID de paiement requis." },
      { status: 400 }
    )
  }

  // Vérifier que ce paiementId appartient bien à l'utilisateur connecté
  const commande = await prisma.commande.findFirst({
    where: { paiementId: id, userId: session.user.id },
    select: { id: true },
  })

  if (!commande) {
    return NextResponse.json({ error: "Paiement introuvable." }, { status: 404 })
  }

  try {
    const statut = await verifierStatutPaiement(id)
    return NextResponse.json({ statut })
  } catch {
    return NextResponse.json(
      { error: "Impossible de vérifier le statut du paiement." },
      { status: 500 }
    )
  }
}
