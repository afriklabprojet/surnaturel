import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ cle: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { cle } = await params
  const body = await req.json()
  const { valeur } = body

  if (valeur === undefined || valeur === null) {
    return NextResponse.json({ error: "Valeur requise" }, { status: 400 })
  }

  const valeurStr = typeof valeur === "string" ? valeur : JSON.stringify(valeur)

  const config = await prisma.appConfig.update({
    where: { cle },
    data: { valeur: valeurStr },
  })

  return NextResponse.json(config)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ cle: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { cle } = await params
  await prisma.appConfig.delete({ where: { cle } })
  return NextResponse.json({ ok: true })
}
