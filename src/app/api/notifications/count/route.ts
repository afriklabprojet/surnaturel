import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/notifications/count — Nombre de notifications non lues (pour le badge)
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ count: 0 })
    }

    const count = await prisma.notification.count({
      where: { userId: session.user.id, lu: false },
    })

    return NextResponse.json({ count })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}
