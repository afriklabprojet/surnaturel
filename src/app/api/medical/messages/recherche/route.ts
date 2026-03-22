import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const ALLOWED_ROLES = ["CLIENT", "ACCOMPAGNATEUR_MEDICAL"] as const

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  if (!(ALLOWED_ROLES as readonly string[]).includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const url = new URL(req.url)
  const q = url.searchParams.get("q")?.trim() ?? ""

  if (q.length < 2) {
    return NextResponse.json({ utilisateurs: [] })
  }

  // CLIENT → cherche les ACCOMPAGNATEUR_MEDICAL
  // ACCOMPAGNATEUR_MEDICAL → cherche les CLIENTs
  const targetRole = session.user.role === "CLIENT" ? "ACCOMPAGNATEUR_MEDICAL" : "CLIENT"

  const utilisateurs = await prisma.user.findMany({
    where: {
      id: { not: session.user.id },
      role: targetRole,
      OR: [
        { nom: { contains: q, mode: "insensitive" } },
        { prenom: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      nom: true,
      prenom: true,
      photoUrl: true,
      role: true,
    },
    take: 10,
  })

  return NextResponse.json({ utilisateurs })
}
