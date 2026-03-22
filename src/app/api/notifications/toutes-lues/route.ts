import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PATCH /api/notifications/toutes-lues — Marquer toutes les notifications comme lues
export async function PATCH() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        lu: false,
      },
      data: { lu: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur marquer toutes lues:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}
