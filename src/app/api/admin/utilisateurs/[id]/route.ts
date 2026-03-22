import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { id } = await params

  // Prevent self-deletion
  if (id === session.user.id) {
    return NextResponse.json({ error: "Impossible de supprimer votre propre compte" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
  }

  if (user.role === "CLIENT") {
    return NextResponse.json({ error: "Impossible de supprimer un client ici" }, { status: 400 })
  }

  await prisma.user.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
