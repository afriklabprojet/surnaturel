import { NextResponse } from "next/server"
import { verifierStatutPaiement } from "@/lib/jeko"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!id) {
    return NextResponse.json(
      { error: "ID de paiement requis." },
      { status: 400 }
    )
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
