import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const configs = await prisma.appConfig.findMany({ orderBy: { cle: "asc" } })
  return NextResponse.json({
    configs: configs.map((c) => {
      let valeurParsed: unknown
      try { valeurParsed = JSON.parse(c.valeur) } catch { valeurParsed = c.valeur }
      return { id: c.id, cle: c.cle, valeur: c.valeur, valeurParsed }
    }),
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const body = await req.json()
  const { cle, valeur } = body

  if (!cle || typeof cle !== "string" || cle.trim().length === 0) {
    return NextResponse.json({ error: "Clé requise" }, { status: 400 })
  }

  if (valeur === undefined || valeur === null) {
    return NextResponse.json({ error: "Valeur requise" }, { status: 400 })
  }

  const valeurStr = typeof valeur === "string" ? valeur : JSON.stringify(valeur)

  const config = await prisma.appConfig.upsert({
    where: { cle: cle.trim() },
    update: { valeur: valeurStr },
    create: { cle: cle.trim(), valeur: valeurStr },
  })

  return NextResponse.json(config, { status: 201 })
}
