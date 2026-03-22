import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"
import bcrypt from "bcryptjs"

const createUserSchema = z.object({
  email: z.email(),
  nom: z.string().min(1),
  prenom: z.string().min(1),
  password: z.string().min(8),
  role: z.enum(["SAGE_FEMME", "ACCOMPAGNATEUR_MEDICAL"]),
})

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const utilisateurs = await prisma.user.findMany({
    where: { role: { in: ["SAGE_FEMME", "ACCOMPAGNATEUR_MEDICAL", "ADMIN"] } },
    select: { id: true, email: true, nom: true, prenom: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ utilisateurs })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const body = await req.json()
  const result = z.safeParse(createUserSchema, body)

  if (!result.success) {
    return NextResponse.json({ error: z.prettifyError(result.error) }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({
    where: { email: result.data.email },
  })

  if (existing) {
    return NextResponse.json({ error: "Un compte avec cet email existe déjà" }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(result.data.password, 12)

  const user = await prisma.user.create({
    data: {
      email: result.data.email,
      nom: result.data.nom,
      prenom: result.data.prenom,
      passwordHash,
      role: result.data.role,
    },
    select: { id: true, email: true, nom: true, prenom: true, role: true },
  })

  return NextResponse.json(user, { status: 201 })
}
