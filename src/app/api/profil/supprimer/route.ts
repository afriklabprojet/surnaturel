import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const userId = session.user.id

  // Anonymiser les données personnelles (soft-delete)
  await prisma.user.update({
    where: { id: userId },
    data: {
      email: `supprime-${userId}@deleted.local`,
      nom: "Compte",
      prenom: "Supprimé",
      telephone: null,
      adresse: null,
      photoUrl: null,
      image: null,
      passwordHash: null,
      bio: null,
      pseudo: null,
      localisation: null,
      couvertureUrl: null,
      statutProfil: "EN_PAUSE",
      centresInteret: [],
    },
  })

  return NextResponse.json({ ok: true })
}
