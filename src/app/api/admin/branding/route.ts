import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getBranding, updateBranding } from "@/app/actions/branding"
import { generateBrandingCSS, type BrandingData } from "@/lib/branding-utils"

// ─── GET /api/admin/branding ─────────────────────────────────────
// Récupère les paramètres de branding actuels

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const branding = await getBranding()
    return NextResponse.json(branding)
  } catch (error) {
    console.error("[API BRANDING GET]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// ─── PUT /api/admin/branding ─────────────────────────────────────
// Met à jour les paramètres de branding

export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const data = await request.json() as Partial<BrandingData>
    const result = await updateBranding(data)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API BRANDING PUT]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
