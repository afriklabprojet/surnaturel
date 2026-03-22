import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const url = new URL(req.url)
  const q = url.searchParams.get("q")?.trim() ?? ""

  if (q.length < 2) {
    return NextResponse.json({ utilisateurs: [] })
  }

  const utilisateurs = await prisma.user.findMany({
    where: {
      id: { not: session.user.id },
      // Exclure les rôles médicaux — les contacter uniquement via la messagerie médicale
      role: { notIn: ["ACCOMPAGNATEUR_MEDICAL", "SAGE_FEMME", "ADMIN"] },
      OR: [
        { nom: { contains: q, mode: "insensitive" } },
        { prenom: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      nom: true,
      prenom: true,
      photoUrl: true,
    },
    take: 10,
  })

  return NextResponse.json({ utilisateurs })
}
