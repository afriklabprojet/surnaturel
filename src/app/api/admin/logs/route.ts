import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  // No LogAcces model in Prisma yet — return empty for now
  return NextResponse.json({ logs: [] })
}
