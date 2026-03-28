import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"

interface Params { params: Promise<{ slug: string }> }

// GET — Obtenir le lien d'invitation du groupe
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { slug } = await params
  const groupe = await prisma.groupe.findUnique({ where: { slug } })
  if (!groupe) return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 })

  const membre = await prisma.membreGroupe.findUnique({
    where: { groupeId_userId: { groupeId: groupe.id, userId: session.user.id } },
  })
  if (!membre?.approuve) return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 })

  return NextResponse.json({ inviteCode: groupe.inviteCode })
}

// POST — Générer / régénérer un code d'invitation (admin/modérateur uniquement)
export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { slug } = await params
  const groupe = await prisma.groupe.findUnique({ where: { slug } })
  if (!groupe) return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 })

  const membre = await prisma.membreGroupe.findUnique({
    where: { groupeId_userId: { groupeId: groupe.id, userId: session.user.id } },
  })
  if (!membre || !["ADMIN", "MODERATEUR"].includes(membre.role)) {
    return NextResponse.json({ error: "Réservé aux administrateurs et modérateurs" }, { status: 403 })
  }

  const inviteCode = randomBytes(12).toString("base64url")

  await prisma.groupe.update({
    where: { slug },
    data: { inviteCode },
  })

  return NextResponse.json({ inviteCode })
}

// DELETE — Révoquer le lien d'invitation (admin uniquement)
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { slug } = await params
  const groupe = await prisma.groupe.findUnique({ where: { slug } })
  if (!groupe) return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 })

  const membre = await prisma.membreGroupe.findUnique({
    where: { groupeId_userId: { groupeId: groupe.id, userId: session.user.id } },
  })
  if (!membre || membre.role !== "ADMIN") {
    return NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 })
  }

  await prisma.groupe.update({
    where: { slug },
    data: { inviteCode: null },
  })

  return NextResponse.json({ success: true })
}
