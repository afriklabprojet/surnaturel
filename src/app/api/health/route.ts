import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const checks: Record<string, string> = { status: "ok", timestamp: new Date().toISOString() }

  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = "connected"
  } catch {
    checks.database = "error"
    checks.status = "degraded"
  }

  return NextResponse.json(checks, { status: checks.status === "ok" ? 200 : 503 })
}
