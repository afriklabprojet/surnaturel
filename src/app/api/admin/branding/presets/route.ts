import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getBrandingPresets } from "@/app/actions/branding"

// ─── GET /api/admin/branding/presets ─────────────────────────────
// Récupère les presets de branding disponibles

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const presets = await getBrandingPresets()
    return NextResponse.json(presets)
  } catch (error) {
    console.error("[API BRANDING PRESETS]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
