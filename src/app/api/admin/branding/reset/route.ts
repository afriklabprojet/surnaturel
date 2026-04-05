import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { resetBranding, getBranding } from "@/app/actions/branding"

// ─── POST /api/admin/branding/reset ──────────────────────────────
// Réinitialise le branding aux valeurs par défaut

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const result = await resetBranding()
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Retourner les nouvelles valeurs
    const branding = await getBranding()
    return NextResponse.json(branding)
  } catch (error) {
    console.error("[API BRANDING RESET]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
