import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

const faqSchema = z.object({
  question: z.string().min(1),
  reponse: z.string().min(1),
  categorie: z.string().min(1),
  ordre: z.number().int().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const faqs = await prisma.faq.findMany({ orderBy: [{ categorie: "asc" }, { ordre: "asc" }] })
  return NextResponse.json({ faqs })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const body = await req.json()
  const result = z.safeParse(faqSchema, body)

  if (!result.success) {
    return NextResponse.json({ error: z.prettifyError(result.error) }, { status: 400 })
  }

  const faq = await prisma.faq.create({
    data: {
      question: result.data.question,
      reponse: result.data.reponse,
      categorie: result.data.categorie,
      ordre: result.data.ordre ?? 0,
    },
  })

  return NextResponse.json(faq, { status: 201 })
}
