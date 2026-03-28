import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"
import { creerNotification } from "@/lib/notifications"

interface Params { params: Promise<{ slug: string }> }

// GET — Historique des sanctions
export async function GET(req: NextRequest, { params }: Params) {
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

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")
  const type = searchParams.get("type") // "bannis" pour voir la liste des bannis

  if (type === "bannis") {
    const bannis = await prisma.membreGroupe.findMany({
      where: { groupeId: groupe.id, banni: true },
      include: { user: { select: { id: true, nom: true, prenom: true, pseudo: true, photoUrl: true } } },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ bannis })
  }

  const sanctions = await prisma.sanction.findMany({
    where: {
      groupeId: groupe.id,
      ...(userId ? { userId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json({ sanctions })
}

// POST — Créer une sanction (avertissement, mute, ban, kick)
export async function POST(req: NextRequest, { params }: Params) {
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

  const schema = z.object({
    userId: z.string(),
    type: z.enum(["AVERTISSEMENT", "MUTE", "BAN", "KICK"]),
    raison: z.string().min(3).max(500),
    dureeHeures: z.number().int().min(1).max(8760).optional(), // Max 1 an
  })

  const body = await req.json()
  const result = schema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })

  const { userId, type, raison, dureeHeures } = result.data

  // Vérifier que le membre cible existe
  const cible = await prisma.membreGroupe.findUnique({
    where: { groupeId_userId: { groupeId: groupe.id, userId } },
  })
  if (!cible) return NextResponse.json({ error: "Membre introuvable" }, { status: 404 })

  // Un modérateur ne peut pas sanctionner un admin
  if (cible.role === "ADMIN") {
    return NextResponse.json({ error: "Impossible de sanctionner un administrateur" }, { status: 403 })
  }
  // Un modérateur ne peut pas sanctionner un autre modérateur
  if (membre.role === "MODERATEUR" && cible.role === "MODERATEUR") {
    return NextResponse.json({ error: "Impossible de sanctionner un modérateur" }, { status: 403 })
  }

  const dateFin = dureeHeures ? new Date(Date.now() + dureeHeures * 3600000) : null

  // Appliquer la sanction
  if (type === "KICK") {
    await prisma.membreGroupe.delete({ where: { id: cible.id } })
  } else if (type === "BAN") {
    // Marquer comme banni (garder le membre pour pouvoir débannir)
    await prisma.membreGroupe.update({
      where: { id: cible.id },
      data: { banni: true, approuve: false },
    })
  } else if (type === "MUTE") {
    // Mettre à jour mutedUntil
    await prisma.membreGroupe.update({
      where: { id: cible.id },
      data: { mutedUntil: dateFin || new Date(Date.now() + 24 * 3600000) }, // 24h par défaut
    })
  }

  // Créer l'entrée sanction dans l'historique
  const sanction = await prisma.sanction.create({
    data: {
      groupeId: groupe.id,
      userId,
      moderateurId: session.user.id,
      type,
      raison,
      duree: dureeHeures || null,
      dateFin,
    },
  })

  // Écrire dans le journal de modération
  try {
    await prisma.journalModeration.create({
      data: {
        groupeId: groupe.id,
        moderateurId: session.user.id,
        action: type,
        cibleUserId: userId,
        details: raison,
      },
    })
  } catch { /* journal optionnel */ }

  // Notifier le membre sanctionné
  try {
    const typeLabels: Record<string, string> = {
      AVERTISSEMENT: "Avertissement",
      MUTE: "Sourdine",
      BAN: "Exclusion",
      KICK: "Expulsion",
    }
    await creerNotification({
      userId,
      type: "INVITATION_GROUPE",
      titre: `${typeLabels[type]} — ${groupe.nom}`,
      message: raison,
      lien: type === "BAN" || type === "KICK" ? "/communaute/groupes" : `/communaute/groupes/${slug}`,
    })
  } catch { /* notification optionnelle */ }

  return NextResponse.json(sanction, { status: 201 })
}

// PATCH — Débannir un membre
export async function PATCH(req: NextRequest, { params }: Params) {
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

  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: "userId requis" }, { status: 400 })

  const cible = await prisma.membreGroupe.findUnique({
    where: { groupeId_userId: { groupeId: groupe.id, userId } },
  })
  if (!cible || !cible.banni) {
    return NextResponse.json({ error: "Ce membre n'est pas banni" }, { status: 400 })
  }

  await prisma.membreGroupe.update({
    where: { id: cible.id },
    data: { banni: false, approuve: true, role: "MEMBRE" },
  })

  // Désactiver les sanctions BAN actives
  await prisma.sanction.updateMany({
    where: { groupeId: groupe.id, userId, type: "BAN", actif: true },
    data: { actif: false },
  })

  // Journal
  try {
    await prisma.journalModeration.create({
      data: { groupeId: groupe.id, moderateurId: session.user.id, action: "UNBAN", cibleUserId: userId, details: "Débannissement" },
    })
  } catch { /* optionnel */ }

  // Notifier
  try {
    await creerNotification({
      userId,
      type: "INVITATION_GROUPE",
      titre: `Débannissement — ${groupe.nom}`,
      message: "Vous avez été débanni(e) du groupe. Vous pouvez de nouveau y participer.",
      lien: `/communaute/groupes/${slug}`,
    })
  } catch { /* optionnel */ }

  return NextResponse.json({ success: true })
}
