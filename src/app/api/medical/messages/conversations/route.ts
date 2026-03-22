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

  // Récupérer les messages médicaux depuis la table dédiée
  const messages = await prisma.messageMedical.findMany({
    where: {
      OR: [{ expediteurId: userId }, { destinataireId: userId }],
    },
    include: {
      expediteur: {
        select: { id: true, nom: true, prenom: true, photoUrl: true, role: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const medicalMessages = messages

  // Grouper par conversation
  const conversationsMap = new Map<
    string,
    {
      interlocuteur: { id: string; nom: string; prenom: string; photoUrl: string | null }
      dernierMessage: { contenu: string; createdAt: Date; expediteurId: string }
      nonLus: number
    }
  >()

  for (const msg of medicalMessages) {
    const interlocuteurId =
      msg.expediteurId === userId ? msg.destinataireId : msg.expediteurId

    // Vérifier que l'interlocuteur est un rôle médical autorisé
    if (msg.expediteurId !== userId) {
      // L'interlocuteur est l'expéditeur — vérifier son rôle
      if (
        session.user.role === "CLIENT" &&
        msg.expediteur.role !== "ACCOMPAGNATEUR_MEDICAL"
      ) {
        continue
      }
    } else {
      // L'interlocuteur est le destinataire — vérifier son rôle
      const dest = await prisma.user.findUnique({
        where: { id: interlocuteurId },
        select: { role: true },
      })
      if (
        session.user.role === "CLIENT" &&
        dest?.role !== "ACCOMPAGNATEUR_MEDICAL"
      ) {
        continue
      }
      if (
        session.user.role === "ACCOMPAGNATEUR_MEDICAL" &&
        dest?.role !== "CLIENT"
      ) {
        continue
      }
    }

    if (!conversationsMap.has(interlocuteurId)) {
      let interlocuteur: { id: string; nom: string; prenom: string; photoUrl: string | null }

      if (msg.expediteurId === userId) {
        const dest = await prisma.user.findUnique({
          where: { id: interlocuteurId },
          select: { id: true, nom: true, prenom: true, photoUrl: true },
        })
        if (!dest) continue
        interlocuteur = dest
      } else {
        interlocuteur = {
          id: msg.expediteur.id,
          nom: msg.expediteur.nom,
          prenom: msg.expediteur.prenom,
          photoUrl: msg.expediteur.photoUrl,
        }
      }

      // Déchiffrer l'aperçu du dernier message
      let contenuDechiffre = ""
      try {
        contenuDechiffre = decrypt(msg.contenu)
      } catch {
        contenuDechiffre = "[Message confidentiel]"
      }

      conversationsMap.set(interlocuteurId, {
        interlocuteur,
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

  const conversations = Array.from(conversationsMap.values()).sort(
    (a, b) =>
      new Date(b.dernierMessage.createdAt).getTime() -
      new Date(a.dernierMessage.createdAt).getTime()
  )

  return NextResponse.json({ conversations })
}
