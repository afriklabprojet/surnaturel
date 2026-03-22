import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get("page") || 1))
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 20)))
  const search = searchParams.get("search")?.trim()

  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { bloqueur: { OR: [{ nom: { contains: search, mode: "insensitive" } }, { prenom: { contains: search, mode: "insensitive" } }] } },
      { bloque: { OR: [{ nom: { contains: search, mode: "insensitive" } }, { prenom: { contains: search, mode: "insensitive" } }] } },
    ]
  }

  const [blocages, total] = await Promise.all([
    prisma.blocage.findMany({
      where,
      include: {
        bloqueur: { select: { id: true, nom: true, prenom: true, email: true, photoUrl: true } },
        bloque: { select: { id: true, nom: true, prenom: true, email: true, photoUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.blocage.count({ where }),
  ])

  return NextResponse.json({ blocages, total })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 })

  await prisma.blocage.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
