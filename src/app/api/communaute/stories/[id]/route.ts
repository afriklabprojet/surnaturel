import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface Params { params: Promise<{ id: string }> }

// DELETE — Supprimer une story (auteur uniquement)
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id } = await params

  const story = await prisma.story.findUnique({ where: { id } })
  if (!story) {
    return NextResponse.json({ error: "Story non trouvée" }, { status: 404 })
  }
  if (story.auteurId !== session.user.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  await prisma.story.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
