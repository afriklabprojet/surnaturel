import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/config/valeurs — Récupère une configuration par clé
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ cle: string }> }
) {
  try {
    const { cle } = await params
    const config = await prisma.appConfig.findUnique({ where: { cle } })

    if (!config) {
      return NextResponse.json({ error: "Configuration non trouvée" }, { status: 404 })
    }

    return NextResponse.json({ cle: config.cle, valeur: JSON.parse(config.valeur) })
  } catch (error) {
    console.error("Erreur GET /api/config:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
