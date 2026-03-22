import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"
import { creerNotification } from "@/lib/notifications"

interface Params { params: Promise<{ slug: string }> }

const adhesionSchema = z.object({
  reponses: z.array(
    z.object({
      questionId: z.string(),
      reponse: z.string().min(1).max(1000),
    })
  ),
})

// POST — Soumettre une demande d'adhésion avec réponses aux questions
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { slug } = await params
  const groupe = await prisma.groupe.findUnique({
    where: { slug },
    include: { questions: { orderBy: { ordre: "asc" } } },
  })
  if (!groupe) {
    return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 })
  }

  if (groupe.visibilite === "SECRET") {
    return NextResponse.json({ error: "Ce groupe est privé" }, { status: 403 })
  }

  // Vérifier si déjà membre
  const existing = await prisma.membreGroupe.findUnique({
    where: { groupeId_userId: { groupeId: groupe.id, userId: session.user.id } },
  })
  if (existing) {
    return NextResponse.json({ error: "Vous êtes déjà membre de ce groupe" }, { status: 400 })
  }

  const body = await req.json()
  const result = adhesionSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
  }

  // Vérifier que toutes les questions ont une réponse
  const questionIds = groupe.questions.map((q) => q.id)
  const reponseQuestionIds = result.data.reponses.map((r) => r.questionId)
  const missingQuestions = questionIds.filter((id) => !reponseQuestionIds.includes(id))
  if (missingQuestions.length > 0) {
    return NextResponse.json({ error: "Toutes les questions doivent avoir une réponse" }, { status: 400 })
  }

  // Créer le membre avec approuve = false (en attente) si le groupe a des questions
  const needsApproval = groupe.questions.length > 0 && groupe.visibilite !== "PUBLIC"
  const membre = await prisma.membreGroupe.create({
    data: {
      groupeId: groupe.id,
      userId: session.user.id,
      role: "MEMBRE",
      approuve: !needsApproval,
    },
  })

  // Enregistrer les réponses
  if (result.data.reponses.length > 0) {
    await prisma.reponseAdhesion.createMany({
      data: result.data.reponses
        .filter((r) => questionIds.includes(r.questionId))
        .map((r) => ({
          membreId: membre.id,
          questionId: r.questionId,
          reponse: r.reponse,
        })),
    })
  }

  // Notifier les admins
  try {
    const admins = await prisma.membreGroupe.findMany({
      where: { groupeId: groupe.id, role: { in: ["ADMIN", "MODERATEUR"] } },
      select: { userId: true },
    })
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { prenom: true, nom: true },
    })
    for (const admin of admins) {
      await creerNotification({
        userId: admin.userId,
        type: "INVITATION_GROUPE",
        titre: needsApproval ? "Demande d'adhésion" : "Nouveau membre",
        message: needsApproval
          ? `${user?.prenom} ${user?.nom} souhaite rejoindre "${groupe.nom}" — réponses à examiner`
          : `${user?.prenom} ${user?.nom} a rejoint le groupe "${groupe.nom}"`,
        lien: `/communaute/groupes/${groupe.slug}`,
      })
    }
  } catch { /* notification optionnelle */ }

  return NextResponse.json({
    joined: !needsApproval,
    pending: needsApproval,
    message: needsApproval
      ? "Votre demande a été soumise. Un administrateur l'examinera."
      : "Vous avez rejoint le groupe !",
  })
}

// GET — Récupérer les demandes en attente (admin/modérateur)
export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { slug } = await params
  const groupe = await prisma.groupe.findUnique({ where: { slug }, select: { id: true } })
  if (!groupe) {
    return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 })
  }

  const myMembership = await prisma.membreGroupe.findUnique({
    where: { groupeId_userId: { groupeId: groupe.id, userId: session.user.id } },
  })
  if (!myMembership || !["ADMIN", "MODERATEUR"].includes(myMembership.role)) {
    return NextResponse.json({ error: "Réservé aux administrateurs et modérateurs" }, { status: 403 })
  }

  const demandes = await prisma.membreGroupe.findMany({
    where: { groupeId: groupe.id, approuve: false },
    include: {
      user: { select: { id: true, nom: true, prenom: true, photoUrl: true, pseudo: true } },
      reponses: {
        include: { question: { select: { texte: true, ordre: true } } },
        orderBy: { question: { ordre: "asc" } },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ demandes })
}

// PATCH — Approuver ou refuser une demande
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { slug } = await params
  const { membreId, action } = await req.json()

  if (!membreId || !["approuver", "refuser"].includes(action)) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 })
  }

  const groupe = await prisma.groupe.findUnique({ where: { slug }, select: { id: true, nom: true, slug: true } })
  if (!groupe) {
    return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 })
  }

  const myMembership = await prisma.membreGroupe.findUnique({
    where: { groupeId_userId: { groupeId: groupe.id, userId: session.user.id } },
  })
  if (!myMembership || !["ADMIN", "MODERATEUR"].includes(myMembership.role)) {
    return NextResponse.json({ error: "Permission insuffisante" }, { status: 403 })
  }

  const demande = await prisma.membreGroupe.findUnique({
    where: { id: membreId },
    select: { id: true, groupeId: true, userId: true, approuve: true },
  })
  if (!demande || demande.groupeId !== groupe.id || demande.approuve) {
    return NextResponse.json({ error: "Demande introuvable" }, { status: 404 })
  }

  if (action === "approuver") {
    await prisma.membreGroupe.update({ where: { id: membreId }, data: { approuve: true } })
    try {
      await creerNotification({
        userId: demande.userId,
        type: "INVITATION_GROUPE",
        titre: "Demande acceptée !",
        message: `Votre demande pour rejoindre "${groupe.nom}" a été acceptée`,
        lien: `/communaute/groupes/${groupe.slug}`,
      })
    } catch { /* notification optionnelle */ }
    return NextResponse.json({ success: true, action: "approuver" })
  } else {
    // Supprimer le membre (et ses réponses en cascade)
    await prisma.membreGroupe.delete({ where: { id: membreId } })
    try {
      await creerNotification({
        userId: demande.userId,
        type: "INVITATION_GROUPE",
        titre: "Demande refusée",
        message: `Votre demande pour rejoindre "${groupe.nom}" n'a pas été retenue`,
        lien: `/communaute/groupes`,
      })
    } catch { /* notification optionnelle */ }
    return NextResponse.json({ success: true, action: "refuser" })
  }
}
