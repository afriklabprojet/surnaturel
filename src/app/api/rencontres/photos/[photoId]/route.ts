import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// DELETE — Supprimer une photo
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { photoId } = await params

  const photo = await prisma.photoRencontre.findUnique({
    where: { id: photoId },
    select: { userId: true },
  })

  if (!photo) {
    return NextResponse.json({ error: "Photo introuvable" }, { status: 404 })
  }

  if (photo.userId !== session.user.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  await prisma.photoRencontre.delete({ where: { id: photoId } })

  // Recalculer l'ordre des photos restantes
  const remaining = await prisma.photoRencontre.findMany({
    where: { userId: session.user.id },
    orderBy: { ordre: "asc" },
    select: { id: true },
  })

  if (remaining.length > 0) {
    await prisma.$transaction(
      remaining.map((p, index) =>
        prisma.photoRencontre.update({
          where: { id: p.id },
          data: { ordre: index },
        })
      )
    )
  }

  return NextResponse.json({ success: true })
}
