import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { SITE_URL } from "@/lib/site"
import { crediterInscription, crediterParrainage } from "@/lib/fidelite"

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")

  if (!token) {
    return NextResponse.redirect(
      new URL("/connexion?verification=invalid", SITE_URL)
    )
  }

  const user = await prisma.user.findUnique({
    where: { emailVerifToken: token },
    select: { id: true, emailVerifie: true, emailVerifExpiry: true },
  })

  if (!user) {
    return NextResponse.redirect(
      new URL("/connexion?verification=invalid", SITE_URL)
    )
  }

  if (user.emailVerifie) {
    return NextResponse.redirect(
      new URL("/connexion?verification=already", SITE_URL)
    )
  }

  if (user.emailVerifExpiry && user.emailVerifExpiry < new Date()) {
    return NextResponse.redirect(
      new URL("/connexion?verification=expired", SITE_URL)
    )
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifie: true,
      emailVerifToken: null,
      emailVerifExpiry: null,
    },
  })

  // Bonus de bienvenue : +100 points fidélité
  try {
    await crediterInscription(user.id)
  } catch {
    // Ne pas bloquer la vérification si le crédit de points échoue
  }

  // Activer le parrainage et créditer le parrain
  try {
    const parrainage = await prisma.parrainage.findFirst({
      where: { filleulId: user.id, statut: "EN_ATTENTE" },
      include: { parrain: { select: { id: true } }, filleul: { select: { prenom: true } } },
    })
    if (parrainage) {
      await prisma.parrainage.update({
        where: { id: parrainage.id },
        data: { statut: "ACTIF", dateActivation: new Date() },
      })
      await crediterParrainage(parrainage.parrain.id, parrainage.filleul.prenom)
    }
  } catch {
    // Ne pas bloquer la vérification si l'activation du parrainage échoue
  }

  return NextResponse.redirect(
    new URL("/connexion?verification=ok", SITE_URL)
  )
}
