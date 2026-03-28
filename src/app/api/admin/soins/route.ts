import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

const soinSchema = z.object({
  nom: z.string().min(1),
  description: z.string().min(1),
  descriptionLongue: z.string().nullable().optional(),
  prix: z.number().min(0),
  duree: z.number().int().min(1),
  categorie: z.enum(["HAMMAM", "GOMMAGE", "AMINCISSANT", "VISAGE", "POST_ACCOUCHEMENT", "CONSEIL_ESTHETIQUE", "SAGE_FEMME"]),
  imageUrl: z.string().url().nullable().optional(),
  icon: z.string().nullable().optional(),
  badge: z.string().nullable().optional(),
  etapes: z.array(z.object({ titre: z.string(), description: z.string() })).nullable().optional(),
  ordre: z.number().int().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const soins = await prisma.soin.findMany({ orderBy: { nom: "asc" } })
  return NextResponse.json({ soins })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const body = await req.json()
  const result = z.safeParse(soinSchema, body)

  if (!result.success) {
    return NextResponse.json({ error: z.prettifyError(result.error) }, { status: 400 })
  }

  const slug = result.data.nom
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")

  const soin = await prisma.soin.create({
    data: {
      nom: result.data.nom,
      slug,
      description: result.data.description,
      descriptionLongue: result.data.descriptionLongue ?? null,
      prix: result.data.prix,
      duree: result.data.duree,
      categorie: result.data.categorie,
      imageUrl: result.data.imageUrl ?? null,
      icon: result.data.icon ?? null,
      badge: result.data.badge ?? null,
      etapes: result.data.etapes ?? undefined,
      ordre: result.data.ordre ?? 0,
    },
  })

  return NextResponse.json(soin, { status: 201 })
}
