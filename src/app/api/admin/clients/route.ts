import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const url = req.nextUrl.searchParams
  const page = Math.max(1, Number(url.get("page")) || 1)
  const limit = Math.min(100, Math.max(1, Number(url.get("limit")) || 20))
  const search = url.get("search")?.trim()

  const where = {
    role: "CLIENT" as const,
    ...(search
      ? {
          OR: [
            { nom: { contains: search, mode: "insensitive" as const } },
            { prenom: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  }

  const [clients, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        photoUrl: true,
        createdAt: true,
        _count: { select: { rendezVous: true, commandes: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ])

  return NextResponse.json({
    clients: clients.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
    })),
    total,
  })
}
