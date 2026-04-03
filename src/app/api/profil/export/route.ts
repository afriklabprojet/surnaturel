import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/profil/export — Export RGPD des données utilisateur (JSON)
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const userId = session.user.id

  const [user, profilDetail, rendezVous, commandes, avis, favoris, messages, pointsFidelite] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          telephone: true,
          photoUrl: true,
          role: true,
          statutProfil: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.profilDetail.findUnique({
        where: { userId },
        select: {
          ville: true,
          languesParlees: true,
          specialite: true,
        },
      }),
      prisma.rendezVous.findMany({
        where: { userId },
        select: {
          id: true,
          dateHeure: true,
          statut: true,
          notes: true,
          soin: { select: { nom: true, prix: true, duree: true } },
          createdAt: true,
        },
        orderBy: { dateHeure: "desc" },
      }),
      prisma.commande.findMany({
        where: { userId },
        select: {
          id: true,
          total: true,
          statut: true,
          zoneLivraison: true,
          lignes: {
            select: {
              quantite: true,
              prixUnitaire: true,
              produit: { select: { nom: true } },
            },
          },
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.avis.findMany({
        where: { userId },
        select: {
          id: true,
          note: true,
          commentaire: true,
          soin: { select: { nom: true } },
          createdAt: true,
        },
      }),
      prisma.favori.findMany({
        where: { userId },
        select: {
          soin: { select: { nom: true } },
          produit: { select: { nom: true } },
          createdAt: true,
        },
      }),
      prisma.message.findMany({
        where: { expediteurId: userId },
        select: {
          id: true,
          contenu: true,
          type: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.pointsFidelite.findUnique({
        where: { userId },
        select: {
          total: true,
          historique: {
            select: {
              points: true,
              raison: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
          },
        },
      }),
    ])

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
  }

  const exportData = {
    _meta: {
      exportDate: new Date().toISOString(),
      format: "RGPD — Export des données personnelles",
      service: "Le Surnaturel de Dieu",
    },
    profil: {
      ...user,
      detail: profilDetail,
    },
    rendezVous,
    commandes,
    avis,
    favoris,
    messagesEnvoyes: messages,
    pointsFidelite,
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="mes-donnees-surnaturel-${new Date().toISOString().split("T")[0]}.json"`,
    },
  })
}
