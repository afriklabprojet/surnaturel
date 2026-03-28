import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET — Rejoindre un groupe via un code d'invitation
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  if (!code) return NextResponse.json({ error: "Code d'invitation requis" }, { status: 400 })

  const groupe = await prisma.groupe.findUnique({ where: { inviteCode: code } })
  if (!groupe) return NextResponse.json({ error: "Code d'invitation invalide" }, { status: 404 })

  // Vérifier si déjà membre
  const existing = await prisma.membreGroupe.findUnique({
    where: { groupeId_userId: { groupeId: groupe.id, userId: session.user.id } },
  })
  if (existing?.approuve) {
    return NextResponse.json({ already: true, slug: groupe.slug })
  }

  // Si demande en attente, l'approuver directement (l'invitation bypass les questions)
  if (existing && !existing.approuve) {
    await prisma.membreGroupe.update({
      where: { id: existing.id },
      data: { approuve: true },
    })
    return NextResponse.json({ joined: true, slug: groupe.slug })
  }

  // Rejoindre directement (l'invitation bypass les questions et l'approbation)
  await prisma.membreGroupe.create({
    data: { groupeId: groupe.id, userId: session.user.id, role: "MEMBRE", approuve: true },
  })

  return NextResponse.json({ joined: true, slug: groupe.slug })
}
