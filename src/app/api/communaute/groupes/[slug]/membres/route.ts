import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { creerNotification } from "@/lib/notifications"

interface Params { params: Promise<{ slug: string }> }

// POST — Rejoindre ou quitter un groupe
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { slug } = await params
  const groupe = await prisma.groupe.findUnique({ where: { slug } })
  if (!groupe) {
    return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 })
  }

  const existing = await prisma.membreGroupe.findUnique({
    where: { groupeId_userId: { groupeId: groupe.id, userId: session.user.id } },
  })

  if (existing) {
    // Quitter le groupe (sauf si admin unique)
    if (existing.role === "ADMIN") {
      const otherAdmins = await prisma.membreGroupe.count({
        where: { groupeId: groupe.id, role: "ADMIN", userId: { not: session.user.id } },
      })
      if (otherAdmins === 0) {
        return NextResponse.json({
          error: "Vous êtes le seul admin. Nommez un autre admin avant de quitter.",
        }, { status: 400 })
      }
    }
    await prisma.membreGroupe.delete({ where: { id: existing.id } })
    return NextResponse.json({ joined: false })
  }

  // Rejoindre
  if (groupe.visibilite === "SECRET") {
    return NextResponse.json({ error: "Ce groupe est privé" }, { status: 403 })
  }

  // Vérifier si le groupe a des questions d'adhésion (privé)
  if (groupe.visibilite === "PRIVE") {
    const questionCount = await prisma.questionAdhesion.count({ where: { groupeId: groupe.id } })
    if (questionCount > 0) {
      return NextResponse.json({
        requiresQuestions: true,
        message: "Ce groupe requiert des réponses aux questions d'adhésion",
      }, { status: 200 })
    }
  }

  await prisma.membreGroupe.create({
    data: { groupeId: groupe.id, userId: session.user.id, role: "MEMBRE" },
  })

  // Notifier les admins du groupe qu'un nouveau membre a rejoint
  try {
    const admins = await prisma.membreGroupe.findMany({
      where: { groupeId: groupe.id, role: "ADMIN" },
      select: { userId: true },
    })
    const newMember = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { prenom: true, nom: true },
    })
    for (const admin of admins) {
      const prefs = await prisma.user.findUnique({
        where: { id: admin.userId },
        select: { notifGroupes: true },
      })
      if (prefs?.notifGroupes) {
        await creerNotification({
          userId: admin.userId,
          type: "INVITATION_GROUPE",
          titre: "Nouveau membre",
          message: `${newMember?.prenom} ${newMember?.nom} a rejoint le groupe "${groupe.nom}"`,
          lien: `/communaute/groupes/${groupe.slug}`,
        })
      }
    }
  } catch { /* notification optionnelle */ }

  return NextResponse.json({ joined: true })
}

// PATCH — Modifier le rôle d'un membre (admin/modérateur)
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { slug } = await params
  const { userId, role } = await req.json()

  if (!userId || !["ADMIN", "MODERATEUR", "MEMBRE"].includes(role)) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 })
  }

  const groupe = await prisma.groupe.findUnique({ where: { slug } })
  if (!groupe) return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 })

  // Vérifier que le requester est admin
  const myMembership = await prisma.membreGroupe.findUnique({
    where: { groupeId_userId: { groupeId: groupe.id, userId: session.user.id } },
  })
  if (!myMembership || myMembership.role !== "ADMIN") {
    return NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 })
  }

  const targetMembership = await prisma.membreGroupe.findUnique({
    where: { groupeId_userId: { groupeId: groupe.id, userId } },
  })
  if (!targetMembership) {
    return NextResponse.json({ error: "Membre introuvable" }, { status: 404 })
  }

  await prisma.membreGroupe.update({
    where: { id: targetMembership.id },
    data: { role },
  })

  // Notifier le membre de son changement de rôle
  try {
    const prefs = await prisma.user.findUnique({
      where: { id: userId },
      select: { notifGroupes: true },
    })
    if (prefs?.notifGroupes) {
      const roleLabel = role === "ADMIN" ? "administrateur" : role === "MODERATEUR" ? "modérateur" : "membre"
      await creerNotification({
        userId,
        type: "INVITATION_GROUPE",
        titre: "Changement de rôle",
        message: `Vous êtes maintenant ${roleLabel} du groupe "${groupe.nom}"`,
        lien: `/communaute/groupes/${groupe.slug}`,
      })
    }
  } catch { /* notification optionnelle */ }

  return NextResponse.json({ success: true })
}

// DELETE — Expulser un membre
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { slug } = await params
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")
  if (!userId) return NextResponse.json({ error: "userId requis" }, { status: 400 })

  const groupe = await prisma.groupe.findUnique({ where: { slug } })
  if (!groupe) return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 })

  const myMembership = await prisma.membreGroupe.findUnique({
    where: { groupeId_userId: { groupeId: groupe.id, userId: session.user.id } },
  })
  if (!myMembership || !["ADMIN", "MODERATEUR"].includes(myMembership.role)) {
    return NextResponse.json({ error: "Permission insuffisante" }, { status: 403 })
  }

  await prisma.membreGroupe.deleteMany({
    where: { groupeId: groupe.id, userId },
  })

  // Notifier le membre expulsé
  try {
    const prefs = await prisma.user.findUnique({
      where: { id: userId },
      select: { notifGroupes: true },
    })
    if (prefs?.notifGroupes) {
      await creerNotification({
        userId,
        type: "INVITATION_GROUPE",
        titre: "Retrait du groupe",
        message: `Vous avez été retiré(e) du groupe "${groupe.nom}"`,
        lien: "/communaute/groupes",
      })
    }
  } catch { /* notification optionnelle */ }

  return NextResponse.json({ success: true })
}
