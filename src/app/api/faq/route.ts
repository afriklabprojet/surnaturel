import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/faq?categorie=soins — Liste publique des FAQ
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categorie = searchParams.get("categorie")

    const where: Record<string, unknown> = {}
    if (categorie) where.categorie = categorie

    const faqs = await prisma.faq.findMany({
      where,
      orderBy: { ordre: "asc" },
      select: { id: true, question: true, reponse: true, categorie: true },
    })

    return NextResponse.json({ faqs })
  } catch (error) {
    console.error("Erreur GET /api/faq:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
