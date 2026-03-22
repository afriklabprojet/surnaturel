import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

const articleSchema = z.object({
  titre: z.string().min(1),
  contenu: z.string().min(1),
  imageUrl: z.string().url().nullable().optional(),
  publie: z.boolean().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const articles = await prisma.article.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, titre: true, publie: true, createdAt: true },
  })

  return NextResponse.json({
    articles: articles.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    })),
  })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const body = await req.json()
  const result = z.safeParse(articleSchema, body)

  if (!result.success) {
    return NextResponse.json({ error: z.prettifyError(result.error) }, { status: 400 })
  }

  const slug = result.data.titre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")

  const article = await prisma.article.create({
    data: {
      titre: result.data.titre,
      slug,
      contenu: result.data.contenu,
      imageUrl: result.data.imageUrl ?? null,
      publie: result.data.publie ?? false,
    },
  })

  return NextResponse.json(article, { status: 201 })
}
