import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

const forfaitSchema = z.object({
  nom: z.string().min(1),
  description: z.string().min(1),
  prixTotal: z.number().min(0),
  prixForfait: z.number().min(0),
  economie: z.number().min(0),
  badge: z.string().nullable().optional(),
  ordre: z.number().int().optional(),
  soinIds: z.array(z.string()).optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const forfaits = await prisma.forfait.findMany({
    orderBy: { ordre: "asc" },
    include: {
      soins: { include: { soin: { select: { id: true, nom: true } } } },
    },
  })

  return NextResponse.json({
    forfaits: forfaits.map((f) => ({
      ...f,
      soins: f.soins.map((fs) => fs.soin),
    })),
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const body = await req.json()
  const result = z.safeParse(forfaitSchema, body)

  if (!result.success) {
    return NextResponse.json({ error: z.prettifyError(result.error) }, { status: 400 })
  }

  const slug = result.data.nom
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")

  const forfait = await prisma.forfait.create({
    data: {
      nom: result.data.nom,
      slug,
      description: result.data.description,
      prixTotal: result.data.prixTotal,
      prixForfait: result.data.prixForfait,
      economie: result.data.economie,
      badge: result.data.badge ?? null,
      ordre: result.data.ordre ?? 0,
      soins: result.data.soinIds
        ? { create: result.data.soinIds.map((soinId) => ({ soinId })) }
        : undefined,
    },
  })

  return NextResponse.json(forfait, { status: 201 })
}
