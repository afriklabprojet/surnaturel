import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

const produitSchema = z.object({
  nom: z.string().min(1),
  description: z.string().min(1),
  prix: z.number().min(0),
  stock: z.number().int().min(0),
  categorie: z.string().min(1),
  imageUrl: z.string().url().nullable().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const produits = await prisma.produit.findMany({ orderBy: { nom: "asc" } })
  return NextResponse.json({ produits })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const body = await req.json()
  const result = z.safeParse(produitSchema, body)

  if (!result.success) {
    return NextResponse.json({ error: z.prettifyError(result.error) }, { status: 400 })
  }

  const produit = await prisma.produit.create({
    data: {
      nom: result.data.nom,
      description: result.data.description,
      prix: result.data.prix,
      stock: result.data.stock,
      categorie: result.data.categorie,
      imageUrl: result.data.imageUrl ?? null,
    },
  })

  return NextResponse.json(produit, { status: 201 })
}
