import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/crypto"

const ALLOWED_ROLES = ["CLIENT", "ACCOMPAGNATEUR_MEDICAL"] as const

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  if (!(ALLOWED_ROLES as readonly string[]).includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const userId = session.user.id

  // 1) Charger tous les messages médicaux (triés desc)
  const messages = await prisma.messageMedical.findMany({
    where: {
      OR: [{ expediteurId: userId }, { destinataireId: userId }],
    },
    orderBy: { createdAt: "desc" },
    // Inclure expéditeur pour éviter N+1
    include: {
      expediteur: {
        select: { id: true, nom: true, prenom: true, photoUrl: true, role: true },
      },
    },
  })

  // 2) Grouper par interlocuteur (garder seulement le dernier message par conversation)
  const conversationsMap = new Map<
    string,
    {
      interlocuteurId: string
      dernierMessage: { contenu: string; createdAt: Date; expediteurId: string }
      nonLus: number
    }
  >()

  for (const msg of messages) {
    const interlocuteurId =
      msg.expediteurId === userId ? msg.destinataireId : msg.expediteurId

    if (!conversationsMap.has(interlocuteurId)) {
      // Déchiffrer l'aperçu du dernier message seulement
      let contenuDechiffre = ""
      try {
        contenuDechiffre = decrypt(msg.contenu)
      } catch {
        contenuDechiffre = "[Message confidentiel]"
      }

      conversationsMap.set(interlocuteurId, {
        interlocuteurId,
        dernierMessage: {
          contenu: contenuDechiffre,
          createdAt: msg.createdAt,
          expediteurId: msg.expediteurId,
        },
        nonLus: 0,
      })
    }

    if (msg.destinataireId === userId && !msg.lu) {
      const conv = conversationsMap.get(interlocuteurId)!
      conv.nonLus += 1
    }
  }

  // 3) Charger TOUS les interlocuteurs en UNE seule requête
  const interlocuteurIds = [...conversationsMap.keys()]
  const interlocuteurs = await prisma.user.findMany({
    where: { id: { in: interlocuteurIds } },
    select: { id: true, nom: true, prenom: true, photoUrl: true, role: true },
  })
  const interlocuteurMap = new Map(interlocuteurs.map((u) => [u.id, u]))

  // 4) Filtrer par rôle médical et assembler
  const conversations = interlocuteurIds
    .map((id) => {
      const conv = conversationsMap.get(id)!
      const interlocuteur = interlocuteurMap.get(id)
      if (!interlocuteur) return null

      // CLIENT ne voit que les ACCOMPAGNATEUR_MEDICAL et vice versa
      if (
        session.user.role === "CLIENT" &&
        interlocuteur.role !== "ACCOMPAGNATEUR_MEDICAL"
      ) return null
      if (
        session.user.role === "ACCOMPAGNATEUR_MEDICAL" &&
        interlocuteur.role !== "CLIENT"
      ) return null

      return {
        interlocuteur: {
          id: interlocuteur.id,
          nom: interlocuteur.nom,
          prenom: interlocuteur.prenom,
          photoUrl: interlocuteur.photoUrl,
        },
        dernierMessage: conv.dernierMessage,
        nonLus: conv.nonLus,
      }
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        new Date(b!.dernierMessage.createdAt).getTime() -
        new Date(a!.dernierMessage.createdAt).getTime()
    )

  return NextResponse.json({ conversations })
}
